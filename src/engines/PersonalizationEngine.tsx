import React, { useRef, useState } from 'react';
import { EngineProps } from '../types';
import { speakText, vibrateDevice } from '../services/nativeBridge';
import { Palette, Zap, Image as ImgIcon, Volume2 } from 'lucide-react';

const ACCENT_PALETTES = [
  { name: 'فیروزه‌ای نئون', p: '#06b6d4', s: '#8b5cf6' },
  { name: 'یاقوتی گرادینت', p: '#f43f5e', s: '#f97316' },
  { name: 'زمردی هوشمند', p: '#10b981', s: '#06b6d4' },
  { name: 'طلایی لوکس', p: '#f59e0b', s: '#ef4444' },
  { name: 'بنفش کیهانی', p: '#a855f7', s: '#ec4899' },
  { name: 'آبی اقیانوسی', p: '#3b82f6', s: '#0ea5e9' },
];

export const PersonalizationEngine: React.FC<EngineProps> = ({ settings, onUpdateSettings, onToast }) => {
  const wallRef = useRef<HTMLCanvasElement | null>(null);
  const [newRuleName, setNewRuleName] = useState('');

  const generateWallpaper = () => {
    const c = wallRef.current;
    if (!c) return;
    c.width = 720;
    c.height = 1280;
    const ctx = c.getContext('2d')!;
    const g = ctx.createLinearGradient(0, 0, 720, 1280);
    g.addColorStop(0, '#050814');
    g.addColorStop(0.5, settings.accentPrimary);
    g.addColorStop(1, settings.accentSecondary);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 720, 1280);
    for (let i = 0; i < 18; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * 720, Math.random() * 1280, 40 + Math.random() * 140, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${0.04 + Math.random() * 0.08})`;
      ctx.fill();
    }
    const a = document.createElement('a');
    a.href = c.toDataURL('image/png');
    a.download = `omniforge-wallpaper-${Date.now()}.png`;
    a.click();
    onToast('والپیپر اختصاصی با رنگ تم شما ساخته و دانلود شد!', 'success');
  };

  const playChime = (freq: number) => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    [freq, freq * 1.25, freq * 1.5].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = f;
      g.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.12);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.3);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + i * 0.12);
      o.stop(ctx.currentTime + i * 0.12 + 0.3);
    });
  };

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-2xl p-4 space-y-4">
        <h3 className="font-bold text-sm flex items-center gap-2"><Palette className="w-4 h-4 text-fuchsia-400" /> تم، رنگ‌بندی و فونت اختصاصی برنامه</h3>
        <div className="grid grid-cols-3 gap-2 text-xs">
          {([['dark', '🌙 تاریک شیشه‌ای'], ['oled', '⬛ مشکی مطلق OLED'], ['light', '☀️ روشن روز']] as const).map(([m, lbl]) => (
            <button key={m} onClick={() => onUpdateSettings({ theme: m })} className={`rounded-xl py-2.5 font-bold ${settings.theme === m ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
              {lbl}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {ACCENT_PALETTES.map((pal) => (
            <button
              key={pal.name}
              onClick={() => onUpdateSettings({ accentPrimary: pal.p, accentSecondary: pal.s })}
              className="rounded-xl p-2.5 bg-slate-900/70 border border-slate-700 flex items-center gap-2 text-xs hover:border-white/40"
            >
              <span className="w-6 h-6 rounded-full shrink-0" style={{ background: `linear-gradient(135deg, ${pal.p}, ${pal.s})` }} />
              <span>{pal.name}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span>مقیاس اندازه فونت ({Math.round(settings.fontScale * 100)}%):</span>
          <input type="range" min={0.85} max={1.45} step={0.05} value={settings.fontScale} onChange={(e) => onUpdateSettings({ fontScale: Number(e.target.value) })} className="flex-1" />
        </div>
        <div className="flex flex-wrap gap-3 text-xs">
          <label className="flex items-center gap-2"><input type="checkbox" checked={settings.focusMode} onChange={(e) => onUpdateSettings({ focusMode: e.target.checked })} /> حالت تمرکز (Focus Mode)</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={settings.dndMode} onChange={(e) => onUpdateSettings({ dndMode: e.target.checked })} /> مزاحم نشوید (DND)</label>
        </div>
      </div>

      {/* Tasker-like Visual Automation & Macros */}
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <h3 className="font-bold text-sm flex items-center gap-2"><Zap className="w-4 h-4 text-amber-400" /> موتور اتوماسیون هوشمند و ماکرو (Tasker-like)</h3>
        <div className="flex gap-2">
          <input className="omni-input text-xs" value={newRuleName} onChange={(e) => setNewRuleName(e.target.value)} placeholder="نام قانون اتوماسیون جدید..." />
          <button
            onClick={() => {
              if (!newRuleName.trim()) return;
              onUpdateSettings({
                automations: [...settings.automations, { id: `auto-${Date.now()}`, name: newRuleName, enabled: true, trigger: 'manual', action: 'enable_oled' }],
              });
              setNewRuleName('');
              onToast('قانون اتوماسیون اضافه شد', 'success');
            }}
            className="omni-btn omni-btn-primary text-xs shrink-0"
          >
            + قانون جدید
          </button>
        </div>
        <div className="space-y-2 text-xs">
          {settings.automations.map((rule) => (
            <div key={rule.id} className="bg-slate-900/70 p-3 rounded-xl flex items-center justify-between gap-2">
              <div><div className="font-bold">{rule.name}</div><div className="text-[11px] text-slate-400">Trigger: {rule.trigger} → Action: {rule.action}</div></div>
              <button
                onClick={() => {
                  if (rule.action === 'enable_oled') onUpdateSettings({ theme: 'oled' });
                  else if (rule.action === 'speak_greeting') speakText(rule.actionValue || 'خوش آمدید', 'fa-IR');
                  else vibrateDevice([120, 60, 120]);
                  onToast(`ماکرو «${rule.name}» اجرا شد!`, 'success');
                }}
                className="omni-btn omni-btn-primary text-xs"
              >
                اجرا
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Wallpaper & Notification Synth */}
      <div className="glass-card rounded-2xl p-4 flex flex-wrap gap-2 items-center justify-between">
        <canvas ref={wallRef} className="hidden" />
        <button onClick={generateWallpaper} className="omni-btn omni-btn-primary text-xs"><ImgIcon className="w-4 h-4" /> تولید و دانلود والپیپر اختصاصی</button>
        <div className="flex gap-2">
          <button onClick={() => playChime(523)} className="omni-btn omni-btn-secondary text-xs"><Volume2 className="w-3.5 h-3.5" /> زنگ اعلان ۱</button>
          <button onClick={() => playChime(698)} className="omni-btn omni-btn-secondary text-xs"><Volume2 className="w-3.5 h-3.5" /> زنگ اعلان ۲</button>
        </div>
      </div>
    </div>
  );
};
