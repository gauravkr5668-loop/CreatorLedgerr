"""Deterministic reconciliation engine. AI is used only to write the WHY copy."""
from __future__ import annotations

from typing import Dict, List, Optional

from db import get_db
from models import Discrepancy
from ai_service import gpt52_explain_anomalies


def _norm(s: str) -> str:
    return (s or "").strip().lower()


PAN_RE = r"^[A-Z]{5}[0-9]{4}[A-Z]$"
GSTIN_RE = r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}Z[0-9A-Z]{1}$"


def _missing(value: str) -> bool:
    return not (value or "").strip()


def _detect_anomalies(invoice: dict, campaign: Optional[dict], duplicates: List[dict],
                      prior_account_for_creator: Optional[str]) -> List[dict]:
    anomalies: List[dict] = []

    if campaign is None:
        anomalies.append({
            "code": "MISSING_CAMPAIGN", "severity": "critical",
            "label": "No matching campaign",
            "expected": invoice.get("campaign_reference") or "any campaign for this creator",
            "actual": "not found in campaign master sheet",
            "reason": "No matching campaign found in the master sheet for this creator and reference.",
            "suggestion": "Add this creator + campaign to your master sheet before payout.",
            "confidence": 0.95,
        })
    else:
        agreed = float(campaign.get("agreed_fee") or 0)
        gross = float(invoice.get("gross_amount") or 0)
        if agreed > 0 and abs(gross - agreed) / agreed > 0.05:
            severity = "critical" if gross > agreed else "warning"
            anomalies.append({
                "code": "RATE_MISMATCH", "severity": severity,
                "label": "Rate mismatch",
                "expected": f"₹{agreed:,.0f}",
                "actual": f"₹{gross:,.0f}",
                "reason": "",
                "suggestion": "Verify with the creator and campaign manager before approving.",
                "confidence": 0.97,
            })
        if _norm(campaign.get("campaign_name")) and _norm(invoice.get("campaign_reference")) and \
                _norm(campaign.get("campaign_name")) not in _norm(invoice.get("campaign_reference")) and \
                _norm(invoice.get("campaign_reference")) not in _norm(campaign.get("campaign_name")):
            anomalies.append({
                "code": "CAMPAIGN_MISMATCH", "severity": "warning",
                "label": "Campaign mismatch",
                "expected": campaign.get("campaign_name"),
                "actual": invoice.get("campaign_reference"),
                "reason": "",
                "suggestion": "Confirm which campaign this invoice belongs to.",
                "confidence": 0.9,
            })

    # PAN
    if _missing(invoice.get("pan")):
        anomalies.append({
            "code": "MISSING_PAN", "severity": "critical",
            "label": "Missing PAN",
            "expected": "AAAAA9999A format PAN",
            "actual": "not provided",
            "reason": "No PAN was detected anywhere on the invoice — required for TDS filing.",
            "suggestion": "Request PAN from the creator before processing payout.",
            "confidence": 0.99,
        })

    # GSTIN (only flag as info when amount is high)
    if _missing(invoice.get("gstin")) and float(invoice.get("gross_amount") or 0) > 25000:
        anomalies.append({
            "code": "MISSING_GSTIN", "severity": "warning",
            "label": "Missing GSTIN",
            "expected": "15-character GSTIN",
            "actual": "not provided",
            "reason": "Invoice over ₹25,000 without a GSTIN — possible compliance issue.",
            "suggestion": "Ask the creator if they are GST-registered.",
            "confidence": 0.85,
        })

    # Bank details
    if _missing(invoice.get("account_number")) and _missing(invoice.get("upi_id")):
        anomalies.append({
            "code": "MISSING_BANK", "severity": "critical",
            "label": "Missing bank details",
            "expected": "Account + IFSC or UPI ID",
            "actual": "neither provided",
            "reason": "No payout destination found — neither bank account nor UPI was provided.",
            "suggestion": "Cannot run payout. Contact creator immediately.",
            "confidence": 0.99,
        })

    if prior_account_for_creator and invoice.get("account_number") and \
            prior_account_for_creator != invoice.get("account_number"):
        anomalies.append({
            "code": "BANK_CHANGED", "severity": "warning",
            "label": "Bank account changed",
            "expected": f"…{prior_account_for_creator[-4:]} (prior)",
            "actual": f"…{invoice['account_number'][-4:]} (this invoice)",
            "reason": "Bank account differs from the previous invoice for this creator — verify with creator directly.",
            "suggestion": "Call the creator on a known number to confirm before payout.",
            "confidence": 0.93,
        })

    # Invoice total math (line items)
    line_items = invoice.get("line_items") or []
    if line_items:
        total = sum(float(li.get("amount") or 0) for li in line_items)
        if total and abs(total - float(invoice.get("gross_amount") or 0)) > 1:
            anomalies.append({
                "code": "TOTAL_MISMATCH", "severity": "warning",
                "label": "Line items do not sum to total",
                "expected": f"₹{total:,.0f}",
                "actual": f"₹{float(invoice.get('gross_amount') or 0):,.0f}",
                "reason": "",
                "suggestion": "Re-check arithmetic on the invoice.",
                "confidence": 0.92,
            })

    # Duplicate
    if duplicates:
        dup = duplicates[0]
        anomalies.append({
            "code": "DUPLICATE", "severity": "critical",
            "label": "Possible duplicate invoice",
            "expected": "unique invoice",
            "actual": f"matches invoice {dup.get('invoice_number') or '(unknown)'}",
            "reason": "",
            "suggestion": "Mark one as duplicate before approving payouts.",
            "confidence": 0.94,
        })

    # Confidence
    conf = float(invoice.get("confidence_score") or 1.0)
    if conf and conf < 0.7:
        anomalies.append({
            "code": "LOW_CONFIDENCE", "severity": "info",
            "label": "Low extraction confidence",
            "expected": "≥ 0.80",
            "actual": f"{conf:.2f}",
            "reason": "Extraction confidence is low — please double-check key fields.",
            "suggestion": "Manually verify amounts and bank details.",
            "confidence": 0.99,
        })

    return anomalies


