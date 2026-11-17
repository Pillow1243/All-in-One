import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { AppSettings, CategoryMeta, ToolItem } from './types';
import { ALL_TOOLS, CATEGORIES, CATEGORY_MAP, TOOL_MAP, getToolsByCategory } from './data/catalog';
import { PUBLIC_APIS_DIRECTORY } from './data/publicApisData';
import { APP_NAME, APP_VERSION } from './data/changelog';
import { loadData, loadSettings, logToolUsage, saveData, saveSettings } from './services/storage';
import { shareContent, vibrateDevice } from './services/nativeBridge';
import { CategoryIcon } from './components/CategoryIcon';
import { ColorBlindFilters } from './components/ColorBlindFilters';
import { EngineRouter } from './components/EngineRouter';
import { CommandPalette } from './components/CommandPalette';
import { WhatsNew } from './components/WhatsNew';
import {
  ArrowUp, Check, ChevronLeft, ChevronRight, Clock, Command, Globe, Grid2X2,
  Home, Info, Lock, Moon, Search, Settings, Share2, ShieldCheck,
  Star, Sun, Wifi, WifiOff, Wrench, X,
} from 'lucide-react';

type NavView = 'home' | 'categories' | 'all' | 'favorites' | 'category' | 'tool';

interface Route {
  view: NavView;
  id?: string;
}

