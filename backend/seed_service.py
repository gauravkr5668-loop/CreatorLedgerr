"""Sample data generator for demo. Creates 30 creators, 8 campaigns, ~50 invoices
with 12 intentional discrepancies so the dashboard immediately looks alive."""
from __future__ import annotations

import logging
import random
from datetime import datetime, timezone, timedelta
from typing import List

from db import get_db
from models import Campaign, Invoice, LineItem, FinanceSettings, new_id, utcnow_iso
from reconciliation import reconcile_all

logger = logging.getLogger(__name__)
random.seed(0xC1ED6E5)  # deterministic for demo

CREATORS = [
    ("Ananya Iyer",      "AOFPI1234K", "27ASRPM2345A1Z5", "Ananya Iyer",      "HDFC Bank",  "50100123456789", "HDFC0000123"),
    ("Riya Sharma",      "BVRPS4567L", "07KLMPS6789B1Z3", "Riya Sharma",      "ICICI Bank", "00112345678901", "ICIC0000234"),
    ("Kabir Mehta",      "CDEPM8910M", "29POPRM0123C1Z2", "Kabir Mehta",      "Axis Bank",  "9123456789012",  "UTIB0000345"),
    ("Tanya Singh",      "DEFPS3344N", "06LMNTS5566D1Z9", "Tanya Singh",      "SBI",        "30012345678901", "SBIN0000456"),
    ("Aarav Kapoor",     "",            "",                "Aarav Kapoor",     "Yes Bank",   "00567890123456", "YESB0000567"),  # missing PAN
    ("Meher Joshi",      "FGHPJ7788P", "27NOQPJ8899F1Z1", "Meher Joshi",      "Kotak Bank", "40012345678",    "KKBK0000678"),
    ("Vihaan Rao",       "GHIRR1122Q", "33XYZRR2233G1Z7", "Vihaan Rao",       "IndusInd",   "11122233344455", "INDB0000789"),
    ("Diya Nair",        "HIJSN5566R", "32ABCSN6677H1Z4", "Diya Nair",        "Federal Bank","21314151617181","FDRL0000890"),
    ("Arjun Reddy",      "IJKLR9900S", "36DEFLR0011I1Z8", "Arjun Reddy",      "HDFC Bank",  "50200998877665", "HDFC0000901"),
    ("Sara Khan",        "JKLMK1133T", "",                "Sara Khan",        "ICICI Bank", "00298765432101", "ICIC0001012"),  # missing GSTIN, large
    ("Ishaan Bose",      "KLMNB4455U", "19PQRNB5566K1Z0", "Ishaan Bose",      "PNB",        "45623145789632", "PUNB0001123"),
    ("Neha Pillai",      "LMNOP7788V", "32STUOP8899L1Z6", "Neha Pillai",      "Canara",     "78945612303214", "CNRB0001234"),
    ("Rohan Kumar",      "MNOPQ0011W", "06UVWQR1122M1Z5", "Rohan Kumar",      "RBL Bank",   "30912345678905", "RATN0001345"),
    ("Aditi Banerjee",   "NOPRB3344X", "19BCDRB4455N1Z2", "Aditi Banerjee",   "BoB",        "11122233355566", "BARB0001456"),
    ("Yash Patel",       "OPRSP6677Y", "24EFGSP7788O1Z3", "Yash Patel",       "HDFC Bank",  "50300113344556", "HDFC0001567"),
    ("Zara Khanna",      "PRSTK9900Z", "07HIJTK0011P1Z9", "Zara Khanna",      "Axis Bank",  "91234567890121", "UTIB0001678"),
    ("Rehaan Sinha",     "RSTUV2233A", "23KLMTV2233R1Z4", "Rehaan Sinha",     "SBI",        "30087654321098", "SBIN0001789"),
    ("Naina Mehrotra",   "STUVW5566B", "10MNOUV5566S1Z1", "Naina Mehrotra",   "Yes Bank",   "00611223344556", "YESB0001890"),
    ("Aryan Verma",      "TUVWX8899C", "27NOPVW8899T1Z2", "Aryan Verma",      "Kotak",      "40123456789012", "KKBK0001901"),
    ("Anika Gupta",      "UVWXY1122D", "29OPQWX1122U1Z6", "Anika Gupta",      "IndusInd",   "11223344556677", "INDB0002012"),
    ("Devansh Roy",      "VWXYZ4455E", "08PRSYZ4455V1Z7", "Devansh Roy",      "Federal",    "21222324252627", "FDRL0002123"),
    ("Tara Bhatt",       "WXYZA7788F", "06QRSZA7788W1Z8", "Tara Bhatt",       "HDFC Bank",  "50400112233445", "HDFC0002234"),
    ("Karan Malhotra",   "XYZAB0011G", "27RSTAB0011X1Z9", "Karan Malhotra",   "ICICI",      "00345678901234", "ICIC0002345"),
    ("Mehak Saxena",     "YZABC3344H", "19STUBC3344Y1Z3", "Mehak Saxena",     "PNB",        "45612378945612", "PUNB0002456"),
    ("Ved Aiyer",        "ZABCD6677I", "32TUVCD6677Z1Z4", "Ved Aiyer",        "Canara",     "78912365478932", "CNRB0002567"),
    ("Pari Choudhary",   "ABCDE9900J", "33UVWDE9900A1Z5", "Pari Choudhary",   "RBL",        "30923456789012", "RATN0002678"),
    ("Siddh Jain",       "BCDEF2233K", "06VWXEF2233B1Z6", "Siddh Jain",       "BoB",        "11133344455577", "BARB0002789"),
    ("Eva D'Souza",      "CDEFG5566L", "29WXYFG5566C1Z7", "Eva D'Souza",      "HDFC",       "50500223344556", "HDFC0002890"),
    ("Omar Sheikh",      "DEFGH8899M", "07XYZGH8899D1Z8", "Omar Sheikh",      "Axis",       "91298765432101", "UTIB0002901"),
    ("Aisha Bhatia",     "EFGHI1122N", "24YZAHI1122E1Z9", "Aisha Bhatia",     "SBI",        "30098765432109", "SBIN0003012"),
]


