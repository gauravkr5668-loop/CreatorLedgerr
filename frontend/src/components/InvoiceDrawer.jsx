import React, { useState } from "react";
import { api } from "@/lib/api";
import { formatINR, formatDate } from "@/lib/format";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SeverityBadge } from "@/components/SeverityBadge";
import { CheckCircle2, XCircle, Sparkles, Edit3, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function InvoiceDrawer({ invoice, onClose, onChanged }) {
    const open = Boolean(invoice);
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(null);
    const [saving, setSaving] = useState(false);
    const [actioning, setActioning] = useState(false);

    React.useEffect(() => {
        if (invoice) setDraft({ ...invoice });
        setEditing(false);
    }, [invoice]);

    if (!invoice || !draft) return null;

    const save = async () => {
        setSaving(true);
        try {
            const updates = {};
            for (const k of [
                "creator_name", "invoice_number", "invoice_date", "campaign_reference",
                "gross_amount", "gst_amount", "pan", "gstin", "bank_name",
                "account_number", "ifsc", "upi_id", "deliverables", "invoice_notes",
                "review_comments",
            ]) {
                if (draft[k] !== invoice[k]) {
                    updates[k] = typeof draft[k] === "number" ? Number(draft[k]) : draft[k];
                }
            }
            if (!Object.keys(updates).length) {
                setEditing(false);
                return;
            }
            const { data } = await api.patch(`/invoices/${invoice.id}`, updates);
            toast.success("Invoice updated");
            setDraft(data);
            setEditing(false);
            onChanged?.(data);
        } catch (e) {
            toast.error(e.response?.data?.detail || "Save failed");
        } finally {
            setSaving(false);
        }
    };

    const setStatus = async (status) => {
        setActioning(true);
        try {
            const { data } = await api.patch(`/invoices/${invoice.id}`, { status });
            toast.success(status === "approved" ? "Invoice approved" : "Invoice rejected");
            setDraft(data);
            onChanged?.(data);
        } catch (e) {
            toast.error(e.response?.data?.detail || "Action failed");
        } finally {
            setActioning(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
            <SheetContent
                side="right"
                className="w-full sm:max-w-2xl p-0 flex flex-col h-full"
                data-testid="invoice-drawer"
            >
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
                    <SheetHeader className="space-y-1">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">
                                    Invoice review
                                </div>
                                <SheetTitle className="font-display text-2xl font-semibold tracking-tight">
                                    {draft.creator_name || "Unknown creator"} · {draft.invoice_number}
                                </SheetTitle>
                            </div>
                            <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 border border-emerald-200">
                                <Sparkles className="w-3.5 h-3.5" />
                                {Math.round((draft.confidence_score || 0) * 100)}% confidence
                            </div>
                        </div>
                    </SheetHeader>

                    {/* Anomalies */}
                    {draft.discrepancies?.length > 0 && (
                        <div className="space-y-2">
                            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">AI flagged</div>
                            <div className="space-y-2">
                                {draft.discrepancies.map((d, i) => (
                                    <div
                                        key={i}
                                        data-testid={`anomaly-${i}`}
                                        className="rounded-2xl border border-slate-200 bg-gradient-to-br from-emerald-50/40 to-white p-4"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="font-medium text-slate-900">{d.label}</div>
                                            <SeverityBadge severity={d.severity} />
                                        </div>
                                        <p className="mt-2 text-sm text-slate-700 leading-relaxed">{d.reason}</p>
                                        <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                                            {d.expected && <span>Expected: <span className="font-medium text-slate-700">{d.expected}</span></span>}
                                            {d.actual && <span>Actual: <span className="font-medium text-slate-700">{d.actual}</span></span>}
                                            {d.confidence ? <span>Confidence: <span className="font-medium text-slate-700">{Math.round(d.confidence * 100)}%</span></span> : null}
                                        </div>
                                        {d.suggestion && (
                                            <p className="mt-2 text-xs italic text-emerald-700">Suggestion: {d.suggestion}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Fields */}
                    <div className="rounded-2xl border border-slate-200 bg-white">
                        <div className="flex items-center justify-between p-4 border-b border-slate-100">
                            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                                Extracted fields
                            </div>
                            {!editing ? (
                                <Button size="sm" variant="ghost" data-testid="drawer-edit-btn" onClick={() => setEditing(true)}>
                                    <Edit3 className="w-4 h-4 mr-1.5" /> Edit
                                </Button>
                            ) : (
                                <Button size="sm" data-testid="drawer-save-btn" onClick={save} disabled={saving} className="bg-emerald-700 hover:bg-emerald-800 text-white">
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Save className="w-4 h-4 mr-1.5" />}
                                    Save
                                </Button>
                            )}
                        </div>
                        <div className="grid sm:grid-cols-2 gap-x-4 gap-y-3 p-4">
                            <Field label="Creator" k="creator_name" editing={editing} draft={draft} setDraft={setDraft} />
                            <Field label="Invoice #" k="invoice_number" editing={editing} draft={draft} setDraft={setDraft} />
                            <Field label="Invoice date" k="invoice_date" editing={editing} draft={draft} setDraft={setDraft} />
                            <Field label="Campaign reference" k="campaign_reference" editing={editing} draft={draft} setDraft={setDraft} />
                            <Field label="Gross amount (₹)" k="gross_amount" type="number" editing={editing} draft={draft} setDraft={setDraft} display={formatINR(draft.gross_amount)} />
                            <Field label="GST (₹)" k="gst_amount" type="number" editing={editing} draft={draft} setDraft={setDraft} display={formatINR(draft.gst_amount)} />
                            <Field label="PAN" k="pan" editing={editing} draft={draft} setDraft={setDraft} />
                            <Field label="GSTIN" k="gstin" editing={editing} draft={draft} setDraft={setDraft} />
                            <Field label="Bank name" k="bank_name" editing={editing} draft={draft} setDraft={setDraft} />
                            <Field label="Account #" k="account_number" editing={editing} draft={draft} setDraft={setDraft} />
                            <Field label="IFSC" k="ifsc" editing={editing} draft={draft} setDraft={setDraft} />
                            <Field label="UPI ID" k="upi_id" editing={editing} draft={draft} setDraft={setDraft} />
                            <div className="sm:col-span-2">
                                <Field label="Deliverables" k="deliverables" editing={editing} draft={draft} setDraft={setDraft} />
                            </div>
                        </div>
                    </div>

                    {/* Line items */}
                    {draft.line_items?.length > 0 && (
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500 mb-3">Line items</div>
                            <div className="divide-y divide-slate-100">
                                {draft.line_items.map((li, i) => (
                                    <div key={i} className="flex items-center justify-between py-2 text-sm">
                                        <div className="text-slate-700 truncate pr-3">{li.description}</div>
                                        <div className="text-slate-900 font-medium tabular-nums">{formatINR(li.amount)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Reviewer notes */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <Label className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Reviewer notes</Label>
                        <Textarea
                            data-testid="drawer-review-comments"
                            className="mt-2 rounded-xl"
                            placeholder="Leave a comment for finance team…"
                            rows={3}
                            value={draft.review_comments || ""}
                            onChange={(e) => setDraft({ ...draft, review_comments: e.target.value })}
                            onBlur={save}
                        />
                        {draft.reviewed_at && (
                            <div className="mt-2 text-xs text-slate-500">
                                Last reviewed {formatDate(draft.reviewed_at)} by {draft.reviewed_by || "—"}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer actions — always visible, outside the scroll area */}
                <div className="border-t border-slate-200 bg-white px-6 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm text-slate-500">
                        Net payable estimate: <span className="font-semibold text-slate-900">{formatINR((draft.gross_amount || 0) + (draft.gst_amount || 0))}</span>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            data-testid="drawer-reject-btn"
                            onClick={() => setStatus("rejected")}
                            disabled={actioning}
                            className="rounded-xl border-slate-200 hover:bg-rose-50 hover:text-rose-700"
                        >
                            <XCircle className="w-4 h-4 mr-1.5" /> Reject
                        </Button>
                        <Button
                            data-testid="drawer-approve-btn"
                            onClick={() => setStatus("approved")}
                            disabled={actioning}
                            className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white"
                        >
                            <CheckCircle2 className="w-4 h-4 mr-1.5" /> Approve
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}

function Field({ label, k, type = "text", editing, draft, setDraft, display }) {
    return (
        <div>
            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</Label>
            {editing ? (
                <Input
                    type={type}
                    value={draft[k] ?? ""}
                    onChange={(e) => setDraft({ ...draft, [k]: type === "number" ? e.target.value : e.target.value })}
                    className="mt-1 rounded-xl"
                />
            ) : (
                <div className="mt-1 text-sm font-medium text-slate-900 break-all">
                    {display ?? (draft[k] || <span className="text-slate-400">—</span>)}
                </div>
            )}
        </div>
    );
}