const parseHash = (): Route => {
  const raw = window.location.hash.replace(/^#\/?/, '');
  if (!raw) return { view: 'home' };
  const [view, ...rest] = raw.split('/');
  const id = rest.join('/');
  if (view === 'tool' && TOOL_MAP[id]) return { view: 'tool', id };
  if (view === 'category' && CATEGORY_MAP[id]) return { view: 'category', id };
  if (view === 'all' || view === 'favorites' || view === 'categories') return { view };
  return { view: 'home' };
};

export const App: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [favorites, setFavorites] = useState<string[]>(() => loadData<string[]>('favorites', ['ai-chatbot', 'pdf-merge', 'smart-words']));
  const [recentIds, setRecentIds] = useState<string[]>(() => loadData<string[]>('recents', []));
  const [route, setRoute] = useState<Route>(() => parseHash());
  const [searchQuery, setSearchQuery] = useState('');
  const [catFilterQuery, setCatFilterQuery] = useState('');
  const [online, setOnline] = useState(() => navigator.onLine);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(() => loadData<string>('seenVersion', '') !== APP_VERSION);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [locked, setLocked] = useState(() => {
    const s = loadSettings();
    return Boolean(s.appLockEnabled && s.appLockPin);
  });
  const [pinEntry, setPinEntry] = useState('');

  const isRtl = settings.language === 'fa' || settings.language === 'ar';
  const activeTool = route.view === 'tool' && route.id ? TOOL_MAP[route.id] : null;
  const activeCategory = activeTool
    ? CATEGORY_MAP[activeTool.categoryId]
    : route.view === 'category' && route.id
      ? CATEGORY_MAP[route.id]
      : null;

  /* ── theme & document level settings ───────────────────────── */
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
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#FFD400');
    saveSettings(settings);
  }, [settings, isRtl]);

  // Yellow safety-color system chrome; keep dark foreground glyphs for legibility.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    void StatusBar.setStyle({ style: Style.Light }).catch(() => {});
    void StatusBar.setBackgroundColor({ color: '#FFD400' }).catch(() => {});
  }, []);

  /* ── routing ───────────────────────────────────────────────── */
  useEffect(() => {
    const onHash = () => {
      setRoute(parseHash());
      setSearchQuery('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = useCallback((hash: string) => {
    if (window.location.hash === hash) {
      setRoute(parseHash());
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    window.location.hash = hash;
  }, []);

  /* ── network + scroll listeners ────────────────────────────── */
  useEffect(() => {
    const onOn = () => setOnline(true);
    const onOff = () => setOnline(false);
    const onScroll = () => setShowScrollTop(window.scrollY > 640);
    window.addEventListener('online', onOn);
    window.addEventListener('offline', onOff);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('online', onOn);
      window.removeEventListener('offline', onOff);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  /* ── keyboard shortcuts ────────────────────────────────────── */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes((event.target as HTMLElement)?.tagName);
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen(true);
      } else if (event.key === '/' && !typing) {
        event.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ msg, type });
    window.setTimeout(() => setToast((current) => (current?.msg === msg ? null : current)), 3000);
  }, []);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const openTool = useCallback((tool: ToolItem) => {
    if (settings.hapticsEnabled) vibrateDevice([12]);
    logToolUsage(tool.id, tool.categoryId);
    setRecentIds((prev) => {
      const next = [tool.id, ...prev.filter((id) => id !== tool.id)].slice(0, 24);
      saveData('recents', next);
      return next;
    });
    navigate(`#/tool/${tool.id}`);
  }, [settings.hapticsEnabled, navigate]);

  const openCategory = useCallback((category: CategoryMeta) => {
    if (settings.hapticsEnabled) vibrateDevice([10]);
    setCatFilterQuery('');
    navigate(`#/category/${category.id}`);
  }, [settings.hapticsEnabled, navigate]);

  const toggleFavorite = (toolId: string, event?: React.MouseEvent) => {
    event?.stopPropagation();
    const exists = favorites.includes(toolId);
    const next = exists ? favorites.filter((id) => id !== toolId) : [toolId, ...favorites];
    setFavorites(next);
    saveData('favorites', next);
    showToast(exists ? (isRtl ? 'از فهرست منتخب‌ها حذف شد' : 'Removed from pinned list') : (isRtl ? 'به فهرست منتخب‌ها افزوده شد' : 'Added to pinned list'), 'success');
  };

  const shareTool = async (tool: ToolItem) => {
    const url = `${window.location.origin}${window.location.pathname}#/tool/${tool.id}`;
    const shared = await shareContent(`${APP_NAME} — ${tool.nameEn}`, `${tool.nameFa} · ${APP_NAME}`, url);
    if (!shared) showToast(isRtl ? 'اشتراک‌گذاری در دسترس نیست' : 'Sharing unavailable', 'error');
  };

  const closeWhatsNew = (tour: boolean) => {
    saveData('seenVersion', APP_VERSION);
    setShowWhatsNew(false);
    if (tour) {
      navigate('#/category/workshop');
      showToast(isRtl ? 'دسته کارگاه صنعتی باز شد' : 'Industrial Workshop opened', 'info');
    }
  };

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    return ALL_TOOLS.filter((tool) =>
      tool.nameFa.toLowerCase().includes(query) ||
      tool.nameEn.toLowerCase().includes(query) ||
      tool.descriptionFa.toLowerCase().includes(query) ||
      tool.tags.some((tag) => tag.includes(query)),
    ).slice(0, 60);
  }, [searchQuery]);

  const favoriteTools = useMemo(
    () => favorites.map((id) => TOOL_MAP[id]).filter(Boolean) as ToolItem[],
    [favorites],
  );
  const recentTools = useMemo(
    () => recentIds.map((id) => TOOL_MAP[id]).filter(Boolean) as ToolItem[],
    [recentIds],
  );

  /* ── App Lock ──────────────────────────────────────────────── */
  if (locked && settings.appLockEnabled && settings.appLockPin) {
    const unlock = () => {
      if (pinEntry === settings.appLockPin) {
        setLocked(false);
        setPinEntry('');
      } else showToast(isRtl ? 'پین‌کد اشتباه است' : 'Wrong PIN', 'error');
    };
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass-card rounded-3xl p-7 max-w-sm w-full text-center space-y-4 animate-pop">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/25 to-violet-500/25 border border-cyan-400/30 flex items-center justify-center">
            <Lock className="w-7 h-7 text-cyan-300" />
          </div>
          <h1 className="text-lg font-black">{isRtl ? `${APP_NAME} قفل است` : `${APP_NAME} is locked`}</h1>
          <p className="text-[11px] text-slate-400">{isRtl ? 'برای ادامه پین‌کد امنیتی را وارد کنید' : 'Enter your PIN to continue'}</p>
          <input
            type="password"
            inputMode="numeric"
            autoFocus
            value={pinEntry}
            onChange={(event) => setPinEntry(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && unlock()}
            placeholder={isRtl ? 'پین‌کد...' : 'PIN…'}
            className="omni-input text-center font-mono text-xl tracking-[0.4em]"
          />
          <button onClick={unlock} className="omni-btn omni-btn-primary w-full">
            {isRtl ? 'باز کردن قفل' : 'Unlock'}
          </button>
        </div>
      </div>
    );
  }

  const NavButton: React.FC<{ id: string; icon: React.ComponentType<{ className?: string }>; label: string; action: () => void; primary?: boolean }> = ({
    id, icon: Icon, label, action, primary,
  }) => {
    const active = route.view === id || (id === 'ai' && activeTool?.categoryId === 'ai') || (id === 'settings' && activeTool?.categoryId === 'platform');
    return (
      <button
        onClick={action}
        aria-label={label}
        className={`relative flex flex-col items-center justify-center gap-0.5 rounded-2xl py-1.5 transition ${
          primary
            ? '-mt-6 w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 text-white shadow-lg shadow-cyan-500/30'
            : active
              ? 'text-cyan-300 bg-cyan-500/10'
              : 'text-slate-400 hover:text-white'
        }`}
      >
        <Icon className={primary ? 'w-6 h-6' : 'w-5 h-5'} />
        {!primary && <span className="text-[9.5px] font-bold">{label}</span>}
        {active && !primary && <span className="absolute -top-1 h-1 w-6 rounded-full bg-cyan-400" />}
      </button>
    );
  };

  return (
    <div className="min-h-screen pb-28">
      <ColorBlindFilters />

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="app-header sticky top-0 z-40 border-b border-white/10 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-2.5 sm:px-6">
          <button onClick={() => navigate('#/home')} className="flex shrink-0 items-center gap-2.5" aria-label={APP_NAME}>
            <img src="./icons/icon-192.png" alt={APP_NAME} className="h-9 w-9 rounded-lg border border-amber-300/30" />
            <span className="text-start leading-tight">
              <span className="block text-sm font-black tracking-tight sm:text-base">
                Omni<span className="gradient-text">Forge</span> <span className="align-super font-mono text-[9px] font-bold text-amber-300">3.0</span>
              </span>
              <span className="hidden font-mono text-[9px] tracking-wide text-slate-400 sm:block">
                {CATEGORIES.length} {isRtl ? 'دسته' : 'CATEGORIES'} · {ALL_TOOLS.length} {isRtl ? 'ابزار' : 'TOOLS'}
              </span>
            </span>
          </button>

          <button
            onClick={() => setPaletteOpen(true)}
            className="group flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-start text-xs text-slate-400 transition hover:border-cyan-400/40 hover:text-slate-200"
          >
            <Search className="h-4 w-4 text-slate-500 group-hover:text-cyan-300" />
            <span className="flex-1 truncate">{isRtl ? 'جستجو در مجموعه ابزار…' : 'Search tool index…'}</span>
            <kbd className="hidden items-center gap-0.5 rounded-md border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] sm:inline-flex">
              <Command className="h-2.5 w-2.5" />K
            </kbd>
          </button>

          <div className="flex shrink-0 items-center gap-1.5">
            <span
              title={online ? (isRtl ? 'آنلاین' : 'Online') : (isRtl ? 'آفلاین' : 'Offline')}
              className={`hidden items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold md:flex ${online ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}
            >
              {online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {online ? (isRtl ? 'آنلاین' : 'Online') : (isRtl ? 'آفلاین' : 'Offline')}
            </span>
            <button
              onClick={() => updateSettings({ language: settings.language === 'fa' ? 'en' : 'fa' })}
              className="rounded-lg bg-white/5 p-2 text-slate-300 transition hover:bg-white/10"
              title={isRtl ? 'تغییر زبان' : 'Switch language'}
            >
              <Globe className="h-4 w-4" />
            </button>
            <button
              onClick={() => updateSettings({ theme: settings.theme === 'dark' ? 'oled' : settings.theme === 'oled' ? 'light' : 'dark' })}
              className="rounded-lg bg-white/5 p-2 text-slate-300 transition hover:bg-white/10"
              title={isRtl ? 'تم: تاریک / OLED / روشن' : 'Theme: dark / OLED / light'}
            >
              {settings.theme === 'light' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-300" />}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-5 px-3 pt-4 sm:px-6">
        {/* ── Global search results ─────────────────────────────── */}
        {searchQuery.trim().length > 0 && (
          <section className="glass-card animate-fade-up space-y-3 rounded-3xl border border-cyan-500/30 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-cyan-300">
                {isRtl ? `${searchResults.length} نتیجه برای «${searchQuery}»` : `${searchResults.length} results for “${searchQuery}”`}
              </h2>
              <button onClick={() => setSearchQuery('')} className="text-xs text-slate-400 hover:text-white">
                {isRtl ? 'بستن' : 'Close'}
              </button>
            </div>
            {searchResults.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400">
                {isRtl ? 'ابزاری با این عبارت پیدا نشد. املای دیگری را امتحان کنید.' : 'No tool matched. Try a different spelling.'}
              </div>
            )}
            <div className="grid max-h-[62vh] grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
              {searchResults.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => { setSearchQuery(''); openTool(tool); }}
                  className="flex items-start justify-between gap-2 rounded-2xl border border-white/5 bg-slate-900/70 p-3 text-start transition hover:border-cyan-400/40 hover:bg-slate-800/80"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-bold sm:text-sm">{isRtl ? tool.nameFa : tool.nameEn}</span>
                    <span className="mt-0.5 block truncate text-[11px] text-slate-400">{tool.descriptionFa}</span>
                  </span>
                  <Star
                    onClick={(event) => toggleFavorite(tool.id, event)}
                    className={`h-4 w-4 shrink-0 ${favorites.includes(tool.id) ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`}
                  />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── HOME ──────────────────────────────────────────────── */}
        {!searchQuery && route.view === 'home' && (
          <>
            <section className="anvil-hero p-4 sm:p-7">
              <div className="anvil-hero-content flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl space-y-4">
                  <div className="anvil-stamp">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    OMNIFORGE / ANVIL SYSTEMS / BUILD 03
                  </div>
                  <div>
                    <p className="font-mono text-[9px] tracking-[0.16em] text-slate-500">TOOL CONTROL CENTER <span className="text-amber-300">·</span> {APP_VERSION}</p>
                    <h1 className="anvil-hero-title mt-2 text-2xl font-black leading-tight sm:text-[2rem]">
                      {isRtl ? 'جعبه‌ابزار دیجیتال. بدون حاشیه.' : 'Digital tool chest. No surplus.'}
                    </h1>
                  </div>
                  <p className="max-w-xl text-xs leading-relaxed text-slate-300 sm:text-sm">
                    {isRtl
                      ? `مجموعه‌ای از ${ALL_TOOLS.length} ابزار عملیاتی در ${CATEGORIES.length} دسته؛ برای پردازش فایل، محاسبات، عیب‌یابی و گردش‌کارهای روزمره. ابزارهای محلی روی همین دستگاه اجرا می‌شوند.`
                      : `${ALL_TOOLS.length} operational tools across ${CATEGORIES.length} categories for file work, calculations, diagnostics and daily workflows. Local tools run on this device.`}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button onClick={() => setPaletteOpen(true)} className="omni-btn omni-btn-primary text-xs">
                      <Search className="h-4 w-4" /> {isRtl ? 'پالت ابزار (Ctrl+K)' : 'Tool palette (Ctrl+K)'}
                    </button>
                    <button onClick={() => openCategory(CATEGORY_MAP.workshop)} className="omni-btn omni-btn-secondary text-xs">
                      <Wrench className="h-4 w-4 text-amber-300" /> {isRtl ? 'کارگاه صنعتی' : 'Industrial Workshop'}
                    </button>
                    <button onClick={() => setShowWhatsNew(true)} className="omni-btn omni-btn-secondary text-xs">
                      <Info className="h-4 w-4 text-amber-300" /> {isRtl ? 'یادداشت نسخه ۳.۰' : 'Release record 3.0'}
                    </button>
                  </div>
                </div>

                <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
                  {[
                    { value: CATEGORIES.length, label: isRtl ? 'دسته' : 'CATEGORIES' },
                    { value: ALL_TOOLS.length, label: isRtl ? 'ابزار' : 'TOOLS' },
                    { value: PUBLIC_APIS_DIRECTORY.length, label: isRtl ? 'فهرست API' : 'API INDEX' },
                    { value: 'LOCAL', label: isRtl ? 'پردازش' : 'EXECUTION' },
                  ].map((stat) => (
                    <div key={stat.label} className="anvil-readout">
                      <div className="anvil-readout-value">{stat.value}</div>
                      <div className="anvil-readout-label">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {(recentTools.length > 0 || favoriteTools.length > 0) && (
              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                    <Clock className="h-3.5 w-3.5 text-amber-300" /> {isRtl ? 'دسترسی‌های اخیر و منتخب' : 'RECENT & PINNED TOOLS'}
                  </h2>
                  <button onClick={() => navigate('#/favorites')} className="text-[11px] text-cyan-400 hover:underline">
                    {isRtl ? 'فهرست منتخب‌ها' : 'PINNED INDEX'}
                  </button>
                </div>
                <div className="omni-scroll flex gap-2 overflow-x-auto pb-1">
                  {[...favoriteTools.slice(0, 5), ...recentTools.slice(0, 8)]
                    .filter((tool, index, array) => array.findIndex((candidate) => candidate.id === tool.id) === index)
                    .map((tool) => (
                      <button
                        key={tool.id}
                        onClick={() => openTool(tool)}
                        className="glass-card flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition hover:border-cyan-400/50"
                      >
                        <Star className={`h-3.5 w-3.5 ${favorites.includes(tool.id) ? 'fill-amber-400 text-amber-400' : 'text-slate-500'}`} />
                        <span className="max-w-[9rem] truncate">{isRtl ? tool.nameFa : tool.nameEn}</span>
                      </button>
                    ))}
                </div>
              </section>
            )}

            <section className="space-y-3">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-sm font-extrabold sm:text-base">{isRtl ? `همه ${CATEGORIES.length} دسته‌بندی` : `All ${CATEGORIES.length} categories`}</h2>
                  <p className="font-mono text-[9px] tracking-wide text-slate-400">{isRtl ? 'فهرست ماژول‌ها · انتخاب دسته برای مشاهده ابزارها' : 'MODULE INDEX · SELECT A CATEGORY TO VIEW TOOLS'}</p>
                </div>
                <button onClick={() => navigate('#/all')} className="text-xs text-cyan-400 hover:underline">
                  {isRtl ? `فهرست کامل ${ALL_TOOLS.length} ابزار` : `All ${ALL_TOOLS.length} tools`}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {CATEGORIES.map((category) => {
                  const count = getToolsByCategory(category.id).length;
                  return (
                    <button
                      key={category.id}
                      onClick={() => openCategory(category)}
                      className="group glass-card flex flex-col justify-between gap-3 rounded-2xl p-3.5 text-start transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-400/40"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="anvil-icon-block">
                          <CategoryIcon name={category.icon} className="h-5 w-5" />
                        </div>
                        {category.id === 'workshop' && (
                          <span className="rounded-sm border border-amber-400/40 bg-amber-300/10 px-1.5 py-0.5 font-mono text-[8px] font-black tracking-widest text-amber-300">ANVIL</span>
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold transition group-hover:text-cyan-300 sm:text-sm">
                          {isRtl ? category.nameFa : category.nameEn}
                        </div>
                        <div className="mt-0.5 line-clamp-2 text-[10px] leading-relaxed text-slate-400">
                          {isRtl ? category.descriptionFa : category.descriptionEn}
                        </div>
                        <div className="mt-2 text-[10px] font-mono text-slate-500">{count} {isRtl ? 'ابزار' : 'tools'}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="glass-card flex flex-col items-center justify-between gap-3 rounded-2xl p-4 text-center sm:flex-row sm:text-start">
              <div className="flex items-center gap-3">
                <img src="./icons/icon-192.png" alt="" className="h-10 w-10 rounded-xl" />
                <div>
                  <div className="text-xs font-bold">{APP_NAME} v{APP_VERSION}</div>
                  <div className="text-[10px] text-slate-400">
                    {isRtl ? 'متن‌باز · پردازش محلی · رابط فارسی' : 'OPEN SOURCE · LOCAL PROCESSING · PERSIAN UI'}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => navigate('#/category/platform')} className="chip">
                  <Info className="h-3 w-3" /> {isRtl ? 'درباره و تنظیمات' : 'About & settings'}
                </button>
                <button onClick={() => setShowWhatsNew(true)} className="chip">
                  <Info className="h-3 w-3" /> {isRtl ? 'یادداشت نسخه' : 'Release notes'}
                </button>
              </div>
            </section>
          </>
        )}

        {/* ── CATEGORIES ────────────────────────────────────────── */}
        {!searchQuery && route.view === 'categories' && (
          <section className="space-y-3">
            <h2 className="text-base font-extrabold">{isRtl ? `${CATEGORIES.length} دسته‌بندی` : `${CATEGORIES.length} categories`}</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {CATEGORIES.map((category) => {
                const tools = getToolsByCategory(category.id);
                return (
                  <button
                    key={category.id}
                    onClick={() => openCategory(category)}
                    className="glass-card flex items-center gap-3.5 rounded-2xl p-4 text-start transition hover:border-cyan-400/40"
                  >
                    <div className="anvil-icon-block h-12 w-12 shrink-0">
                      <CategoryIcon name={category.icon} className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-bold">{isRtl ? category.nameFa : category.nameEn}</span>
                        <span className="shrink-0 font-mono text-[11px] text-cyan-400">{tools.length}</span>
                      </div>
                      <div className="mt-0.5 truncate text-xs text-slate-400">{isRtl ? category.descriptionFa : category.descriptionEn}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* ── ALL TOOLS ─────────────────────────────────────────── */}
        {!searchQuery && route.view === 'all' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold">{isRtl ? `${ALL_TOOLS.length} ابزار` : `All ${ALL_TOOLS.length} tools`}</h2>
              <button onClick={() => navigate('#/home')} className="omni-btn omni-btn-secondary text-xs">{isRtl ? 'خانه' : 'Home'}</button>
            </div>
            {CATEGORIES.map((category) => {
              const tools = getToolsByCategory(category.id);
              return (
                <div key={category.id} className="glass-card space-y-2.5 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="anvil-icon-block !h-7 !w-7 !rounded-lg">
                        <CategoryIcon name={category.icon} className="h-4 w-4" />
                      </span>
                      <h3 className="text-sm font-bold">{isRtl ? category.nameFa : category.nameEn}</h3>
                    </div>
                    <span className="font-mono text-xs text-slate-400">{tools.length}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
                    {tools.map((tool) => (
                      <button key={tool.id} onClick={() => openTool(tool)} className="truncate rounded-xl bg-slate-900/70 px-2.5 py-2 text-start text-xs transition hover:bg-slate-800">
                        {isRtl ? tool.nameFa : tool.nameEn}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* ── FAVORITES ─────────────────────────────────────────── */}
        {!searchQuery && route.view === 'favorites' && (
          <section className="space-y-4">
            <div className="glass-card space-y-3 rounded-2xl p-4">
              <h2 className="flex items-center gap-2 text-sm font-bold">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {isRtl ? `برگزیده‌ها (${favoriteTools.length})` : `Starred (${favoriteTools.length})`}
              </h2>
              {favoriteTools.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  {isRtl ? 'هنوز چیزی ستاره نکرده‌اید. کنار هر ابزار ستاره را بزنید.' : 'Nothing starred yet — tap the star on any tool.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {favoriteTools.map((tool) => (
                    <button key={tool.id} onClick={() => openTool(tool)} className="flex items-center justify-between rounded-xl bg-slate-900/80 p-3 text-start transition hover:bg-slate-800">
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-bold">{isRtl ? tool.nameFa : tool.nameEn}</span>
                        <span className="block truncate text-[11px] text-slate-400">{tool.descriptionFa}</span>
                      </span>
                      <Star onClick={(event) => toggleFavorite(tool.id, event)} className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            {recentTools.length > 0 && (
              <div className="glass-card space-y-3 rounded-2xl p-4">
                <h2 className="flex items-center gap-2 text-sm font-bold">
                  <Clock className="h-4 w-4 text-cyan-400" /> {isRtl ? 'اخیر' : 'Recent'}
                </h2>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {recentTools.map((tool) => (
                    <button key={tool.id} onClick={() => openTool(tool)} className="truncate rounded-xl bg-slate-900/70 p-2.5 text-start text-xs font-semibold transition hover:bg-slate-800">
                      {isRtl ? tool.nameFa : tool.nameEn}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── CATEGORY DETAIL ───────────────────────────────────── */}
        {!searchQuery && route.view === 'category' && activeCategory && (
          <section className="space-y-4">
            <div className={`anvil-category-hero relative overflow-hidden bg-gradient-to-br ${activeCategory.gradient} p-5 text-white shadow-xl`}>
              <div className="relative flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <button onClick={() => navigate('#/home')} className="rounded-xl bg-black/25 p-2 transition hover:bg-black/40" aria-label={isRtl ? 'بازگشت' : 'Back'}>
                    {isRtl ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                  </button>
                  <div>
                    <h1 className="text-lg font-black sm:text-xl">{isRtl ? activeCategory.nameFa : activeCategory.nameEn}</h1>
                    <p className="text-xs text-white/85">
                      {isRtl ? activeCategory.descriptionFa : activeCategory.descriptionEn} · {getToolsByCategory(activeCategory.id).length} {isRtl ? 'ابزار' : 'tools'}
                    </p>
                  </div>
                </div>
                <input
                  value={catFilterQuery}
                  onChange={(event) => setCatFilterQuery(event.target.value)}
                  placeholder={isRtl ? 'فیلتر در این دسته…' : 'Filter in category…'}
                  className="rounded-xl border border-white/25 bg-black/25 px-3 py-2 text-xs text-white outline-none placeholder:text-white/70 sm:w-64"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {getToolsByCategory(activeCategory.id)
                .filter((tool) => `${tool.nameFa} ${tool.nameEn} ${tool.descriptionFa} ${tool.tags.join(' ')}`.toLowerCase().includes(catFilterQuery.toLowerCase()))
                .map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => openTool(tool)}
                    className="glass-card flex items-start justify-between gap-2 rounded-2xl p-3.5 text-start transition hover:border-cyan-400/50 hover:bg-slate-800/70"
                  >
                    <span className="min-w-0">
                      <span className="block text-xs font-bold sm:text-sm">{isRtl ? tool.nameFa : tool.nameEn}</span>
                      <span className="mt-1 line-clamp-2 block text-[11px] text-slate-400">{tool.descriptionFa}</span>
                      <span className="mt-2 flex flex-wrap gap-1.5">
                        {tool.badge && <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-bold text-cyan-300">{tool.badge}</span>}
                        <span className="truncate rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">{tool.nameEn}</span>
                      </span>
                    </span>
                    <Star
                      onClick={(event) => toggleFavorite(tool.id, event)}
                      className={`mt-0.5 h-4 w-4 shrink-0 ${favorites.includes(tool.id) ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`}
                    />
                  </button>
                ))}
            </div>
          </section>
        )}

        {/* ── TOOL WORKBENCH ────────────────────────────────────── */}
        {!searchQuery && route.view === 'tool' && activeTool && activeCategory && (
          <section className="space-y-4">
            <div className="glass-card flex flex-wrap items-center justify-between gap-3 rounded-2xl p-3.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <button
                  onClick={() => navigate(`#/category/${activeCategory.id}`)}
                  className="omni-btn omni-btn-secondary shrink-0 !px-2.5 !py-2"
                  aria-label={isRtl ? 'بازگشت' : 'Back'}
                >
                  {isRtl ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </button>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="truncate text-sm font-black sm:text-base">{isRtl ? activeTool.nameFa : activeTool.nameEn}</h1>
                    <span className="rounded-md bg-cyan-500/15 px-2 py-0.5 font-mono text-[10px] text-cyan-300">{activeTool.nameEn}</span>
                  </div>
                  <button onClick={() => navigate(`#/category/${activeCategory.id}`)} className="text-[11px] text-slate-400 hover:text-cyan-300">
                    {isRtl ? activeCategory.nameFa : activeCategory.nameEn}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => shareTool(activeTool)} className="omni-btn omni-btn-secondary !py-1.5 text-xs" title={isRtl ? 'اشتراک‌گذاری' : 'Share'}>
                  <Share2 className="h-4 w-4" />
                </button>
                <button onClick={(event) => toggleFavorite(activeTool.id, event)} className="omni-btn omni-btn-secondary !py-1.5 text-xs">
                  <Star className={`h-4 w-4 ${favorites.includes(activeTool.id) ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
                  <span>{isRtl ? 'برگزیده' : 'Star'}</span>
                </button>
              </div>
            </div>

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

            <div className="glass-card space-y-2 rounded-2xl p-3">
              <div className="text-[11px] font-bold text-slate-400">
                {isRtl ? `ابزارهای دیگر «${activeCategory.nameFa}»` : `More in ${activeCategory.nameEn}`}
              </div>
              <div className="omni-scroll flex gap-1.5 overflow-x-auto pb-1">
                {getToolsByCategory(activeCategory.id).slice(0, 24).map((sibling) => (
                  <button
                    key={sibling.id}
                    onClick={() => openTool(sibling)}
                    className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition ${
                      sibling.id === activeTool.id ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {isRtl ? sibling.nameFa : sibling.nameEn}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ── Scroll to top ───────────────────────────────────────── */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-24 end-4 z-40 rounded-full border border-white/10 bg-slate-900/90 p-2.5 text-slate-300 shadow-xl backdrop-blur transition hover:text-white animate-pop"
          aria-label={isRtl ? 'بازگشت به بالا' : 'Back to top'}
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      )}

      {/* ── Bottom navigation ───────────────────────────────────── */}
      <nav className="app-nav fixed inset-x-0 bottom-0 z-40 border-t border-white/10 px-2 py-1.5 backdrop-blur-xl safe-pb">
        <div className="mx-auto grid max-w-xl grid-cols-5 items-center gap-1">
          <NavButton id="home" icon={Home} label={isRtl ? 'خانه' : 'Home'} action={() => navigate('#/home')} />
          <NavButton id="categories" icon={Grid2X2} label={isRtl ? 'دسته‌ها' : 'Browse'} action={() => navigate('#/categories')} />
          <NavButton id="search" icon={Search} label={isRtl ? 'جستجو' : 'Search'} action={() => setPaletteOpen(true)} primary />
          <NavButton id="favorites" icon={Star} label={isRtl ? 'برگزیده' : 'Saved'} action={() => navigate('#/favorites')} />
          <NavButton id="settings" icon={Settings} label={isRtl ? 'تنظیمات' : 'Settings'} action={() => openTool(getToolsByCategory('platform')[0])} />
        </div>
      </nav>

      {/* ── Overlays ────────────────────────────────────────────── */}
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        tools={ALL_TOOLS}
        categories={CATEGORIES}
        favorites={favorites}
        recents={recentIds}
        isRtl={isRtl}
        onPickTool={openTool}
        onPickCategory={openCategory}
      />

      <WhatsNew
        open={showWhatsNew}
        onClose={() => closeWhatsNew(false)}
        isRtl={isRtl}
        toolCount={ALL_TOOLS.length}
        categoryCount={CATEGORIES.length}
      />

      {toast && (
        <div
          role="status"
          className={`fixed bottom-24 start-1/2 z-[80] flex -translate-x-1/2 items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-bold shadow-2xl backdrop-blur-xl animate-pop ${
            toast.type === 'error'
              ? 'border-rose-400/50 bg-rose-950/90 text-rose-100'
              : toast.type === 'success'
                ? 'border-emerald-400/50 bg-emerald-950/90 text-emerald-100'
                : 'border-cyan-400/50 bg-slate-900/95 text-white'
          }`}
        >
          {toast.type === 'success' ? <Check className="h-4 w-4" /> : toast.type === 'error' ? <X className="h-4 w-4" /> : <Info className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

    </div>
  );
};

export default App;
