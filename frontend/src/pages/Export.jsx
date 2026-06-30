import React, { useEffect, useState } from "react";
import { api, API_BASE } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
    Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Download, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ExportPage() {
    const [status, setStatus] = useState("approved");
    const [rows, setRows] = useState([]);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        try {
            const [{ data: invs }, { data: s }] = await Promise.all([
                api.get("/invoices", { params: { status: status === "all" ? "all" : status } }),
                api.get("/settings"),
            ]);
            setRows(invs || []);
            setSettings(s);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { load(); /* eslint-disable-next-line */ }, [status]);

    const downloadCSV = async () => {
        try {
            const res = await api.get(`/export/payouts.csv?status=${status}`, { responseType: "blob" });
            const url = URL.createObjectURL(res.data);
            const a = document.createElement("a");
            a.href = url;
            a.download = "creatorledger_payouts.csv";
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            toast.success("Export downloaded");
        } catch (e) {
            toast.error("Export failed");
        }
    };

    const total = rows.reduce((acc, r) => acc + (r.gross_amount || 0), 0);

    return (
        <div className="space-y-6" data-testid="export-page">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">Bulk export</div>
                    <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-slate-900">Payout-ready CSV</h1>
                    <p className="mt-2 text-sm text-slate-500 max-w-2xl">
                        Net payable, bank, IFSC, PAN, GSTIN — calculated against your finance settings and exported in one click.
                    </p>
                </div>
                <div className="flex gap-2 items-center">
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger data-testid="export-status-filter" className="w-44 h-10 rounded-xl">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="approved">Approved only (recommended)</SelectItem>
                            <SelectItem value="reviewed">Reviewed</SelectItem>
                            <SelectItem value="extracted">Extracted</SelectItem>
                            <SelectItem value="all">All statuses</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={downloadCSV} data-testid="export-download-btn" className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white">
                        <Download className="w-4 h-4 mr-2" /> Download CSV
                    </Button>
                </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
                <Stat label="Invoices in export" value={loading ? "—" : rows.length} />
                <Stat label="Gross total" value={loading ? "—" : formatINR(total)} accent="emerald" />
                <Stat label="Filter" value={loading ? "—" : status} />
            </div>

            {status === "approved" && !loading && rows.length === 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                        <div className="font-medium text-amber-900">No approved invoices yet</div>
                        <p className="text-sm text-amber-800/90 mt-1">Head over to <span className="font-semibold">Reconciliation</span>, approve some flagged invoices, and they'll appear here ready to export.</p>
                    </div>
                </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                <div className="hidden md:grid grid-cols-12 px-4 py-3 border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <div className="col-span-3">Creator</div>
                    <div className="col-span-2">Invoice #</div>
                    <div className="col-span-2">Bank</div>
                    <div className="col-span-2">Gross</div>
                    <div className="col-span-2">Net payable</div>
                    <div className="col-span-1 text-right">Status</div>
                </div>
                {loading ? Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="grid grid-cols-12 px-4 py-3 border-b border-slate-100">
                        <div className="col-span-12 h-6 shimmer rounded-md" />
                    </div>
                )) : rows.map((r, i) => {
                    const gross = Number(r.gross_amount || 0);
                    const gst = (gross * (settings?.gst_rate || 0)) / 100;
                    const tds = (gross * (settings?.tds_rate || 0)) / 100;
                    const commission = (gross * (settings?.agency_commission_pct || 0)) / 100;
                    const platform = (gross * (settings?.platform_fee_pct || 0)) / 100;
                    const net = gross + gst - tds - commission - platform;
                    return (
                        <div key={r.id} data-testid={`export-row-${i}`} className="grid md:grid-cols-12 grid-cols-2 gap-y-2 items-center px-4 py-3 border-b border-slate-100">
                            <div className="md:col-span-3 col-span-2">
                                <div className="font-medium text-slate-900 truncate">{r.creator_name || "—"}</div>
                                <div className="text-xs text-slate-500 truncate">{r.campaign_reference}</div>
                            </div>
                            <div className="md:col-span-2 font-mono text-xs text-slate-700">{r.invoice_number}</div>
                            <div className="md:col-span-2 text-xs text-slate-600 truncate">
                                {r.bank_name ? `${r.bank_name} · …${(r.account_number || "").slice(-4)}` : (r.upi_id || "—")}
                            </div>
                            <div className="md:col-span-2 text-sm font-medium text-slate-900">{formatINR(gross)}</div>
                            <div className="md:col-span-2 text-sm font-semibold text-emerald-700">{formatINR(net)}</div>
                            <div className="md:col-span-1 text-right text-[10px] uppercase font-bold tracking-widest text-slate-500">{r.status}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function Stat({ label, value, accent }) {
    return (
        <div className="rounded-2xl bg-white border border-slate-200 px-5 py-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</div>
            <div className={`mt-1 font-display text-2xl font-semibold tracking-tight ${accent === "emerald" ? "text-emerald-700" : "text-slate-900"}`}>{value}</div>
        </div>
    );
}
