import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { formatINR, formatDate } from "@/lib/format";
import { motion } from "framer-motion";
import {
    Upload, Search, FileText, Sparkles, Filter, Loader2, X, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SeverityBadge } from "@/components/SeverityBadge";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import InvoiceDrawer from "@/components/InvoiceDrawer";

export default function Invoices() {
    const [params, setParams] = useSearchParams();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [filter, setFilter] = useState({
        q: params.get("q") || "",
        status: params.get("status") || "all",
        severity: params.get("severity") || "all",
    });
    const [openInvoice, setOpenInvoice] = useState(null);
    const fileRef = useRef(null);
    const navigate = useNavigate();

    const load = async () => {
        setLoading(true);
        try {
            const { data } = await api.get("/invoices", { params: filter });
            setRows(data || []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // sync params
        const next = new URLSearchParams();
        if (filter.q) next.set("q", filter.q);
        if (filter.status !== "all") next.set("status", filter.status);
        if (filter.severity !== "all") next.set("severity", filter.severity);
        setParams(next, { replace: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter.q, filter.status, filter.severity]);

    const onUpload = async (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        const fd = new FormData();
        for (const f of files) fd.append("files", f);
        setUploading(true);
        const t = toast.loading(`Extracting ${files.length} invoice${files.length > 1 ? "s" : ""} with AI…`);
        try {
            const { data } = await api.post("/invoices/upload", fd, {
                headers: { "Content-Type": "multipart/form-data" },
                timeout: 180000,
            });
            const ok = data.results.filter((r) => r.ok).length;
            const fail = data.results.filter((r) => !r.ok).length;
            toast.dismiss(t);
            if (ok) toast.success(`${ok} invoice${ok > 1 ? "s" : ""} extracted & reconciled`);
            if (fail) toast.error(`${fail} file${fail > 1 ? "s" : ""} failed`);
            await load();
        } catch (err) {
            toast.dismiss(t);
            toast.error(err.response?.data?.detail || "Upload failed");
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = "";
        }
    };

    const counts = useMemo(() => ({
        total: rows.length,
        approved: rows.filter((r) => r.status === "approved").length,
        flagged: rows.filter((r) => r.discrepancies?.length).length,
        pending: rows.filter((r) => r.status === "extracted" || r.status === "reviewed").length,
    }), [rows]);

    return (
        <div className="space-y-6" data-testid="invoices-page">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">Invoices</div>
                    <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-slate-900">
                        Creator invoices
                    </h1>
                    <p className="mt-2 text-sm text-slate-500 max-w-xl">
                        Drag-and-drop PDFs, PNGs or JPGs — GPT-5.2 extracts and reconciles each one in seconds.
                    </p>
                </div>
                <div className="flex gap-2">
                    <input
                        ref={fileRef}
                        type="file"
                        accept="application/pdf,image/png,image/jpeg"
                        multiple
                        className="hidden"
                        onChange={onUpload}
                        data-testid="invoice-upload-input"
                    />
                    <Button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                        data-testid="invoice-upload-btn"
                        className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white"
                    >
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                        Bulk upload
                    </Button>
                </div>
            </div>

            {/* Count strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { l: "Total", v: counts.total },
                    { l: "Flagged", v: counts.flagged, tone: "rose" },
                    { l: "Pending review", v: counts.pending, tone: "amber" },
                    { l: "Approved", v: counts.approved, tone: "emerald" },
                ].map((c) => (
                    <div key={c.l} className="rounded-2xl bg-white border border-slate-200 px-4 py-3">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{c.l}</div>
                        <div className={`mt-1 font-display text-2xl font-semibold tracking-tight ${c.tone === "emerald" ? "text-emerald-700" :
                            c.tone === "amber" ? "text-amber-700" :
                                c.tone === "rose" ? "text-rose-600" : "text-slate-900"
                            }`}>{c.v}</div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="rounded-2xl border border-slate-200 bg-white p-3 flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[220px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        data-testid="invoice-search-input"
                        value={filter.q}
                        onChange={(e) => setFilter({ ...filter, q: e.target.value })}
                        placeholder="Search creator, invoice #, PAN…"
                        className="pl-9 h-10 rounded-xl border-slate-200/70"
                    />
                </div>
                <Select value={filter.status} onValueChange={(v) => setFilter({ ...filter, status: v })}>
                    <SelectTrigger data-testid="invoice-filter-status" className="w-[170px] h-10 rounded-xl">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="extracted">Extracted</SelectItem>
                        <SelectItem value="reviewed">Reviewed</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={filter.severity} onValueChange={(v) => setFilter({ ...filter, severity: v })}>
                    <SelectTrigger data-testid="invoice-filter-severity" className="w-[170px] h-10 rounded-xl">
                        <SelectValue placeholder="Severity" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All severities</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="info">Info</SelectItem>
                    </SelectContent>
                </Select>
                {(filter.q || filter.status !== "all" || filter.severity !== "all") && (
                    <Button
                        variant="ghost"
                        size="sm"
                        data-testid="invoice-clear-filters"
                        onClick={() => setFilter({ q: "", status: "all", severity: "all" })}
                        className="text-slate-500 hover:text-slate-900"
                    >
                        <X className="w-4 h-4 mr-1" /> Clear
                    </Button>
                )}
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                <div className="hidden md:grid grid-cols-12 px-4 py-3 border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <div className="col-span-3">Creator</div>
                    <div className="col-span-2">Invoice #</div>
                    <div className="col-span-2">Campaign</div>
                    <div className="col-span-1">Date</div>
                    <div className="col-span-1 text-right">Amount</div>
                    <div className="col-span-2">Flags</div>
                    <div className="col-span-1">Status</div>
                </div>

                {loading ? Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="grid grid-cols-12 px-4 py-3 border-b border-slate-100">
                        <div className="col-span-12 h-6 shimmer rounded-md" />
                    </div>
                )) : rows.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-slate-400" />
                        </div>
                        <p className="mt-4 text-base font-medium text-slate-700">No invoices yet</p>
                        <p className="text-sm text-slate-500">Drop your first PDF and watch CreatorLedger work.</p>
                    </div>
                ) : rows.map((inv, i) => (
                    <motion.button
                        type="button"
                        key={inv.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2, delay: Math.min(i * 0.012, 0.3) }}
                        onClick={() => setOpenInvoice(inv)}
                        data-testid={`invoice-row-${i}`}
                        className="w-full text-left grid md:grid-cols-12 grid-cols-2 px-4 py-3 border-b border-slate-100 hover:bg-slate-50/70 transition-colors items-center gap-y-2"
                    >
                        <div className="md:col-span-3 col-span-2">
                            <div className="font-medium text-slate-900 truncate">{inv.creator_name || "Unknown creator"}</div>
                            <div className="text-xs text-slate-500 truncate md:hidden">{inv.invoice_number}</div>
                        </div>
                        <div className="hidden md:block md:col-span-2 font-mono text-xs text-slate-700">{inv.invoice_number}</div>
                        <div className="hidden md:block md:col-span-2 text-sm text-slate-600 truncate">{inv.campaign_reference}</div>
                        <div className="hidden md:block md:col-span-1 text-xs text-slate-500">{formatDate(inv.invoice_date)}</div>
                        <div className="md:col-span-1 text-right text-sm font-semibold text-slate-900">{formatINR(inv.gross_amount)}</div>
                        <div className="md:col-span-2 flex flex-wrap gap-1.5">
                            {inv.discrepancies?.length ? inv.discrepancies.slice(0, 2).map((d, di) => (
                                <SeverityBadge key={di} severity={d.severity}>{d.label}</SeverityBadge>
                            )) : <span className="text-[10px] text-emerald-700 inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Clean</span>}
                            {inv.discrepancies?.length > 2 && (
                                <span className="text-[10px] font-medium text-slate-500 rounded-full bg-slate-100 px-1.5 py-0.5">+{inv.discrepancies.length - 2}</span>
                            )}
                        </div>
                        <div className="md:col-span-1">
                            <StatusPill status={inv.status} />
                        </div>
                    </motion.button>
                ))}
            </div>

            <InvoiceDrawer
                invoice={openInvoice}
                onClose={() => setOpenInvoice(null)}
                onChanged={async (updated) => {
                    setOpenInvoice(updated);
                    await load();
                }}
            />
        </div>
    );
}

function StatusPill({ status }) {
    const m = {
        extracted: ["bg-slate-100 text-slate-700 border-slate-200", "Extracted"],
        reviewed: ["bg-blue-50 text-blue-700 border-blue-200", "Reviewed"],
        approved: ["bg-emerald-50 text-emerald-800 border-emerald-200", "Approved"],
        rejected: ["bg-rose-50 text-rose-700 border-rose-200", "Rejected"],
    };
    const [cls, label] = m[status] || m.extracted;
    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide border ${cls}`}>
            {label}
        </span>
    );
}
