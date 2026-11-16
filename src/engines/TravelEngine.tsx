import React, { useEffect, useState } from 'react';
import { EngineProps } from '../types';
import { fetchWeatherAndSoil, geocodeCity } from '../services/freeApis';
import { WORLD_COUNTRIES } from '../data/referenceData';
import { speakText } from '../services/nativeBridge';
import { Compass, CloudSun, MapPin, Fuel, Languages } from 'lucide-react';

type TravelTab = 'map' | 'weather' | 'calc' | 'countries' | 'phrasebook' | 'gps' | 'places' | 'currency' | 'esim';

const PHRASES = [
  { fa: 'سلام، حالتون چطوره؟', en: 'Hello, how are you?', ar: 'مرحباً، كيف حالك؟', tr: 'Merhaba, nasılsın?', fr: 'Bonjour, comment allez-vous ?' },
  { fa: 'قیمت این چقدر است؟', en: 'How much does this cost?', ar: 'كم سعر هذا؟', tr: 'Bunun fiyatı ne kadar?', fr: 'Combien coûte ceci ?' },
  { fa: 'لطفاً کمکم کنید (اضطراری)', en: 'Please help me!', ar: 'ساعدني من فضلك!', tr: 'Lütfen bana yardım edin!', fr: 'Aidez-moi s’il vous plaît !' },
  { fa: 'فرودگاه / ایستگاه قطار کجاست؟', en: 'Where is the airport / train station?', ar: 'أين المطار / محطة القطار؟', tr: 'Havaalanı / tren istasyonu nerede?', fr: 'Où est l’aéroport / la gare ?' },
  { fa: 'متشکرم', en: 'Thank you very much', ar: 'شكراً جزيلاً', tr: 'Çok teşekkür ederim', fr: 'Merci beaucoup' },
];

