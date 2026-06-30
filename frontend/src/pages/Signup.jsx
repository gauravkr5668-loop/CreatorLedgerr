import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sparkles, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function Signup() {
    const navigate = useNavigate();
    const { register, googleSignIn } = useAuth();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        const res = await register(email.trim(), password, name.trim());
        setLoading(false);
        if (res.ok) {
            toast.success("Workspace created. Sample data is loading…");
            navigate("/dashboard");
        } else {
            setError(res.error);
        }
    };

    const handleGoogle = async () => {
        setLoading(true);
        const res = await googleSignIn();
        setLoading(false);
        if (res.ok) {
            toast.success("Signed in with Google (demo)");
            navigate("/dashboard");
        } else {
            setError(res.error);
        }
    };

    return (
        <div className="min-h-screen grid md:grid-cols-2 bg-[hsl(var(--bg))]" data-testid="signup-page">
            <aside className="hidden md:flex relative overflow-hidden bg-[#0F172A] text-white">
                <div className="absolute inset-0 bg-dotted opacity-15" aria-hidden="true" />
                <div className="absolute -bottom-40 -left-20 w-[34rem] h-[34rem] rounded-full bg-emerald-500/20 blur-3xl" />
                <div className="relative z-10 p-12 flex flex-col justify-between">
                    <Logo />
                    <div className="space-y-6 max-w-md">
                        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                            <Sparkles className="w-3.5 h-3.5" /> Free demo workspace
                        </div>
                        <h2 className="font-display text-4xl font-semibold tracking-tight leading-tight">
                            Create your workspace in seconds.
                        </h2>
                        <ul className="space-y-2.5 text-slate-300 text-sm">
                            {[
                                "30 sample creators auto-loaded",
                                "8 campaigns + 50 invoices ready",
                                "12 discrepancies waiting for review",
                                "Full AI explainability included",
                            ].map((it) => (
                                <li key={it} className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-300" /> {it}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="text-xs text-slate-500">© {new Date().getFullYear()} CreatorLedger</div>
                </div>
            </aside>

            <section className="flex items-center justify-center p-6 sm:p-10">
                <div className="w-full max-w-sm">
                    <div className="md:hidden mb-8">
                        <Logo />
                    </div>
                    <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900">Create your workspace</h1>
                    <p className="mt-2 text-sm text-slate-500">
                        Already on CreatorLedger?{" "}
                        <Link to="/login" data-testid="link-login" className="text-emerald-700 font-medium hover:underline">
                            Log in instead
                        </Link>
                    </p>

                    <button
                        type="button"
                        data-testid="google-signin-btn"
                        onClick={handleGoogle}
                        disabled={loading}
                        className="mt-7 w-full inline-flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors px-4 py-2.5 text-sm font-medium text-slate-800 disabled:opacity-60"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 48 48" aria-hidden="true">
                            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                            <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z" />
                            <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
                            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
                        </svg>
                        Continue with Google
                    </button>

                    <div className="my-6 flex items-center gap-4 text-xs text-slate-400">
                        <div className="h-px flex-1 bg-slate-200" /> OR <div className="h-px flex-1 bg-slate-200" />
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="name" className="text-xs font-medium text-slate-700">Your name</Label>
                            <Input id="name" data-testid="signup-name-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Aarti Khanna" className="h-11 rounded-xl" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="email" className="text-xs font-medium text-slate-700">Work email</Label>
                            <Input id="email" data-testid="signup-email-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@agency.com" required className="h-11 rounded-xl" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="password" className="text-xs font-medium text-slate-700">Password</Label>
                            <Input id="password" data-testid="signup-password-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" required minLength={6} className="h-11 rounded-xl" />
                        </div>

                        {error && (
                            <div data-testid="signup-error" className="rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm px-3 py-2">
                                {error}
                            </div>
                        )}

                        <Button
                            data-testid="signup-submit-button"
                            type="submit"
                            disabled={loading}
                            className="w-full h-11 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                <span className="inline-flex items-center gap-2">
                                    Create workspace <ArrowRight className="w-4 h-4" />
                                </span>
                            )}
                        </Button>
                    </form>
                </div>
            </section>
        </div>
    );
}
