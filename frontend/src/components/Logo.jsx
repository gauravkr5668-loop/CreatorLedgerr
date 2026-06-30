import React from "react";
import { cn } from "@/lib/utils";

export const Logo = ({ className, size = "md" }) => {
    const dot = size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3";
    const text = size === "sm" ? "text-sm" : "text-base";
    return (
        <div className={cn("flex items-center gap-2.5", className)} data-testid="brand-logo">
            <span className="relative inline-flex">
                <span className={cn("rounded-[5px] bg-emerald-700", dot)} />
                <span className={cn("absolute -top-1 -right-1 rounded-full bg-amber-400", "w-1.5 h-1.5")} />
            </span>
            <span className={cn("font-display font-semibold tracking-tight text-slate-900", text)}>
                CreatorLedger
            </span>
        </div>
    );
};

export default Logo;
