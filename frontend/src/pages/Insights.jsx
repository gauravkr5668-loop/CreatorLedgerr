import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { Sparkles, AlertTriangle, Banknote, ShieldCheck, TrendingUp, Copy, IdCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SeverityBadge } from "@/components/SeverityBadge";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";

const ICONS = {
    "alert-triangle": AlertTriangle,
    "banknote": Banknote,
    "sparkles": Sparkles,
    "shield-check": ShieldCheck,
    "trending-up": TrendingUp,
    "copy": Copy,
    "id-card": IdCard,
};

const TONES = {
    critical: "from-rose-50 to-white border-rose-200/70",
    warning: "from-amber-50 to-white border-amber-200/70",
    info: "from-blue-50 to-white border-blue-200/70",
    success: "from-emerald-50 to-white border-emerald-200/70",
};

export default function Insights() {
    const [insights, setInsights] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = async (useLlm = false) => {
        if (useLlm) setRefreshing(true);
        else setLoading(true);
        try {
            const { data } = await api.get("/insights", { params: { use_llm: useLlm } });
            setInsights(data?.insights || []);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { load(false); }, []);

    return (
        <div className="space-y-6" data-testid="insights-page">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">AI insights</div>
                    <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-slate-900">What CreatorLedger noticed</h1>
                    <p className="mt-2 text-sm text-slate-500 max-w-2xl">
                        High-signal patterns across this cycle's invoices — the things you'd want to know without reading 50 PDFs.
                    </p>
                </div>
                <Button
                    onClick={async () => {
                        const t = toast.loading("Asking GPT-5.2 for fresh observations…");
                        await load(true);
                        toast.dismiss(t);
                        toast.success("Insights refreshed with GPT-5.2");
                    }}
                    disabled={refreshing}
                    data-testid="refresh-ai-insights"
                    className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white"
                >
                    {refreshing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    Refresh with AI
                </Button>
            </div>

            {loading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => <div key={i} className="rounded-2xl border border-slate-200 bg-white h-44 shimmer" />)}
                </div>
            ) : insights.length === 0 ? (
                <EmptyState
                    icon={Sparkles}
                    title="No insights yet"
                    body="Upload your campaign sheet and a few invoices, then come back. CreatorLedger will surface what changed and what needs your attention."
                />
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {insights.map((c, i) => {
                        const Icon = ICONS[c.icon] || Sparkles;
                        return (
                            <motion.div
                                key={c.id}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.35, delay: i * 0.04 }}
                                data-testid={`insight-${i}`}
                                className={`rounded-2xl border bg-gradient-to-br ${TONES[c.severity] || TONES.info} p-5`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white border border-white/60">
                                        <Icon className="w-4 h-4" strokeWidth={1.75} />
                                    </span>
                                    <SeverityBadge severity={c.severity} />
                                </div>
                                <div className="mt-4 font-display text-base font-medium leading-snug text-slate-900">{c.title}</div>
                                <div className="mt-1.5 text-sm text-slate-600 leading-relaxed">{c.body}</div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
