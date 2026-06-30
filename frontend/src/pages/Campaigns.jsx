import React, { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FolderKanban, Trash2, Plus, FileSpreadsheet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function Campaigns() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({
        creator_name: "", campaign_name: "", agreed_fee: "", deliverables: "",
        status: "active", campaign_manager: "",
    });
    const fileRef = useRef(null);

    const load = async () => {
        setLoading(true);
        try {
            const { data } = await api.get("/campaigns");
            setRows(data || []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const onUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const fd = new FormData();
        fd.append("file", file);
        setUploading(true);
        try {
            const { data } = await api.post("/campaigns/upload", fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            toast.success(`${data.inserted} campaigns imported`);
            await load();
        } catch (err) {
            toast.error(err.response?.data?.detail || "Upload failed");
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = "";
        }
    };

    const submit = async (e) => {
        e.preventDefault();
        const payload = { ...form, agreed_fee: parseFloat(form.agreed_fee || 0) };
        try {
            await api.post("/campaigns", payload);
            toast.success("Campaign added");
            setOpen(false);
            setForm({ creator_name: "", campaign_name: "", agreed_fee: "", deliverables: "", status: "active", campaign_manager: "" });
            await load();
        } catch (err) {
            toast.error(err.response?.data?.detail || "Could not save");
        }
    };

    const remove = async (id) => {
        try {
            await api.delete(`/campaigns/${id}`);
            toast.success("Campaign removed");
            await load();
        } catch {
            toast.error("Failed to delete");
        }
    };

    return (
        <div className="space-y-6" data-testid="campaigns-page">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">Campaign master sheet</div>
                    <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-slate-900">Campaigns</h1>
                    <p className="mt-2 text-sm text-slate-500 max-w-2xl">
                        The source of truth for what each creator agreed to deliver and at what rate. Reconciliation runs against this sheet.
                    </p>
                </div>
                <div className="flex gap-2">
                    <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onUpload} data-testid="campaigns-upload-input" />
                    <Button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                        data-testid="campaigns-upload-btn"
                        className="rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-900 hover:bg-slate-50 shadow-none"
                    >
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileSpreadsheet className="w-4 h-4 mr-2" />}
                        Upload Excel
                    </Button>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button data-testid="campaign-add-btn" className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white">
                                <Plus className="w-4 h-4 mr-2" /> Add campaign
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md rounded-2xl">
                            <DialogHeader>
                                <DialogTitle className="font-display">Add campaign</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={submit} className="space-y-3">
                                <div>
                                    <Label className="text-xs">Creator name</Label>
                                    <Input data-testid="campaign-form-creator" value={form.creator_name} onChange={(e) => setForm({ ...form, creator_name: e.target.value })} required />
                                </div>
                                <div>
                                    <Label className="text-xs">Campaign name</Label>
                                    <Input data-testid="campaign-form-name" value={form.campaign_name} onChange={(e) => setForm({ ...form, campaign_name: e.target.value })} required />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label className="text-xs">Agreed fee (₹)</Label>
                                        <Input data-testid="campaign-form-fee" type="number" value={form.agreed_fee} onChange={(e) => setForm({ ...form, agreed_fee: e.target.value })} required />
                                    </div>
                                    <div>
                                        <Label className="text-xs">Manager</Label>
                                        <Input data-testid="campaign-form-manager" value={form.campaign_manager} onChange={(e) => setForm({ ...form, campaign_manager: e.target.value })} />
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs">Deliverables</Label>
                                    <Input data-testid="campaign-form-deliverables" value={form.deliverables} onChange={(e) => setForm({ ...form, deliverables: e.target.value })} placeholder="1 Reel, 2 Stories" />
                                </div>
                                <DialogFooter>
                                    <Button data-testid="campaign-form-submit" type="submit" className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl">Save campaign</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                <div className="grid grid-cols-12 px-4 py-3 border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <div className="col-span-3">Creator</div>
                    <div className="col-span-3">Campaign</div>
                    <div className="col-span-2">Agreed fee</div>
                    <div className="col-span-2">Manager</div>
                    <div className="col-span-1">Status</div>
                    <div className="col-span-1 text-right">—</div>
                </div>
                <AnimatePresence>
                    {loading ? Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="grid grid-cols-12 px-4 py-3 border-b border-slate-100">
                            <div className="col-span-12 h-6 shimmer rounded-md" />
                        </div>
                    )) : rows.length === 0 ? (
                        <div className="p-10 text-center">
                            <div className="mx-auto w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center">
                                <FolderKanban className="w-5 h-5 text-slate-400" />
                            </div>
                            <p className="mt-3 text-sm text-slate-600 font-medium">No campaigns yet</p>
                            <p className="text-xs text-slate-400">Upload your master sheet or add one manually.</p>
                        </div>
                    ) : rows.map((c, i) => (
                        <motion.div
                            key={c.id}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: i * 0.015 }}
                            data-testid={`campaign-row-${i}`}
                            className="grid grid-cols-12 items-center px-4 py-3 border-b border-slate-100 hover:bg-slate-50/60 transition-colors"
                        >
                            <div className="col-span-3 text-sm font-medium text-slate-900 truncate">{c.creator_name}</div>
                            <div className="col-span-3 text-sm text-slate-600 truncate">{c.campaign_name}</div>
                            <div className="col-span-2 text-sm font-semibold text-slate-900">{formatINR(c.agreed_fee)}</div>
                            <div className="col-span-2 text-sm text-slate-500 truncate">{c.campaign_manager || "—"}</div>
                            <div className="col-span-1">
                                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide border ${c.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                    c.status === "completed" ? "bg-slate-50 text-slate-600 border-slate-200" :
                                        "bg-amber-50 text-amber-700 border-amber-200"
                                    }`}>{c.status}</span>
                            </div>
                            <div className="col-span-1 flex justify-end">
                                <button
                                    onClick={() => remove(c.id)}
                                    data-testid={`campaign-delete-${i}`}
                                    className="text-slate-400 hover:text-rose-600 transition-colors p-1.5 rounded-lg hover:bg-rose-50"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
