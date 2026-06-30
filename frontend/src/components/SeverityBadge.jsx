import React from "react";
import { cn } from "@/lib/utils";

const styles = {
    critical: "bg-rose-50 text-rose-600 border-rose-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export const SeverityBadge = ({ severity = "info", children, className, ...rest }) => {
    return (
        <span
            data-testid={`severity-badge-${severity}`}
            className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border tracking-wide uppercase",
                styles[severity] || styles.info,
                className,
            )}
            {...rest}
        >
            <span className={cn("w-1.5 h-1.5 rounded-full",
                severity === "critical" ? "bg-rose-500" :
                severity === "warning" ? "bg-amber-500" :
                severity === "success" ? "bg-emerald-500" : "bg-blue-500")} />
            {children || severity}
        </span>
    );
};

export default SeverityBadge;
