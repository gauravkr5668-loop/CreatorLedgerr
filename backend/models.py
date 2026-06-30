"""Pydantic models for CreatorLedger."""
from __future__ import annotations
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Literal

from pydantic import BaseModel, Field, EmailStr, ConfigDict


def utcnow_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id() -> str:
    return str(uuid.uuid4())


# ---------- Auth ----------
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(default="", max_length=80)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserPublic(BaseModel):
    id: str
    email: EmailStr
    name: str
    role: str = "member"
    agency_name: str = "CreatorLedger Studio"


# ---------- Campaign ----------
class CampaignBase(BaseModel):
    creator_name: str
    campaign_name: str
    agreed_fee: float
    deliverables: str = ""
    status: Literal["active", "completed", "pending", "paused"] = "active"
    expected_gst: float = 0.0
    expected_payment: float = 0.0
    campaign_manager: str = ""


class Campaign(CampaignBase):
    id: str = Field(default_factory=new_id)
    user_id: str
    created_at: str = Field(default_factory=utcnow_iso)


# ---------- Invoice ----------
class Discrepancy(BaseModel):
    code: str  # e.g., RATE_MISMATCH, MISSING_PAN
    severity: Literal["critical", "warning", "info"]
    label: str  # short title
    reason: str  # human-readable explanation (AI-generated)
    confidence: float = 0.0  # 0..1
    expected: Optional[str] = None
    actual: Optional[str] = None
    suggestion: Optional[str] = None


class LineItem(BaseModel):
    description: str
    quantity: int = 1
    rate: float = 0.0
    amount: float = 0.0


class InvoiceBase(BaseModel):
    creator_name: str = ""
    invoice_number: str = ""
    invoice_date: str = ""
    campaign_reference: str = ""
    gross_amount: float = 0.0
    gst_amount: float = 0.0
    pan: str = ""
    gstin: str = ""
    bank_name: str = ""
    account_number: str = ""
    ifsc: str = ""
    upi_id: str = ""
    deliverables: str = ""
    invoice_notes: str = ""
    line_items: List[LineItem] = Field(default_factory=list)
    confidence_score: float = 0.0


class Invoice(InvoiceBase):
    id: str = Field(default_factory=new_id)
    user_id: str
    file_name: str = ""
    status: Literal["extracted", "reviewed", "approved", "rejected"] = "extracted"
    discrepancies: List[Discrepancy] = Field(default_factory=list)
    review_comments: str = ""
    reviewed_at: Optional[str] = None
    reviewed_by: Optional[str] = None
    created_at: str = Field(default_factory=utcnow_iso)


class InvoiceUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    creator_name: Optional[str] = None
    invoice_number: Optional[str] = None
    invoice_date: Optional[str] = None
    campaign_reference: Optional[str] = None
    gross_amount: Optional[float] = None
    gst_amount: Optional[float] = None
    pan: Optional[str] = None
    gstin: Optional[str] = None
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc: Optional[str] = None
    upi_id: Optional[str] = None
    deliverables: Optional[str] = None
    invoice_notes: Optional[str] = None
    review_comments: Optional[str] = None
    status: Optional[Literal["extracted", "reviewed", "approved", "rejected"]] = None


# ---------- Finance Settings ----------
class FinanceSettings(BaseModel):
    id: str = Field(default_factory=new_id)
    user_id: str
    gst_rate: float = 18.0  # %
    tds_section: str = "194R"
    tds_rate: float = 10.0  # %
    agency_commission_pct: float = 15.0  # %
    platform_fee_pct: float = 2.0  # %
    updated_at: str = Field(default_factory=utcnow_iso)


class FinanceSettingsUpdate(BaseModel):
    gst_rate: Optional[float] = None
    tds_section: Optional[str] = None
    tds_rate: Optional[float] = None
    agency_commission_pct: Optional[float] = None
    platform_fee_pct: Optional[float] = None


# ---------- Insights ----------
class AIInsight(BaseModel):
    id: str = Field(default_factory=new_id)
    title: str
    body: str
    severity: Literal["critical", "warning", "info", "success"]
    amount: Optional[float] = None
    icon: str = "sparkles"