export const TravelEngine: React.FC<EngineProps> = ({ tool, onToast }) => {
  const [tab, setTab] = useState<TravelTab>((tool.mode as TravelTab) || 'weather');
  const [cityQuery, setCityQuery] = useState('Tehran');
  const [coords, setCoords] = useState({ name: 'Tehran', lat: 35.6892, lon: 51.389 });
  const [weather, setWeather] = useState<any>(null);

  // Trip Distance & Fuel Cost
  const [distKm, setDistKm] = useState(450);
  const [lPer100, setLPer100] = useState(7.5);
  const [fuelPrice, setFuelPrice] = useState(30000);
  const [passengers, setPassengers] = useState(4);

  useEffect(() => {
    const allowed: TravelTab[] = ['map', 'weather', 'calc', 'countries', 'phrasebook', 'gps', 'places', 'currency', 'esim'];
    if (allowed.includes(tool.mode as TravelTab)) setTab(tool.mode as TravelTab);
  }, [tool.id, tool.mode]);

  const loadCityWeather = async (lat = coords.lat, lon = coords.lon) => {
    const w = await fetchWeatherAndSoil(lat, lon);
    setWeather(w);
  };

  useEffect(() => {
    if (!weather) loadCityWeather();
  }, []);

  const searchCity = async () => {
    const list = await geocodeCity(cityQuery);
    if (list[0]) {
      setCoords({ name: `${list[0].name}, ${list[0].country}`, lat: list[0].lat, lon: list[0].lon });
      loadCityWeather(list[0].lat, list[0].lon);
      onToast(`موقعیت به ${list[0].name} تغییر یافت`, 'success');
    }
  };

  const totalFuel = (distKm / 100) * lPer100;
  const totalCost = totalFuel * fuelPrice;

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 overflow-x-auto pb-2">
        {[
          ['weather', 'هواشناسی ۷ روزه زنده'],
          ['map', 'نقشه OpenStreetMap'],
          ['calc', 'هزینه سوخت و تقسیم کرایه'],
          ['phrasebook', 'مکالمات سفر آفلاین'],
          ['countries', 'کد کشورها و اضطراری'],
        ].map(([id, lbl]) => (
          <button key={id} onClick={() => setTab(id as TravelTab)} className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold ${tab === id ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white' : 'bg-slate-800/70 text-slate-300'}`}>
            {lbl}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input className="omni-input text-xs" value={cityQuery} onChange={(e) => setCityQuery(e.target.value)} placeholder="نام شهر مقصد (مثلاً Tehran, Istanbul, Paris)..." />
        <button onClick={searchCity} className="omni-btn omni-btn-primary text-xs shrink-0"><MapPin className="w-4 h-4" /> جستجوی شهر</button>
      </div>

      {(tab === 'weather' || tab === 'places' || tab === 'currency') && weather && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2"><CloudSun className="w-4 h-4 text-amber-400" /> هواشناسی زنده {coords.name} (Open-Meteo Free API)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div className="bg-slate-900 p-3 rounded-xl"><div className="text-slate-400">دمای فعلی</div><div className="text-2xl font-black text-amber-400">{weather.current?.temperature_2m}°C</div></div>
            <div className="bg-slate-900 p-3 rounded-xl"><div className="text-slate-400">رطوبت هوا</div><div className="text-xl font-bold text-cyan-400">{weather.current?.relative_humidity_2m}%</div></div>
            <div className="bg-slate-900 p-3 rounded-xl"><div className="text-slate-400">سرعت باد</div><div className="text-xl font-bold">{weather.current?.wind_speed_10m} km/h</div></div>
            <div className="bg-slate-900 p-3 rounded-xl"><div className="text-slate-400">فشار هوا</div><div className="text-xl font-bold">{weather.current?.surface_pressure} hPa</div></div>
          </div>
          {weather.daily?.time && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
              {weather.daily.time.slice(0, 4).map((d: string, i: number) => (
                <div key={d} className="bg-slate-900/70 p-2.5 rounded-xl flex justify-between">
                  <span className="font-mono text-slate-400">{d.slice(5)}</span>
                  <span className="font-bold text-amber-300">{weather.daily.temperature_2m_min?.[i]}° / {weather.daily.temperature_2m_max?.[i]}°</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {(tab === 'map' || tab === 'gps') && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2"><Compass className="w-4 h-4 text-cyan-400" /> نقشه زنده OpenStreetMap ({coords.lat.toFixed(4)}, {coords.lon.toFixed(4)})</h3>
          <iframe
            title="OSM Map"
            className="w-full h-72 rounded-xl border border-slate-700"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${coords.lon - 0.12},${coords.lat - 0.08},${coords.lon + 0.12},${coords.lat + 0.08}&layer=mapnik&marker=${coords.lat},${coords.lon}`}
          />
        </div>
      )}

      {tab === 'calc' && (
        <div className="glass-card rounded-2xl p-4 space-y-3 text-xs">
          <h3 className="font-bold text-sm flex items-center gap-2"><Fuel className="w-4 h-4 text-amber-400" /> محاسبه مصرف سوخت، زمان سفر و تقسیم کرایه</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <label>مسافت (km)<input type="number" className="omni-input mt-1" value={distKm} onChange={(e) => setDistKm(Number(e.target.value))} /></label>
            <label>مصرف در ۱۰۰km<input type="number" step="0.5" className="omni-input mt-1" value={lPer100} onChange={(e) => setLPer100(Number(e.target.value))} /></label>
            <label>قیمت هر لیتر<input type="number" className="omni-input mt-1" value={fuelPrice} onChange={(e) => setFuelPrice(Number(e.target.value))} /></label>
            <label>تعداد همسفران<input type="number" className="omni-input mt-1" value={passengers} onChange={(e) => setPassengers(Math.max(1, Number(e.target.value)))} /></label>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-900 p-3 rounded-xl">بنزین لازم<strong className="block text-lg text-amber-400">{totalFuel.toFixed(1)} لیتر</strong></div>
            <div className="bg-slate-900 p-3 rounded-xl">هزینه کل<strong className="block text-lg text-emerald-400">{Math.round(totalCost).toLocaleString()}</strong></div>
            <div className="bg-slate-900 p-3 rounded-xl">سهم هر نفر<strong className="block text-lg text-cyan-400">{Math.round(totalCost / passengers).toLocaleString()}</strong></div>
          </div>
        </div>
      )}

      {tab === 'phrasebook' && (
        <div className="glass-card rounded-2xl p-4 space-y-2 text-xs">
          <h3 className="font-bold text-sm flex items-center gap-2"><Languages className="w-4 h-4 text-cyan-400" /> مکالمات ضروری سفر آفلاین با تلفظ صوتی</h3>
          {PHRASES.map((p, i) => (
            <div key={i} className="bg-slate-900/70 p-3 rounded-xl space-y-1">
              <div className="font-bold text-cyan-300">{p.fa}</div>
              <div className="flex flex-wrap gap-2 text-[11px]" dir="ltr">
                <button onClick={() => speakText(p.en, 'en-US')} className="bg-slate-800 px-2 py-1 rounded">🇬🇧 {p.en}</button>
                <button onClick={() => speakText(p.tr, 'tr-TR')} className="bg-slate-800 px-2 py-1 rounded">🇹🇷 {p.tr}</button>
                <button onClick={() => speakText(p.fr, 'fr-FR')} className="bg-slate-800 px-2 py-1 rounded">🇫🇷 {p.fr}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(tab === 'countries' || tab === 'esim') && (
        <div className="glass-card rounded-2xl p-4 space-y-2 text-xs max-h-80 overflow-y-auto">
          <h3 className="font-bold text-sm">پیش‌شماره کشورها، ارز و مناطق زمانی جهان</h3>
          {WORLD_COUNTRIES.map((c) => (
            <div key={c.code} className="bg-slate-900/70 p-2.5 rounded-xl flex justify-between">
              <span>{c.nameFa} ({c.nameEn})</span>
              <span className="font-mono text-cyan-300">{c.dial} · {c.currency} · {c.tz}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
