import React from "react";
import {
    TrendingUp, IdCard, ShieldAlert, Banknote, RefreshCcw,
    Copy, Sparkles, SearchX, AlertTriangle, Calculator,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS = {
    RATE_MISMATCH: TrendingUp,
    MISSING_PAN: IdCard,
    MISSING_GSTIN: ShieldAlert,
    MISSING_BANK: Banknote,
    BANK_CHANGED: RefreshCcw,
    DUPLICATE: Copy,
    LOW_CONFIDENCE: Sparkles,
    MISSING_CAMPAIGN: SearchX,
    CAMPAIGN_MISMATCH: AlertTriangle,
    TOTAL_MISMATCH: Calculator,
};

const TONES = {
    critical: "bg-rose-50 text-rose-600 ring-rose-200/60",
    warning: "bg-amber-50 text-amber-700 ring-amber-200/60",
    info: "bg-blue-50 text-blue-700 ring-blue-200/60",
    success: "bg-emerald-50 text-emerald-700 ring-emerald-200/60",
};

export function AnomalyIcon({ code, severity = "info", className }) {
    const Icon = ICONS[code] || AlertTriangle;
    return (
        <span
            className={cn(
                "inline-flex items-center justify-center w-9 h-9 rounded-xl ring-1",
                TONES[severity] || TONES.info,
                className,
            )}
            aria-hidden="true"
        >
            <Icon className="w-4 h-4" strokeWidth={1.75} />
        </span>
    );
}

export default AnomalyIcon;