CAMPAIGNS_LIB = [
    ("Festive Glow with Maybelline",       "Maybelline",  "Beauty",   "Aarti Khanna"),
    ("Spotify Wrapped Creator Push",        "Spotify",     "Music",    "Kunal Sharma"),
    ("Cred Rewards Series",                 "CRED",        "Fintech",  "Aarti Khanna"),
    ("Boat Audio Diwali Drop",              "Boat",        "Tech",     "Rohit Vyas"),
    ("Zomato Foodie Hours",                 "Zomato",      "Lifestyle","Tanvi Rao"),
    ("Mamaearth Skincare Reels",            "Mamaearth",   "Beauty",   "Tanvi Rao"),
    ("Mivi Beats Launch",                   "Mivi",        "Tech",     "Kunal Sharma"),
    ("Lenskair Vision Edit",                "Lenskair",    "Lifestyle","Rohit Vyas"),
]


def _amount_with_gst(base: float, gst_rate: float = 18.0) -> tuple[float, float]:
    gst = round(base * gst_rate / 100, 2)
    return base, gst


def _build_line_items(deliverable: str, total: float) -> List[LineItem]:
    parts = max(1, deliverable.count(",") + 1)
    per = round(total / parts, 2)
    items: List[LineItem] = []
    for p in deliverable.split(","):
        items.append(LineItem(description=p.strip(), quantity=1, rate=per, amount=per))
    # adjust last to absorb rounding
    if items:
        items[-1] = LineItem(
            description=items[-1].description,
            quantity=1,
            rate=items[-1].rate,
            amount=round(total - per * (len(items) - 1), 2),
        )
    return items


