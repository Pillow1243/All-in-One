import React, { useRef, useState } from 'react';
import { ColorBlindMode, EngineProps } from '../types';
import { speakText, vibrateDevice } from '../services/nativeBridge';
import { Eye, Mic, ZoomIn, Volume2 } from 'lucide-react';

export const AccessibilityEngine: React.FC<EngineProps> = ({ settings, onUpdateSettings, onToast }) => {
  const [captionText, setCaptionText] = useState('');
  const [captioning, setCaptioning] = useState(false);
  const [magZoom, setMagZoom] = useState(2);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [camOn, setCamOn] = useState(false);

  const toggleLiveCaptions = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return onToast('زیرنویس زنده گفتار در این مرورگر پشتیبانی نمی‌شود', 'error');
    if (captioning) { setCaptioning(false); return; }
    const rec = new SR();
    rec.lang = 'fa-IR';
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e: any) => {
      const txt = Array.from(e.results).map((r: any) => r[0].transcript).join(' ');
      setCaptionText(txt);
    };
    rec.start();
    setCaptioning(true);
    onToast('زیرنویس زنده فعال شد — صحبت کنید', 'success');
  };

  const startMagnifier = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCamOn(true);
    } catch {
      onToast('دسترسی به دوربین برای ذره‌بین داده نشد', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-2xl p-4 space-y-4">
        <h3 className="font-bold text-sm flex items-center gap-2"><Eye className="w-4 h-4 text-teal-400" /> تنظیمات سراسری بینایی، کنتراست بالا و فیلتر کوررنگی</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <label className="bg-slate-900/70 p-3 rounded-xl flex items-center justify-between">
            <span>کنتراست بسیار بالا (High Contrast)</span>
            <input type="checkbox" checked={settings.highContrast} onChange={(e) => onUpdateSettings({ highContrast: e.target.checked })} />
          </label>
          <label className="bg-slate-900/70 p-3 rounded-xl flex items-center justify-between">
            <span>لرزش لمسی (Haptic Feedback)</span>
            <input type="checkbox" checked={settings.hapticsEnabled} onChange={(e) => { onUpdateSettings({ hapticsEnabled: e.target.checked }); if (e.target.checked) vibrateDevice([80]); }} />
          </label>
        </div>

        <div className="space-y-2 text-xs">
          <div className="font-bold">فیلتر واقعی اصلاح/شبیه‌سازی کوررنگی (SVG Matrix روی کل برنامه):</div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {([['none', 'عادی'], ['protanopia', 'پروتانوپیا (قرمز)'], ['deuteranopia', 'دوتراپیا (سبز)'], ['tritanopia', 'تریتانوپیا (آبی)'], ['achromatopsia', 'تک‌رنگ کامل']] as [ColorBlindMode, string][]).map(([m, lbl]) => (
              <button key={m} onClick={() => onUpdateSettings({ colorBlindMode: m })} className={`rounded-xl py-2 px-2 font-semibold ${settings.colorBlindMode === m ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
                {lbl}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span>بزرگ‌نمایی فونت کل اپ ({Math.round(settings.fontScale * 100)}%):</span>
          <input type="range" min={1} max={1.5} step={0.05} value={settings.fontScale} onChange={(e) => onUpdateSettings({ fontScale: Number(e.target.value) })} className="flex-1" />
        </div>
      </div>

      {/* Live Captions & Quick Sign Phraseboard */}
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <h3 className="font-bold text-sm flex items-center gap-2"><Mic className="w-4 h-4 text-cyan-400" /> زیرنویس زنده گفتار و تابلوی ارتباط سریع صوتی</h3>
        <button onClick={toggleLiveCaptions} className="omni-btn omni-btn-primary text-xs">
          {captioning ? '⏹ توقف زیرنویس زنده' : '🎙️ شروع زیرنویس زنده (Live Captions)'}
        </button>
        {captionText && <div className="rounded-xl bg-black p-4 text-lg font-bold text-amber-200 border border-amber-500/40">{captionText}</div>}
        <div className="flex flex-wrap gap-2">
          {['سلام، لطفاً کمی بلندتر صحبت کنید', 'لطفاً کمکم کنید', 'ممنون از همراهی شما', 'بله متوجه شدم'].map((phrase) => (
            <button key={phrase} onClick={() => speakText(phrase, 'fa-IR')} className="omni-btn omni-btn-secondary text-xs">
              <Volume2 className="w-3.5 h-3.5" /> {phrase}
            </button>
          ))}
        </div>
      </div>

      {/* Camera Magnifier */}
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm flex items-center gap-2"><ZoomIn className="w-4 h-4 text-amber-400" /> ذره‌بین دیجیتال زنده دوربین ({magZoom}x)</h3>
          <button onClick={startMagnifier} className="omni-btn omni-btn-primary text-xs">روشن کردن دوربین ذره‌بین</button>
        </div>
        <input type="range" min={1} max={5} step={0.5} value={magZoom} onChange={(e) => setMagZoom(Number(e.target.value))} className="w-full" />
        {camOn && (
          <div className="overflow-hidden rounded-xl border border-slate-700 h-56 bg-black">
            <video ref={videoRef} autoPlay playsInline style={{ transform: `scale(${magZoom})` }} className="w-full h-full object-cover transition-transform" />
          </div>
        )}
      </div>
    </div>
  );
};
