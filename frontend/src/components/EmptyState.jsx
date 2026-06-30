import React from "react";
import { cn } from "@/lib/utils";

/** Reusable polished empty state with a pulsing ring around the icon. */
export function EmptyState({ icon: Icon, title, body, action, className, testId, tone = "emerald" }) {
    const tones = {
        emerald: { ring: "ring-emerald-200/70", bg: "bg-emerald-50", icon: "text-emerald-700", pulse: "bg-emerald-300/40" },
        slate: { ring: "ring-slate-200/80", bg: "bg-slate-50", icon: "text-slate-500", pulse: "bg-slate-200/60" },
    };
    const t = tones[tone] || tones.emerald;
    return (
        <div
            data-testid={testId}
            className={cn(
                "relative rounded-2xl border border-slate-200/70 bg-white p-10 sm:p-14 text-center overflow-hidden",
                className,
            )}
        >
            {/* subtle background grid */}
            <span className="absolute inset-0 bg-dotted opacity-[0.5]" aria-hidden="true" />
            <div className="relative">
                <span className="relative mx-auto inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-soft">
                    <span className={cn("absolute inset-0 rounded-2xl animate-ping-slow", t.pulse)} />
                    <Icon className={cn("w-6 h-6 relative", t.icon)} strokeWidth={1.6} />
                </span>
                {title ? (
                    <h3 className="mt-5 font-display text-lg sm:text-xl font-medium tracking-tight text-slate-900">{title}</h3>
                ) : null}
                {body ? (
                    <p className="mt-1.5 text-sm text-slate-500 max-w-md mx-auto leading-relaxed">{body}</p>
                ) : null}
                {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
            </div>
        </div>
    );
}

export default EmptyState;
