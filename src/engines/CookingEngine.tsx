import React, { useEffect, useState } from 'react';
import { EngineProps } from '../types';
import { searchRecipesFree } from '../services/freeApis';
import { loadData, saveData } from '../services/storage';
import { ChefHat, Timer, ShoppingCart, Search, Scale } from 'lucide-react';

type CookTab = 'convert' | 'timers' | 'scaler' | 'shopping' | 'search' | 'recipes' | 'planner' | 'guides';

const DENSITY_G_PER_CUP: Record<string, { label: string; g: number }> = {
  flour: { label: 'آرد سفید', g: 125 },
  sugar: { label: 'شکر سفید', g: 200 },
  butter: { label: 'کره', g: 227 },
  rice: { label: 'برنج خام', g: 185 },
  milk: { label: 'شیر / آب', g: 240 },
  oil: { label: 'روغن مایع', g: 218 },
  honey: { label: 'عسل', g: 340 },
};

export const CookingEngine: React.FC<EngineProps> = ({ tool, onToast }) => {
  const [tab, setTab] = useState<CookTab>((tool.mode as CookTab) || 'convert');

  // Gram <-> Cup + Oven Temp
  const [ingKey, setIngKey] = useState('flour');
  const [grams, setGrams] = useState(250);
  const [ovenC, setOvenC] = useState(180);

  // Multi-timer kitchen dashboard
  const [timers, setTimers] = useState<{ id: string; label: string; sec: number; running: boolean }[]>([
    { id: 't1', label: 'دم کشیدن برنج', sec: 1800, running: false },
    { id: 't2', label: 'پخت پاستا', sec: 540, running: false },
    { id: 't3', label: 'دم کردن چای', sec: 420, running: false },
  ]);

  // Recipe Scaler
  const [origServings, setOrigServings] = useState(4);
  const [targetServings, setTargetServings] = useState(7);
  const [baseIngs] = useState([
    { name: 'برنج ایرانی', qty: 4, unit: 'پیمانه' },
    { name: 'گوشت خورشتی', qty: 500, unit: 'گرم' },
    { name: 'سبزی قورمه', qty: 600, unit: 'گرم' },
    { name: 'لوبیا قرمز', qty: 120, unit: 'گرم' },
  ]);

  // Shopping List
  const [shopItems, setShopItems] = useState<{ id: string; name: string; cost: number; bought: boolean }[]>(() =>
    loadData('cook_shopping', [
      { id: 's1', name: 'گوشت تازه ۱ کیلو', cost: 650000, bought: false },
      { id: 's2', name: 'سبزی تازه', cost: 85000, bought: false },
    ])
  );
  const [shopName, setShopName] = useState('');
  const [shopCost, setShopCost] = useState('');

  // Live TheMealDB Recipe Search
  const [recipeQ, setRecipeQ] = useState('Chicken');
  const [meals, setMeals] = useState<any[]>([]);

  useEffect(() => {
    const allowed: CookTab[] = ['convert', 'timers', 'scaler', 'shopping', 'search', 'recipes', 'planner', 'guides'];
    if (allowed.includes(tool.mode as CookTab)) setTab(tool.mode as CookTab);
  }, [tool.id, tool.mode]);

  useEffect(() => {
    const id = setInterval(() => {
      setTimers((prev) =>
        prev.map((t) => {
          if (!t.running) return t;
          if (t.sec <= 1) {
            onToast(`⏰ تایمر «${t.label}» به پایان رسید!`, 'success');
            return { ...t, sec: 0, running: false };
          }
          return { ...t, sec: t.sec - 1 };
        })
      );
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const cups = grams / (DENSITY_G_PER_CUP[ingKey]?.g || 200);
  const gasMark = Math.max(1, Math.min(10, Math.round((ovenC - 121) / 14)));

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 overflow-x-auto pb-2">
        {[
          ['convert', 'گرم↔پیمانه و فر'],
          ['timers', 'چندتایمر آشپزی'],
          ['scaler', 'مقیاس دستور پخت'],
          ['search', 'جستجوی غذا (API)'],
          ['shopping', 'لیست خرید و هزینه'],
          ['guides', 'جایگزین‌ها و رژیم'],
        ].map(([id, lbl]) => (
          <button key={id} onClick={() => setTab(id as CookTab)} className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold ${tab === id ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' : 'bg-slate-800/70 text-slate-300'}`}>
            {lbl}
          </button>
        ))}
      </div>

      {tab === 'convert' && (
        <div className="glass-card rounded-2xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-900/70 p-3 rounded-xl space-y-2">
            <div className="font-bold text-orange-400 flex items-center gap-1.5"><ChefHat className="w-4 h-4" /> تبدیل دقیق گرم به پیمانه</div>
            <select className="omni-input" value={ingKey} onChange={(e) => setIngKey(e.target.value)}>
              {Object.entries(DENSITY_G_PER_CUP).map(([k, v]) => <option key={k} value={k}>{v.label} ({v.g}g / پیمانه)</option>)}
            </select>
            <input type="number" className="omni-input font-mono" value={grams} onChange={(e) => setGrams(Number(e.target.value))} />
            <div className="text-lg font-black text-cyan-400">{cups.toFixed(2)} پیمانه ≈ {(cups * 16).toFixed(1)} قاشق غذاخوری</div>
          </div>
          <div className="bg-slate-900/70 p-3 rounded-xl space-y-2">
            <div className="font-bold text-amber-400">🔥 تبدیل دمای فر</div>
            <label>سانتی‌گراد (°C)<input type="number" className="omni-input mt-1 font-mono" value={ovenC} onChange={(e) => setOvenC(Number(e.target.value))} /></label>
            <div className="text-sm font-bold">فارنهایت: <span className="text-amber-300">{Math.round((ovenC * 9) / 5 + 32)}°F</span> | فر فن‌دار: <span className="text-emerald-400">{ovenC - 20}°C</span> | Gas Mark: <strong>{gasMark}</strong></div>
          </div>
        </div>
      )}

      {tab === 'timers' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2"><Timer className="w-4 h-4 text-orange-400" /> چندتایمر هم‌زمان آشپزخانه</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {timers.map((t) => (
              <div key={t.id} className="bg-slate-900/80 p-4 rounded-xl text-center space-y-2">
                <div className="font-bold text-xs">{t.label}</div>
                <div className="text-3xl font-mono font-black text-orange-400">{String(Math.floor(t.sec / 60)).padStart(2, '0')}:{String(t.sec % 60).padStart(2, '0')}</div>
                <button onClick={() => setTimers((p) => p.map((x) => (x.id === t.id ? { ...x, running: !x.running } : x)))} className="omni-btn omni-btn-primary text-xs w-full">
                  {t.running ? 'توقف' : 'شروع'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'scaler' && (
        <div className="glass-card rounded-2xl p-4 space-y-3 text-xs">
          <h3 className="font-bold text-sm flex items-center gap-2"><Scale className="w-4 h-4 text-cyan-400" /> مقیاس‌ساز هوشمند تعداد نفرات دستور پخت</h3>
          <div className="grid grid-cols-2 gap-2">
            <label>دستور اصلی (نفر)<input type="number" className="omni-input mt-1" value={origServings} onChange={(e) => setOrigServings(Math.max(1, Number(e.target.value)))} /></label>
            <label>تعداد مهمانان شما<input type="number" className="omni-input mt-1" value={targetServings} onChange={(e) => setTargetServings(Math.max(1, Number(e.target.value)))} /></label>
          </div>
          <div className="space-y-1.5">
            {baseIngs.map((ing) => (
              <div key={ing.name} className="bg-slate-900/70 p-2.5 rounded-xl flex justify-between">
                <span>{ing.name}</span>
                <strong className="text-amber-300">{((ing.qty * targetServings) / origServings).toFixed(1)} {ing.unit}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      {(tab === 'search' || tab === 'recipes' || tab === 'planner') && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2"><Search className="w-4 h-4 text-orange-400" /> جستجوی زنده هزاران دستور غذا (TheMealDB Free API)</h3>
          <div className="flex gap-2" dir="ltr">
            <input className="omni-input text-xs" value={recipeQ} onChange={(e) => setRecipeQ(e.target.value)} placeholder="e.g. Pasta, Chicken, Kebab, Soup" />
            <button onClick={async () => { try { const r = await searchRecipesFree(recipeQ); setMeals(r.meals || []); } catch { onToast('خطا در جستجو', 'error'); } }} className="omni-btn omni-btn-primary text-xs">جستجو</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
            {meals.slice(0, 6).map((m) => (
              <div key={m.idMeal} className="bg-slate-900/80 rounded-xl overflow-hidden text-xs">
                <img src={m.strMealThumb} alt={m.strMeal} className="w-full h-32 object-cover" />
                <div className="p-3 space-y-1">
                  <div className="font-bold text-sm">{m.strMeal}</div>
                  <div className="text-slate-400">{m.strArea} · {m.strCategory}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'shopping' && (
        <div className="glass-card rounded-2xl p-4 space-y-3 text-xs">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-emerald-400" /> لیست خرید و برآورد هزینه</h3>
            <strong className="text-emerald-400 font-mono">جمع: {shopItems.reduce((s, x) => s + x.cost, 0).toLocaleString()}</strong>
          </div>
          <div className="flex gap-2">
            <input className="omni-input" value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder="قلم خرید..." />
            <input type="number" className="omni-input !w-32" value={shopCost} onChange={(e) => setShopCost(e.target.value)} placeholder="قیمت" />
            <button onClick={() => { if (!shopName) return; const next = [{ id: String(Date.now()), name: shopName, cost: Number(shopCost) || 0, bought: false }, ...shopItems]; setShopItems(next); saveData('cook_shopping', next); setShopName(''); setShopCost(''); }} className="omni-btn omni-btn-primary">+</button>
          </div>
          {shopItems.map((it) => (
            <label key={it.id} className="bg-slate-900/70 p-2.5 rounded-xl flex justify-between">
              <span className={it.bought ? 'line-through text-slate-500' : ''}>{it.name} ({it.cost.toLocaleString()})</span>
              <input type="checkbox" checked={it.bought} onChange={() => { const next = shopItems.map((x) => (x.id === it.id ? { ...x, bought: !x.bought } : x)); setShopItems(next); saveData('cook_shopping', next); }} />
            </label>
          ))}
        </div>
      )}

      {tab === 'guides' && (
        <div className="glass-card rounded-2xl p-4 space-y-2 text-xs">
          <h3 className="font-bold text-sm">جایگزین هوشمند مواد اولیه و حساسیت‌های غذایی</h3>
          {[
            ['۱ عدد تخم‌مرغ (وگان)', '۱ قاشق دانه چیا + ۳ قاشق آب (یا نصف موز له شده)'],
            ['۱ پیمانه شیر گاو (بدون لاکتوز)', '۱ پیمانه شیر بادام یا شیر جو دوسر'],
            ['۱ قاشق بیکینگ پودر', '¼ قاشق جوش شیرین + ½ قاشق آبلیمو یا ماست'],
            ['۱ پیمانه کره', '¾ پیمانه روغن زیتون یا روغن نارگیل'],
            ['شکر سفید (رژیم کتو)', 'اریتریتول یا عصاره طبیعی استویا'],
          ].map(([from, to]) => (
            <div key={from} className="bg-slate-900/70 p-3 rounded-xl flex flex-col sm:flex-row justify-between gap-1">
              <strong className="text-orange-300">{from}</strong>
              <span className="text-emerald-300">← {to}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
