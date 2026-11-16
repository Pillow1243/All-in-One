import React, { useEffect, useState } from 'react';
import { EngineProps } from '../types';
import { FOOD_CALORIES_DB } from '../data/referenceData';
import { lookupFoodBarcode } from '../services/freeApis';
import { loadData, saveData } from '../services/storage';
import { speakText } from '../services/nativeBridge';
import { HeartPulse, Droplets, Timer, Wind, Eye, Utensils } from 'lucide-react';

type HealthTab = 'body' | 'trackers' | 'vitals' | 'nutrition' | 'workout' | 'mind' | 'women' | 'tests' | 'sensory';

export const HealthEngine: React.FC<EngineProps> = ({ tool, onToast }) => {
  const [tab, setTab] = useState<HealthTab>((tool.mode as HealthTab) || 'body');

  // Body metrics
  const [weight, setWeight] = useState(74);
  const [height, setHeight] = useState(176);
  const [age, setAge] = useState(28);
  const [gender, setGender] = useState<'m' | 'f'>('m');
  const [waist, setWaist] = useState(84);
  const [neck, setNeck] = useState(38);

  // Trackers
  const [waterCups, setWaterCups] = useState<number>(() => loadData('health_water', 4));
  const [steps, setSteps] = useState<number>(() => loadData('health_steps', 3200));
  const [meds, setMeds] = useState<{ id: string; name: string; time: string; done: boolean }[]>(() =>
    loadData('health_meds', [{ id: '1', name: 'ویتامین D3', time: '09:00', done: false }])
  );
  const [newMed, setNewMed] = useState('');

  // Heart rate tap BPM & Sleep
  const [hrTaps, setHrTaps] = useState<number[]>([]);
  const [bpm, setBpm] = useState(72);
  const [wakeTime, setWakeTime] = useState('07:00');

  // Women cycle
  const [lastPeriod, setLastPeriod] = useState(new Date().toISOString().slice(0, 10));
  const [cycleLen, setCycleLen] = useState(28);

  // Nutrition & OpenFoodFacts Barcode
  const [barcode, setBarcode] = useState('3017620422003');
  const [barcodeFood, setBarcodeFood] = useState<any>(null);

  // HIIT Timer
  const [hiitActive, setHiitActive] = useState(false);
  const [hiitPhase, setHiitPhase] = useState<'work' | 'rest'>('work');
  const [hiitSec, setHiitSec] = useState(30);
  const [reps, setReps] = useState(0);

  // Breathing 4-7-8 / Box
  const [breathOn, setBreathOn] = useState(false);
  const [breathStage, setBreathStage] = useState<'دم (۴ ثانیه)' | 'نگه‌داشتن (۴ ثانیه)' | 'بازدم (۴ ثانیه)'>('دم (۴ ثانیه)');

  // Sensory Tests (Hearing Hz + Memory)
  const [hearHz, setHearHz] = useState(1000);
  const [memSeq, setMemSeq] = useState('48291');
  const [memShow, setMemShow] = useState(true);
  const [memGuess, setMemGuess] = useState('');

  useEffect(() => {
    const allowed: HealthTab[] = ['body', 'trackers', 'vitals', 'nutrition', 'workout', 'mind', 'women', 'tests', 'sensory'];
    if (allowed.includes(tool.mode as HealthTab)) setTab(tool.mode as HealthTab);
  }, [tool.id, tool.mode]);

  useEffect(() => {
    if (!hiitActive) return;
    const id = setInterval(() => {
      setHiitSec((s) => {
        if (s <= 1) {
          const next = hiitPhase === 'work' ? 'rest' : 'work';
          setHiitPhase(next);
          speakText(next === 'work' ? 'شروع تمرین' : 'استراحت', 'fa-IR');
          return next === 'work' ? 30 : 15;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [hiitActive, hiitPhase]);

  useEffect(() => {
    if (!breathOn) return;
    const stages: (typeof breathStage)[] = ['دم (۴ ثانیه)', 'نگه‌داشتن (۴ ثانیه)', 'بازدم (۴ ثانیه)'];
    let i = 0;
    const id = setInterval(() => { i = (i + 1) % 3; setBreathStage(stages[i]); }, 4000);
    return () => clearInterval(id);
  }, [breathOn]);

  const bmi = weight / ((height / 100) ** 2);
  const bmr = Math.round(10 * weight + 6.25 * height - 5 * age + (gender === 'm' ? 5 : -161));
  const idealWeight = Math.round((gender === 'm' ? 50 : 45.5) + 0.91 * (height - 152.4));
  const bodyFat = Math.max(5, Math.min(50, +(495 / (1.0324 - 0.19077 * Math.log10(Math.max(10, waist - neck)) + 0.15456 * Math.log10(height)) - 450).toFixed(1)));

  const nextPeriod = new Date(new Date(lastPeriod).getTime() + cycleLen * 86400000).toLocaleDateString('fa-IR');
  const ovulationDate = new Date(new Date(lastPeriod).getTime() + (cycleLen - 14) * 86400000).toLocaleDateString('fa-IR');
  const dueDate = new Date(new Date(lastPeriod).getTime() + 280 * 86400000).toLocaleDateString('fa-IR');

  const playHearTone = () => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    osc.frequency.value = hearHz;
    osc.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.9);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 overflow-x-auto pb-2">
        {[
          ['body', 'BMI / BMR / چربی'],
          ['trackers', 'آب، قدم و دارو'],
          ['vitals', 'ضربان قلب و خواب'],
          ['nutrition', 'کالری و بارکد غذا'],
          ['workout', 'تایمر HIIT و تکرار'],
          ['mind', 'تنفس و مدیتیشن'],
          ['women', 'چرخه و بارداری'],
          ['sensory', 'تست بینایی/شنوایی/حافظه'],
        ].map(([id, lbl]) => (
          <button key={id} onClick={() => setTab(id as HealthTab)} className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold ${tab === id ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white' : 'bg-slate-800/70 text-slate-300'}`}>
            {lbl}
          </button>
        ))}
      </div>

      {tab === 'body' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2"><HeartPulse className="w-4 h-4 text-pink-400" /> تحلیلگر جامع بدنی (BMI, BMR, کالری, وزن ایده‌آل, درصد چربی)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <label>وزن (kg)<input type="number" className="omni-input mt-1" value={weight} onChange={(e) => setWeight(Number(e.target.value))} /></label>
            <label>قد (cm)<input type="number" className="omni-input mt-1" value={height} onChange={(e) => setHeight(Number(e.target.value))} /></label>
            <label>سن<input type="number" className="omni-input mt-1" value={age} onChange={(e) => setAge(Number(e.target.value))} /></label>
            <label>دور کمر (cm)<input type="number" className="omni-input mt-1" value={waist} onChange={(e) => setWaist(Number(e.target.value))} /></label>
            <label>دور گردن (cm)<input type="number" className="omni-input mt-1" value={neck} onChange={(e) => setNeck(Number(e.target.value))} /></label>
            <label>جنسیت<select className="omni-input mt-1" value={gender} onChange={(e) => setGender(e.target.value as any)}><option value="m">مرد</option><option value="f">زن</option></select></label>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div className="bg-slate-900 p-3 rounded-xl"><div className="text-slate-400">BMI</div><div className="text-xl font-black text-cyan-400">{bmi.toFixed(1)}</div><div>{bmi < 18.5 ? 'کم‌وزن' : bmi < 25 ? 'نرمال' : bmi < 30 ? 'اضافه‌وزن' : 'چاقی'}</div></div>
            <div className="bg-slate-900 p-3 rounded-xl"><div className="text-slate-400">متابولیسم BMR</div><div className="text-xl font-black text-emerald-400">{bmr}</div><div>کالری/روز</div></div>
            <div className="bg-slate-900 p-3 rounded-xl"><div className="text-slate-400">وزن ایده‌آل</div><div className="text-xl font-black text-amber-400">{idealWeight} kg</div><div>تخمینی</div></div>
            <div className="bg-slate-900 p-3 rounded-xl"><div className="text-slate-400">درصد چربی</div><div className="text-xl font-black text-pink-400">{bodyFat}%</div><div>توده عضلانی: {Math.round(weight * (1 - bodyFat / 100))}kg</div></div>
          </div>
        </div>
      )}

      {tab === 'trackers' && (
        <div className="glass-card rounded-2xl p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-900/70 p-4 rounded-xl text-center space-y-2">
              <div className="font-bold text-sm flex items-center justify-center gap-1.5"><Droplets className="w-4 h-4 text-cyan-400" /> آب روزانه ({waterCups} / ۸ لیوان)</div>
              <div className="flex justify-center gap-2">
                <button onClick={() => { const n = waterCups + 1; setWaterCups(n); saveData('health_water', n); }} className="omni-btn omni-btn-primary text-xs">+ ۱ لیوان</button>
                <button onClick={() => { setWaterCups(0); saveData('health_water', 0); }} className="omni-btn omni-btn-secondary text-xs">ریست</button>
              </div>
            </div>
            <div className="bg-slate-900/70 p-4 rounded-xl text-center space-y-2">
              <div className="font-bold text-sm">👟 قدم‌شمار: {steps.toLocaleString()} قدم (~{Math.round(steps * 0.04)} کالری)</div>
              <button onClick={() => { const n = steps + 500; setSteps(n); saveData('health_steps', n); }} className="omni-btn omni-btn-primary text-xs">+ ۵۰۰ قدم</button>
            </div>
          </div>
          <div className="space-y-2">
            <div className="font-bold text-xs">💊 یادآور دارو و مکمل</div>
            <div className="flex gap-2">
              <input className="omni-input text-xs" value={newMed} onChange={(e) => setNewMed(e.target.value)} placeholder="نام دارو..." />
              <button onClick={() => { if (!newMed) return; const next = [...meds, { id: String(Date.now()), name: newMed, time: '12:00', done: false }]; setMeds(next); saveData('health_meds', next); setNewMed(''); }} className="omni-btn omni-btn-primary text-xs">افزودن</button>
            </div>
            {meds.map((m) => (
              <label key={m.id} className="flex items-center justify-between bg-slate-900/70 p-2.5 rounded-xl text-xs">
                <span className={m.done ? 'line-through text-slate-500' : ''}>{m.name} ({m.time})</span>
                <input type="checkbox" checked={m.done} onChange={() => { const next = meds.map((x) => (x.id === m.id ? { ...x, done: !x.done } : x)); setMeds(next); saveData('health_meds', next); }} />
              </label>
            ))}
          </div>
        </div>
      )}

      {tab === 'vitals' && (
        <div className="glass-card rounded-2xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900/70 p-4 rounded-xl text-center space-y-3">
            <div className="font-bold text-sm">❤️ ضربان قلب (با هر تپش نبض ضربه بزنید)</div>
            <div className="text-5xl font-black text-rose-400 font-mono">{bpm} BPM</div>
            <button
              onClick={() => {
                const now = Date.now();
                const next = [...hrTaps.slice(-5), now];
                setHrTaps(next);
                if (next.length >= 2) {
                  const avg = (next[next.length - 1] - next[0]) / (next.length - 1);
                  setBpm(Math.round(60000 / avg));
                }
              }}
              className="omni-btn omni-btn-primary w-full"
            >
              ضربه روی نبض (Tap)
            </button>
          </div>
          <div className="bg-slate-900/70 p-4 rounded-xl space-y-2 text-xs">
            <div className="font-bold text-sm">😴 محاسبه‌گر چرخه خواب ۹۰ دقیقه‌ای</div>
            <label>ساعت بیدار شدن:<input type="time" className="omni-input mt-1" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} /></label>
            <div className="text-slate-300 pt-1">بهترین زمان‌های به خواب رفتن (۵ یا ۶ چرخه کامل):</div>
            <div className="flex flex-wrap gap-2 font-mono text-cyan-300">
              {[6, 5, 4].map((cycles) => {
                const [h, m] = wakeTime.split(':').map(Number);
                const tot = ((h * 60 + m - cycles * 90 - 15) % 1440 + 1440) % 1440;
                return <span key={cycles} className="bg-slate-800 px-3 py-1 rounded-lg">{String(Math.floor(tot / 60)).padStart(2, '0')}:{String(tot % 60).padStart(2, '0')} ({cycles} چرخه)</span>;
              })}
            </div>
          </div>
        </div>
      )}

      {tab === 'nutrition' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2"><Utensils className="w-4 h-4 text-amber-400" /> کالری غذاها + استعلام بارکد خوراکی (OpenFoodFacts API)</h3>
          <div className="flex gap-2" dir="ltr">
            <input className="omni-input font-mono text-xs" value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="بارکد محصول (مثلاً 3017620422003 نوتلا)" />
            <button onClick={async () => { try { const r = await lookupFoodBarcode(barcode); setBarcodeFood(r.product); } catch { onToast('محصول یافت نشد', 'error'); } }} className="omni-btn omni-btn-primary text-xs shrink-0">استعلام بارکد</button>
          </div>
          {barcodeFood && (
            <div className="rounded-xl bg-emerald-950/50 border border-emerald-500/30 p-3 text-xs">
              <strong>{barcodeFood.product_name || 'محصول'}</strong> — کالری در ۱۰۰ گرم: <strong>{barcodeFood.nutriments?.['energy-kcal_100g'] || '—'} kcal</strong> | پروتئین: {barcodeFood.nutriments?.proteins_100g || 0}g
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-60 overflow-y-auto text-xs">
            {FOOD_CALORIES_DB.map((f) => (
              <div key={f.name} className="bg-slate-900/70 p-2.5 rounded-xl flex justify-between">
                <span>{f.name}</span>
                <span className="font-mono text-amber-300">{f.kcal} kcal (P:{f.protein}g)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'workout' && (
        <div className="glass-card rounded-2xl p-4 text-center space-y-3">
          <h3 className="font-bold text-sm flex items-center justify-center gap-2"><Timer className="w-4 h-4 text-cyan-400" /> تایمر تمرین HIIT/تاباتا و شمارشگر تکرار</h3>
          <div className={`text-5xl font-black font-mono ${hiitPhase === 'work' ? 'text-emerald-400' : 'text-amber-400'}`}>{hiitSec}s</div>
          <div className="text-sm font-bold">{hiitPhase === 'work' ? '🔥 زمان تمرین!' : '😮‍💨 استراحت'}</div>
          <div className="flex justify-center gap-2">
            <button onClick={() => setHiitActive(!hiitActive)} className="omni-btn omni-btn-primary">{hiitActive ? 'توقف' : 'شروع تایمر HIIT'}</button>
            <button onClick={() => setReps((r) => r + 1)} className="omni-btn omni-btn-secondary">تکرار: {reps} (+1)</button>
          </div>
        </div>
      )}

      {tab === 'mind' && (
        <div className="glass-card rounded-2xl p-4 text-center space-y-4">
          <h3 className="font-bold text-sm flex items-center justify-center gap-2"><Wind className="w-4 h-4 text-cyan-400" /> تمرین تنفس جعبه‌ای (Box Breathing) و آرامش ذهن</h3>
          <div className={`w-36 h-36 mx-auto rounded-full bg-gradient-to-br from-cyan-500/30 to-violet-500/40 border-2 border-cyan-400 flex items-center justify-center text-sm font-bold transition-transform duration-1000 ${breathOn && breathStage.startsWith('دم') ? 'scale-125' : 'scale-95'}`}>
            {breathOn ? breathStage : 'آماده'}
          </div>
          <button onClick={() => setBreathOn(!breathOn)} className="omni-btn omni-btn-primary">{breathOn ? 'پایان تمرین' : 'شروع تنفس آرام‌بخش'}</button>
        </div>
      )}

      {tab === 'women' && (
        <div className="glass-card rounded-2xl p-4 space-y-3 text-xs">
          <h3 className="font-bold text-sm">تقویم چرخه قاعدگی، تخمک‌گذاری و محاسبه تاریخ زایمان</h3>
          <div className="grid grid-cols-2 gap-2">
            <label>اولین روز آخرین قاعدگی<input type="date" className="omni-input mt-1" value={lastPeriod} onChange={(e) => setLastPeriod(e.target.value)} /></label>
            <label>طول چرخه (روز)<input type="number" className="omni-input mt-1" value={cycleLen} onChange={(e) => setCycleLen(Number(e.target.value))} /></label>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-900 p-3 rounded-xl"><div className="text-slate-400">دوره بعدی</div><strong className="text-pink-400">{nextPeriod}</strong></div>
            <div className="bg-slate-900 p-3 rounded-xl"><div className="text-slate-400">تخمک‌گذاری تقریبی</div><strong className="text-cyan-400">{ovulationDate}</strong></div>
            <div className="bg-slate-900 p-3 rounded-xl"><div className="text-slate-400">تاریخ زایمان (بارداری)</div><strong className="text-emerald-400">{dueDate}</strong></div>
          </div>
        </div>
      )}

      {(tab === 'sensory' || tab === 'tests') && (
        <div className="glass-card rounded-2xl p-4 space-y-4">
          <h3 className="font-bold text-sm flex items-center gap-2"><Eye className="w-4 h-4 text-cyan-400" /> تست شنوایی (20Hz-18kHz)، بینایی (Snellen) و حافظه عددی</h3>
          <div className="bg-slate-900/70 p-3 rounded-xl space-y-2 text-xs">
            <div>🎧 تست فرکانس شنوایی: <strong>{hearHz} Hz</strong></div>
            <div className="flex gap-2 items-center">
              <input type="range" min={100} max={18000} step={100} value={hearHz} onChange={(e) => setHearHz(Number(e.target.value))} className="flex-1" />
              <button onClick={playHearTone} className="omni-btn omni-btn-primary text-xs">پخش صدا</button>
            </div>
          </div>
          <div className="bg-white text-slate-950 rounded-xl p-4 text-center font-mono space-y-1">
            <div className="text-xs text-slate-500">چارت بینایی Snellen (از فاصله ۱ متری بخوانید)</div>
            <div className="text-4xl font-black tracking-widest">E</div>
            <div className="text-2xl font-bold tracking-widest">F P</div>
            <div className="text-lg font-bold tracking-widest">T O Z</div>
            <div className="text-sm font-bold tracking-widest">L P E D</div>
            <div className="text-[10px] font-bold tracking-widest">P E C F D</div>
          </div>
          <div className="bg-slate-900/70 p-3 rounded-xl space-y-2 text-center text-xs">
            <div className="font-bold">🧠 تست حافظه کوتاه‌مدت</div>
            {memShow ? (
              <>
                <div className="text-2xl font-mono font-black tracking-widest text-amber-400">{memSeq}</div>
                <button onClick={() => setMemShow(false)} className="omni-btn omni-btn-secondary text-xs">مخفی کن و امتحان بده</button>
              </>
            ) : (
              <div className="flex gap-2 justify-center">
                <input className="omni-input !w-40 text-center font-mono" value={memGuess} onChange={(e) => setMemGuess(e.target.value)} />
                <button onClick={() => { const ok = memGuess === memSeq; onToast(ok ? 'عالی! دقیقاً درست بود 🎉' : `عدد اصلی ${memSeq} بود`, ok ? 'success' : 'error'); setMemSeq(String(Math.floor(100000 + Math.random() * 900000))); setMemGuess(''); setMemShow(true); }} className="omni-btn omni-btn-primary text-xs">بررسی</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
