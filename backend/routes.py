"""Main application routes: campaigns, invoices, reconciliation, insights, export."""
from __future__ import annotations

import csv
import io
import logging
import os
import uuid
from datetime import datetime, timezone
from typing import List, Optional

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import StreamingResponse

from db import get_db
from auth import get_current_user
from models import (
    Campaign, Invoice, InvoiceUpdate, FinanceSettings,
    FinanceSettingsUpdate, new_id, utcnow_iso,
)
from reconciliation import reconcile_all, reconcile_invoice
from ai_service import extract_invoice_from_file, gpt52_dashboard_insights

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["app"])

UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "/tmp/creatorledger_uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_INVOICE_MIME = {
    "application/pdf": ".pdf",
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
}

# Max size per uploaded invoice file. The client-declared Content-Type header is
# trivially spoofable, so we also verify real file type by magic bytes below.
MAX_INVOICE_FILE_SIZE = int(os.environ.get("MAX_INVOICE_FILE_SIZE_BYTES", 15 * 1024 * 1024))  # 15MB default

# Known file signatures ("magic bytes") for each type we accept. We check the actual
# bytes on disk against these rather than trusting the client's Content-Type header.
_FILE_SIGNATURES = {
    ".pdf": [b"%PDF-"],
    ".png": [b"\x89PNG\r\n\x1a\n"],
    ".jpg": [b"\xff\xd8\xff"],
}


def _sniff_extension(content: bytes) -> Optional[str]:
    """Return the extension implied by the file's actual magic bytes, or None if unrecognised."""
    for ext, signatures in _FILE_SIGNATURES.items():
        for sig in signatures:
            if content.startswith(sig):
                return ext
    return None


# ---------- Dashboard summary ----------
@router.get("/dashboard/summary")
async def dashboard_summary(user: dict = Depends(get_current_user)):
    db = get_db()
    invoices = await db.invoices.find({"user_id": user["id"]}, {"_id": 0}).to_list(5000)
    campaigns = await db.campaigns.find({"user_id": user["id"]}, {"_id": 0}).to_list(2000)

    creators = {i.get("creator_name") for i in invoices if i.get("creator_name")}
    total_campaign_value = sum(float(c.get("agreed_fee") or 0) for c in campaigns)
    flagged = sum(1 for i in invoices if i.get("discrepancies"))
    approved = sum(1 for i in invoices if i.get("status") == "approved")
    rejected = sum(1 for i in invoices if i.get("status") == "rejected")
    pending = sum(1 for i in invoices if i.get("status") in ("extracted", "reviewed"))
    export_ready = approved
    total_invoice_value = sum(float(i.get("gross_amount") or 0) for i in invoices)

    critical = sum(1 for i in invoices for d in i.get("discrepancies", []) if d.get("severity") == "critical")
    warnings = sum(1 for i in invoices for d in i.get("discrepancies", []) if d.get("severity") == "warning")

    return {
        "invoices_uploaded": len(invoices),
        "creators_processed": len(creators),
        "total_campaign_value": total_campaign_value,
        "total_invoice_value": total_invoice_value,
        "flagged_issues": flagged,
        "critical_issues": critical,
        "warning_issues": warnings,
        "approved_payouts": approved,
        "rejected": rejected,
        "pending_review": pending,
        "export_ready": export_ready,
        "campaigns_count": len(campaigns),
    }


# ---------- Campaigns ----------
@router.get("/campaigns")
async def list_campaigns(user: dict = Depends(get_current_user)):
    db = get_db()
    rows = await db.campaigns.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(2000)
    return rows


@router.post("/campaigns")
async def create_campaign(body: dict, user: dict = Depends(get_current_user)):
    db = get_db()
    campaign = Campaign(user_id=user["id"], **body).model_dump()
    await db.campaigns.insert_one(campaign)
    # reconcile invoices after adding a campaign
    await reconcile_all(user["id"], use_llm_explanations=False)
    campaign.pop("_id", None)
    return campaign


