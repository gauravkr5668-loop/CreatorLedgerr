import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Upload, FileText, Image as ImageIcon, X, Sparkles,
    CheckCircle2, AlertCircle, Loader2, Trash2,
} from "lucide-react";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const MAX_SIZE_MB = 10;
const ACCEPT_MIME = new Set(["application/pdf", "image/png", "image/jpeg"]);

function niceBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function iconFor(file) {
    return file.type === "application/pdf" ? FileText : ImageIcon;
}

export function UploadModal({ open, onOpenChange, onComplete }) {
    const [items, setItems] = useState([]); // {id, file, status, result?, error?}
    const [busy, setBusy] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        if (!open) {
            // small delay so the close animation completes before clearing
            const t = setTimeout(() => setItems([]), 200);
            return () => clearTimeout(t);
        }
    }, [open]);

    const addFiles = useCallback((list) => {
        const next = [];
        for (const f of Array.from(list || [])) {
            if (!ACCEPT_MIME.has(f.type)) {
                toast.error(`${f.name} — unsupported type`);
                continue;
            }
            if (f.size > MAX_SIZE_MB * 1024 * 1024) {
                toast.error(`${f.name} exceeds ${MAX_SIZE_MB} MB`);
                continue;
            }
            next.push({
                id: `${f.name}-${f.size}-${Math.random().toString(36).slice(2, 8)}`,
                file: f,
                status: "queued",
            });
        }
        if (next.length) setItems((prev) => [...prev, ...next]);
    }, []);

    const onDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        addFiles(e.dataTransfer.files);
    };

    const remove = (id) => setItems((prev) => prev.filter((x) => x.id !== id));

    const start = async () => {
        const pending = items.filter((x) => x.status === "queued" || x.status === "error");
        if (!pending.length) return;
        setBusy(true);
        setItems((prev) =>
            prev.map((x) =>
                x.status === "queued" || x.status === "error" ? { ...x, status: "extracting", error: null } : x,
            ),
        );
        const fd = new FormData();
        for (const x of pending) fd.append("files", x.file);
        try {
            const { data } = await api.post("/invoices/upload", fd, {
                headers: { "Content-Type": "multipart/form-data" },
                timeout: 240000,
            });
            const byName = {};
            for (const r of data.results || []) byName[r.file] = r;
            setItems((prev) =>
                prev.map((x) => {
                    if (x.status !== "extracting") return x;
                    const r = byName[x.file.name];
                    if (!r) return { ...x, status: "error", error: "No response from server" };
                    return r.ok
                        ? { ...x, status: "done", result: r.invoice }
                        : { ...x, status: "error", error: r.error || "Extraction failed" };
                }),
            );
            const ok = (data.results || []).filter((r) => r.ok).length;
            const fail = (data.results || []).filter((r) => !r.ok).length;
            if (ok) toast.success(`${ok} invoice${ok > 1 ? "s" : ""} extracted & reconciled`);
            if (fail) toast.error(`${fail} file${fail > 1 ? "s" : ""} failed`);
            onComplete?.();
        } catch (e) {
            toast.error(e.response?.data?.detail || e.message || "Upload failed");
            setItems((prev) =>
                prev.map((x) =>
                    x.status === "extracting" ? { ...x, status: "error", error: "Network error" } : x,
                ),
            );
        } finally {
            setBusy(false);
        }
    };

    const allDone = items.length > 0 && items.every((x) => x.status === "done");
    const queuedCount = items.filter((x) => x.status === "queued" || x.status === "error").length;
    const doneCount = items.filter((x) => x.status === "done").length;

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                if (busy) return;
                onOpenChange(v);
            }}
        >
            <DialogContent
                className="sm:max-w-2xl rounded-2xl p-0 overflow-hidden border-slate-200/70"
                data-testid="upload-modal"
            >
                <div className="p-6 sm:p-7">
                    <DialogHeader className="space-y-1">
                        <div className="flex items-start justify-between">
                            <div>
                                <DialogTitle className="font-display text-2xl font-semibold tracking-tight">
                                    Upload creator invoices
                                </DialogTitle>
                                <DialogDescription className="text-slate-500 mt-1">
                                    PDF, PNG or JPG · up to {MAX_SIZE_MB} MB each · AI extracts and reconciles each one.
                                </DialogDescription>
                            </div>
                            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 border border-emerald-200">
                                <Sparkles className="w-3.5 h-3.5" />
                                GPT-5.2 · Gemini
                            </span>
                        </div>
                    </DialogHeader>

                    {/* Drop zone */}
                    <div
                        role="button"
                        tabIndex={0}
                        onDragOver={(e) => {
                            e.preventDefault();
                            setDragOver(true);
                        }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={onDrop}
                        onClick={() => inputRef.current?.click()}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
                        }}
                        data-testid="upload-modal-dropzone"
                        className={`mt-5 group rounded-2xl border-2 border-dashed transition-all cursor-pointer p-7 sm:p-9 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/30 ${dragOver
                            ? "border-emerald-500 bg-emerald-50/60"
                            : "border-slate-200 hover:border-emerald-400 bg-slate-50/40 hover:bg-emerald-50/30"
                            }`}
                    >
                        <input
                            ref={inputRef}
                            type="file"
                            multiple
                            accept="application/pdf,image/png,image/jpeg"
                            className="hidden"
                            onChange={(e) => {
                                addFiles(e.target.files);
                                e.target.value = "";
                            }}
                            data-testid="upload-modal-input"
                        />
                        <div className={`mx-auto w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${dragOver
                            ? "bg-emerald-700 border-emerald-700 shadow-lg scale-105"
                            : "bg-white border-slate-200 group-hover:border-emerald-200 shadow-sm"
                            }`}>
                            <Upload
                                className={`w-5 h-5 transition-colors ${dragOver ? "text-white" : "text-emerald-700"}`}
                                strokeWidth={1.75}
                            />
                        </div>
                        <div className="mt-4 font-display text-base font-medium text-slate-900">
                            {dragOver ? "Drop them here" : "Drag invoices in, or click to browse"}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                            PDF · PNG · JPG · multiple files supported
                        </div>
                    </div>

                    {/* File list */}
                    <AnimatePresence initial={false}>
                        {items.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.25 }}
                                className="mt-5 rounded-2xl border border-slate-200 bg-white overflow-hidden"
                            >
                                <div className="max-h-[280px] overflow-y-auto">
                                    {items.map((x, i) => {
                                        const Icon = iconFor(x.file);
                                        return (
                                            <motion.div
                                                key={x.id}
                                                initial={{ opacity: 0, x: -8 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.3) }}
                                                className="flex items-center gap-3 px-3.5 py-2.5 border-b border-slate-100 last:border-b-0"
                                            >
                                                <div
                                                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${x.status === "done"
                                                        ? "bg-emerald-50 text-emerald-700"
                                                        : x.status === "error"
                                                            ? "bg-rose-50 text-rose-600"
                                                            : "bg-slate-100 text-slate-600"
                                                        }`}
                                                >
                                                    <Icon className="w-4 h-4" strokeWidth={1.75} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-sm text-slate-900 truncate">
                                                        {x.file.name}
                                                    </div>
                                                    <div className="text-xs text-slate-500 flex items-center gap-2 truncate">
                                                        <span className="shrink-0">{niceBytes(x.file.size)}</span>
                                                        <StatusDetail item={x} />
                                                    </div>
                                                </div>
                                                <StatusPill status={x.status} />
                                                {!busy && x.status !== "done" && (
                                                    <button
                                                        type="button"
                                                        onClick={() => remove(x.id)}
                                                        aria-label={`Remove ${x.file.name}`}
                                                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Footer */}
                    <div className="mt-6 flex items-center justify-between gap-3">
                        <div className="text-xs text-slate-500 min-w-0 truncate">
                            {items.length === 0 ? (
                                "No files queued yet"
                            ) : (
                                <span>
                                    <span className="font-medium text-slate-700">{items.length}</span> file
                                    {items.length > 1 ? "s" : ""} · <span className="text-emerald-700 font-medium">{doneCount}</span> extracted
                                    {queuedCount > 0 && (
                                        <> · <span className="text-slate-700 font-medium">{queuedCount}</span> queued</>
                                    )}
                                </span>
                            )}
                        </div>
                        <div className="flex gap-2">
                            {items.length > 0 && !busy && !allDone && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setItems([])}
                                    data-testid="upload-modal-clear"
                                    className="text-slate-500 hover:text-slate-900"
                                >
                                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                    Clear
                                </Button>
                            )}
                            {allDone ? (
                                <Button
                                    onClick={() => onOpenChange(false)}
                                    data-testid="upload-modal-done"
                                    className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white"
                                >
                                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                                    Done
                                </Button>
                            ) : (
                                <Button
                                    onClick={start}
                                    disabled={busy || !queuedCount}
                                    data-testid="upload-modal-start"
                                    className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white disabled:bg-slate-200 disabled:text-slate-400"
                                >
                                    {busy ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> Extracting…
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4 mr-1.5" />
                                            Extract & reconcile
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function StatusDetail({ item }) {
    if (item.status === "done" && item.result) {
        return (
            <span className="text-emerald-700 truncate inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                {item.result.creator_name || "Extracted"} · {item.result.invoice_number || "—"}
            </span>
        );
    }
    if (item.status === "extracting") {
        return (
            <span className="text-emerald-700 inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3 animate-pulse shrink-0" />
                <span className="extracting-shimmer">AI extracting fields…</span>
            </span>
        );
    }
    if (item.status === "error") {
        return (
            <span className="text-rose-600 truncate inline-flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {item.error}
            </span>
        );
    }
    return null;
}

function StatusPill({ status }) {
    const map = {
        queued: ["bg-slate-100 text-slate-600 border-slate-200", "Queued"],
        extracting: ["bg-emerald-50 text-emerald-700 border-emerald-200", "Extracting"],
        done: ["bg-emerald-100 text-emerald-800 border-emerald-300", "Done"],
        error: ["bg-rose-50 text-rose-700 border-rose-200", "Failed"],
    };
    const [cls, label] = map[status] || map.queued;
    return (
        <span className={`text-[10px] font-bold uppercase tracking-widest rounded-full px-2 py-0.5 border ${cls}`}>
            {label}
        </span>
    );
}

export default UploadModal;
