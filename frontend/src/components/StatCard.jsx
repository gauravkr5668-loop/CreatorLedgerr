import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function StatCard({ label, value, sub, icon: Icon, accent = "default", testId, className }) {
    const accents = {
        default: "text-slate-900",
        emerald: "text-emerald-700",
        amber: "text-amber-700",
        rose: "text-rose-600",
        blue: "text-blue-700",
    };
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            data-testid={testId}
            className={cn(
                "group relative rounded-2xl bg-white border border-slate-200/70 p-5 sm:p-6 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 overflow-hidden",
                className,
            )}
        >
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        {label}
                    </div>
                    <div className={cn("font-display text-2xl sm:text-3xl font-semibold tracking-tight", accents[accent])}>
                        {value}
                    </div>
                </div>
                {Icon ? (
                    <span className="text-slate-300 group-hover:text-emerald-600 transition-colors">
                        <Icon className="w-5 h-5" strokeWidth={1.5} />
                    </span>
                ) : null}
            </div>
            {sub ? <div className="mt-3 text-xs text-slate-500">{sub}</div> : null}
            <span className="pointer-events-none absolute -bottom-12 -right-12 w-32 h-32 rounded-full bg-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl" />
        </motion.div>
    );
}

export default StatCard;