@router.delete("/campaigns/{campaign_id}")
async def delete_campaign(campaign_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    res = await db.campaigns.delete_one({"id": campaign_id, "user_id": user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(404, "Campaign not found")
    await reconcile_all(user["id"], use_llm_explanations=False)
    return {"ok": True}


# Campaign sheets are small structured data; cap generously above what a real agency
# spreadsheet would need, to block accidental or malicious oversized uploads.
MAX_CAMPAIGN_FILE_SIZE = int(os.environ.get("MAX_CAMPAIGN_FILE_SIZE_BYTES", 10 * 1024 * 1024))  # 10MB default


@router.post("/campaigns/upload")
async def upload_campaigns_excel(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    """Upload an Excel/CSV with campaign master data. Expected columns
    (case-insensitive, all optional except creator/agreed fee):
    creator_name, campaign_name, agreed_fee, deliverables, status,
    expected_gst, expected_payment, campaign_manager.
    """
    name = (file.filename or "").lower()
    if not name.endswith((".xlsx", ".xls", ".csv")):
        raise HTTPException(400, "Unsupported file type — upload an .xlsx, .xls, or .csv file")

    content = await file.read(MAX_CAMPAIGN_FILE_SIZE + 1)
    if len(content) > MAX_CAMPAIGN_FILE_SIZE:
        raise HTTPException(400, f"File exceeds the {MAX_CAMPAIGN_FILE_SIZE // (1024*1024)}MB upload limit")
    if not content:
        raise HTTPException(400, "Empty file")

    try:
        if name.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(content))
        else:
            df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(400, f"Could not read file: {e}")

    df.columns = [str(c).strip().lower().replace(" ", "_") for c in df.columns]

    db = get_db()
    inserted = 0
    for _, row in df.iterrows():
        row_d = {k: ("" if pd.isna(v) else v) for k, v in row.to_dict().items()}
        creator = str(row_d.get("creator_name") or row_d.get("creator") or "").strip()
        if not creator:
            continue
        try:
            agreed = float(row_d.get("agreed_fee") or row_d.get("rate") or 0)
        except (TypeError, ValueError):
            agreed = 0.0
        campaign = Campaign(
            user_id=user["id"],
            creator_name=creator,
            campaign_name=str(row_d.get("campaign_name") or row_d.get("campaign") or "").strip(),
            agreed_fee=agreed,
            deliverables=str(row_d.get("deliverables") or "").strip(),
            status=str(row_d.get("status") or "active").lower(),
            expected_gst=float(row_d.get("expected_gst") or round(agreed * 0.18, 2)),
            expected_payment=float(row_d.get("expected_payment") or round(agreed * 1.18, 2)),
            campaign_manager=str(row_d.get("campaign_manager") or "").strip(),
        ).model_dump()
        await db.campaigns.insert_one(campaign)
        inserted += 1

    await reconcile_all(user["id"], use_llm_explanations=False)
    return {"inserted": inserted}


# ---------- Invoices ----------
@router.get("/invoices")
async def list_invoices(
    user: dict = Depends(get_current_user),
    status: Optional[str] = None,
    severity: Optional[str] = None,
    campaign: Optional[str] = None,
    q: Optional[str] = None,
    limit: int = 500,
):
    db = get_db()
    query: dict = {"user_id": user["id"]}
    if status and status != "all":
        query["status"] = status
    if campaign:
        query["campaign_reference"] = {"$regex": campaign, "$options": "i"}
    if q:
        query["$or"] = [
            {"creator_name": {"$regex": q, "$options": "i"}},
            {"invoice_number": {"$regex": q, "$options": "i"}},
            {"pan": {"$regex": q, "$options": "i"}},
            {"campaign_reference": {"$regex": q, "$options": "i"}},
        ]
    rows = await db.invoices.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    if severity and severity != "all":
        rows = [r for r in rows if any(d.get("severity") == severity for d in r.get("discrepancies", []))]
    return rows


@router.get("/invoices/{invoice_id}")
async def get_invoice(invoice_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    inv = await db.invoices.find_one({"id": invoice_id, "user_id": user["id"]}, {"_id": 0})
    if not inv:
        raise HTTPException(404, "Invoice not found")
    return inv


@router.patch("/invoices/{invoice_id}")
async def update_invoice(invoice_id: str, body: InvoiceUpdate, user: dict = Depends(get_current_user)):
    db = get_db()
    update = {k: v for k, v in body.model_dump().items() if v is not None}
    if not update:
        raise HTTPException(400, "Nothing to update")
    if "status" in update and update["status"] in ("approved", "rejected", "reviewed"):
        update["reviewed_at"] = utcnow_iso()
        update["reviewed_by"] = user["email"]
    res = await db.invoices.update_one(
        {"id": invoice_id, "user_id": user["id"]},
        {"$set": update},
    )
    if res.matched_count == 0:
        raise HTTPException(404, "Invoice not found")
    # If financial fields changed, re-reconcile this invoice
    if any(k in update for k in ("gross_amount", "pan", "gstin", "account_number", "campaign_reference", "ifsc")):
        await reconcile_invoice(user["id"], invoice_id, use_llm_explanations=False)
    inv = await db.invoices.find_one({"id": invoice_id, "user_id": user["id"]}, {"_id": 0})
    return inv


@router.post("/invoices/{invoice_id}/approve")
async def approve_invoice(invoice_id: str, user: dict = Depends(get_current_user)):
    return await update_invoice(invoice_id, InvoiceUpdate(status="approved"), user)


@router.post("/invoices/{invoice_id}/reject")
async def reject_invoice(invoice_id: str, user: dict = Depends(get_current_user)):
    return await update_invoice(invoice_id, InvoiceUpdate(status="rejected"), user)


@router.post("/invoices/upload")
async def upload_invoices(
    files: List[UploadFile] = File(...),
    user: dict = Depends(get_current_user),
):
    db = get_db()
    results = []
    for f in files:
        mime = (f.content_type or "").lower()
        if mime not in ALLOWED_INVOICE_MIME:
            results.append({"file": f.filename, "ok": False, "error": f"Unsupported file type: {mime}"})
            continue
        ext = ALLOWED_INVOICE_MIME[mime]

        # Read with a hard cap so a single oversized file can't exhaust memory/disk/LLM cost.
        chunks = []
        total = 0
        too_large = False
        while True:
            chunk = await f.read(1024 * 1024)
            if not chunk:
                break
            total += len(chunk)
            if total > MAX_INVOICE_FILE_SIZE:
                too_large = True
                break
            chunks.append(chunk)
        if too_large:
            results.append({
                "file": f.filename, "ok": False,
                "error": f"File exceeds the {MAX_INVOICE_FILE_SIZE // (1024*1024)}MB upload limit",
            })
            continue
        content = b"".join(chunks)
        if not content:
            results.append({"file": f.filename, "ok": False, "error": "Empty file"})
            continue

        # Verify the file's real bytes match what it claims to be.
        sniffed_ext = _sniff_extension(content)
        if sniffed_ext is None or sniffed_ext != ext:
            results.append({
                "file": f.filename, "ok": False,
                "error": "File content does not match its declared type",
            })
            continue

        local_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4().hex}{ext}")
        with open(local_path, "wb") as fp:
            fp.write(content)

        try:
            extracted = await extract_invoice_from_file(local_path, mime)
        except Exception as e:
            logger.exception("Extraction failed for %s", f.filename)
            results.append({"file": f.filename, "ok": False, "error": str(e)})
            continue

        inv = Invoice(
            user_id=user["id"],
            file_name=f.filename or os.path.basename(local_path),
            creator_name=str(extracted.get("creator_name") or ""),
            invoice_number=str(extracted.get("invoice_number") or ""),
            invoice_date=str(extracted.get("invoice_date") or ""),
            campaign_reference=str(extracted.get("campaign_reference") or ""),
            gross_amount=float(extracted.get("gross_amount") or 0),
            gst_amount=float(extracted.get("gst_amount") or 0),
            pan=str(extracted.get("pan") or ""),
            gstin=str(extracted.get("gstin") or ""),
            bank_name=str(extracted.get("bank_name") or ""),
            account_number=str(extracted.get("account_number") or ""),
            ifsc=str(extracted.get("ifsc") or ""),
            upi_id=str(extracted.get("upi_id") or ""),
            deliverables=str(extracted.get("deliverables") or ""),
            invoice_notes=str(extracted.get("invoice_notes") or ""),
            line_items=extracted.get("line_items") or [],
            confidence_score=float(extracted.get("confidence_score") or 0.85),
        ).model_dump()
        await db.invoices.insert_one(inv)
        # Reconcile (with LLM reasoning for these freshly uploaded files)
        await reconcile_invoice(user["id"], inv["id"], use_llm_explanations=True)
        fresh = await db.invoices.find_one({"id": inv["id"]}, {"_id": 0})
        results.append({"file": f.filename, "ok": True, "invoice": fresh})

    return {"results": results}


# ---------- Reconciliation ----------
@router.post("/reconciliation/run")
async def run_reconciliation(
    use_llm: bool = False,
    user: dict = Depends(get_current_user),
):
    return await reconcile_all(user["id"], use_llm_explanations=use_llm)


# ---------- Settings (Finance Calculator) ----------
@router.get("/settings")
async def get_settings(user: dict = Depends(get_current_user)):
    db = get_db()
    s = await db.settings.find_one({"user_id": user["id"]}, {"_id": 0})
    if not s:
        s = FinanceSettings(user_id=user["id"]).model_dump()
        await db.settings.insert_one(s)
    return s


@router.patch("/settings")
async def update_settings(body: FinanceSettingsUpdate, user: dict = Depends(get_current_user)):
    db = get_db()
    update = {k: v for k, v in body.model_dump().items() if v is not None}
    update["updated_at"] = utcnow_iso()
    await db.settings.update_one(
        {"user_id": user["id"]},
        {"$set": update, "$setOnInsert": {"id": new_id(), "user_id": user["id"]}},
        upsert=True,
    )
    return await db.settings.find_one({"user_id": user["id"]}, {"_id": 0})


# ---------- AI Insights ----------
@router.get("/insights")
async def get_insights(use_llm: bool = False, user: dict = Depends(get_current_user)):
    db = get_db()
    invoices = await db.invoices.find({"user_id": user["id"]}, {"_id": 0}).to_list(5000)
    campaigns = await db.campaigns.find({"user_id": user["id"]}, {"_id": 0}).to_list(2000)

    cards: list[dict] = []

    # 1. overbilling total
    overbills = []
    for inv in invoices:
        for d in inv.get("discrepancies", []):
            if d.get("code") == "RATE_MISMATCH":
                try:
                    exp = float(str(d.get("expected", "0")).replace("₹", "").replace(",", "").strip() or 0)
                    act = float(str(d.get("actual", "0")).replace("₹", "").replace(",", "").strip() or 0)
                    if act > exp:
                        overbills.append(act - exp)
                except ValueError:
                    pass
    if overbills:
        cards.append({
            "id": new_id(),
            "title": f"₹{sum(overbills):,.0f} in potential overbilling detected",
            "body": f"{len(overbills)} invoices exceed the agreed campaign value across creators.",
            "severity": "critical",
            "amount": sum(overbills),
            "icon": "alert-triangle",
        })

    # 2. missing PAN
    no_pan = [i for i in invoices if any(d.get("code") == "MISSING_PAN" for d in i.get("discrepancies", []))]
    if no_pan:
        cards.append({
            "id": new_id(),
            "title": f"{len(no_pan)} creators are missing PAN",
            "body": "PAN is required to file TDS. Request PAN before running these payouts.",
            "severity": "warning",
            "amount": None,
            "icon": "id-card",
        })

    # 3. duplicates
    dups = [i for i in invoices if any(d.get("code") == "DUPLICATE" for d in i.get("discrepancies", []))]
    if dups:
        cards.append({
            "id": new_id(),
            "title": "Duplicate invoice detected",
            "body": f"{len(dups)} invoices look like duplicates of previously submitted ones.",
            "severity": "critical",
            "amount": None,
            "icon": "copy",
        })

    # 4. bank changed
    bc = [i for i in invoices if any(d.get("code") == "BANK_CHANGED" for d in i.get("discrepancies", []))]
    if bc:
        cards.append({
            "id": new_id(),
            "title": "Bank account differs from previous submission",
            "body": f"{len(bc)} creator(s) submitted a new bank account this cycle — verify before payout.",
            "severity": "warning",
            "amount": None,
            "icon": "shield-check",
        })

    # 5. low confidence
    lowc = [i for i in invoices if any(d.get("code") == "LOW_CONFIDENCE" for d in i.get("discrepancies", []))]
    if lowc:
        cards.append({
            "id": new_id(),
            "title": f"{len(lowc)} invoices have low extraction confidence",
            "body": "Manually verify key fields on these invoices before approving.",
            "severity": "info",
            "amount": None,
            "icon": "sparkles",
        })

    # 6. approved payouts ready
    approved = [i for i in invoices if i.get("status") == "approved"]
    if approved:
        total = sum(float(i.get("gross_amount") or 0) for i in approved)
        cards.append({
            "id": new_id(),
            "title": f"₹{total:,.0f} ready to be paid out",
            "body": f"{len(approved)} invoices have been approved and are export-ready.",
            "severity": "success",
            "amount": total,
            "icon": "banknote",
        })

    # Optional GPT-5.2 augmentation (off by default for speed)
    if use_llm:
        try:
            ai_cards = await gpt52_dashboard_insights({
                "user_id": user["id"],
                "invoice_count": len(invoices),
                "campaign_count": len(campaigns),
                "deterministic_cards": cards,
            })
            for c in ai_cards or []:
                c.setdefault("id", new_id())
                cards.append(c)
        except Exception as e:
            logger.warning("AI insights skipped: %s", e)

    return {"insights": cards}


# ---------- Bulk export ----------
@router.get("/export/payouts.csv")
async def export_payouts_csv(
    status: str = Query("approved"),
    user: dict = Depends(get_current_user),
):
    db = get_db()
    settings = await db.settings.find_one({"user_id": user["id"]}, {"_id": 0})
    settings = settings or FinanceSettings(user_id=user["id"]).model_dump()
    query = {"user_id": user["id"]}
    if status and status != "all":
        query["status"] = status
    invoices = await db.invoices.find(query, {"_id": 0}).to_list(5000)

    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow([
        "Invoice Number", "Creator", "Campaign", "Gross (₹)",
        "GST (₹)", "TDS (₹)", "Agency Commission (₹)", "Platform Fee (₹)",
        "Net Payable (₹)", "Bank", "Account Number", "IFSC", "UPI", "PAN", "GSTIN", "Status",
    ])
    for i in invoices:
        gross = float(i.get("gross_amount") or 0)
        gst = round(gross * settings["gst_rate"] / 100, 2)
        tds = round(gross * settings["tds_rate"] / 100, 2)
        commission = round(gross * settings["agency_commission_pct"] / 100, 2)
        platform = round(gross * settings["platform_fee_pct"] / 100, 2)
        net = round(gross + gst - tds - commission - platform, 2)
        writer.writerow([
            i.get("invoice_number"), i.get("creator_name"), i.get("campaign_reference"),
            gross, gst, tds, commission, platform, net,
            i.get("bank_name"), i.get("account_number"), i.get("ifsc"), i.get("upi_id"),
            i.get("pan"), i.get("gstin"), i.get("status"),
        ])

    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=creatorledger_payouts.csv"},
    )


# ---------- Global search ----------
@router.get("/search")
async def global_search(q: str, user: dict = Depends(get_current_user)):
    if not q.strip():
        return {"creators": [], "campaigns": [], "invoices": []}
    db = get_db()
    qreg = {"$regex": q, "$options": "i"}
    invs = await db.invoices.find(
        {"user_id": user["id"], "$or": [
            {"creator_name": qreg}, {"invoice_number": qreg}, {"pan": qreg}, {"campaign_reference": qreg},
        ]},
        {"_id": 0, "id": 1, "creator_name": 1, "invoice_number": 1, "gross_amount": 1, "status": 1},
    ).to_list(50)
    camps = await db.campaigns.find(
        {"user_id": user["id"], "$or": [
            {"campaign_name": qreg}, {"creator_name": qreg}, {"campaign_manager": qreg},
        ]},
        {"_id": 0, "id": 1, "campaign_name": 1, "creator_name": 1, "agreed_fee": 1, "status": 1},
    ).to_list(50)
    creators = list({i["creator_name"] for i in invs if i.get("creator_name")}) + \
               list({c["creator_name"] for c in camps if c.get("creator_name")})
    creators = list(dict.fromkeys(creators))[:20]
    return {"creators": creators, "campaigns": camps, "invoices": invs}
