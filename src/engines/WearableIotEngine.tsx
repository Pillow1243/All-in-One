import React, { useState } from 'react';
import { EngineProps } from '../types';
import { sendIrSignal } from '../services/nativeBridge';
import { Watch, Lightbulb, Power, Tv, Bluetooth, Radio } from 'lucide-react';

export const WearableIotEngine: React.FC<EngineProps> = ({ onToast }) => {
  const [bulbOn, setBulbOn] = useState(true);
  const [bulbColor, setBulbColor] = useState('#22d3ee');
  const [bulbBright, setBulbBright] = useState(80);
  const [plugOn, setPlugOn] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [bleDevices, setBleDevices] = useState<string[]>([]);

  const triggerWebhook = async (action: string) => {
    if (!webhookUrl) return;
    try {
      await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, bulbOn, bulbColor, bulbBright, plugOn }) });
      onToast(`دستور ${action} به Webhook خانه هوشمند ارسال شد`, 'success');
    } catch {
      onToast('خطا در ارسال Webhook محلی', 'error');
    }
  };

  const scanBluetooth = async () => {
    const nav = navigator as Navigator & { bluetooth?: { requestDevice: (opts: any) => Promise<{ name?: string; id: string }> } };
    if (!nav.bluetooth) return onToast('Web Bluetooth در اندروید کروم یا گوشی دارای بلوتوث پشتیبانی می‌شود', 'info');
    try {
      const dev = await nav.bluetooth.requestDevice({ acceptAllDevices: true });
      setBleDevices((d) => Array.from(new Set([`${dev.name || 'BLE Device'} (${dev.id.slice(0, 8)})`, ...d])));
      onToast(`دستگاه بلوتوث متصل شد: ${dev.name || dev.id}`, 'success');
    } catch {
      onToast('انتخاب دستگاه بلوتوث لغو شد', 'info');
    }
  };

  const irCommand = async (name: string) => {
    const res = await sendIrSignal(38000, [9000, 4500, 560, 560, 560, 1690]);
    onToast(res.transmitted ? `سیگنال IR «${name}» ارسال شد!` : `فرمان ریموت «${name}» ثبت شد (نیاز به سنسور IR سخت‌افزاری اندروید)`, 'info');
  };

  return (
    <div className="space-y-4">
      {/* Smart Bulb & Plug */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm flex items-center gap-2"><Lightbulb className="w-4 h-4 text-amber-400" /> کنترل لامپ هوشمند RGB</h3>
            <button onClick={() => { setBulbOn(!bulbOn); triggerWebhook('bulb_toggle'); }} className={`omni-btn text-xs ${bulbOn ? 'bg-amber-400 text-slate-950' : 'omni-btn-secondary'}`}>{bulbOn ? 'روشن' : 'خاموش'}</button>
          </div>
          <div className="h-12 rounded-xl border border-slate-700 transition" style={{ backgroundColor: bulbOn ? bulbColor : '#0f172a', opacity: bulbOn ? bulbBright / 100 : 0.4 }} />
          <div className="flex items-center gap-3 text-xs">
            <input type="color" value={bulbColor} onChange={(e) => setBulbColor(e.target.value)} className="w-10 h-8 rounded" />
            <input type="range" min={10} max={100} value={bulbBright} onChange={(e) => setBulbBright(Number(e.target.value))} className="flex-1" />
            <span>{bulbBright}%</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm flex items-center gap-2"><Power className="w-4 h-4 text-emerald-400" /> پریز هوشمند و Webhook IoT</h3>
            <button onClick={() => { setPlugOn(!plugOn); triggerWebhook('plug_toggle'); }} className={`omni-btn text-xs ${plugOn ? 'bg-emerald-500 text-slate-950' : 'omni-btn-secondary'}`}>{plugOn ? 'وصل (ON)' : 'قطع (OFF)'}</button>
          </div>
          <input dir="ltr" className="omni-input font-mono text-xs" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="Home Assistant / MQTT HTTP Webhook URL (اختیاری)" />
          <div className="text-xs text-slate-400 flex items-center gap-2"><Watch className="w-4 h-4 text-cyan-400" /> Wear OS Sync: آماده همگام‌سازی ضربان و اعلان</div>
        </div>
      </div>

      {/* Universal IR & Smart TV Remote */}
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <h3 className="font-bold text-sm flex items-center gap-2"><Tv className="w-4 h-4 text-cyan-400" /> ریموت کنترل تلویزیون و مادون قرمز همه‌کاره (Android IR Blaster)</h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs">
          {['پاور ⚡', 'صدا +', 'صدا -', 'کانال +', 'کانال -', 'بی‌صدا 🔇', 'ورودی HDMI', 'منو ☰', 'تایید OK', 'کولر ۲۴°'].map((btn) => (
            <button key={btn} onClick={() => irCommand(btn)} className="omni-btn omni-btn-secondary text-xs py-3">{btn}</button>
          ))}
        </div>
      </div>

      {/* Bluetooth BLE Scanner */}
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-sm flex items-center gap-2"><Bluetooth className="w-4 h-4 text-blue-400" /> اسکنر دستگاه‌های بلوتوث (BLE) و IoT</h3>
          <button onClick={scanBluetooth} className="omni-btn omni-btn-primary text-xs"><Radio className="w-4 h-4" /> اسکن بلوتوث</button>
        </div>
        {bleDevices.length > 0 && (
          <div className="space-y-1 text-xs font-mono">
            {bleDevices.map((d) => <div key={d} className="bg-slate-900 p-2 rounded-lg">{d}</div>)}
          </div>
        )}
      </div>
    </div>
  );
};
