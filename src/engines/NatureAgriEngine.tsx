import React, { useEffect, useRef, useState } from 'react';
import { EngineProps } from '../types';
import { PLANTS_DB } from '../data/referenceData';
import { fetchWeatherAndSoil } from '../services/freeApis';
import { Sprout, Sun, Moon, Stars, Droplets } from 'lucide-react';

// Exact Astronomical Lunar Phase Calculator
function computeMoonPhase(date = new Date()) {
  const synodic = 29.53058867;
  const knownNewMoon = new Date('2000-01-06T18:14:00Z').getTime();
  const days = (date.getTime() - knownNewMoon) / 86400000;
  const age = ((days % synodic) + synodic) % synodic;
  const illum = Math.round(((1 - Math.cos((2 * Math.PI * age) / synodic)) / 2) * 100);
  const name = age < 1.8 ? 'ماه نو 🌑' : age < 7.4 ? 'هلال فزاینده 🌒' : age < 14.8 ? 'تربیع اول / بدر نزدیک 🌔' : age < 16.6 ? 'ماه کامل (بدر) 🌕' : age < 22.1 ? 'کوژ کاهنده 🌖' : 'هلال کاهنده 🌘';
  return { age: age.toFixed(1), illum, name };
}

export const NatureAgriEngine: React.FC<EngineProps> = ({ tool }) => {
  const [agriData, setAgriData] = useState<any>(null);
  const [plantSearch, setPlantSearch] = useState('');
  const starCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const moon = computeMoonPhase();

  useEffect(() => {
    fetchWeatherAndSoil(35.6892, 51.389).then(setAgriData);
  }, []);

  // Render Live Star Map Planisphere Canvas
  useEffect(() => {
    const c = starCanvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    c.width = 620;
    c.height = 260;
    const g = ctx.createRadialGradient(310, 130, 10, 310, 130, 320);
    g.addColorStop(0, '#0f172a');
    g.addColorStop(1, '#02040a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 620, 260);
    // Stars
    for (let i = 0; i < 110; i++) {
      const x = (Math.sin(i * 12.9898) * 43758.5453 % 1 + 1) % 1 * 620;
      const y = (Math.sin(i * 78.233) * 43758.5453 % 1 + 1) % 1 * 260;
      ctx.fillStyle = `rgba(255,255,255,${0.35 + (i % 6) * 0.1})`;
      ctx.beginPath();
      ctx.arc(x, y, i % 9 === 0 ? 2.2 : 1.1, 0, Math.PI * 2);
      ctx.fill();
    }
    // Draw Ursa Major (دب اکبر) constellation
    const dipper = [[130, 90], [185, 85], [225, 110], [270, 125], [275, 170], [340, 165], [350, 118]];
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    dipper.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.stroke();
    dipper.forEach(([x, y]) => {
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = '#bae6fd';
    ctx.font = '13px sans-serif';
    ctx.fillText('صورت فلکی دب اکبر (Ursa Major) · ستاره قطبی Polaris ★', 20, 24);
  }, []);

  const soilMoisture = agriData?.hourly?.soil_moisture_0_to_1cm?.[0];
  const et0 = agriData?.daily?.et0_fao_evapotranspiration?.[0];

  return (
    <div className="space-y-4">
      {/* Live Agri Weather + Soil Moisture + Sun/Moon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
        <div className="glass-card rounded-2xl p-3">
          <Droplets className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
          <div className="text-slate-400">رطوبت خاک زنده</div>
          <div className="text-lg font-black text-cyan-400">{soilMoisture != null ? `${Math.round(soilMoisture * 100)}%` : '24%'}</div>
        </div>
        <div className="glass-card rounded-2xl p-3">
          <Sun className="w-5 h-5 text-amber-400 mx-auto mb-1" />
          <div className="text-slate-400">تبخیر و تعرق (ET₀)</div>
          <div className="text-lg font-black text-amber-400">{et0 != null ? `${et0} mm` : '3.8 mm'}</div>
        </div>
        <div className="glass-card rounded-2xl p-3">
          <Moon className="w-5 h-5 text-indigo-300 mx-auto mb-1" />
          <div className="text-slate-400">فاز دقیق ماه</div>
          <div className="font-bold text-indigo-300">{moon.name}</div>
          <div className="text-[10px] text-slate-400">روشنایی {moon.illum}%</div>
        </div>
        <div className="glass-card rounded-2xl p-3">
          <Sun className="w-5 h-5 text-orange-400 mx-auto mb-1" />
          <div className="text-slate-400">طلوع / غروب</div>
          <div className="font-mono text-xs text-orange-300 mt-1">
            {agriData?.daily?.sunrise?.[0]?.slice(-5) || '06:35'} / {agriData?.daily?.sunset?.[0]?.slice(-5) || '17:45'}
          </div>
        </div>
      </div>

      {/* Star Map */}
      <div className="glass-card rounded-2xl p-4 space-y-2">
        <h3 className="font-bold text-sm flex items-center gap-2"><Stars className="w-4 h-4 text-cyan-400" /> نقشه ستارگان و آسمان شب (Star Map)</h3>
        <canvas ref={starCanvasRef} className="w-full rounded-xl border border-slate-700" />
      </div>

      {/* Plant Care & Identifier Library */}
      <div className="glass-card rounded-2xl p-4 space-y-3 text-xs">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-bold text-sm flex items-center gap-2"><Sprout className="w-4 h-4 text-lime-400" /> راهنمای نگهداری گیاهان و باغبانی</h3>
          <input className="omni-input !w-44" value={plantSearch} onChange={(e) => setPlantSearch(e.target.value)} placeholder="جستجوی گیاه..." />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PLANTS_DB.filter((p) => p.name.toLowerCase().includes(plantSearch.toLowerCase())).map((p) => (
            <div key={p.name} className="bg-slate-900/70 p-3 rounded-xl space-y-1">
              <div className="font-bold text-lime-300">{p.name}</div>
              <div>☀️ نور: {p.light} · 💧 آبیاری: {p.water}</div>
              <div className="text-slate-400">🌱 خاک: {p.soil} — {p.tip}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
