import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { motion } from "framer-motion";
import { Calculator as CalculatorIcon, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

export default function Calculator() {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [sample, setSample] = useState(50000);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get("/settings");
                setSettings(data);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const save = async () => {
        setSaving(true);
        try {
            const { data } = await api.patch("/settings", {
                gst_rate: settings.gst_rate,
                tds_section: settings.tds_section,
                tds_rate: settings.tds_rate,
                agency_commission_pct: settings.agency_commission_pct,
                platform_fee_pct: settings.platform_fee_pct,
            });
            setSettings(data);
            toast.success("Finance settings saved");
        } catch (e) {
            toast.error(e.response?.data?.detail || "Could not save");
        } finally {
            setSaving(false);
        }
    };

    if (loading || !settings) {
        return <div className="rounded-2xl bg-white border border-slate-200 h-64 shimmer" />;
    }

    const gst = (sample * settings.gst_rate) / 100;
    const tds = (sample * settings.tds_rate) / 100;
    const commission = (sample * settings.agency_commission_pct) / 100;
    const platform = (sample * settings.platform_fee_pct) / 100;
    const net = sample + gst - tds - commission - platform;

    return (
        <div className="space-y-6" data-testid="calculator-page">
            <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">Finance calculator</div>
                <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-slate-900">Configure your payout math</h1>
                <p className="mt-2 text-sm text-slate-500 max-w-2xl">
                    Tax rules vary by agency. Configure GST, TDS, agency commission and platform fee — the calculator and CSV exports use these values for every payout.
                </p>
            </div>

            <div className="grid lg:grid-cols-12 gap-5">
                <div className="lg:col-span-7 rounded-2xl bg-white border border-slate-200 p-5 sm:p-6">
                    <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Tax & fees</div>
                    <div className="mt-5 space-y-5">
                        <PercentField
                            label="GST applied to gross"
                            value={settings.gst_rate}
                            onChange={(v) => setSettings({ ...settings, gst_rate: v })}
                            testId="setting-gst"
                            max={28}
                        />
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">TDS section</Label>
                                <Input
                                    data-testid="setting-tds-section"
                                    value={settings.tds_section}
                                    onChange={(e) => setSettings({ ...settings, tds_section: e.target.value })}
                                    className="mt-2 rounded-xl"
                                />
                            </div>
                            <PercentField
                                label="TDS rate"
                                value={settings.tds_rate}
                                onChange={(v) => setSettings({ ...settings, tds_rate: v })}
                                testId="setting-tds-rate"
                                max={30}
                                compact
                            />
                        </div>
                        <PercentField
                            label="Agency commission"
                            value={settings.agency_commission_pct}
                            onChange={(v) => setSettings({ ...settings, agency_commission_pct: v })}
                            testId="setting-commission"
                            max={40}
                        />
                        <PercentField
                            label="Platform fee"
                            value={settings.platform_fee_pct}
                            onChange={(v) => setSettings({ ...settings, platform_fee_pct: v })}
                            testId="setting-platform-fee"
                            max={10}
                        />
                    </div>
                    <div className="mt-7 flex justify-end">
                        <Button onClick={save} disabled={saving} data-testid="save-settings-btn" className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Save settings
                        </Button>
                    </div>
                </div>

                {/* Live preview */}
                <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="lg:col-span-5 rounded-2xl bg-gradient-to-br from-emerald-50/60 to-white border border-emerald-200/60 p-5 sm:p-6"
                >
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">
                        <CalculatorIcon className="w-3.5 h-3.5" /> Live payout preview
                    </div>
                    <div className="mt-4">
                        <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Sample invoice gross</Label>
                        <Input
                            data-testid="preview-sample-input"
                            type="number"
                            value={sample}
                            onChange={(e) => setSample(parseFloat(e.target.value || 0))}
                            className="mt-2 rounded-xl"
                        />
                    </div>
                    <div className="mt-5 divide-y divide-emerald-100">
                        <Row k="Gross" v={formatINR(sample)} />
                        <Row k={`+ GST (${settings.gst_rate}%)`} v={formatINR(gst)} />
                        <Row k={`− TDS ${settings.tds_section} (${settings.tds_rate}%)`} v={`−${formatINR(tds)}`} tone="rose" />
                        <Row k={`− Agency (${settings.agency_commission_pct}%)`} v={`−${formatINR(commission)}`} tone="rose" />
                        <Row k={`− Platform (${settings.platform_fee_pct}%)`} v={`−${formatINR(platform)}`} tone="rose" />
                    </div>
                    <div className="mt-5 rounded-xl bg-emerald-700 text-white p-4 flex items-center justify-between">
                        <div className="text-sm font-medium opacity-90">Net payable to creator</div>
                        <div data-testid="preview-net-payable" className="font-display text-2xl font-semibold tracking-tight">{formatINR(net)}</div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

function PercentField({ label, value, onChange, testId, max = 30, compact }) {
    return (
        <div>
            <div className="flex items-center justify-between">
                <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{label}</Label>
                <div className="font-mono text-sm font-semibold text-slate-900 tabular-nums">{Number(value).toFixed(1)}%</div>
            </div>
            <Slider
                data-testid={testId}
                value={[Number(value)]}
                min={0}
                max={max}
                step={0.5}
                onValueChange={(v) => onChange(v[0])}
                className="mt-3"
            />
            {!compact && (
                <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                    <span>0%</span><span>{max}%</span>
                </div>
            )}
        </div>
    );
}

function Row({ k, v, tone }) {
    return (
        <div className="flex items-center justify-between py-2 text-sm">
            <div className="text-slate-700">{k}</div>
            <div className={`font-semibold tabular-nums ${tone === "rose" ? "text-rose-600" : "text-slate-900"}`}>{v}</div>
        </div>
    );
}
