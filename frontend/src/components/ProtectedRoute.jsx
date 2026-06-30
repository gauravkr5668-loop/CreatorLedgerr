import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading || user === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--bg))]">
                <div className="flex items-center gap-3 text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 pulse-dot" />
                    <span className="text-sm tracking-wide">Loading CreatorLedger…</span>
                </div>
            </div>
        );
    }
    if (!user) return <Navigate to="/login" replace />;
    return children;
}
