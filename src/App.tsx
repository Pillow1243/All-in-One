import React, { useEffect, useMemo, useState } from 'react';
import { AppSettings, CategoryMeta, ToolItem } from './types';
import { ALL_TOOLS, CATEGORIES, CATEGORY_MAP, TOOL_MAP, getToolsByCategory } from './data/catalog';
import { PUBLIC_APIS_DIRECTORY } from './data/publicApisData';
import { loadData, loadSettings, logToolUsage, saveData, saveSettings } from './services/storage';
import { vibrateDevice } from './services/nativeBridge';
import { CategoryIcon } from './components/CategoryIcon';
import { ColorBlindFilters } from './components/ColorBlindFilters';
import { EngineRouter } from './components/EngineRouter';
import {
  Search, Star, Home, LayoutGrid, Sparkles, Settings, ChevronRight, ChevronLeft,
  Moon, Sun, Globe, Wifi, WifiOff, Clock, ShieldCheck, X, Lock,
} from 'lucide-react';

type NavView = 'home' | 'categories' | 'all' | 'favorites' | 'category' | 'tool';

export const App: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [favorites, setFavorites] = useState<string[]>(() => loadData<string[]>('favorites', ['ai-chatbot', 'pdf-merge', 'converter-currency-live']));
  const [recentIds, setRecentIds] = useState<string[]>(() => loadData<string[]>('recents', []));
  const [view, setView] = useState<NavView>('home');
  const [activeCategory, setActiveCategory] = useState<CategoryMeta | null>(null);
  const [activeTool, setActiveTool] = useState<ToolItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [catFilterQuery, setCatFilterQuery] = useState('');
  const [online, setOnline] = useState(() => navigator.onLine);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [locked, setLocked] = useState(() => {
    const s = loadSettings();
    return Boolean(s.appLockEnabled && s.appLockPin);
  });
  const [pinEntry, setPinEntry] = useState('');

  const isRtl = settings.language === 'fa' || settings.language === 'ar';

  // Apply live theme, direction, contrast, colorblind filter & font scale
  useEffect(() => {
    const html = document.documentElement;
    html.dir = isRtl ? 'rtl' : 'ltr';
    html.lang = settings.language;
    html.setAttribute('data-theme', settings.theme);
    html.setAttribute('data-contrast', settings.highContrast ? 'high' : 'normal');
    html.setAttribute('data-colorblind', settings.colorBlindMode);
    html.style.setProperty('--accent-primary', settings.accentPrimary);
    html.style.setProperty('--accent-secondary', settings.accentSecondary);
    html.style.fontSize = `${Math.round(16 * settings.fontScale)}px`;
    saveSettings(settings);
  }, [settings, isRtl]);

  useEffect(() => {
    const onOn = () => setOnline(true);
    const onOff = () => setOnline(false);
    window.addEventListener('online', onOn);
    window.addEventListener('offline', onOff);
    return () => {
      window.removeEventListener('online', onOn);
      window.removeEventListener('offline', onOff);
    };
  }, []);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast((t) => (t?.msg === msg ? null : t)), 3200);
  };

  const updateSettings = (patch: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  };

  const openTool = (tool: ToolItem) => {
    if (settings.hapticsEnabled) vibrateDevice([15]);
    setActiveTool(tool);
    setActiveCategory(CATEGORY_MAP[tool.categoryId] || null);
    setView('tool');
    logToolUsage(tool.id, tool.categoryId);
    const nextRecents = [tool.id, ...recentIds.filter((id) => id !== tool.id)].slice(0, 20);
    setRecentIds(nextRecents);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openCategory = (cat: CategoryMeta) => {
    if (settings.hapticsEnabled) vibrateDevice([12]);
    setActiveCategory(cat);
    setCatFilterQuery('');
    setView('category');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleFavorite = (toolId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const exists = favorites.includes(toolId);
    const next = exists ? favorites.filter((f) => f !== toolId) : [toolId, ...favorites];
    setFavorites(next);
    saveData('favorites', next);
    showToast(exists ? 'از علاقه‌مندی‌ها حذف شد' : 'به علاقه‌مندی‌ها اضافه شد ⭐', 'success');
  };

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return ALL_TOOLS.filter(
      (t) =>
        t.nameFa.toLowerCase().includes(q) ||
        t.nameEn.toLowerCase().includes(q) ||
        t.descriptionFa.toLowerCase().includes(q) ||
        t.tags.some((tg) => tg.includes(q))
    );
  }, [searchQuery]);

  const favoriteTools = useMemo(
    () => favorites.map((id) => TOOL_MAP[id]).filter(Boolean),
    [favorites]
  );

  const recentTools = useMemo(
    () => recentIds.map((id) => TOOL_MAP[id]).filter(Boolean),
    [recentIds]
  );

  // App Lock Screen
  if (locked && settings.appLockEnabled && settings.appLockPin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass-card rounded-3xl p-7 max-w-sm w-full text-center space-y-4">
          <Lock className="w-10 h-10 text-cyan-400 mx-auto" />
          <h1 className="text-lg font-black">قفل امنیتی همه‌کاره پرو</h1>
          <input
            type="password"
            inputMode="numeric"
            value={pinEntry}
            onChange={(e) => setPinEntry(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && pinEntry === settings.appLockPin && setLocked(false)}
            placeholder="پین‌کد ورود..."
            className="omni-input text-center font-mono text-xl tracking-widest"
          />
          <button
            onClick={() => (pinEntry === settings.appLockPin ? setLocked(false) : showToast('پین‌کد اشتباه است', 'error'))}
            className="omni-btn omni-btn-primary w-full"
          >
            باز کردن قفل
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <ColorBlindFilters />

      {/* Top Sticky Glass Header */}
      <header className="sticky top-0 z-40 glass-card border-b border-white/10 px-3 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2.5">
          <button onClick={() => { setView('home'); setSearchQuery(''); }} className="flex items-center gap-2.5 shrink-0 text-right">
            <img src="./icons/icon-192.png" alt="OmniForge Pro" className="w-9 h-9 rounded-xl shadow-lg shadow-cyan-500/20" />
            <div className="leading-tight">
              <div className="font-black text-sm sm:text-base tracking-tight bg-gradient-to-r from-cyan-400 via-violet-400 to-amber-300 bg-clip-text text-transparent">
                {isRtl ? 'همه‌کاره پرو' : 'OmniForge Pro'}
              </div>
              <div className="text-[10px] text-slate-400 hidden sm:block">
                {CATEGORIES.length} {isRtl ? 'دسته' : 'Categories'} · {ALL_TOOLS.length}+ {isRtl ? 'ابزار رایگان' : 'Free Tools'}
              </div>
            </div>
          </button>

          {/* Instant Global Command Search */}
          <div className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3 pointer-events-none" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRtl ? `جستجو در ${ALL_TOOLS.length} ابزار (PDF، ویرایش عکس، ارز، بازی، AI...)` : `Search ${ALL_TOOLS.length}+ tools...`}
              className="omni-input !ps-9 !pe-8 !py-2 text-xs sm:text-sm"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute top-1/2 -translate-y-1/2 end-2.5 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Header Quick Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span title={online ? 'آنلاین' : 'آفلاین'} className={`hidden md:flex items-center gap-1 rounded-xl px-2 py-1 text-[11px] font-semibold ${online ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}>
              {online ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              {online ? (isRtl ? 'آنلاین' : 'Online') : (isRtl ? 'آفلاین' : 'Offline')}
            </span>
            <button
              onClick={() => updateSettings({ language: settings.language === 'fa' ? 'en' : 'fa' })}
              className="omni-btn omni-btn-secondary !px-2.5 !py-1.5 text-xs"
              title="تغییر زبان فارسی/انگلیسی"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">{settings.language.toUpperCase()}</span>
            </button>
            <button
              onClick={() => updateSettings({ theme: settings.theme === 'dark' ? 'oled' : settings.theme === 'oled' ? 'light' : 'dark' })}
              className="omni-btn omni-btn-secondary !px-2.5 !py-1.5 text-xs"
              title="تغییر تم (تاریک / OLED / روشن)"
            >
              {settings.theme === 'light' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-300" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 pt-4 space-y-5">
        {/* Global Live Search Overlay Results */}
        {searchQuery.trim().length > 0 && (
          <section className="glass-card rounded-3xl p-4 space-y-3 border border-cyan-500/30">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-cyan-300">
                {isRtl ? `نتایج جستجو (${searchResults.length} ابزار یافت شد)` : `Search Results (${searchResults.length} tools)`}
              </h2>
              <button onClick={() => setSearchQuery('')} className="text-xs text-slate-400 hover:text-white">بستن جستجو</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[65vh] overflow-y-auto">
              {searchResults.slice(0, 60).map((t) => {
                const cat = CATEGORY_MAP[t.categoryId];
                return (
                  <button
                    key={t.id}
                    onClick={() => { setSearchQuery(''); openTool(t); }}
                    className="rounded-2xl bg-slate-900/75 hover:bg-slate-800/90 border border-white/5 hover:border-cyan-400/40 p-3 text-right flex items-start justify-between gap-2 transition"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-xs sm:text-sm truncate">{isRtl ? t.nameFa : t.nameEn}</div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">{t.descriptionFa}</div>
                      {cat && <span className="inline-block mt-1.5 text-[10px] rounded-md bg-white/5 px-1.5 py-0.5 text-cyan-300">{isRtl ? cat.nameFa : cat.nameEn}</span>}
                    </div>
                    <Star
                      onClick={(e) => toggleFavorite(t.id, e)}
                      className={`w-4 h-4 shrink-0 ${favorites.includes(t.id) ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`}
                    />
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* HOME DASHBOARD VIEW */}
        {!searchQuery && view === 'home' && (
          <>
            {/* Hero Banner */}
            <section className="relative overflow-hidden rounded-3xl p-5 sm:p-7 bg-gradient-to-br from-slate-900 via-indigo-950/80 to-slate-950 border border-cyan-500/20 shadow-2xl">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="space-y-2 max-w-2xl">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/15 border border-cyan-400/30 px-3 py-1 text-[11px] font-semibold text-cyan-300">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {isRtl ? '۱۰۰٪ رایگان همیشگی · بدون تبلیغات · آفلاین + APIهای رایگان عمومی' : '100% Free Forever · Ad-Free · Offline + Public Free APIs'}
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                    {isRtl ? 'سوپراپلیکیشن همه‌کاره پرو' : 'OmniForge Pro Super-App'}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {isRtl
                      ? `مجموعه‌ای بی‌رقیب شامل ${ALL_TOOLS.length}+ ابزار واقعی و حرفه‌ای در ${CATEGORIES.length} دسته‌بندی: از استودیو PDF و ادیتور تصویر و DAW موسیقی گرفته تا هوش مصنوعی رایگان، ابزار مهندسی، پزشکی، مالی، بازی‌ها و کاوشگر ${PUBLIC_APIS_DIRECTORY.length} API عمومی!`
                      : `${ALL_TOOLS.length}+ working tools across ${CATEGORIES.length} categories: PDF Studio, Photo/Video/Audio DAW, Free AI, Dev/Security, Finance, Games & ${PUBLIC_APIS_DIRECTORY.length} Public APIs.`}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button onClick={() => openTool(getToolsByCategory('ai')[0])} className="omni-btn omni-btn-primary text-xs">
                      <Sparkles className="w-4 h-4" /> {isRtl ? 'شروع با هوش مصنوعی رایگان' : 'Launch Free AI Studio'}
                    </button>
                    <button onClick={() => openTool(getToolsByCategory('pdf')[0])} className="omni-btn omni-btn-secondary text-xs">
                      📄 {isRtl ? 'استودیو PDF سازمانی' : 'PDF Enterprise'}
                    </button>
                    <button onClick={() => openTool(getToolsByCategory('platform').find((t) => t.mode === 'apis') || getToolsByCategory('platform')[0])} className="omni-btn omni-btn-secondary text-xs">
                      🌐 {isRtl ? `کاوشگر ${PUBLIC_APIS_DIRECTORY.length} API رایگان` : `Explore ${PUBLIC_APIS_DIRECTORY.length} Free APIs`}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center shrink-0">
                  <div className="rounded-2xl bg-black/40 border border-white/10 p-3">
                    <div className="text-xl sm:text-2xl font-black text-cyan-400">{CATEGORIES.length}</div>
                    <div className="text-[10px] text-slate-400">{isRtl ? 'دسته‌بندی' : 'Categories'}</div>
                  </div>
                  <div className="rounded-2xl bg-black/40 border border-white/10 p-3">
                    <div className="text-xl sm:text-2xl font-black text-violet-400">{ALL_TOOLS.length}+</div>
                    <div className="text-[10px] text-slate-400">{isRtl ? 'ابزار واقعی' : 'Real Tools'}</div>
                  </div>
                  <div className="rounded-2xl bg-black/40 border border-white/10 p-3">
                    <div className="text-xl sm:text-2xl font-black text-emerald-400">{PUBLIC_APIS_DIRECTORY.length}</div>
                    <div className="text-[10px] text-slate-400">{isRtl ? 'API رایگان' : 'Free APIs'}</div>
                  </div>
                </div>
              </div>
            </section>

            {/* Quick Recent & Pinned Strip */}
            {(recentTools.length > 0 || favoriteTools.length > 0) && (
              <section className="space-y-2">
                <h2 className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" /> {isRtl ? 'دسترسی سریع (اخیر و برگزیده‌ها)' : 'Quick Access (Recent & Starred)'}
                </h2>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {[...favoriteTools.slice(0, 6), ...recentTools.slice(0, 6)]
                    .filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i)
                    .map((t) => (
                      <button
                        key={t.id}
                        onClick={() => openTool(t)}
                        className="shrink-0 glass-card rounded-xl px-3 py-2 text-xs font-semibold hover:border-cyan-400/50 flex items-center gap-2 transition"
                      >
                        <Star className={`w-3.5 h-3.5 ${favorites.includes(t.id) ? 'fill-amber-400 text-amber-400' : 'text-slate-500'}`} />
                        <span>{isRtl ? t.nameFa : t.nameEn}</span>
                      </button>
                    ))}
                </div>
              </section>
            )}

            {/* 30-Category Premium Bento Grid */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-extrabold text-sm sm:text-base">{isRtl ? 'همه ۳۰ دسته‌بندی جامع ابزارها' : 'All 30 Tool Categories'}</h2>
                <button onClick={() => setView('all')} className="text-xs text-cyan-400 hover:underline">
                  {isRtl ? `مشاهده فهرست کامل (${ALL_TOOLS.length} ابزار)` : `Browse All ${ALL_TOOLS.length} Tools`}
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {CATEGORIES.map((cat) => {
                  const count = getToolsByCategory(cat.id).length;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => openCategory(cat)}
                      className="group glass-card rounded-2xl p-3.5 text-right hover:scale-[1.02] hover:border-cyan-400/40 transition-all duration-200 flex flex-col justify-between gap-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center text-white shadow-lg`}>
                          <CategoryIcon name={cat.icon} className="w-5 h-5" />
                        </div>
                        <span className="rounded-lg bg-white/5 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                          {count} {isRtl ? 'ابزار' : ''}
                        </span>
                      </div>
                      <div>
                        <div className="font-bold text-xs sm:text-sm group-hover:text-cyan-300 transition">{isRtl ? cat.nameFa : cat.nameEn}</div>
                        <div className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">{isRtl ? cat.descriptionFa : cat.descriptionEn}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {/* CATEGORIES LIST VIEW */}
        {!searchQuery && view === 'categories' && (
          <section className="space-y-3">
            <h2 className="font-extrabold text-base">{isRtl ? 'مرورگر ۳۰ دسته‌بندی اصلی' : 'All 30 Categories'}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {CATEGORIES.map((cat) => {
                const tools = getToolsByCategory(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => openCategory(cat)}
                    className="glass-card rounded-2xl p-4 text-right hover:border-cyan-400/40 transition flex items-center gap-3.5"
                  >
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center text-white shrink-0`}>
                      <CategoryIcon name={cat.icon} className="w-6 h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-sm truncate">{isRtl ? cat.nameFa : cat.nameEn}</span>
                        <span className="text-[11px] font-mono text-cyan-400 shrink-0">{tools.length}</span>
                      </div>
                      <div className="text-xs text-slate-400 truncate mt-0.5">{isRtl ? cat.descriptionFa : cat.descriptionEn}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* ALL 995+ TOOLS DIRECTORY VIEW */}
        {!searchQuery && view === 'all' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-base">{isRtl ? `فهرست کامل همه ${ALL_TOOLS.length} ابزار` : `Complete Directory (${ALL_TOOLS.length} Tools)`}</h2>
              <button onClick={() => setView('home')} className="omni-btn omni-btn-secondary text-xs">{isRtl ? 'بازگشت به خانه' : 'Home'}</button>
            </div>
            {CATEGORIES.map((cat) => {
              const tools = getToolsByCategory(cat.id);
              return (
                <div key={cat.id} className="glass-card rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-7 h-7 rounded-lg bg-gradient-to-br ${cat.gradient} flex items-center justify-center text-white`}>
                        <CategoryIcon name={cat.icon} className="w-4 h-4" />
                      </span>
                      <h3 className="font-bold text-sm">{isRtl ? cat.nameFa : cat.nameEn}</h3>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">{tools.length} ابزار</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
                    {tools.map((t) => (
                      <button key={t.id} onClick={() => openTool(t)} className="rounded-xl bg-slate-900/70 hover:bg-slate-800 px-2.5 py-2 text-right text-xs truncate transition">
                        {isRtl ? t.nameFa : t.nameEn}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* FAVORITES & RECENT VIEW */}
        {!searchQuery && view === 'favorites' && (
          <section className="space-y-4">
            <div className="glass-card rounded-2xl p-4 space-y-3">
              <h2 className="font-bold text-sm flex items-center gap-2"><Star className="w-4 h-4 text-amber-400 fill-amber-400" /> {isRtl ? `ابزارهای برگزیده (${favoriteTools.length})` : `Starred Tools (${favoriteTools.length})`}</h2>
              {favoriteTools.length === 0 ? (
                <div className="text-xs text-slate-400 py-4 text-center">هنوز ابزاری را ستاره‌دار نکرده‌اید. روی ستاره کنار هر ابزار کلیک کنید!</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {favoriteTools.map((t) => (
                    <button key={t.id} onClick={() => openTool(t)} className="rounded-xl bg-slate-900/80 hover:bg-slate-800 p-3 text-right flex justify-between items-center">
                      <div><div className="font-bold text-xs">{isRtl ? t.nameFa : t.nameEn}</div><div className="text-[11px] text-slate-400">{t.descriptionFa}</div></div>
                      <Star onClick={(e) => toggleFavorite(t.id, e)} className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            {recentTools.length > 0 && (
              <div className="glass-card rounded-2xl p-4 space-y-3">
                <h2 className="font-bold text-sm flex items-center gap-2"><Clock className="w-4 h-4 text-cyan-400" /> {isRtl ? 'ابزارهای اخیر' : 'Recently Used'}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {recentTools.map((t) => (
                    <button key={t.id} onClick={() => openTool(t)} className="rounded-xl bg-slate-900/70 hover:bg-slate-800 p-2.5 text-right text-xs font-semibold truncate">
                      {isRtl ? t.nameFa : t.nameEn}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* SINGLE CATEGORY DETAIL VIEW */}
        {!searchQuery && view === 'category' && activeCategory && (
          <section className="space-y-4">
            <div className={`rounded-3xl p-5 bg-gradient-to-br ${activeCategory.gradient} text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
              <div className="flex items-center gap-3">
                <button onClick={() => setView('home')} className="rounded-xl bg-black/25 hover:bg-black/40 p-2">
                  {isRtl ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                </button>
                <div>
                  <h1 className="text-lg sm:text-xl font-black">{isRtl ? activeCategory.nameFa : activeCategory.nameEn}</h1>
                  <p className="text-xs text-white/85">{isRtl ? activeCategory.descriptionFa : activeCategory.descriptionEn} ({getToolsByCategory(activeCategory.id).length} ابزار فعال)</p>
                </div>
              </div>
              <input
                value={catFilterQuery}
                onChange={(e) => setCatFilterQuery(e.target.value)}
                placeholder={isRtl ? 'فیلتر ابزارهای این دسته...' : 'Filter in category...'}
                className="rounded-xl bg-black/25 border border-white/25 px-3 py-2 text-xs text-white placeholder:text-white/70 outline-none sm:w-64"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {getToolsByCategory(activeCategory.id)
                .filter((t) => `${t.nameFa} ${t.nameEn} ${t.descriptionFa} ${t.tags.join(' ')}`.toLowerCase().includes(catFilterQuery.toLowerCase()))
                .map((t) => (
                  <button
                    key={t.id}
                    onClick={() => openTool(t)}
                    className="glass-card rounded-2xl p-3.5 text-right hover:border-cyan-400/50 hover:bg-slate-800/70 transition flex items-start justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-xs sm:text-sm">{isRtl ? t.nameFa : t.nameEn}</div>
                      <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">{t.descriptionFa}</div>
                      <div className="flex gap-1.5 mt-2">
                        {t.badge && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                            {t.badge}
                          </span>
                        )}
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 font-mono truncate">{t.nameEn}</span>
                      </div>
                    </div>
                    <Star
                      onClick={(e) => toggleFavorite(t.id, e)}
                      className={`w-4 h-4 shrink-0 mt-0.5 ${favorites.includes(t.id) ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`}
                    />
                  </button>
                ))}
            </div>
          </section>
        )}

        {/* ACTIVE TOOL ENGINE WORKBENCH VIEW */}
        {!searchQuery && view === 'tool' && activeTool && activeCategory && (
          <section className="space-y-4">
            <div className="glass-card rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  onClick={() => setView('category')}
                  className="omni-btn omni-btn-secondary !px-2.5 !py-2 shrink-0"
                  title="بازگشت"
                >
                  {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="font-black text-sm sm:text-base truncate">{isRtl ? activeTool.nameFa : activeTool.nameEn}</h1>
                    <span className="text-[10px] rounded-md bg-cyan-500/15 text-cyan-300 px-2 py-0.5 font-mono">{activeTool.nameEn}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">{activeTool.descriptionFa}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={(e) => toggleFavorite(activeTool.id, e)} className="omni-btn omni-btn-secondary text-xs !py-1.5">
                  <Star className={`w-4 h-4 ${favorites.includes(activeTool.id) ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
                  <span>{isRtl ? 'برگزیده' : 'Star'}</span>
                </button>
              </div>
            </div>

            {/* Dedicated Category Engine */}
            <EngineRouter
              tool={activeTool}
              category={activeCategory}
              lang={settings.language}
              settings={settings}
              onUpdateSettings={updateSettings}
              onToast={showToast}
              onSelectTool={(id) => {
                const target = TOOL_MAP[id];
                if (target) openTool(target);
              }}
            />

            {/* Quick Sibling Tools Switcher */}
            <div className="glass-card rounded-2xl p-3 space-y-2">
              <div className="text-[11px] font-bold text-slate-400">
                {isRtl ? `سایر ابزارهای دسته «${activeCategory.nameFa}»:` : `More in ${activeCategory.nameEn}:`}
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {getToolsByCategory(activeCategory.id).slice(0, 20).map((sib) => (
                  <button
                    key={sib.id}
                    onClick={() => openTool(sib)}
                    className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition ${
                      sib.id === activeTool.id ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {isRtl ? sib.nameFa : sib.nameEn}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Native Android Style Bottom Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-40 glass-card border-t border-white/10 px-2 py-1.5 safe-pb">
        <div className="max-w-xl mx-auto grid grid-cols-5 gap-1">
          {[
            { id: 'home', icon: Home, label: isRtl ? 'خانه' : 'Home', action: () => { setSearchQuery(''); setView('home'); } },
            { id: 'categories', icon: LayoutGrid, label: isRtl ? 'دسته‌ها' : 'Cats', action: () => { setSearchQuery(''); setView('categories'); } },
            { id: 'ai', icon: Sparkles, label: isRtl ? 'هوش مصنوعی' : 'AI', action: () => { setSearchQuery(''); openTool(getToolsByCategory('ai')[0]); } },
            { id: 'favorites', icon: Star, label: isRtl ? 'برگزیده' : 'Saved', action: () => { setSearchQuery(''); setView('favorites'); } },
            { id: 'settings', icon: Settings, label: isRtl ? 'تنظیمات' : 'OS', action: () => { setSearchQuery(''); openTool(getToolsByCategory('platform')[0]); } },
          ].map((nav) => {
            const Icon = nav.icon;
            const active = (nav.id === view) || (nav.id === 'ai' && activeTool?.categoryId === 'ai' && view === 'tool') || (nav.id === 'settings' && activeTool?.categoryId === 'platform' && view === 'tool');
            return (
              <button
                key={nav.id}
                onClick={nav.action}
                className={`flex flex-col items-center justify-center py-1 rounded-xl transition ${active ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-400 hover:text-white'}`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-semibold mt-0.5">{nav.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-20 start-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-bold border backdrop-blur-xl bg-slate-900/95 border-cyan-400/50 text-white">
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default App;
