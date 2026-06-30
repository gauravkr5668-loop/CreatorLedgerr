import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";
import {
    LayoutDashboard, FileText, FolderKanban, ClipboardCheck,
    Calculator, Download, Sparkles, Search, ChevronDown,
    LogOut, Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";
import {
    DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
    DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

const NAV = [
    { to: "/dashboard", label: "Dashboard", Icon: LayoutDashboard, testId: "nav-dashboard" },
    { to: "/campaigns", label: "Campaigns", Icon: FolderKanban, testId: "nav-campaigns" },
    { to: "/invoices", label: "Invoices", Icon: FileText, testId: "nav-invoices" },
    { to: "/reconciliation", label: "Reconciliation", Icon: ClipboardCheck, testId: "nav-reconciliation" },
    { to: "/insights", label: "AI Insights", Icon: Sparkles, testId: "nav-insights" },
    { to: "/calculator", label: "Calculator", Icon: Calculator, testId: "nav-calculator" },
    { to: "/export", label: "Export", Icon: Download, testId: "nav-export" },
];

function Sidebar() {
    return (
        <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-slate-200/70 bg-white/60 backdrop-blur-sm">
            <div className="px-6 pt-6 pb-4">
                <Logo />
            </div>
            <div className="px-3 pb-2">
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400 px-3 mb-2">
                    Workspace
                </div>
                <nav className="flex flex-col gap-0.5">
                    {NAV.map(({ to, label, Icon, testId }) => (
                        <NavLink
                            key={to}
                            to={to}
                            data-testid={testId}
                            className={({ isActive }) =>
                                cn(
                                    "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-emerald-50 text-emerald-800"
                                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                                )
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    {isActive && (
                                        <motion.span
                                            layoutId="active-nav-indicator"
                                            className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-emerald-600"
                                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                        />
                                    )}
                                    <Icon className="w-4 h-4" strokeWidth={1.75} />
                                    {label}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>
            </div>
            <div className="mt-auto px-4 pb-5 pt-6">
                <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                        Demo workspace
                    </div>
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                        Sample creators, campaigns and invoices are loaded for you. Try a re-extraction on any invoice.
                    </p>
                </div>
            </div>
        </aside>
    );
}

function TopBar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [q, setQ] = useState("");
    const searchRef = React.useRef(null);

    React.useEffect(() => {
        const onKey = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                searchRef.current?.focus();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    return (
        <header className="sticky top-0 z-40 glass-strong border-b border-slate-200/60">
            <div className="flex items-center gap-4 px-4 sm:px-6 h-16">
                <div className="lg:hidden">
                    <Logo size="sm" />
                </div>
                <div className="flex-1 max-w-xl relative hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" strokeWidth={1.75} />
                    <Input
                        ref={searchRef}
                        data-testid="global-search-input"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && q.trim()) {
                                navigate(`/invoices?q=${encodeURIComponent(q.trim())}`);
                            }
                        }}
                        placeholder="Search creators, campaigns, PAN, invoice #…"
                        className="pl-9 pr-14 h-10 rounded-xl bg-white border-slate-200/70 focus:ring-2 focus:ring-emerald-700/15 focus:border-emerald-700/40"
                    />
                    <kbd className="hidden lg:inline-flex items-center justify-center absolute right-2 top-1/2 -translate-y-1/2 h-6 px-1.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200/70 font-mono">
                        ⌘K
                    </kbd>
                </div>
                <div className="ml-auto flex items-center gap-3">
                    <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-dot" /> Live
                    </span>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                data-testid="user-menu-trigger"
                                className="flex items-center gap-2 rounded-xl border border-slate-200/70 bg-white px-2 py-1.5 hover:border-slate-300 transition-colors"
                            >
                                <span className="w-7 h-7 rounded-full bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center">
                                    {initials(user?.name || user?.email)}
                                </span>
                                <span className="hidden sm:block text-sm font-medium text-slate-700 max-w-[120px] truncate">
                                    {user?.name || user?.email}
                                </span>
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel className="text-xs text-slate-500">
                                {user?.agency_name || "CreatorLedger Studio"}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => navigate("/calculator")} data-testid="user-menu-settings">
                                <Settings className="w-4 h-4 mr-2" /> Finance settings
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                data-testid="user-menu-logout"
                                onClick={async () => {
                                    await logout();
                                    navigate("/");
                                }}
                            >
                                <LogOut className="w-4 h-4 mr-2" /> Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}

function MobileNav() {
    return (
        <nav className="lg:hidden flex overflow-x-auto gap-1 px-3 py-2 border-b border-slate-200/70 bg-white/70 backdrop-blur-sm">
            {NAV.map(({ to, label, Icon, testId }) => (
                <NavLink
                    key={to}
                    to={to}
                    data-testid={`${testId}-mobile`}
                    className={({ isActive }) =>
                        cn(
                            "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap",
                            isActive ? "bg-emerald-50 text-emerald-800" : "text-slate-600 hover:bg-slate-100",
                        )
                    }
                >
                    <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
                    {label}
                </NavLink>
            ))}
        </nav>
    );
}

export default function AppLayout() {
    return (
        <div className="min-h-screen flex bg-[hsl(var(--bg))]">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <TopBar />
                <MobileNav />
                <main className="flex-1 px-4 sm:px-8 py-6 sm:py-10">
                    <div className="max-w-7xl mx-auto">
                        <PageTransition>
                            <Outlet />
                        </PageTransition>
                    </div>
                </main>
            </div>
        </div>
    );
}
/div>
    );
}
