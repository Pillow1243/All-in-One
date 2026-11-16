import React, { useEffect, useRef, useState } from 'react';
import { EngineProps } from '../types';
import { ScanEye, Camera, Ruler, Sofa, Glasses } from 'lucide-react';

export const ArStudioEngine: React.FC<EngineProps> = ({ tool, onToast }) => {
  const [arMode, setArMode] = useState<'measure' | 'compass' | 'furniture' | 'tryon' | 'filters' | 'edu'>('measure');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [camActive, setCamActive] = useState(false);
  const [rulerCm, setRulerCm] = useState(12.5);
  const [heading, setHeading] = useState(0);
  const [propPos, setPropPos] = useState({ x: 50, y: 55, scale: 1, item: '🛋️' });
  const [arFilter, setArFilter] = useState('none');

  useEffect(() => {
    const m = tool.mode;
    if (['measure', 'compass', 'furniture', 'tryon', 'filters', 'edu'].includes(m)) setArMode(m as any);
  }, [tool.id, tool.mode]);

  useEffect(() => {
    const h = (e: DeviceOrientationEvent) => setHeading(Math.round(e.alpha || 0));
    window.addEventListener('deviceorientation', h);
    return () => window.removeEventListener('deviceorientation', h);
  }, []);

  const toggleCamera = async () => {
    if (camActive) {
      const s = videoRef.current?.srcObject as MediaStream | null;
      s?.getTracks().forEach((t) => t.stop());
      setCamActive(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: arMode === 'tryon' ? 'user' : 'environment' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCamActive(true);
    } catch {
      onToast('حالت شبیه‌ساز AR فعال شد (برای دوربین زنده مجوز دوربین را تایید کنید)', 'info');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 overflow-x-auto pb-2">
        {[
          ['measure', 'خط‌کش و متر AR'],
          ['compass', 'قطب‌نما HUD'],
          ['furniture', 'چیدمان مبلمان AR'],
          ['tryon', 'پرو مجازی عینک/کلاه'],
          ['filters', 'فیلتر زنده AR'],
          ['edu', 'منظومه شمسی AR'],
        ].map(([id, lbl]) => (
          <button key={id} onClick={() => setArMode(id as any)} className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold ${arMode === id ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white' : 'bg-slate-800/70 text-slate-300'}`}>
            {lbl}
          </button>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm flex items-center gap-2"><ScanEye className="w-4 h-4 text-fuchsia-400" /> استودیو واقعیت افزوده زنده (AR Viewport)</h3>
          <button onClick={toggleCamera} className="omni-btn omni-btn-primary text-xs"><Camera className="w-4 h-4" /> {camActive ? 'بستن دوربین' : 'روشن کردن دوربین AR'}</button>
        </div>

        {/* Live AR Viewport with Interactive Overlays */}
        <div className="relative h-72 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 border border-violet-500/40 flex items-center justify-center">
          <video ref={videoRef} autoPlay playsInline muted style={{ filter: arFilter }} className={`absolute inset-0 w-full h-full object-cover ${camActive ? 'opacity-100' : 'opacity-0'}`} />

          {arMode === 'measure' && (
            <div className="relative z-10 w-4/5 space-y-2 text-center">
              <div className="h-1 bg-cyan-400 relative flex justify-between items-center shadow shadow-cyan-400">
                <span className="w-3 h-3 rounded-full bg-cyan-300 -mx-1" />
                <span className="bg-black/80 px-3 py-1 rounded-full text-xs font-mono text-cyan-300 -mt-9">{rulerCm.toFixed(1)} cm</span>
                <span className="w-3 h-3 rounded-full bg-cyan-300 -mx-1" />
              </div>
              <input type="range" min={1} max={100} step={0.5} value={rulerCm} onChange={(e) => setRulerCm(Number(e.target.value))} className="w-full" />
            </div>
          )}

          {arMode === 'compass' && (
            <div className="relative z-10 bg-black/60 backdrop-blur px-6 py-3 rounded-2xl border border-cyan-400/40 text-center">
              <div className="text-3xl font-black font-mono text-cyan-300">{heading}°</div>
              <div className="text-xs text-slate-300">AR Compass & Walking Navigation HUD</div>
            </div>
          )}

          {(arMode === 'furniture' || arMode === 'tryon') && (
            <div
              style={{ left: `${propPos.x}%`, top: `${propPos.y}%`, transform: `translate(-50%, -50%) scale(${propPos.scale})` }}
              className="absolute z-10 text-7xl select-none drop-shadow-2xl"
            >
              {propPos.item}
            </div>
          )}

          {arMode === 'edu' && (
            <div className="relative z-10 flex items-center gap-6 text-4xl animate-pulse">
              <span>☀️</span><span className="text-2xl">🌍</span><span className="text-xl">🌕</span><span className="text-3xl">🪐</span>
            </div>
          )}
        </div>

        {(arMode === 'furniture' || arMode === 'tryon') && (
          <div className="space-y-2 text-xs">
            <div className="flex flex-wrap gap-2">
              {(arMode === 'furniture' ? ['🛋️', '🪴', '🪑', '🛏️', '📺', '💡'] : ['🕶️', '👓', '👑', '🎩', '🎧', '🧢']).map((em) => (
                <button key={em} onClick={() => setPropPos({ ...propPos, item: em })} className="rounded-xl bg-slate-800 px-3 py-2 text-xl">{em}</button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <label>موقعیت X<input type="range" min={10} max={90} value={propPos.x} onChange={(e) => setPropPos({ ...propPos, x: Number(e.target.value) })} className="w-full" /></label>
              <label>موقعیت Y<input type="range" min={10} max={90} value={propPos.y} onChange={(e) => setPropPos({ ...propPos, y: Number(e.target.value) })} className="w-full" /></label>
              <label>مقیاس<input type="range" min={0.5} max={2.5} step={0.1} value={propPos.scale} onChange={(e) => setPropPos({ ...propPos, scale: Number(e.target.value) })} className="w-full" /></label>
            </div>
          </div>
        )}

        {arMode === 'filters' && (
          <div className="flex flex-wrap gap-2 text-xs">
            {[['none', 'اصلی'], ['hue-rotate(180deg) saturate(2)', 'نئون سایبری'], ['grayscale(1) contrast(1.5)', 'نوآر'], ['sepia(0.8)', 'قدیمی'], ['invert(1)', 'حرارتی X-Ray']].map(([f, lbl]) => (
              <button key={lbl} onClick={() => setArFilter(f)} className="omni-btn omni-btn-secondary text-xs">{lbl}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