def _find_matching_campaign(invoice: dict, campaigns: List[dict]) -> Optional[dict]:
    creator = _norm(invoice.get("creator_name"))
    ref = _norm(invoice.get("campaign_reference"))
    # Best match: same creator + campaign name appears in ref (or vice versa)
    candidates = [c for c in campaigns if _norm(c.get("creator_name")) == creator]
    if not candidates:
        return None
    if not ref:
        return candidates[0]
    for c in candidates:
        if _norm(c.get("campaign_name")) in ref or ref in _norm(c.get("campaign_name")):
            return c
    return candidates[0]


def _find_duplicates(invoice: dict, all_invoices: List[dict]) -> List[dict]:
    dups: List[dict] = []
    for other in all_invoices:
        if other.get("id") == invoice.get("id"):
            continue
        if _norm(other.get("creator_name")) != _norm(invoice.get("creator_name")):
            continue
        if other.get("invoice_number") and \
                _norm(other.get("invoice_number")) == _norm(invoice.get("invoice_number")):
            dups.append(other)
            continue
        # very similar amount on same creator
        if abs(float(other.get("gross_amount") or 0) - float(invoice.get("gross_amount") or 0)) < 1 \
                and other.get("gross_amount"):
            dups.append(other)
    return dups


def _prior_account_for_creator(invoice: dict, all_invoices: List[dict]) -> Optional[str]:
    creator = _norm(invoice.get("creator_name"))
    accounts = []
    for other in all_invoices:
        if other.get("id") == invoice.get("id"):
            continue
        if _norm(other.get("creator_name")) == creator and other.get("account_number"):
            accounts.append(other.get("account_number"))
    return accounts[0] if accounts else None


