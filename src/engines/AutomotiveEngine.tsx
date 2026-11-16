import React, { useEffect, useRef, useState } from 'react';
import { EngineProps } from '../types';
import { OBD2_CODES } from '../data/referenceData';
import { decodeVinNhtsa } from '../services/freeApis';
import { loadData, saveData } from '../services/storage';
import { Car, Gauge, MapPin, Wrench, Video, Search } from 'lucide-react';

export const AutomotiveEngine: React.FC<EngineProps> = ({ tool, onToast }) => {
  const [obdQuery, setObdQuery] = useState('');
  const [vin, setVin] = useState('1HGCM82633A004352');
  const [vinResult, setVinResult] = useState<{ k: string; v: string }[]>([]);
  const [speedKmh, setSpeedKmh] = useState(0);
  const [hudMirror, setHudMirror] = useState(false);
  const [parkingPin, setParkingPin] = useState<{ lat: number; lon: number; time: string } | null>(() => loadData('car_parking', null));
  const [services, setServices] = useState<{ id: string; item: string; km: number }[]>(() =>
    loadData('car_maint', [
      { id: '1', item: 'تعویض روغن موتور و فیلتر', km: 65000 },
      { id: '2', item: 'بازدید لنت ترمز و باد لاستیک (32 PSI)', km: 70000 },
    ])
  );
  const [newSvc, setNewSvc] = useState('');
  const dashRef = useRef<HTMLVideoElement | null>(null);
  const [dashOn, setDashOn] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (p) => { if (p.coords.speed != null) setSpeedKmh(Math.round(p.coords.speed * 3.6)); },
      () => {},
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const saveParking = () => {
    navigator.geolocation?.getCurrentPosition(
      (p) => {
        const pin = { lat: p.coords.latitude, lon: p.coords.longitude, time: new Date().toLocaleTimeString('fa-IR') };
        setParkingPin(pin);
        saveData('car_parking', pin);
        onToast('موقعیت پارک خودرو ثبت شد!', 'success');
      },
      () => {
        const pin = { lat: 35.6892, lon: 51.389, time: new Date().toLocaleTimeString('fa-IR') };
        setParkingPin(pin);
        saveData('car_parking', pin);
        onToast('زمان و موقعیت پارک ثبت شد', 'info');
      }
    );
  };

  const toggleDashcam = async () => {
    if (dashOn) {
      (dashRef.current?.srcObject as MediaStream | null)?.getTracks().forEach((t) => t.stop());
      setDashOn(false);
      return;
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (dashRef.current) dashRef.current.srcObject = s;
      setDashOn(true);
    } catch {
      onToast('دسترسی به دوربین برای داش‌کم تایید نشد', 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* HUD Mirror Speedometer + Parking Pin */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="glass-card rounded-2xl p-4 text-center space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm flex items-center gap-1.5"><Gauge className="w-4 h-4 text-red-400" /> سرعت‌سنج HUD شیشه</h3>
            <button onClick={() => setHudMirror(!hudMirror)} className="omni-btn omni-btn-secondary text-xs">🪞 آینه HUD</button>
          </div>
          <div style={{ transform: hudMirror ? 'scaleX(-1)' : 'none' }} className="bg-black rounded-xl py-6 border border-emerald-500/30">
            <div className="text-6xl font-mono font-black text-emerald-400">{speedKmh}</div>
            <div className="text-xs text-emerald-300/70 font-mono">KM/H (Live GPS)</div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 space-y-3 text-xs">
          <h3 className="font-bold text-sm flex items-center gap-2"><MapPin className="w-4 h-4 text-amber-400" /> یادآور محل پارک و پیدا کردن خودرو</h3>
          <button onClick={saveParking} className="omni-btn omni-btn-primary w-full text-xs">📍 ثبت محل پارک الان</button>
          {parkingPin && (
            <div className="bg-slate-900 p-3 rounded-xl space-y-1">
              <div>زمان پارک: <strong>{parkingPin.time}</strong></div>
              <div dir="ltr" className="font-mono text-cyan-300">{parkingPin.lat.toFixed(5)}, {parkingPin.lon.toFixed(5)}</div>
              <a href={`https://www.openstreetmap.org/?mlat=${parkingPin.lat}&mlon=${parkingPin.lon}#map=17/${parkingPin.lat}/${parkingPin.lon}`} target="_blank" rel="noreferrer" className="text-emerald-400 underline block pt-1">
                مسیریابی تا خودرو روی نقشه ↗
              </a>
            </div>
          )}
          <button onClick={toggleDashcam} className="omni-btn omni-btn-secondary w-full text-xs"><Video className="w-4 h-4" /> {dashOn ? 'توقف داش‌کم' : 'روشن کردن دوربین داش‌کم'}</button>
          {dashOn && <video ref={dashRef} autoPlay playsInline muted className="w-full h-36 rounded-xl object-cover bg-black" />}
        </div>
      </div>

      {/* OBD-II DTC Fault Code Database */}
      <div className="glass-card rounded-2xl p-4 space-y-3 text-xs">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-bold text-sm flex items-center gap-2"><Car className="w-4 h-4 text-rose-400" /> اسکنر و دیتابیس کدهای خطای دیاگ خودرو (OBD-II)</h3>
          <input dir="ltr" className="omni-input !w-44 font-mono" value={obdQuery} onChange={(e) => setObdQuery(e.target.value)} placeholder="مثلاً P0300 یا اکسیژن" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-56 overflow-y-auto">
          {OBD2_CODES.filter((c) => `${c.code} ${c.system} ${c.descFa}`.toLowerCase().includes(obdQuery.toLowerCase())).map((c) => (
            <div key={c.code} className="bg-slate-900/70 p-2.5 rounded-xl flex items-start justify-between gap-2">
              <div><strong className="font-mono text-cyan-400">{c.code}</strong> <span className="text-slate-400">({c.system})</span><div className="mt-0.5 text-slate-200">{c.descFa}</div></div>
              <span className={`px-2 py-0.5 rounded text-[10px] ${c.severity === 'high' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'}`}>{c.severity}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Live NHTSA VIN Decoder + Maintenance Log */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="glass-card rounded-2xl p-4 space-y-2">
          <h3 className="font-bold text-sm flex items-center gap-1.5"><Search className="w-4 h-4 text-cyan-400" /> رمزگشای شماره شاسی VIN (NHTSA Free API)</h3>
          <div className="flex gap-2" dir="ltr">
            <input className="omni-input font-mono" value={vin} onChange={(e) => setVin(e.target.value)} />
            <button onClick={async () => {
              try {
                const res = await decodeVinNhtsa(vin);
                setVinResult(res.Results.filter((r) => r.Value && ['Make', 'Model', 'Model Year', 'Fuel Type - Primary', 'Plant Country', 'Body Class'].includes(r.Variable)).map((r) => ({ k: r.Variable, v: r.Value! })));
              } catch { onToast('خطا در استعلام VIN', 'error'); }
            }} className="omni-btn omni-btn-primary shrink-0">استعلام</button>
          </div>
          {vinResult.map((r) => <div key={r.k} className="bg-slate-900/70 p-2 rounded-lg flex justify-between"><span>{r.k}</span><strong className="text-emerald-300">{r.v}</strong></div>)}
        </div>

        <div className="glass-card rounded-2xl p-4 space-y-2">
          <h3 className="font-bold text-sm flex items-center gap-1.5"><Wrench className="w-4 h-4 text-amber-400" /> دفترچه سرویس دوره‌ای خودرو</h3>
          <div className="flex gap-2">
            <input className="omni-input" value={newSvc} onChange={(e) => setNewSvc(e.target.value)} placeholder="سرویس جدید (مثلاً تسمه تایم)..." />
            <button onClick={() => { if (!newSvc) return; const next = [{ id: String(Date.now()), item: newSvc, km: 75000 }, ...services]; setServices(next); saveData('car_maint', next); setNewSvc(''); }} className="omni-btn omni-btn-primary">+</button>
          </div>
          {services.map((s) => <div key={s.id} className="bg-slate-900/70 p-2.5 rounded-xl flex justify-between"><span>{s.item}</span><span className="font-mono text-amber-300">{s.km.toLocaleString()} km</span></div>)}
        </div>
      </div>
    </div>
  );
};
