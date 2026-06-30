import React from "react";

/** Circular SVG progress ring for confidence/score 0..1. */
export function ConfidenceRing({ value = 0, size = 56, strokeWidth = 4, label = "" }) {
    const pct = Math.max(0, Math.min(1, Number(value) || 0));
    const r = size / 2 - strokeWidth;
    const c = 2 * Math.PI * r;
    const offset = c * (1 - pct);
    const color = pct >= 0.85 ? "#0A805D" : pct >= 0.7 ? "#D97706" : "#E11D48";
    const valColor = pct >= 0.85 ? "text-emerald-700" : pct >= 0.7 ? "text-amber-700" : "text-rose-600";

    return (
        <div className="inline-flex flex-col items-center justify-center" data-testid="confidence-ring">
            <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="-rotate-90">
                    <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(15, 23, 42, 0.08)" strokeWidth={strokeWidth} fill="none" />
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={r}
                        stroke={color}
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeDasharray={c}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.4s" }}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`font-display text-sm font-semibold tabular-nums ${valColor}`}>
                        {Math.round(pct * 100)}
                    </div>
                </div>
            </div>
            {label ? (
                <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{label}</div>
            ) : null}
        </div>
    );
}

export default ConfidenceRing;
