import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { motion } from "framer-motion";
import { CheckCircle2, RefreshCw, Loader2, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SeverityBadge } from "@/components/SeverityBadge";
import { AnomalyIcon } from "@/components/AnomalyIcon";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import InvoiceDrawer from "@/components/InvoiceDrawer";

export default function Reconciliation() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState("all");
    const [rerunning, setRerunning] = useState(false);
    const [params] = useSearchParams();
    const [openInvoice, setOpenInvoice] = useState(null);
    const focusId = params.get("focus");

    const load = async () => {
        setLoading(true);
        try {
            const { data } = await api.get("/invoices");
            setRows(data || []);
            if (focusId) {
                const focused = data.find((d) => d.id === focusId);
                if (focused) setOpenInvoice(focused);
            }
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const flagged = useMemo(() => rows.filter((r) => r.discrepancies?.length), [rows]);
    const filtered = useMemo(() => {
        if (tab === "all") return flagged;
        return flagged.filter((r) => r.discrepancies.some((d) => d.severity === tab));
    }, [flagged, tab]);

    const rerun = async () => {
        setRerunning(true);
        const t = toast.loading("Running reconciliation…");
        try {
            const { data } = await api.post("/reconciliation/run");
            toast.dismiss(t);
            toast.success(`Reconciled ${data.reconciled} invoices · ${data.flagged} flagged`);
            await load();
        } catch (e) {
            toast.dismiss(t);
            toast.error("Reconciliation failed");
        } finally {
            setRerunning(false);
        }
    };

    return (
        <div className="space-y-6" data-testid="reconciliation-page">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">AI reconciliation</div>
                    <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-slate-900">Review flagged invoices</h1>
                    <p className="mt-2 text-sm text-slate-500 max-w-2xl">
                        Every flag includes a one-sentence reason from the AI. Click into any invoice to approve, reject, or edit.
                    </p>
                </div>
                <Button onClick={rerun} disabled={rerunning} data-testid="rerun-reconciliation" className="rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-900 hover:bg-slate-50">
                    {rerunning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                    Re-run reconciliation
                </Button>
            </div>

            <Tabs value={tab} onValueChange={setTab} data-testid="reconciliation-tabs">
                <TabsList className="bg-white border border-slate-200 rounded-xl p-1 h-auto">
                    <TabsTrigger data-testid="tab-all" value="all" className="rounded-lg data-[state=active]:bg-slate-900 data-[state=active]:text-white px-4 py-1.5">
                        All ({flagged.length})
                    </TabsTrigger>
                    <TabsTrigger data-testid="tab-critical" value="critical" className="rounded-lg data-[state=active]:bg-rose-600 data-[state=active]:text-white px-4 py-1.5">
                        Critical ({flagged.filter((r) => r.discrepancies.some((d) => d.severity === "critical")).length})
                    </TabsTrigger>
                    <TabsTrigger data-testid="tab-warning" value="warning" className="rounded-lg data-[state=active]:bg-amber-500 data-[state=active]:text-white px-4 py-1.5">
                        Warning ({flagged.filter((r) => r.discrepancies.some((d) => d.severity === "warning")).length})
                    </TabsTrigger>
                    <TabsTrigger data-testid="tab-info" value="info" className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white px-4 py-1.5">
                        Info ({flagged.filter((r) => r.discrepancies.some((d) => d.severity === "info")).length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value={tab} className="mt-5">
                    {loading ? (
                        <div className="grid lg:grid-cols-2 gap-4">
                            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="rounded-2xl bg-white border border-slate-200 p-6 h-40 shimmer" />)}
                        </div>
                    ) : filtered.length === 0 ? (
                        <EmptyStateInline />
                    ) : (
                        <div className="grid lg:grid-cols-2 gap-4">
                            {filtered.map((inv, i) => (
                                <motion.button
                                    key={inv.id}
                                    type="button"
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.4) }}
                                    onClick={() => setOpenInvoice(inv)}
                                    data-testid={`recon-card-${i}`}
                                    className="text-left rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-300 hover:shadow-card-hover transition-all"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="font-display text-lg font-medium text-slate-900 truncate">{inv.creator_name}</div>
                                            <div className="text-xs text-slate-500 truncate">{inv.invoice_number} · {inv.campaign_reference}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-display text-xl font-semibold tracking-tight text-slate-900">{formatINR(inv.gross_amount)}</div>
                                            <div className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                                                {Math.round((inv.confidence_score || 0) * 100)}% AI
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 space-y-2">
                                        {inv.discrepancies.slice(0, 2).map((d, di) => (
                                            <div key={di} className="rounded-xl bg-slate-50/60 border border-slate-200/70 p-3">
                                                <div className="flex items-start gap-2.5">
                                                    <AnomalyIcon code={d.code} severity={d.severity} className="w-7 h-7" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <div className="font-medium text-sm text-slate-900 truncate">{d.label}</div>
                                                            <SeverityBadge severity={d.severity} />
                                                        </div>
                                                        <div className="mt-1 text-xs text-slate-600 leading-relaxed line-clamp-2">{d.reason}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {inv.discrepancies.length > 2 && (
                                            <div className="text-[11px] font-semibold text-slate-500 px-1">+ {inv.discrepancies.length - 2} more issue{inv.discrepancies.length - 2 > 1 ? "s" : ""}</div>
                                        )}
                                    </div>

                                    <div className="mt-4 flex items-center justify-between text-xs">
                                        <span className="text-slate-500">Click to review</span>
                                        <span className="text-emerald-700 font-medium">Open →</span>
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            <InvoiceDrawer
                invoice={openInvoice}
                onClose={() => setOpenInvoice(null)}
                onChanged={async (u) => {
                    setOpenInvoice(u);
                    await load();
                }}
            />
        </div>
    );
}

function EmptyStateInline() {
    return (
        <EmptyState
            icon={CheckCircle2}
            title="All clear in this slice"
            body="No invoices match this severity filter. Try switching tabs or re-run reconciliation."
        />
    );
}
