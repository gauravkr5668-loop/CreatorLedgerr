import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { formatINR, formatINRCompact, initials } from "@/lib/format";
import { StatCard } from "@/components/StatCard";
import { SeverityBadge } from "@/components/SeverityBadge";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { EmptyState } from "@/components/EmptyState";
import {
    FileText, Users, Banknote, AlertTriangle, ShieldCheck,
    Hourglass, CheckCircle2, ArrowRight, Sparkles, Wallet,
    TrendingUp, Copy, IdCard,
} from "lucide-react";

const insightIcons = {
    "alert-triangle": AlertTriangle,
    "banknote": Banknote,
    "sparkles": Sparkles,
    "shield-check": ShieldCheck,
    "trending-up": TrendingUp,
    "copy": Copy,
    "id-card": IdCard,
};

const insightTones = {
    critical: "from-rose-50 to-white border-rose-200/70 text-rose-900",
    warning: "from-amber-50 to-white border-amber-200/70 text-amber-900",
    info: "from-blue-50 to-white border-blue-200/70 text-blue-900",
    success: "from-emerald-50 to-white border-emerald-200/70 text-emerald-900",
};

export default function Dashboard() {
    const [summary, setSummary] = useState(null);
    const [insights, setInsights] = useState([]);
    const [topInvoices, setTopInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const [s, i, inv] = await Promise.all([
                    api.get("/dashboard/summary"),
                    api.get("/insights"),
                    api.get("/invoices", { params: { limit: 200 } }),
                ]);
                if (!alive) return;
                setSummary(s.data);
                setInsights(i.data?.insights || []);
                const flagged = (inv.data || []).filter((x) => x.discrepancies?.length);
                setTopInvoices(flagged.slice(0, 5));
                if (!flagged.length) {
                    setTopInvoices((inv.data || []).slice(0, 5));
                }
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, []);

    return (
        <div className="space-y-8" data-testid="dashboard-page">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">Workspace overview</div>
                    <h1 className="mt-2 font-display text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">
                        Good to see you again.
                    </h1>
                    <p className="mt-2 text-sm text-slate-500">
                        Here's where this month's payout cycle stands across every creator and campaign.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link
                        to="/invoices"
                        data-testid="dashboard-cta-upload"
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 text-sm font-medium transition-colors"
                    >
                        Upload invoices <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                        to="/export"
                        data-testid="dashboard-cta-export"
                        className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-900 px-4 py-2.5 text-sm font-medium transition-colors"
                    >
                        Export CSV
                    </Link>
                </div>
            </div>

            {/* Stat bento grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <StatCard testId="stat-invoices-uploaded" label="Invoices uploaded"
                    value={loading ? "—" : <AnimatedNumber value={summary.invoices_uploaded} />}
                    icon={FileText} />
                <StatCard testId="stat-creators-processed" label="Creators processed"
                    value={loading ? "—" : <AnimatedNumber value={summary.creators_processed} />}
                    icon={Users} />
                <StatCard testId="stat-campaign-value" label="Campaign value"
                    value={loading ? "—" : formatINRCompact(summary.total_campaign_value)}
                    icon={Wallet} accent="emerald" />
                <StatCard testId="stat-invoice-value" label="Invoiced this cycle"
                    value={loading ? "—" : formatINRCompact(summary.total_invoice_value)}
                    icon={TrendingUp} accent="emerald" />
                <StatCard testId="stat-flagged-issues" label="Flagged issues"
                    value={loading ? "—" : <AnimatedNumber value={summary.flagged_issues} />}
                    icon={AlertTriangle} accent="rose"
                    sub={loading ? "" : `${summary.critical_issues} critical · ${summary.warning_issues} warning`} />
                <StatCard testId="stat-approved" label="Approved payouts"
                    value={loading ? "—" : <AnimatedNumber value={summary.approved_payouts} />}
                    icon={CheckCircle2} accent="emerald" />
                <StatCard testId="stat-pending" label="Pending review"
                    value={loading ? "—" : <AnimatedNumber value={summary.pending_review} />}
                    icon={Hourglass} accent="amber" />
                <StatCard testId="stat-export-ready" label="Export-ready"
                    value={loading ? "—" : <AnimatedNumber value={summary.export_ready} />}
                    icon={Banknote} accent="emerald" />
            </div>

            {/* AI Insights + flagged list */}
            <div className="grid lg:grid-cols-12 gap-4">
                <div className="lg:col-span-7 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">AI insights</div>
                            <h2 className="mt-1 font-display text-xl sm:text-2xl font-medium text-slate-900">What we noticed this cycle</h2>
                        </div>
                        <Link to="/insights" className="text-xs font-medium text-emerald-700 hover:underline" data-testid="see-all-insights">See all →</Link>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3" data-testid="insights-grid">
                        {loading
                            ? Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 h-32 shimmer" />
                            ))
                            : insights.slice(0, 4).map((c, i) => {
                                const Icon = insightIcons[c.icon] || Sparkles;
                                return (
                                    <motion.div
                                        key={c.id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.35, delay: i * 0.05 }}
                                        data-testid={`insight-card-${c.severity}`}
                                        className={`rounded-2xl border bg-gradient-to-br ${insightTones[c.severity]} p-5`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-white/80 backdrop-blur-sm border border-white/60">
                                                <Icon className="w-4 h-4" strokeWidth={1.75} />
                                            </span>
                                            <SeverityBadge severity={c.severity} />
                                        </div>
                                        <div className="mt-4 font-display text-base font-medium leading-snug">{c.title}</div>
                                        <div className="mt-1 text-sm opacity-80 leading-relaxed">{c.body}</div>
                                    </motion.div>
                                );
                            })}
                    </div>
                </div>

                <div className="lg:col-span-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">Needs attention</div>
                            <h2 className="mt-1 font-display text-xl sm:text-2xl font-medium text-slate-900">Top flagged invoices</h2>
                        </div>
                        <Link to="/reconciliation" className="text-xs font-medium text-emerald-700 hover:underline" data-testid="see-all-flagged">Review all →</Link>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden divide-y divide-slate-100" data-testid="flagged-invoices-list">
                        {loading
                            ? Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="p-4 h-16 shimmer" />
                            ))
                            : topInvoices.length === 0 ? (
                                <div className="p-8 text-center">
                                    <CheckCircle2 className="mx-auto w-8 h-8 text-emerald-600" />
                                    <p className="mt-2 text-sm text-slate-700 font-medium">All clear in this cycle</p>
                                    <p className="text-xs text-slate-400">No invoices need attention right now.</p>
                                </div>
                            ) : topInvoices.map((inv, i) => (
                                <Link
                                    key={inv.id}
                                    to={`/reconciliation?focus=${inv.id}`}
                                    data-testid={`flagged-row-${i}`}
                                    className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors group"
                                >
                                    <span className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center shrink-0 group-hover:bg-emerald-700 group-hover:text-white transition-colors">
                                        {initials(inv.creator_name)}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div className="font-medium text-slate-900 truncate text-sm">{inv.creator_name || "—"}</div>
                                        <div className="text-xs text-slate-500 truncate">{inv.invoice_number} · {inv.campaign_reference}</div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="text-sm font-semibold text-slate-900 tabular-nums">{formatINR(inv.gross_amount)}</div>
                                        <div className="mt-1 flex justify-end">
                                            {inv.discrepancies?.length ? (
                                                <SeverityBadge severity={inv.discrepancies[0].severity}>
                                                    {inv.discrepancies[0].label}
                                                </SeverityBadge>
                                            ) : (
                                                <span className="text-[10px] text-slate-400">No issues</span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
