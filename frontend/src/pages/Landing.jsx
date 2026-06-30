import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";
import { SeverityBadge } from "@/components/SeverityBadge";
import {
    ArrowRight, Sparkles, ShieldCheck, FileText, Upload, ClipboardCheck,
    Banknote, AlertTriangle, IdCard, Copy, CheckCircle2, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const fadeUp = {
    initial: { opacity: 0, y: 18 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" },
    transition: { duration: 0.5, ease: "easeOut" },
};

function NavBar() {
    return (
        <header className="sticky top-0 z-50 glass-strong border-b border-slate-200/60">
            <div className="max-w-7xl mx-auto flex items-center justify-between px-5 sm:px-8 h-16">
                <Logo />
                <nav className="hidden md:flex items-center gap-7 text-sm text-slate-600">
                    <a href="#problem" className="hover:text-slate-900 transition-colors" data-testid="nav-problem">Problem</a>
                    <a href="#how" className="hover:text-slate-900 transition-colors" data-testid="nav-how">How it works</a>
                    <a href="#features" className="hover:text-slate-900 transition-colors" data-testid="nav-features">Features</a>
                    <a href="#pricing" className="hover:text-slate-900 transition-colors" data-testid="nav-pricing">Pricing</a>
                    <a href="#faq" className="hover:text-slate-900 transition-colors" data-testid="nav-faq">FAQ</a>
                </nav>
                <div className="flex items-center gap-2">
                    <Link
                        to="/login"
                        data-testid="nav-login"
                        className="hidden sm:inline-flex items-center px-3.5 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
                    >
                        Log in
                    </Link>
                    <Link
                        to="/signup"
                        data-testid="hero-cta-signup"
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 px-4 py-2 text-sm font-medium text-white transition-colors"
                    >
                        Start Free Audit
                        <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
                    </Link>
                </div>
            </div>
        </header>
    );
}

function Hero() {
    return (
        <section className="relative overflow-hidden">
            {/* subtle background */}
            <div className="absolute inset-0 bg-grid opacity-[0.6]" aria-hidden="true" />
            <div className="absolute -top-32 -right-32 w-[42rem] h-[42rem] rounded-full bg-emerald-100/60 blur-3xl" aria-hidden="true" />
            <div className="absolute -bottom-40 -left-32 w-[34rem] h-[34rem] rounded-full bg-amber-100/40 blur-3xl" aria-hidden="true" />

            <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-16 sm:pt-24 pb-12 sm:pb-20">
                <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
                    <div className="lg:col-span-7">
                        <motion.div {...fadeUp}>
                            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                                <Sparkles className="w-3.5 h-3.5" /> AI Finance Copilot for Influencer Agencies
                            </div>
                        </motion.div>
                        <motion.h1
                            {...fadeUp}
                            transition={{ duration: 0.55, ease: "easeOut", delay: 0.05 }}
                            className="mt-5 font-display text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tighter text-slate-900 leading-[1.04]"
                        >
                            From <span className="text-emerald-700">100 creator invoices</span> to ready-to-pay in minutes.
                        </motion.h1>
                        <motion.p
                            {...fadeUp}
                            transition={{ duration: 0.55, ease: "easeOut", delay: 0.12 }}
                            className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl"
                        >
                            CreatorLedger automatically extracts creator invoices, verifies campaign rates,
                            detects finance issues and prepares payout-ready exports — so your finance team
                            spends minutes, not weekends.
                        </motion.p>
                        <motion.div
                            {...fadeUp}
                            transition={{ duration: 0.55, ease: "easeOut", delay: 0.2 }}
                            className="mt-8 flex flex-wrap items-center gap-3"
                        >
                            <Link
                                to="/signup"
                                data-testid="hero-primary-cta"
                                className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-5 py-3 text-sm font-medium text-white shadow-sm transition-colors"
                            >
                                Start Free Audit
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                            <a
                                href="#how"
                                data-testid="hero-secondary-cta"
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-800 hover:border-slate-300 transition-colors"
                            >
                                Watch demo
                            </a>
                        </motion.div>
                        <motion.div
                            {...fadeUp}
                            transition={{ duration: 0.55, ease: "easeOut", delay: 0.3 }}
                            className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-3 text-xs text-slate-500"
                        >
                            <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-700" />SOC-2 ready architecture</div>
                            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-700" />Built for Indian GST & TDS</div>
                            <div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-emerald-700" />Powered by GPT-5.2</div>
                        </motion.div>
                    </div>

                    {/* Right: live preview card */}
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
                        className="lg:col-span-5"
                    >
                        <HeroPreview />
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

function HeroPreview() {
    return (
        <div className="relative">
            <div className="absolute -inset-2 bg-gradient-to-br from-emerald-200/50 to-amber-100/40 rounded-3xl blur-2xl" aria-hidden="true" />
            <div className="relative rounded-3xl bg-white border border-slate-200/70 shadow-card p-5 sm:p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <FileText className="w-4 h-4" /> Invoice #INV-0241
                    </div>
                    <SeverityBadge severity="critical">Critical</SeverityBadge>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <div className="text-[11px] uppercase tracking-wide text-slate-400">Creator</div>
                        <div className="font-medium text-slate-900">Ananya Iyer</div>
                    </div>
                    <div>
                        <div className="text-[11px] uppercase tracking-wide text-slate-400">Campaign</div>
                        <div className="font-medium text-slate-900">Festive Glow · Maybelline</div>
                    </div>
                    <div>
                        <div className="text-[11px] uppercase tracking-wide text-slate-400">Billed</div>
                        <div className="font-medium text-rose-600">₹42,000</div>
                    </div>
                    <div>
                        <div className="text-[11px] uppercase tracking-wide text-slate-400">Agreed</div>
                        <div className="font-medium text-slate-900">₹35,000</div>
                    </div>
                </div>

                <div className="mt-5 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/70 to-white p-4">
                    <div className="flex items-center gap-2 text-emerald-800 text-xs font-semibold">
                        <Sparkles className="w-3.5 h-3.5" />
                        AI Confidence · 96%
                    </div>
                    <p className="mt-2 text-sm text-slate-700 leading-relaxed">
                        Creator billed <span className="font-semibold">₹42,000</span> but the campaign sheet shows
                        <span className="font-semibold"> ₹35,000</span>. Possible overbilling of
                        <span className="font-semibold text-rose-600"> ₹7,000</span> detected.
                    </p>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-slate-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-dot" />
                        41 invoices analysed · 14 flagged
                    </div>
                    <span className="text-slate-400">12s</span>
                </div>
            </div>
        </div>
    );
}

function Stats() {
    const stats = [
        { v: "94%", l: "less time spent on payout prep" },
        { v: "12s", l: "average per-invoice extraction" },
        { v: "11", l: "issue types detected automatically" },
        { v: "₹2.4 Cr", l: "reconciled in the demo dataset" },
    ];
    return (
        <section className="border-y border-slate-200/70 bg-white/60">
            <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10 grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-8">
                {stats.map((s) => (
                    <div key={s.l}>
                        <div className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">{s.v}</div>
                        <div className="mt-1 text-xs sm:text-sm text-slate-500">{s.l}</div>
                    </div>
                ))}
            </div>
        </section>
    );
}

function Problem() {
    return (
        <section id="problem" className="py-20 sm:py-28">
            <div className="max-w-7xl mx-auto px-5 sm:px-8 grid lg:grid-cols-12 gap-12 items-center">
                <motion.div {...fadeUp} className="lg:col-span-5">
                    <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">The problem</div>
                    <h2 className="mt-3 font-display text-3xl sm:text-4xl font-medium tracking-tight text-slate-900">
                        Creator invoices arrive in 30 different shapes — finance teams burn weekends on them.
                    </h2>
                    <p className="mt-5 text-slate-600 leading-relaxed">
                        Canva, Word, screenshots, PDFs, hand-typed invoices, missing PANs, swapped bank accounts.
                        Multiply by 100 creators every cycle and your finance team disappears for the week.
                    </p>
                </motion.div>
                <motion.div {...fadeUp} className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
                    {[
                        { t: "Opening every invoice by hand", d: "Different layouts, different fields, no consistency." },
                        { t: "Cross-checking the campaign sheet", d: "Did this creator agree to ₹35k or ₹42k? Where was that thread?" },
                        { t: "Hunting missing PAN / GSTIN", d: "Email creators one by one, wait for replies, chase again." },
                        { t: "Building the payout CSV", d: "Account, IFSC, TDS, GST. Re-key into the payout system. Hope nothing breaks." },
                    ].map((it, i) => (
                        <div
                            key={it.t}
                            className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-300 hover:shadow-soft transition-all"
                        >
                            <div className="text-[11px] font-bold tracking-widest text-slate-400">#{String(i + 1).padStart(2, "0")}</div>
                            <div className="mt-2 font-medium text-slate-900">{it.t}</div>
                            <div className="mt-1.5 text-sm text-slate-500">{it.d}</div>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

function HowItWorks() {
    const steps = [
        { t: "Upload campaign sheet", d: "Drop in your Excel master sheet — agreed rates, deliverables, managers.", Icon: Upload, tag: "Step 01" },
        { t: "Drop in creator invoices", d: "PDF, PNG, JPG — bulk. We extract every field automatically.", Icon: FileText, tag: "Step 02" },
        { t: "AI reconciles & flags", d: "Rate mismatch, missing PAN, duplicates, bank changes — all caught in seconds.", Icon: Sparkles, tag: "Step 03" },
        { t: "Approve & export", d: "Review flagged items, approve the rest, export a payout-ready CSV.", Icon: Banknote, tag: "Step 04" },
    ];
    return (
        <section id="how" className="py-20 sm:py-28 bg-gradient-to-b from-white to-[#FBFBF8]">
            <div className="max-w-7xl mx-auto px-5 sm:px-8">
                <motion.div {...fadeUp} className="max-w-3xl">
                    <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">How it works</div>
                    <h2 className="mt-3 font-display text-3xl sm:text-4xl font-medium tracking-tight text-slate-900">
                        Upload. Verify. Pay.
                    </h2>
                    <p className="mt-4 text-slate-600 leading-relaxed">
                        One workflow replaces the entire payout cycle — built for how influencer agencies actually operate.
                    </p>
                </motion.div>

                <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {steps.map(({ t, d, Icon, tag }, i) => (
                        <motion.div
                            key={t}
                            {...fadeUp}
                            transition={{ duration: 0.5, delay: i * 0.06 }}
                            className="relative rounded-2xl border border-slate-200/70 bg-white p-6 hover:shadow-card-hover hover:-translate-y-0.5 transition-all"
                        >
                            <div className="flex items-center justify-between">
                                <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700">
                                    <Icon className="w-4 h-4" strokeWidth={1.75} />
                                </span>
                                <span className="text-[10px] font-bold tracking-widest text-slate-400">{tag}</span>
                            </div>
                            <div className="mt-5 font-display text-lg font-medium text-slate-900">{t}</div>
                            <div className="mt-2 text-sm text-slate-500 leading-relaxed">{d}</div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function Features() {
    const items = [
        { Icon: AlertTriangle, t: "Rate mismatch detection", d: "Catches every invoice billed above the agreed campaign value." },
        { Icon: IdCard, t: "PAN & GSTIN validation", d: "Flags creators missing tax details before payout, not after." },
        { Icon: Copy, t: "Duplicate invoice catch", d: "Compares against past months — no creator gets paid twice." },
        { Icon: ShieldCheck, t: "Bank account change alerts", d: "Notices when a creator's bank changes between invoices." },
        { Icon: Sparkles, t: "Explainable AI", d: "Every flag comes with a one-line reason and a confidence score." },
        { Icon: Banknote, t: "Payout-ready exports", d: "CSV with account, IFSC, TDS, GST and net payable in one click." },
    ];
    return (
        <section id="features" className="py-20 sm:py-28">
            <div className="max-w-7xl mx-auto px-5 sm:px-8">
                <motion.div {...fadeUp} className="max-w-3xl">
                    <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">What you get</div>
                    <h2 className="mt-3 font-display text-3xl sm:text-4xl font-medium tracking-tight text-slate-900">
                        Eleven types of finance issues — caught automatically.
                    </h2>
                </motion.div>
                <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {items.map(({ Icon, t, d }, i) => (
                        <motion.div
                            key={t}
                            {...fadeUp}
                            transition={{ duration: 0.45, delay: i * 0.04 }}
                            className="rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-card-hover hover:-translate-y-0.5 transition-all"
                        >
                            <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 text-slate-700">
                                <Icon className="w-4 h-4" strokeWidth={1.75} />
                            </span>
                            <div className="mt-4 font-medium text-slate-900">{t}</div>
                            <div className="mt-1.5 text-sm text-slate-500 leading-relaxed">{d}</div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function AIShowcase() {
    return (
        <section className="py-20 sm:py-28 bg-[#0F172A] text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-dotted opacity-10" aria-hidden="true" />
            <div className="absolute -top-40 right-0 w-[36rem] h-[36rem] rounded-full bg-emerald-500/15 blur-3xl" aria-hidden="true" />
            <div className="max-w-7xl mx-auto px-5 sm:px-8 grid lg:grid-cols-12 gap-10 items-center relative">
                <motion.div {...fadeUp} className="lg:col-span-6">
                    <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300">AI explainability</div>
                    <h2 className="mt-3 font-display text-3xl sm:text-4xl font-medium tracking-tight">
                        Don't just flag it — explain it.
                    </h2>
                    <p className="mt-4 text-slate-300 leading-relaxed">
                        CreatorLedger doesn't dump alerts on your finance team. Every flag comes with a one-sentence
                        reason in plain English and a confidence score — so they know exactly why the AI is worried.
                    </p>
                </motion.div>

                <motion.div {...fadeUp} className="lg:col-span-6 space-y-3">
                    <AICardDark severity="critical" title="Possible duplicate invoice" body="Invoice total, creator name and invoice number closely match invoice INV-0218 — confidence 94%." />
                    <AICardDark severity="warning" title="Bank account changed" body="Account number differs from previous invoice for Diya Nair — verify with creator before payout." />
                    <AICardDark severity="info" title="Low extraction confidence" body="OCR confidence 0.62 on Riya Sharma's invoice — manually verify amounts and bank fields." />
                </motion.div>
            </div>
        </section>
    );
}

function AICardDark({ severity, title, body }) {
    const tones = {
        critical: "border-rose-400/30 bg-rose-400/10 text-rose-200",
        warning: "border-amber-400/30 bg-amber-400/10 text-amber-200",
        info: "border-sky-400/30 bg-sky-400/10 text-sky-200",
    };
    return (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between">
                <div className="font-medium">{title}</div>
                <span className={`text-[10px] font-bold uppercase tracking-[0.18em] rounded-full px-2 py-0.5 border ${tones[severity]}`}>
                    {severity}
                </span>
            </div>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">{body}</p>
        </div>
    );
}

function Security() {
    return (
        <section className="py-20 sm:py-28">
            <div className="max-w-7xl mx-auto px-5 sm:px-8 grid lg:grid-cols-12 gap-10 items-start">
                <motion.div {...fadeUp} className="lg:col-span-5">
                    <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">Security</div>
                    <h2 className="mt-3 font-display text-3xl sm:text-4xl font-medium tracking-tight text-slate-900">
                        Finance-grade by default.
                    </h2>
                    <p className="mt-4 text-slate-600 leading-relaxed">
                        Bank details, PANs and GSTINs never leave your workspace. Invoices are processed in-memory,
                        access tokens are httpOnly, and every action is auditable.
                    </p>
                </motion.div>
                <motion.div {...fadeUp} className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
                    {[
                        ["Encrypted at rest", "All persisted invoice data is encrypted on disk."],
                        ["Role-based access", "Owner / reviewer / read-only roles per workspace."],
                        ["Audit trail", "Every approve / reject / edit is recorded with reviewer + timestamp."],
                        ["GDPR & DPDP", "Designed to comply with Indian DPDP and EU GDPR."],
                    ].map(([t, d]) => (
                        <div key={t} className="rounded-2xl border border-slate-200 bg-white p-5">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                                <div className="font-medium text-slate-900">{t}</div>
                            </div>
                            <div className="mt-2 text-sm text-slate-500 leading-relaxed">{d}</div>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

function Pricing() {
    const tiers = [
        {
            name: "Starter",
            price: "₹9,999",
            unit: "/mo",
            blurb: "For boutique agencies running ≤ 100 creators a month.",
            features: ["Up to 100 invoices / mo", "Bulk PDF + image extract", "AI reconciliation", "CSV export"],
            cta: "Start free audit",
            highlight: false,
        },
        {
            name: "Studio",
            price: "₹29,999",
            unit: "/mo",
            blurb: "For mid-market agencies managing 1,000+ campaigns a year.",
            features: ["Up to 1,000 invoices / mo", "Multi-workspace", "API access", "Priority support", "Audit log export"],
            cta: "Talk to sales",
            highlight: true,
        },
        {
            name: "Scale",
            price: "Custom",
            unit: "",
            blurb: "For agencies & holding groups with 10+ brand teams.",
            features: ["Unlimited invoices", "SAML / SSO", "Dedicated CSM", "On-prem option", "Custom integrations"],
            cta: "Talk to sales",
            highlight: false,
        },
    ];
    return (
        <section id="pricing" className="py-20 sm:py-28 bg-gradient-to-b from-[#FBFBF8] to-white">
            <div className="max-w-7xl mx-auto px-5 sm:px-8">
                <motion.div {...fadeUp} className="max-w-3xl">
                    <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">Pricing</div>
                    <h2 className="mt-3 font-display text-3xl sm:text-4xl font-medium tracking-tight text-slate-900">
                        Replace 40 finance-hours a month for less than ₹10k.
                    </h2>
                </motion.div>
                <div className="mt-12 grid md:grid-cols-3 gap-5">
                    {tiers.map((t) => (
                        <motion.div
                            key={t.name}
                            {...fadeUp}
                            className={`rounded-2xl p-6 border ${t.highlight
                                ? "border-emerald-700/30 bg-gradient-to-br from-emerald-50 to-white shadow-card-hover"
                                : "border-slate-200 bg-white"
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="font-display text-lg font-medium text-slate-900">{t.name}</div>
                                {t.highlight && <SeverityBadge severity="success">Most popular</SeverityBadge>}
                            </div>
                            <div className="mt-4 flex items-baseline gap-1">
                                <div className="font-display text-4xl font-semibold tracking-tighter text-slate-900">{t.price}</div>
                                <div className="text-slate-500 text-sm">{t.unit}</div>
                            </div>
                            <p className="mt-2 text-sm text-slate-500 leading-relaxed">{t.blurb}</p>
                            <ul className="mt-5 space-y-2.5 text-sm">
                                {t.features.map((f) => (
                                    <li key={f} className="flex items-start gap-2 text-slate-700">
                                        <CheckCircle2 className="w-4 h-4 mt-[2px] text-emerald-700" />
                                        <span>{f}</span>
                                    </li>
                                ))}
                            </ul>
                            <Link
                                to="/signup"
                                data-testid={`pricing-cta-${t.name.toLowerCase()}`}
                                className={`mt-7 inline-flex items-center justify-center w-full rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${t.highlight
                                    ? "bg-emerald-700 hover:bg-emerald-800 text-white"
                                    : "bg-slate-900 hover:bg-slate-800 text-white"
                                    }`}
                            >
                                {t.cta}
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function FAQ() {
    const items = [
        { q: "Does this work for invoices in any format?", a: "Yes. PDFs, JPGs, PNGs, scanned files — anything readable. Multi-page PDFs are supported too." },
        { q: "What about GST and TDS calculations?", a: "We never hardcode tax rules. You configure GST %, TDS section and rate, agency commission and platform fee — and the payout sheet calculates net payable accordingly." },
        { q: "Where does my data live?", a: "Your workspace data lives in an isolated MongoDB tenant. We never train models on your invoice content." },
        { q: "Can I integrate with my existing payout system?", a: "Yes. Use the CSV export today, or get API access on the Studio and Scale tiers." },
        { q: "How much time will I really save?", a: "Agencies using CreatorLedger save 94% of finance-team time on payout prep — what used to be a week becomes an afternoon." },
    ];
    return (
        <section id="faq" className="py-20 sm:py-28">
            <div className="max-w-3xl mx-auto px-5 sm:px-8">
                <motion.div {...fadeUp}>
                    <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">FAQ</div>
                    <h2 className="mt-3 font-display text-3xl sm:text-4xl font-medium tracking-tight text-slate-900">
                        Questions, answered.
                    </h2>
                </motion.div>
                <Accordion type="single" collapsible className="mt-10">
                    {items.map((it, i) => (
                        <AccordionItem key={it.q} value={`q-${i}`} className="border-b border-slate-200">
                            <AccordionTrigger
                                data-testid={`faq-trigger-${i}`}
                                className="py-5 text-left font-medium text-slate-900 hover:no-underline"
                            >
                                {it.q}
                            </AccordionTrigger>
                            <AccordionContent className="text-slate-600 leading-relaxed pb-5">
                                {it.a}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </section>
    );
}

function CTA() {
    return (
        <section className="py-16 sm:py-24">
            <div className="max-w-6xl mx-auto px-5 sm:px-8">
                <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-10 sm:p-14">
                    <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-emerald-500/20 blur-3xl" />
                    <div className="absolute inset-0 bg-dotted opacity-10" />
                    <div className="relative grid md:grid-cols-12 gap-8 items-center">
                        <div className="md:col-span-8">
                            <h2 className="font-display text-3xl sm:text-4xl font-medium tracking-tight">
                                Run your next payout cycle in under an hour.
                            </h2>
                            <p className="mt-3 text-slate-300 max-w-xl">
                                Sign up free, drop in this month's invoices, and watch the discrepancies surface in seconds.
                            </p>
                        </div>
                        <div className="md:col-span-4 flex md:justify-end">
                            <Link
                                to="/signup"
                                data-testid="footer-cta"
                                className="inline-flex items-center gap-2 rounded-xl bg-white text-slate-900 hover:bg-emerald-50 px-5 py-3 text-sm font-medium transition-colors"
                            >
                                Start Free Audit <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function Footer() {
    return (
        <footer className="border-t border-slate-200 py-10">
            <div className="max-w-7xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                    <Logo size="sm" />
                    <span>© {new Date().getFullYear()} CreatorLedger — finance copilot for influencer agencies.</span>
                </div>
                <div className="flex items-center gap-5">
                    <a href="#" className="hover:text-slate-800">Privacy</a>
                    <a href="#" className="hover:text-slate-800">Terms</a>
                    <a href="#" className="hover:text-slate-800">Security</a>
                </div>
            </div>
        </footer>
    );
}

export default function Landing() {
    return (
        <div className="bg-[hsl(var(--bg))] min-h-screen" data-testid="landing-page">
            <NavBar />
            <Hero />
            <Stats />
            <Problem />
            <HowItWorks />
            <Features />
            <AIShowcase />
            <Security />
            <Pricing />
            <FAQ />
            <CTA />
            <Footer />
        </div>
    );
}
