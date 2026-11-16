import React, { useEffect, useRef, useState } from 'react';
import { EngineProps } from '../types';
import { getBatteryDetails, getDeviceHardware, getWifiDetails, toggleTorch, vibrateDevice } from '../services/nativeBridge';
import { Cpu, Battery, Compass, Flashlight, Mic, MonitorCheck, Gauge, Navigation } from 'lucide-react';

type HwTab = 'specs' | 'battery' | 'sensors' | 'compass' | 'level' | 'sound' | 'torch' | 'gps' | 'tests' | 'benchmark' | 'connectivity';

export const HardwareEngine: React.FC<EngineProps> = ({ tool, onToast }) => {
  const [tab, setTab] = useState<HwTab>((tool.mode as HwTab) || 'specs');
  const [specs, setSpecs] = useState<Awaited<ReturnType<typeof getDeviceHardware>> | null>(null);
  const [battery, setBattery] = useState<Awaited<ReturnType<typeof getBatteryDetails>> | null>(null);
  const [wifi, setWifi] = useState<Awaited<ReturnType<typeof getWifiDetails>> | null>(null);
  const [gpuRenderer, setGpuRenderer] = useState('');

  // Sensors (Compass / Level / Accel)
  const [orientation, setOrientation] = useState({ alpha: 0, beta: 0, gamma: 0 });
  const [accel, setAccel] = useState({ x: 0, y: 0, z: 9.8 });

  // Live dB Sound Meter
  const [dbActive, setDbActive] = useState(false);
  const [dbValue, setDbValue] = useState(0);
  const [dbPeak, setDbPeak] = useState(0);

  // Flashlight & SOS
  const [torchOn, setTorchOn] = useState(false);
  const [screenFlash, setScreenFlash] = useState(false);

  // GPS
  const [gps, setGps] = useState<{ lat: number; lon: number; alt: number | null; speed: number | null; acc: number } | null>(null);

  // Screen & Touch & Speaker Tests
  const [deadPixelColor, setDeadPixelColor] = useState<string | null>(null);
  const touchCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [speakerFreq, setSpeakerFreq] = useState(440);

  // Benchmark
  const [benchScore, setBenchScore] = useState<{ cpuOps: number; ms: number; grade: string } | null>(null);

  useEffect(() => {
    const allowed: HwTab[] = ['specs', 'battery', 'sensors', 'compass', 'level', 'sound', 'torch', 'gps', 'tests', 'benchmark', 'connectivity'];
    if (allowed.includes(tool.mode as HwTab)) setTab(tool.mode as HwTab);
  }, [tool.id, tool.mode]);

  useEffect(() => {
    getDeviceHardware().then(setSpecs);
    getBatteryDetails().then(setBattery);
    getWifiDetails().then(setWifi);
    try {
      const c = document.createElement('canvas');
      const gl = c.getContext('webgl');
      const dbg = gl?.getExtension('WEBGL_debug_renderer_info');
      setGpuRenderer(dbg ? gl?.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl?.getParameter(gl.RENDERER) || 'WebGL GPU');
    } catch { setGpuRenderer('Standard GPU'); }
  }, []);

  // Live Orientation & Motion listeners
  useEffect(() => {
    const onOri = (e: DeviceOrientationEvent) => {
      setOrientation({ alpha: Math.round(e.alpha || 0), beta: Math.round(e.beta || 0), gamma: Math.round(e.gamma || 0) });
    };
    const onMot = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      if (a) setAccel({ x: +(a.x || 0).toFixed(2), y: +(a.y || 0).toFixed(2), z: +(a.z || 0).toFixed(2) });
    };
    window.addEventListener('deviceorientation', onOri);
    window.addEventListener('devicemotion', onMot);
    return () => {
      window.removeEventListener('deviceorientation', onOri);
      window.removeEventListener('devicemotion', onMot);
    };
  }, []);

  // Live Microphone dB Meter
  useEffect(() => {
    if (!dbActive) return;
    let stop = false;
    let stream: MediaStream | null = null;
    navigator.mediaDevices.getUserMedia({ audio: true }).then((s) => {
      stream = s;
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const src = ctx.createMediaStreamSource(s);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      src.connect(analyser);
      const buf = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        if (stop) return;
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / buf.length);
        const db = Math.max(20, Math.min(120, Math.round(20 * Math.log10(Math.max(rms, 0.0005)) + 92)));
        setDbValue(db);
        setDbPeak((p) => Math.max(p, db));
        requestAnimationFrame(tick);
      };
      tick();
    }).catch(() => {
      onToast('مجوز میکروفون برای دسی‌بل‌متر رد شد', 'error');
      setDbActive(false);
    });
    return () => { stop = true; stream?.getTracks().forEach((t) => t.stop()); };
  }, [dbActive]);

  const runBenchmark = () => {
    const t0 = performance.now();
    let acc = 0;
    for (let i = 1; i < 4000000; i++) acc += Math.sqrt(i) * Math.sin(i % 90);
    const ms = Math.max(1, Math.round(performance.now() - t0));
    const cpuOps = Math.round((4000000 / ms) * 10);
    const grade = ms < 140 ? 'پرچم‌دار (S+)' : ms < 320 ? 'عالی (A)' : 'استاندارد (B)';
    setBenchScore({ cpuOps: acc ? cpuOps : cpuOps, ms, grade });
    onToast(`بنچمارک کامل شد: امتیاز ${cpuOps.toLocaleString()}`, 'success');
  };

  const playSpeakerTone = () => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    osc.frequency.value = speakerFreq;
    osc.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.8);
  };

  return (
    <div className="space-y-4">
      {deadPixelColor && (
        <div
          onClick={() => setDeadPixelColor(null)}
          style={{ backgroundColor: deadPixelColor }}
          className="fixed inset-0 z-50 flex items-end justify-center pb-10 cursor-pointer"
        >
          <span className="rounded-full bg-black/70 px-4 py-2 text-xs text-white">برای خروج از تست پیکسل صفحه را لمس کنید</span>
        </div>
      )}
      {screenFlash && (
        <div onClick={() => setScreenFlash(false)} className="fixed inset-0 z-50 bg-white flex items-end justify-center pb-12 cursor-pointer">
          <span className="rounded-full bg-slate-900 px-4 py-2 text-xs text-white">خاموش کردن نور صفحه</span>
        </div>
      )}

      <div className="flex gap-1.5 overflow-x-auto pb-2">
        {[
          ['specs', 'CPU/GPU/RAM'],
          ['battery', 'باتری'],
          ['compass', 'قطب‌نما'],
          ['level', 'تراز دیجیتال'],
          ['sound', 'متر صوتی dB'],
          ['torch', 'چراغ‌قوه/SOS'],
          ['gps', 'GPS و سرعت'],
          ['tests', 'تست صفحه/تاچ/صدا'],
          ['benchmark', 'بنچمارک'],
          ['connectivity', 'Wi-Fi / شبکه'],
        ].map(([id, lbl]) => (
          <button key={id} onClick={() => setTab(id as HwTab)} className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold ${tab === id ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white' : 'bg-slate-800/70 text-slate-300'}`}>
            {lbl}
          </button>
        ))}
      </div>

      {tab === 'specs' && specs && (
        <div className="glass-card rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
          {[
            ['سازنده / مدل', `${specs.manufacturer} ${specs.model}`],
            ['سیستم‌عامل', `${specs.androidVersion} (API ${specs.sdkInt})`],
            ['معماری CPU', specs.cpuAbi],
            ['تعداد هسته CPU', `${specs.cpuCores} Core`],
            ['دمای CPU', `${specs.cpuTempC} °C`],
            ['حافظه RAM', `${specs.availRamMb} / ${specs.totalRamMb} MB`],
            ['حافظه داخلی', `${specs.freeStorageGb} / ${specs.totalStorageGb} GB`],
            ['تراکم نمایشگر', `${specs.screenDensityDpi} DPI (${window.screen.width}×${window.screen.height})`],
            ['پردازنده گرافیکی', gpuRenderer],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-slate-900/70 p-3">
              <div className="text-slate-400">{k}</div>
              <div className="font-bold text-slate-100 mt-1 break-all">{v}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'battery' && battery && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm flex items-center gap-2"><Battery className="w-4 h-4 text-emerald-400" /> وضعیت کامل باتری</h3>
            <span className="text-2xl font-black text-emerald-400">{battery.level}%</span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400" style={{ width: `${battery.level}%` }} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <div className="bg-slate-900/70 p-3 rounded-xl">وضعیت: <strong>{battery.isCharging ? '⚡ در حال شارژ' : '🔋 تخلیه'}</strong></div>
            <div className="bg-slate-900/70 p-3 rounded-xl">دما: <strong>{battery.temperatureC} °C</strong></div>
            <div className="bg-slate-900/70 p-3 rounded-xl">ولتاژ: <strong>{battery.voltageMv} mV</strong></div>
            <div className="bg-slate-900/70 p-3 rounded-xl">سلامت: <strong>{battery.health}</strong></div>
            <div className="bg-slate-900/70 p-3 rounded-xl">تکنولوژی: <strong>{battery.technology}</strong></div>
            <div className="bg-slate-900/70 p-3 rounded-xl">جریان: <strong>{Math.round(battery.currentMicroAmps / 1000)} mA</strong></div>
          </div>
        </div>
      )}

      {(tab === 'compass' || tab === 'sensors') && (
        <div className="glass-card rounded-2xl p-4 text-center space-y-4">
          <h3 className="font-bold text-sm flex items-center justify-center gap-2"><Compass className="w-4 h-4 text-cyan-400" /> قطب‌نمای مغناطیسی و سنسورهای ۳ محوره</h3>
          <div className="relative w-48 h-48 mx-auto rounded-full border-4 border-cyan-500/40 bg-slate-950 flex items-center justify-center">
            <div style={{ transform: `rotate(${-orientation.alpha}deg)` }} className="w-full h-full flex flex-col items-center justify-between py-2 transition-transform">
              <span className="text-rose-400 font-black text-sm">N</span>
              <div className="w-1.5 h-20 bg-gradient-to-b from-rose-500 to-slate-400 rounded-full" />
              <span className="text-slate-400 font-bold text-xs">S</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs font-mono" dir="ltr">
            <div className="bg-slate-900 p-2.5 rounded-xl">Azimuth: {orientation.alpha}°</div>
            <div className="bg-slate-900 p-2.5 rounded-xl">Pitch: {orientation.beta}°</div>
            <div className="bg-slate-900 p-2.5 rounded-xl">Roll: {orientation.gamma}°</div>
            <div className="bg-slate-900 p-2.5 rounded-xl">Acc X: {accel.x}</div>
            <div className="bg-slate-900 p-2.5 rounded-xl">Acc Y: {accel.y}</div>
            <div className="bg-slate-900 p-2.5 rounded-xl">Acc Z: {accel.z}</div>
          </div>
        </div>
      )}

      {tab === 'level' && (
        <div className="glass-card rounded-2xl p-4 text-center space-y-3">
          <h3 className="font-bold text-sm">تراز دیجیتال دو محوره (Bubble Level)</h3>
          <div className="relative w-52 h-52 mx-auto rounded-full bg-emerald-950/60 border-4 border-emerald-500/40 flex items-center justify-center overflow-hidden">
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-emerald-400/50" />
            <div
              style={{ transform: `translate(${Math.max(-70, Math.min(70, orientation.gamma * 2))}px, ${Math.max(-70, Math.min(70, orientation.beta * 2))}px)` }}
              className="absolute w-10 h-10 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50 transition-transform"
            />
          </div>
          <div className="text-xs font-mono" dir="ltr">X: {orientation.gamma}° | Y: {orientation.beta}°</div>
        </div>
      )}

      {tab === 'sound' && (
        <div className="glass-card rounded-2xl p-4 text-center space-y-3">
          <h3 className="font-bold text-sm flex items-center justify-center gap-2"><Mic className="w-4 h-4 text-rose-400" /> متر صوتی زنده (دسی‌بل‌متر dB)</h3>
          <div className="text-5xl font-black font-mono text-cyan-400">{dbValue} <span className="text-base">dB</span></div>
          <div className="text-xs text-slate-400">اوج صدا (Peak): {dbPeak} dB</div>
          <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 transition-all" style={{ width: `${Math.min(100, dbValue)}%` }} />
          </div>
          <button onClick={() => setDbActive(!dbActive)} className="omni-btn omni-btn-primary">
            {dbActive ? 'توقف اندازه‌گیری' : 'شروع اندازه‌گیری زنده صدا'}
          </button>
        </div>
      )}

      {tab === 'torch' && (
        <div className="glass-card rounded-2xl p-4 text-center space-y-3">
          <h3 className="font-bold text-sm flex items-center justify-center gap-2"><Flashlight className="w-4 h-4 text-amber-400" /> چراغ‌قوه سخت‌افزاری، SOS و نور صفحه</h3>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={async () => {
                const next = !torchOn;
                const res = await toggleTorch(next);
                setTorchOn(next);
                if (!res.supported && next) setScreenFlash(true);
                onToast(res.note || (next ? 'چراغ‌قوه روشن شد' : 'چراغ‌قوه خاموش شد'), 'info');
              }}
              className="omni-btn omni-btn-primary"
            >
              🔦 {torchOn ? 'خاموش کردن چراغ‌قوه' : 'روشن کردن چراغ‌قوه'}
            </button>
            <button onClick={() => setScreenFlash(true)} className="omni-btn omni-btn-secondary">💡 نور حداکثری صفحه</button>
            <button onClick={() => vibrateDevice([150, 100, 150, 100, 150, 300, 400, 100, 400, 100, 400])} className="omni-btn omni-btn-secondary">🆘 لرزش SOS</button>
          </div>
        </div>
      )}

      {tab === 'gps' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm flex items-center gap-2"><Navigation className="w-4 h-4 text-cyan-400" /> مختصات GPS، ارتفاع و سرعت حرکت</h3>
            <button
              onClick={() => {
                navigator.geolocation?.getCurrentPosition(
                  (p) => {
                    setGps({ lat: p.coords.latitude, lon: p.coords.longitude, alt: p.coords.altitude, speed: p.coords.speed, acc: Math.round(p.coords.accuracy) });
                    onToast('موقعیت GPS دریافت شد', 'success');
                  },
                  (e) => onToast(`خطای GPS: ${e.message}`, 'error'),
                  { enableHighAccuracy: true }
                );
              }}
              className="omni-btn omni-btn-primary text-xs"
            >
              دریافت موقعیت زنده
            </button>
          </div>
          {gps && (
            <div className="grid grid-cols-2 gap-2 text-xs font-mono" dir="ltr">
              <div className="bg-slate-900 p-3 rounded-xl">Lat: {gps.lat.toFixed(6)}</div>
              <div className="bg-slate-900 p-3 rounded-xl">Lon: {gps.lon.toFixed(6)}</div>
              <div className="bg-slate-900 p-3 rounded-xl">Alt: {gps.alt ? `${Math.round(gps.alt)} m` : 'N/A'}</div>
              <div className="bg-slate-900 p-3 rounded-xl">Speed: {gps.speed ? `${(gps.speed * 3.6).toFixed(1)} km/h` : '0 km/h'} (±{gps.acc}m)</div>
            </div>
          )}
        </div>
      )}

      {tab === 'tests' && (
        <div className="glass-card rounded-2xl p-4 space-y-4">
          <h3 className="font-bold text-sm flex items-center gap-2"><MonitorCheck className="w-4 h-4 text-emerald-400" /> تست پیکسل صفحه، لمس، اسپیکر و ویبره</h3>
          <div className="flex flex-wrap gap-2">
            {[['#ef4444', 'قرمز'], ['#22c55e', 'سبز'], ['#3b82f6', 'آبی'], ['#ffffff', 'سفید'], ['#000000', 'مشکی']].map(([hex, lbl]) => (
              <button key={hex} onClick={() => setDeadPixelColor(hex)} className="omni-btn omni-btn-secondary text-xs">تست صفحه {lbl}</button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span>تست فرکانس اسپیکر ({speakerFreq} Hz):</span>
            <input type="range" min={100} max={8000} value={speakerFreq} onChange={(e) => setSpeakerFreq(Number(e.target.value))} className="flex-1" />
            <button onClick={playSpeakerTone} className="omni-btn omni-btn-primary text-xs">🔊 پخش</button>
            <button onClick={() => vibrateDevice([100, 80, 200, 80, 350])} className="omni-btn omni-btn-secondary text-xs">📳 تست ویبره</button>
          </div>
          <canvas
            ref={touchCanvasRef}
            width={500}
            height={160}
            onPointerMove={(e) => {
              if (e.buttons === 0 && e.pointerType === 'mouse') return;
              const rect = e.currentTarget.getBoundingClientRect();
              const ctx = e.currentTarget.getContext('2d')!;
              ctx.fillStyle = '#22d3ee';
              ctx.beginPath();
              ctx.arc(((e.clientX - rect.left) / rect.width) * 500, ((e.clientY - rect.top) / rect.height) * 160, 8, 0, Math.PI * 2);
              ctx.fill();
            }}
            className="w-full h-40 rounded-xl bg-slate-950 border border-cyan-500/30 touch-none"
          />
        </div>
      )}

      {tab === 'benchmark' && (
        <div className="glass-card rounded-2xl p-4 text-center space-y-3">
          <h3 className="font-bold text-sm flex items-center justify-center gap-2"><Gauge className="w-4 h-4 text-amber-400" /> بنچمارک و تست فشار پردازنده (CPU Stress)</h3>
          <button onClick={runBenchmark} className="omni-btn omni-btn-primary">اجرای بنچمارک واقعی ۴ میلیون عملیات</button>
          {benchScore && (
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-slate-900 p-3 rounded-xl"><div className="text-slate-400">امتیاز</div><div className="text-xl font-black text-cyan-400">{benchScore.cpuOps.toLocaleString()}</div></div>
              <div className="bg-slate-900 p-3 rounded-xl"><div className="text-slate-400">زمان</div><div className="text-xl font-black text-emerald-400">{benchScore.ms} ms</div></div>
              <div className="bg-slate-900 p-3 rounded-xl"><div className="text-slate-400">رده</div><div className="text-lg font-bold text-amber-400">{benchScore.grade}</div></div>
            </div>
          )}
        </div>
      )}

      {tab === 'connectivity' && wifi && (
        <div className="glass-card rounded-2xl p-4 grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-900/70 p-3 rounded-xl">وضعیت Wi-Fi: <strong>{wifi.ssid}</strong></div>
          <div className="bg-slate-900/70 p-3 rounded-xl">قدرت سیگنال: <strong>{wifi.rssi} dBm</strong></div>
          <div className="bg-slate-900/70 p-3 rounded-xl">سرعت لینک: <strong>{wifi.linkSpeedMbps} Mbps</strong></div>
          <div className="bg-slate-900/70 p-3 rounded-xl">فرکانس: <strong>{wifi.frequencyMhz} MHz</strong></div>
          <div className="bg-slate-900/70 p-3 rounded-xl col-span-2">IP محلی: <strong dir="ltr" className="font-mono">{wifi.localIp}</strong></div>
        </div>
      )}
    </div>
  );
};
