import React, { useEffect, useState } from 'react';
import { EngineProps } from '../types';
import { fetchLiveCrypto, fetchLiveCurrencyRates, CryptoTicker } from '../services/freeApis';
import { ArrowLeftRight, RefreshCw, Volume2 } from 'lucide-react';

interface UnitDef { label: string; factor: number; } // relative to base SI unit

const LINEAR_CATEGORIES: Record<string, { title: string; units: Record<string, UnitDef> }> = {
  length: { title: 'طول و مسافت', units: { m: { label: 'متر (m)', factor: 1 }, km: { label: 'کیلومتر', factor: 1000 }, cm: { label: 'سانتی‌متر', factor: 0.01 }, mm: { label: 'میلی‌متر', factor: 0.001 }, mi: { label: 'مایل', factor: 1609.344 }, yd: { label: 'یارد', factor: 0.9144 }, ft: { label: 'فوت', factor: 0.3048 }, in: { label: 'اینچ', factor: 0.0254 }, nmi: { label: 'مایل دریایی', factor: 1852 } } },
  weight: { title: 'وزن و جرم', units: { kg: { label: 'کیلوگرم', factor: 1 }, g: { label: 'گرم', factor: 0.001 }, mg: { label: 'میلی‌گرم', factor: 1e-6 }, ton: { label: 'تن متریک', factor: 1000 }, lb: { label: 'پوند (lb)', factor: 0.45359237 }, oz: { label: 'اونس (oz)', factor: 0.0283495 }, mesghal: { label: 'مثقال طلا', factor: 0.0046083 } } },
  speed: { title: 'سرعت', units: { ms: { label: 'متر بر ثانیه', factor: 1 }, kmh: { label: 'کیلومتر بر ساعت', factor: 1 / 3.6 }, mph: { label: 'مایل بر ساعت', factor: 0.44704 }, knot: { label: 'گره دریایی (Knot)', factor: 0.514444 }, mach: { label: 'ماخ (صوت)', factor: 343 } } },
  area: { title: 'مساحت', units: { m2: { label: 'متر مربع', factor: 1 }, km2: { label: 'کیلومتر مربع', factor: 1e6 }, ha: { label: 'هکتار', factor: 10000 }, acre: { label: 'جریب/آکر', factor: 4046.856 }, ft2: { label: 'فوت مربع', factor: 0.092903 } } },
  volume: { title: 'حجم و مایعات', units: { l: { label: 'لیتر', factor: 1 }, ml: { label: 'میلی‌لیتر / cc', factor: 0.001 }, m3: { label: 'متر مکعب', factor: 1000 }, gal: { label: 'گالن آمریکا', factor: 3.78541 }, cup: { label: 'پیمانه (Cup)', factor: 0.236588 }, tbsp: { label: 'قاشق غذاخوری', factor: 0.014787 }, bbl: { label: 'بشکه نفت', factor: 158.987 } } },
  time: { title: 'زمان', units: { s: { label: 'ثانیه', factor: 1 }, ms: { label: 'میلی‌ثانیه', factor: 0.001 }, min: { label: 'دقیقه', factor: 60 }, h: { label: 'ساعت', factor: 3600 }, day: { label: 'روز', factor: 86400 }, week: { label: 'هفته', factor: 604800 }, year: { label: 'سال', factor: 31557600 } } },
  data: { title: 'حجم داده', units: { B: { label: 'بایت (Byte)', factor: 1 }, b: { label: 'بیت (bit)', factor: 0.125 }, KB: { label: 'کیلوبایت', factor: 1024 }, MB: { label: 'مگابایت', factor: 1024 ** 2 }, GB: { label: 'گیگابایت', factor: 1024 ** 3 }, TB: { label: 'ترابایت', factor: 1024 ** 4 } } },
  pressure: { title: 'فشار', units: { pa: { label: 'پاسکال (Pa)', factor: 1 }, kpa: { label: 'کیلوپاسکال', factor: 1000 }, bar: { label: 'بار (Bar)', factor: 100000 }, psi: { label: 'PSI (باد لاستیک)', factor: 6894.76 }, atm: { label: 'اتمسفر', factor: 101325 }, mmhg: { label: 'میلی‌متر جیوه', factor: 133.322 } } },
  energy: { title: 'انرژی و سوخت', units: { j: { label: 'ژول (J)', factor: 1 }, kj: { label: 'کیلوژول', factor: 1000 }, kcal: { label: 'کیلوکالری', factor: 4184 }, wh: { label: 'وات‌ساعت', factor: 3600 }, kwh: { label: 'کیلووات‌ساعت', factor: 3.6e6 }, btu: { label: 'BTU گاز', factor: 1055.06 } } },
  power: { title: 'توان', units: { w: { label: 'وات (W)', factor: 1 }, kw: { label: 'کیلووات', factor: 1000 }, mw: { label: 'مگاوات', factor: 1e6 }, hp: { label: 'اسب بخار (HP)', factor: 745.7 } } },
  angle: { title: 'زاویه و نظامی', units: { deg: { label: 'درجه (°)', factor: 1 }, rad: { label: 'رادیان', factor: 57.2957795 }, grad: { label: 'گراد', factor: 0.9 }, mil: { label: 'میل ناتو', factor: 360 / 6400 } } },
  frequency: { title: 'فرکانس و CPU', units: { hz: { label: 'هرتز (Hz)', factor: 1 }, khz: { label: 'کیلوهرتز', factor: 1e3 }, mhz: { label: 'مگاهرتز', factor: 1e6 }, ghz: { label: 'گیگاهرتز', factor: 1e9 } } },
  astronomy: { title: 'واحد نجومی', units: { km: { label: 'کیلومتر', factor: 1 }, au: { label: 'واحد نجومی (AU)', factor: 1.4959787e8 }, ly: { label: 'سال نوری', factor: 9.4607e12 }, pc: { label: 'پارسک (pc)', factor: 3.0857e13 } } },
  glucose: { title: 'قند خون', units: { mgdl: { label: 'mg/dL (ایران/آمریکا)', factor: 1 }, mmoll: { label: 'mmol/L (اروپا)', factor: 18.0182 } } },
  cholesterol: { title: 'کلسترول', units: { mgdl: { label: 'mg/dL', factor: 1 }, mmoll: { label: 'mmol/L', factor: 38.67 } } },
  typography: { title: 'تایپوگرافی و CSS', units: { px: { label: 'پیکسل (px)', factor: 1 }, pt: { label: 'پوینت (pt)', factor: 1.33333 }, rem: { label: 'rem (16px)', factor: 16 }, cm: { label: 'سانتی‌متر چاپی', factor: 37.795 } } },
  bandwidth: { title: 'سرعت اینترنت', units: { mbps: { label: 'مگابیت/ثانیه (Mbps)', factor: 1 }, mbs: { label: 'مگابایت/ثانیه (MB/s)', factor: 8 }, gbps: { label: 'گیگابیت/ثانیه (Gbps)', factor: 1000 }, kbps: { label: 'کیلوبیت/ثانیه', factor: 0.001 } } },
  cooking: { title: 'واحدهای آشپزی', units: { ml: { label: 'میلی‌لیتر', factor: 1 }, tsp: { label: 'قاشق چای‌خوری', factor: 4.929 }, tbsp: { label: 'قاشق غذاخوری', factor: 14.787 }, cup: { label: 'پیمانه', factor: 236.588 }, floz: { label: 'اونس مایع', factor: 29.5735 } } },
  light: { title: 'روشنایی (نور)', units: { lux: { label: 'لوکس (Lux)', factor: 1 }, fc: { label: 'فوت‌کندل (fc)', factor: 10.7639 } } },
  radiation: { title: 'رادیواکتیو', units: { sv: { label: 'سیورت (Sv)', factor: 1 }, msv: { label: 'میلی‌سیورت', factor: 0.001 }, rem: { label: 'رم (rem)', factor: 0.01 } } },
  torque: { title: 'گشتاور', units: { nm: { label: 'نیوتن‌متر (N·m)', factor: 1 }, lbft: { label: 'پوند‌فوت (lb-ft)', factor: 1.35582 } } },
};