async def seed_user_data(user_id: str) -> dict:
    db = get_db()

    # Wipe any existing demo data for this user
    await db.campaigns.delete_many({"user_id": user_id})
    await db.invoices.delete_many({"user_id": user_id})
    await db.settings.delete_many({"user_id": user_id})

    # Finance settings
    settings = FinanceSettings(user_id=user_id)
    await db.settings.insert_one(settings.model_dump())

    # Campaigns: each creator participates in 1-2 campaigns
    campaign_docs: list[dict] = []
    creator_to_campaign: dict[str, list[dict]] = {}
    for creator_idx, c in enumerate(CREATORS):
        creator_name = c[0]
        campaigns_for_creator = random.sample(CAMPAIGNS_LIB, k=random.choice([1, 1, 2]))
        for cinfo in campaigns_for_creator:
            base_fee = random.choice([18000, 22000, 25000, 28000, 30000, 35000, 42000, 50000, 65000, 75000])
            deliverables = random.choice([
                "1 Instagram Reel, 2 Stories",
                "2 Reels, 3 Stories",
                "1 YouTube Short, 4 Stories",
                "1 Static Post, 2 Stories",
                "1 Reel, 1 Static, 3 Stories",
            ])
            campaign = Campaign(
                user_id=user_id,
                creator_name=creator_name,
                campaign_name=cinfo[0],
                agreed_fee=float(base_fee),
                deliverables=deliverables,
                status=random.choice(["active", "active", "active", "completed"]),
                expected_gst=round(base_fee * 0.18, 2),
                expected_payment=round(base_fee * 1.18, 2),
                campaign_manager=cinfo[3],
            )
            d = campaign.model_dump()
            campaign_docs.append(d)
            creator_to_campaign.setdefault(creator_name, []).append(d)
    if campaign_docs:
        await db.campaigns.insert_many(campaign_docs)

    # Invoices — one per (creator, campaign) plus a few extras for variety
    invoice_docs: list[dict] = []
    base_date = datetime.now(timezone.utc) - timedelta(days=30)
    inv_counter = 1000

    # planned discrepancy slots — exactly 12 across the run
    planned = (
        [("RATE_OVER", 1)] * 3 +      # overbilled
        [("RATE_UNDER", 1)] * 1 +     # underbilled
        [("MISSING_PAN", 1)] * 2 +    # missing PAN
        [("MISSING_GSTIN", 1)] * 1 +  # missing GSTIN large
        [("DUPLICATE", 1)] * 1 +      # duplicate
        [("BANK_CHANGED", 1)] * 1 +   # bank changed
        [("CAMPAIGN_MISMATCH", 1)] * 1 +
        [("MISSING_BANK", 1)] * 1 +
        [("LOW_CONFIDENCE", 1)] * 1
    )
    random.shuffle(planned)

    flat_assignments = list(creator_to_campaign.items())

    plan_idx = 0
    for creator_name, campaigns in flat_assignments:
        for camp in campaigns:
            inv_counter += 1
            invoice_no = f"INV-{inv_counter:04d}"
            invoice_date = (base_date + timedelta(days=random.randint(0, 28))).date().isoformat()
            # find the creator profile
            profile = next(p for p in CREATORS if p[0] == creator_name)
            pan, gstin, _disp, bank, acc, ifsc = profile[1], profile[2], profile[3], profile[4], profile[5], profile[6]

            base_amount = float(camp["agreed_fee"])
            this_amount = base_amount

            # apply planned discrepancy
            plan = planned[plan_idx] if plan_idx < len(planned) else None
            plan_idx += 1
            confidence = round(random.uniform(0.85, 0.99), 2)

            if plan and plan[0] == "RATE_OVER":
                this_amount = base_amount + random.choice([5000, 7000, 9500])
            elif plan and plan[0] == "RATE_UNDER":
                this_amount = base_amount - random.choice([2000, 3500])
            elif plan and plan[0] == "MISSING_PAN":
                pan = ""
            elif plan and plan[0] == "MISSING_GSTIN":
                gstin = ""
                this_amount = max(this_amount, 30000)
            elif plan and plan[0] == "MISSING_BANK":
                bank, acc, ifsc = "", "", ""
                upi_id = ""
            elif plan and plan[0] == "LOW_CONFIDENCE":
                confidence = round(random.uniform(0.45, 0.65), 2)
            elif plan and plan[0] == "CAMPAIGN_MISMATCH":
                pass  # we'll alter campaign_reference below

            gross = this_amount
            gst = round(gross * 0.18, 2) if gstin else 0.0

            line_items = _build_line_items(camp["deliverables"], gross)
            campaign_reference = camp["campaign_name"]
            if plan and plan[0] == "CAMPAIGN_MISMATCH":
                # pick a different campaign label
                others = [c for c in CAMPAIGNS_LIB if c[0] != camp["campaign_name"]]
                campaign_reference = random.choice(others)[0]

            upi_id = ""
            if random.random() < 0.4 and not (plan and plan[0] == "MISSING_BANK"):
                upi_id = f"{creator_name.split()[0].lower()}@upi"

            inv = Invoice(
                user_id=user_id,
                file_name=f"{creator_name.replace(' ', '_')}_{invoice_no}.pdf",
                creator_name=creator_name,
                invoice_number=invoice_no,
                invoice_date=invoice_date,
                campaign_reference=campaign_reference,
                gross_amount=gross,
                gst_amount=gst,
                pan=pan,
                gstin=gstin,
                bank_name=bank,
                account_number=acc,
                ifsc=ifsc,
                upi_id=upi_id,
                deliverables=camp["deliverables"],
                invoice_notes="",
                line_items=line_items,
                confidence_score=confidence,
            )
            invoice_docs.append(inv.model_dump())

    # Add an explicit duplicate invoice
    if invoice_docs:
        dup_source = invoice_docs[0]
        inv_counter += 1
        dup = dict(dup_source)
        dup["id"] = new_id()
        dup["invoice_number"] = f"INV-{inv_counter:04d}"
        dup["invoice_date"] = (base_date + timedelta(days=12)).date().isoformat()
        dup["file_name"] = dup["file_name"].replace(".pdf", "_resend.pdf")
        invoice_docs.append(dup)

    # Add a bank-account-changed invoice for the first creator
    if len(invoice_docs) > 2:
        bc = dict(invoice_docs[1])
        inv_counter += 1
        bc["id"] = new_id()
        bc["invoice_number"] = f"INV-{inv_counter:04d}"
        bc["invoice_date"] = (base_date + timedelta(days=20)).date().isoformat()
        bc["account_number"] = bc["account_number"][:-4] + "0000" if bc["account_number"] else "00000000000000"
        invoice_docs.append(bc)

    if invoice_docs:
        await db.invoices.insert_many(invoice_docs)

    # run reconciliation deterministically (no LLM calls for speed)
    await reconcile_all(user_id, use_llm_explanations=False)

    return {"campaigns": len(campaign_docs), "invoices": len(invoice_docs)}