async def reconcile_invoice(user_id: str, invoice_id: str, use_llm_explanations: bool = True) -> dict:
    db = get_db()
    invoice = await db.invoices.find_one({"id": invoice_id, "user_id": user_id}, {"_id": 0})
    if not invoice:
        return {"updated": False}

    campaigns = await db.campaigns.find({"user_id": user_id}, {"_id": 0}).to_list(2000)
    all_invoices = await db.invoices.find({"user_id": user_id}, {"_id": 0}).to_list(5000)

    campaign = _find_matching_campaign(invoice, campaigns)
    duplicates = _find_duplicates(invoice, all_invoices)
    prior_account = _prior_account_for_creator(invoice, all_invoices)

    anomalies = _detect_anomalies(invoice, campaign, duplicates, prior_account)

    if anomalies and use_llm_explanations:
        # only call LLM for anomalies whose 'reason' is empty
        empty_idx = [i for i, a in enumerate(anomalies) if not a.get("reason")]
        if empty_idx:
            empties = [anomalies[i] for i in empty_idx]
            reasons = await gpt52_explain_anomalies(invoice, empties, campaign)
            for slot_i, reason in zip(empty_idx, reasons):
                if reason:
                    anomalies[slot_i]["reason"] = reason

    # Save
    await db.invoices.update_one(
        {"id": invoice_id, "user_id": user_id},
        {"$set": {"discrepancies": anomalies}},
    )
    return {"updated": True, "discrepancies": anomalies}


async def reconcile_all(user_id: str, use_llm_explanations: bool = False) -> dict:
    """Bulk reconcile. Defaults to deterministic-only reasons (no LLM calls) for speed."""
    db = get_db()
    invoices = await db.invoices.find({"user_id": user_id}, {"_id": 0}).to_list(5000)
    campaigns = await db.campaigns.find({"user_id": user_id}, {"_id": 0}).to_list(2000)

    flagged = 0
    for inv in invoices:
        campaign = _find_matching_campaign(inv, campaigns)
        duplicates = _find_duplicates(inv, invoices)
        prior_account = _prior_account_for_creator(inv, invoices)
        anomalies = _detect_anomalies(inv, campaign, duplicates, prior_account)
        # Fill in deterministic reasons where empty
        for a in anomalies:
            if not a.get("reason"):
                a["reason"] = _fallback_reason(a, inv, campaign)
        if anomalies:
            flagged += 1
        await db.invoices.update_one(
            {"id": inv["id"], "user_id": user_id},
            {"$set": {"discrepancies": anomalies}},
        )
    return {"reconciled": len(invoices), "flagged": flagged}


def _fallback_reason(a: dict, invoice: dict, campaign: Optional[dict]) -> str:
    code = a.get("code")
    if code == "RATE_MISMATCH" and campaign:
        diff = float(invoice.get("gross_amount") or 0) - float(campaign.get("agreed_fee") or 0)
        if diff > 0:
            return f"Creator billed ₹{float(invoice['gross_amount']):,.0f} but the campaign sheet shows ₹{float(campaign['agreed_fee']):,.0f} — possible overbilling of ₹{diff:,.0f}."
        return f"Creator billed ₹{float(invoice['gross_amount']):,.0f} vs agreed ₹{float(campaign['agreed_fee']):,.0f} — underbilled by ₹{abs(diff):,.0f}."
    if code == "CAMPAIGN_MISMATCH":
        return f"Invoice references '{invoice.get('campaign_reference')}' but campaign master lists this creator under '{campaign.get('campaign_name') if campaign else ''}'."
    if code == "TOTAL_MISMATCH":
        return f"Line items sum to {a.get('expected')} but invoice total reads {a.get('actual')}."
    if code == "DUPLICATE":
        return f"Invoice total, creator name and invoice number closely match a prior submission ({a.get('actual')})."
    return a.get("reason") or ""