const MORSE_MAP: Record<string, string> = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---',
  K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-',
  U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..', '0': '-----', '1': '.----', '2': '..---',
  '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.', ' ': '/',
};

const BRAILLE_MAP: Record<string, string> = {
  a: '⠁', b: '⠃', c: '⠉', d: '⠙', e: '⠑', f: '⠋', g: '⠛', h: '⠓', i: '⠊', j: '⠚',
  k: '⠅', l: '⠇', m: '⠍', n: '⠝', o: '⠕', p: '⠏', q: '⠟', r: '⠗', s: '⠎', t: '⠞',
  u: '⠥', v: '⠧', w: '⠺', x: '⠭', y: '⠽', z: '⠵', ' ': ' ',
};

export const ConverterEngine: React.FC<EngineProps> = ({ tool, onToast }) => {
  const [section, setSection] = useState<'units' | 'temp' | 'live-fx' | 'live-crypto' | 'date' | 'morse' | 'color' | 'tech'>('units');
  const [catKey, setCatKey] = useState('length');
  const [val, setVal] = useState(1);
  const [fromU, setFromU] = useState('m');
  const [toU, setToU] = useState('km');

  // Temp
  const [tempC, setTempC] = useState(25);

  // Live Currency / Gold
  const [fxAmount, setFxAmount] = useState(100);
  const [fxFrom, setFxFrom] = useState('usd');
  const [fxTo, setFxTo] = useState('eur');
  const [fxRates, setFxRates] = useState<Record<string, number>>({});
  const [fxSource, setFxSource] = useState('');
  const [cryptos, setCryptos] = useState<CryptoTicker[]>([]);

  // 5-Calendar Date Converter
  const [isoDate, setIsoDate] = useState(new Date().toISOString().slice(0, 10));

  // Morse / Braille / Binary
  const [codeInput, setCodeInput] = useState('SOS OMNIFORGE 2026');

  // Color
  const [hexColor, setHexColor] = useState('#06b6d4');

  // Tech PPI / Battery
  const [mah, setMah] = useState(5000);
  const [battV, setBattV] = useState(3.85);
  const [scrW, setScrW] = useState(1080);
  const [scrH, setScrH] = useState(2400);
  const [scrInch, setScrInch] = useState(6.7);

  useEffect(() => {
    const m = tool.mode;
    if (m in LINEAR_CATEGORIES) {
      setSection('units');
      setCatKey(m);
      const keys = Object.keys(LINEAR_CATEGORIES[m].units);
      setFromU(keys[0]);
      setToU(keys[1] || keys[0]);
    } else if (m === 'temperature') setSection('temp');
    else if (m === 'live-fx' || m === 'live-metals') setSection('live-fx');
    else if (m === 'live-crypto') setSection('live-crypto');
    else if (m === 'special-date') setSection('date');
    else if (m.startsWith('special-morse') || m.startsWith('special-braille') || m.startsWith('special-binary')) setSection('morse');
    else if (m === 'special-color') setSection('color');
    else if (m === 'tech') setSection('tech');
  }, [tool.id, tool.mode]);

  const loadFx = async (base = fxFrom) => {
    const res = await fetchLiveCurrencyRates(base);
    setFxRates(res.rates);
    setFxSource(`${res.source} (${res.date})`);
  };

  const loadCrypto = async () => {
    const res = await fetchLiveCrypto();
    setCryptos(res.coins);
    onToast(`قیمت زنده از ${res.source} بروزرسانی شد`, 'success');
  };

  useEffect(() => {
    if (section === 'live-fx' && Object.keys(fxRates).length === 0) loadFx();
    if (section === 'live-crypto' && cryptos.length === 0) loadCrypto();
  }, [section]);

  const currentCat = LINEAR_CATEGORIES[catKey] || LINEAR_CATEGORIES.length;
  const fromFactor = currentCat.units[fromU]?.factor || 1;
  const toFactor = currentCat.units[toU]?.factor || 1;
  const converted = (val * fromFactor) / toFactor;

  // Morse Audio Playback
  const playMorseAudio = (morse: string) => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    let t = ctx.currentTime;
    for (const ch of morse) {
      if (ch === '.' || ch === '-') {
        const dur = ch === '.' ? 0.08 : 0.22;
        const osc = ctx.createOscillator();
        osc.frequency.value = 740;
        osc.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + dur);
        t += dur + 0.07;
      } else {
        t += 0.18;
      }
    }
  };

  const morseOut = codeInput.toUpperCase().split('').map((c) => MORSE_MAP[c] || c).join(' ');
  const brailleOut = codeInput.toLowerCase().split('').map((c) => BRAILLE_MAP[c] || c).join('');
  const binaryOut = codeInput.split('').map((c) => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');

  // Color conversions
  const r = parseInt(hexColor.slice(1, 3), 16) || 0;
  const g = parseInt(hexColor.slice(3, 5), 16) || 0;
  const b = parseInt(hexColor.slice(5, 7), 16) || 0;
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const maxC = Math.max(rn, gn, bn), minC = Math.min(rn, gn, bn);
  const kCmyk = 1 - maxC;
  const cCmyk = kCmyk < 1 ? Math.round(((1 - rn - kCmyk) / (1 - kCmyk)) * 100) : 0;
  const mCmyk = kCmyk < 1 ? Math.round(((1 - gn - kCmyk) / (1 - kCmyk)) * 100) : 0;
  const yCmyk = kCmyk < 1 ? Math.round(((1 - bn - kCmyk) / (1 - kCmyk)) * 100) : 0;

  const dateObj = new Date(isoDate + 'T12:00:00');
  const formatCal = (cal: string, locale = 'fa-IR') => {
    try { return new Intl.DateTimeFormat(`${locale}-u-ca-${cal}`, { dateStyle: 'full' }).format(dateObj); }
    catch { return dateObj.toDateString(); }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 overflow-x-auto pb-2">
        {[
          ['units', 'واحدهای فیزیکی/تخصصی'],
          ['live-fx', 'ارز و طلا (زنده)'],
          ['live-crypto', 'کریپتو (زنده)'],
          ['date', '۵ تقویم (شمسی/قمری)'],
          ['temp', 'دما'],
          ['morse', 'مورس/بریل/باینری'],
          ['color', 'رنگ HEX/RGB/CMYK'],
          ['tech', 'فنی (PPI/باتری)'],
        ].map(([id, lbl]) => (
          <button key={id} onClick={() => setSection(id as any)} className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold ${section === id ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white' : 'bg-slate-800/70 text-slate-300'}`}>
            {lbl}
          </button>
        ))}
      </div>

      {section === 'units' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(LINEAR_CATEGORIES).map(([k, v]) => (
              <button
                key={k}
                onClick={() => {
                  setCatKey(k);
                  const ks = Object.keys(v.units);
                  setFromU(ks[0]);
                  setToU(ks[1] || ks[0]);
                }}
                className={`rounded-lg px-2.5 py-1 text-[11px] ${catKey === k ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'}`}
              >
                {v.title}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
            <label className="text-xs">مقدار<input type="number" className="omni-input mt-1 font-mono" value={val} onChange={(e) => setVal(Number(e.target.value))} /></label>
            <label className="text-xs">از واحد
              <select className="omni-input mt-1" value={fromU} onChange={(e) => setFromU(e.target.value)}>
                {Object.entries(currentCat.units).map(([k, u]) => <option key={k} value={k}>{u.label}</option>)}
              </select>
            </label>
            <label className="text-xs">به واحد
              <select className="omni-input mt-1" value={toU} onChange={(e) => setToU(e.target.value)}>
                {Object.entries(currentCat.units).map(([k, u]) => <option key={k} value={k}>{u.label}</option>)}
              </select>
            </label>
          </div>
          <div className="rounded-xl bg-slate-950 p-4 text-center">
            <div className="text-xs text-slate-400">نتیجه تبدیل ({currentCat.title})</div>
            <div dir="ltr" className="text-2xl font-mono font-black text-amber-400 mt-1">{Number(converted.toPrecision(8))} {toU}</div>
          </div>
        </div>
      )}

      {section === 'temp' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm">مبدل دقیق دما</h3>
          <input type="number" className="omni-input font-mono text-lg" value={tempC} onChange={(e) => setTempC(Number(e.target.value))} />
          <div className="grid grid-cols-3 gap-2 text-center font-mono">
            <div className="bg-slate-900 p-3 rounded-xl"><div className="text-xs text-slate-400">Celsius</div><div className="text-lg font-bold">{tempC} °C</div></div>
            <div className="bg-slate-900 p-3 rounded-xl"><div className="text-xs text-slate-400">Fahrenheit</div><div className="text-lg font-bold text-amber-400">{((tempC * 9) / 5 + 32).toFixed(2)} °F</div></div>
            <div className="bg-slate-900 p-3 rounded-xl"><div className="text-xs text-slate-400">Kelvin</div><div className="text-lg font-bold text-cyan-400">{(tempC + 273.15).toFixed(2)} K</div></div>
          </div>
        </div>
      )}

      {section === 'live-fx' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm">نرخ زنده ارزها، طلا (XAU) و نقره (XAG) — Public APIs</h3>
            <button onClick={() => loadFx(fxFrom)} className="omni-btn omni-btn-secondary text-xs"><RefreshCw className="w-3.5 h-3.5" /> بروزرسانی</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input type="number" className="omni-input font-mono" value={fxAmount} onChange={(e) => setFxAmount(Number(e.target.value))} />
            <select className="omni-input uppercase" value={fxFrom} onChange={(e) => { setFxFrom(e.target.value); loadFx(e.target.value); }}>
              {['usd', 'eur', 'gbp', 'aed', 'try', 'irr', 'cad', 'jpy', 'xau', 'xag', 'btc'].map((c) => <option key={c} value={c}>{c.toUpperCase()}</option>)}
            </select>
            <select className="omni-input uppercase" value={fxTo} onChange={(e) => setFxTo(e.target.value)}>
              {['eur', 'usd', 'gbp', 'aed', 'try', 'irr', 'cad', 'jpy', 'xau', 'xag', 'btc'].map((c) => <option key={c} value={c}>{c.toUpperCase()}</option>)}
            </select>
          </div>
          <div className="rounded-xl bg-slate-950 p-4 text-center space-y-1">
            <div className="text-2xl font-mono font-black text-emerald-400" dir="ltr">
              {fxAmount} {fxFrom.toUpperCase()} = {((fxRates[fxTo] || 0) * fxAmount).toLocaleString(undefined, { maximumFractionDigits: 4 })} {fxTo.toUpperCase()}
            </div>
            <div className="text-[11px] text-slate-400">منبع: {fxSource || 'در حال دریافت...'}</div>
          </div>
        </div>
      )}

      {section === 'live-crypto' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm">قیمت زنده ارزهای دیجیتال (CoinGecko Free API)</h3>
            <button onClick={loadCrypto} className="omni-btn omni-btn-secondary text-xs"><RefreshCw className="w-3.5 h-3.5" /> بروزرسانی</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {cryptos.map((c) => (
              <div key={c.id} className="rounded-xl bg-slate-900/70 p-3 flex items-center justify-between">
                <div><div className="font-bold text-sm">{c.name}</div><div className="text-xs text-slate-400">{c.symbol}</div></div>
                <div className="text-left font-mono" dir="ltr">
                  <div className="font-bold text-white">${c.priceUsd.toLocaleString()}</div>
                  <div className={`text-xs ${c.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{c.change24h >= 0 ? '+' : ''}{c.change24h}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {section === 'date' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm">مبدل هم‌زمان ۵ تقویم (شمسی، میلادی، قمری، عبری و Unix)</h3>
          <input type="date" className="omni-input font-mono" value={isoDate} onChange={(e) => setIsoDate(e.target.value)} />
          <div className="space-y-2 text-sm">
            <div className="bg-slate-900/70 p-3 rounded-xl flex justify-between"><span className="text-cyan-400">شمسی (جلالی):</span><strong>{formatCal('persian', 'fa-IR')}</strong></div>
            <div className="bg-slate-900/70 p-3 rounded-xl flex justify-between"><span className="text-emerald-400">قمری (هجری):</span><strong>{formatCal('islamic', 'fa-IR')}</strong></div>
            <div className="bg-slate-900/70 p-3 rounded-xl flex justify-between"><span className="text-amber-400">میلادی:</span><strong>{formatCal('gregory', 'en-US')}</strong></div>
            <div className="bg-slate-900/70 p-3 rounded-xl flex justify-between"><span className="text-violet-400">عبری (Hebrew):</span><strong>{formatCal('hebrew', 'en-US')}</strong></div>
            <div className="bg-slate-900/70 p-3 rounded-xl flex justify-between"><span className="text-slate-400">Unix Timestamp:</span><strong dir="ltr" className="font-mono">{Math.floor(dateObj.getTime() / 1000)}</strong></div>
          </div>
        </div>
      )}

      {section === 'morse' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm">مبدل کد مورس (با پخش صوت)، خط بریل و باینری</h3>
          <input dir="ltr" className="omni-input font-mono" value={codeInput} onChange={(e) => setCodeInput(e.target.value)} />
          <div className="space-y-2 text-xs font-mono" dir="ltr">
            <div className="bg-slate-900 p-3 rounded-xl flex items-center justify-between gap-2">
              <div className="break-all"><span className="text-amber-400">MORSE:</span> {morseOut}</div>
              <button onClick={() => playMorseAudio(morseOut)} className="omni-btn omni-btn-primary text-xs shrink-0"><Volume2 className="w-3.5 h-3.5" /> پخش</button>
            </div>
            <div className="bg-slate-900 p-3 rounded-xl text-lg"><span className="text-cyan-400 text-xs">BRAILLE: </span>{brailleOut}</div>
            <div className="bg-slate-900 p-3 rounded-xl break-all"><span className="text-emerald-400">BINARY: </span>{binaryOut}</div>
          </div>
        </div>
      )}

      {section === 'color' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm">مبدل حرفه‌ای رنگ (HEX / RGB / CMYK)</h3>
          <div className="flex items-center gap-3">
            <input type="color" value={hexColor} onChange={(e) => setHexColor(e.target.value)} className="w-16 h-12 rounded-xl bg-transparent cursor-pointer" />
            <input dir="ltr" className="omni-input font-mono" value={hexColor} onChange={(e) => setHexColor(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono" dir="ltr">
            <div className="bg-slate-900 p-3 rounded-xl">RGB({r}, {g}, {b})</div>
            <div className="bg-slate-900 p-3 rounded-xl">CMYK({cCmyk}%, {mCmyk}%, {yCmyk}%, {Math.round(kCmyk * 100)}%)</div>
            <div className="bg-slate-900 p-3 rounded-xl">Luminance: {Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b)}</div>
          </div>
        </div>
      )}

      {section === 'tech' && (
        <div className="glass-card rounded-2xl p-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-900/70 p-3 rounded-xl space-y-2">
            <div className="font-bold text-cyan-400">🔋 تبدیل باتری mAh ↔ Wh</div>
            <label>ظرفیت (mAh)<input type="number" className="omni-input mt-1" value={mah} onChange={(e) => setMah(Number(e.target.value))} /></label>
            <label>ولتاژ (V)<input type="number" step="0.05" className="omni-input mt-1" value={battV} onChange={(e) => setBattV(Number(e.target.value))} /></label>
            <div className="text-sm font-bold text-emerald-400">انرژی باتری: {((mah * battV) / 1000).toFixed(2)} Wh</div>
          </div>
          <div className="bg-slate-900/70 p-3 rounded-xl space-y-2">
            <div className="font-bold text-amber-400">📱 تراکم پیکسل صفحه‌نمایش (PPI)</div>
            <div className="grid grid-cols-3 gap-1">
              <input type="number" className="omni-input" value={scrW} onChange={(e) => setScrW(Number(e.target.value))} />
              <input type="number" className="omni-input" value={scrH} onChange={(e) => setScrH(Number(e.target.value))} />
              <input type="number" step="0.1" className="omni-input" value={scrInch} onChange={(e) => setScrInch(Number(e.target.value))} />
            </div>
            <div className="text-sm font-bold text-cyan-400">تراکم: {Math.round(Math.hypot(scrW, scrH) / (scrInch || 1))} PPI</div>
          </div>
        </div>
      )}
    </div>
  );
};