async def ensure_admin_user_seeded():
    """Create the demo admin user + sample data on startup, idempotent."""
    import os
    from auth import hash_password

    db = get_db()
    demo_mode = os.environ.get("DEMO_MODE", "false").lower() == "true"
    email = os.environ.get("ADMIN_EMAIL", "demo@creatorledger.com")
    password = os.environ.get("ADMIN_PASSWORD")
    if not password:
        if not demo_mode:
            logger.warning(
                "ADMIN_PASSWORD is not set and DEMO_MODE is not 'true' — skipping "
                "demo admin account seeding. Set ADMIN_PASSWORD explicitly, or set "
                "DEMO_MODE=true to use the demo default for local/contest use only."
            )
            return
        logger.warning(
            "ADMIN_PASSWORD not set; falling back to the well-known demo password "
            "because DEMO_MODE=true. Never run with DEMO_MODE=true in production."
        )
        password = "demo1234"
    existing = await db.users.find_one({"email": email})
    if existing is None:
        user_id = new_id()
        await db.users.insert_one({
            "id": user_id,
            "email": email,
            "password_hash": hash_password(password),
            "name": "Demo Owner",
            "role": "owner",
            "agency_name": "CreatorLedger Studio",
            "created_at": utcnow_iso(),
        })
        await seed_user_data(user_id)
    else:
        # keep password in sync with env
        from auth import verify_password
        if not verify_password(password, existing.get("password_hash", "")):
            await db.users.update_one(
                {"email": email},
                {"$set": {"password_hash": hash_password(password)}},
            )
        # ensure data exists
        has_data = await db.campaigns.count_documents({"user_id": existing["id"]})
        if not has_data:
            await seed_user_data(existing["id"])
