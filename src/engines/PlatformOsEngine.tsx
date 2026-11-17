import React, { useEffect, useState } from 'react';
import { AppLanguage, EngineProps } from '../types';
import { PUBLIC_APIS_DIRECTORY } from '../data/publicApisData';
import { ALL_TOOLS, CATEGORIES } from '../data/catalog';
import { fetchLatestAppRelease } from '../services/freeApis';
import { loadData } from '../services/storage';
import { Globe, Plug, BarChart3, RefreshCw, Play, Sparkles } from 'lucide-react';

type PlatTab = 'apis' | 'plugins' | 'analytics' | 'i18n' | 'updates' | 'account' | 'system' | 'sdk' | 'sync';

const LANGUAGES: { code: AppLanguage; label: string; dir: 'rtl' | 'ltr' }[] = [
  { code: 'fa', label: 'فارسی (Persian — RTL)', dir: 'rtl' },
  { code: 'en', label: 'English (LTR)', dir: 'ltr' },
  { code: 'ar', label: 'العربية (Arabic — RTL)', dir: 'rtl' },
  { code: 'tr', label: 'Türkçe (Turkish)', dir: 'ltr' },
  { code: 'de', label: 'Deutsch (German)', dir: 'ltr' },
  { code: 'fr', label: 'Français (French)', dir: 'ltr' },
  { code: 'es', label: 'Español (Spanish)', dir: 'ltr' },
  { code: 'ru', label: 'Русский (Russian)', dir: 'ltr' },
  { code: 'zh', label: '中文 (Chinese)', dir: 'ltr' },
  { code: 'ja', label: '日本語 (Japanese)', dir: 'ltr' },
];

export const PlatformOsEngine: React.FC<EngineProps> = ({ tool, settings, onUpdateSettings, onToast }) => {
  const [tab, setTab] = useState<PlatTab>((tool.mode as PlatTab) || 'apis');
  const [apiSearch, setApiSearch] = useState('');
  const [apiCat, setApiCat] = useState('ALL');
  const [liveApiResp, setLiveApiResp] = useState<{ name: string; json: string } | null>(null);
  const [pluginInput, setPluginInput] = useState('weight=75, height=178');
  const [pluginOut, setPluginOut] = useState('');
  const [releaseInfo, setReleaseInfo] = useState<any>(null);

  useEffect(() => {
    const allowed: PlatTab[] = ['apis', 'plugins', 'analytics', 'i18n', 'updates', 'account', 'system', 'sdk', 'sync'];
    if (allowed.includes(tool.mode as PlatTab)) setTab(tool.mode as PlatTab);
  }, [tool.id, tool.mode]);

  const apiCategories = ['ALL', ...Array.from(new Set(PUBLIC_APIS_DIRECTORY.map((a) => a.category)))];
  const filteredApis = PUBLIC_APIS_DIRECTORY.filter(
    (a) =>
      (apiCat === 'ALL' || a.category === apiCat) &&
      `${a.name} ${a.category} ${a.description}`.toLowerCase().includes(apiSearch.toLowerCase())
  );

  const toolStats = loadData<Record<string, number>>('analytics_tools', {});
  const crashLogs = loadData<{ time: string; level: string; message: string }[]>('crash_logs', []);

  const testPublicApi = async (name: string, endpoint: string) => {
    try {
      const res = await fetch(endpoint);
      const txt = await res.text();
      let pretty = txt;
      try { pretty = JSON.stringify(JSON.parse(txt), null, 2); } catch {}
      setLiveApiResp({ name, json: pretty.slice(0, 1800) });
      onToast(`پاسخ زنده از ${name} دریافت شد!`, 'success');
    } catch {
      onToast('خطا در فراخوانی API (نیاز به اینترنت)', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 overflow-x-auto pb-2">
        {[
          ['apis', `کاوشگر ${PUBLIC_APIS_DIRECTORY.length} API رایگان`],
          ['plugins', 'پلاگین و مارکت‌پلیس'],
          ['i18n', 'زبان‌ها و RTL/LTR'],
          ['analytics', 'آمار و لاگ سیستم'],
          ['updates', 'آپدیت APK گیت‌هاب'],
          ['account', 'حساب و رایگان همیشگی'],
        ].map(([id, lbl]) => (
          <button key={id} onClick={() => setTab(id as PlatTab)} className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold ${tab === id ? 'bg-gradient-to-r from-slate-600 to-cyan-600 text-white' : 'bg-slate-800/70 text-slate-300'}`}>
            {lbl}
          </button>
        ))}
      </div>

      {/* Interactive Public APIs Explorer (extracted from github.com/public-apis/public-apis) */}
      {(tab === 'apis' || tab === 'sdk' || tab === 'system' || tab === 'sync') && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-bold text-sm flex items-center gap-2"><Globe className="w-4 h-4 text-cyan-400" /> دایرکتوری زنده APIهای رایگان (برگرفته از public-apis/public-apis)</h3>
            <span className="text-xs text-emerald-400 font-mono">{filteredApis.length} Zero-Auth HTTPS APIs</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <input className="omni-input flex-1 text-xs" value={apiSearch} onChange={(e) => setApiSearch(e.target.value)} placeholder="جستجوی API (مثلاً Weather, Crypto, Translation, Joke)..." />
            <select className="omni-input !w-44 text-xs" value={apiCat} onChange={(e) => setApiCat(e.target.value)}>
              {apiCategories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {liveApiResp && (
            <div className="rounded-xl bg-slate-950 border border-cyan-500/40 p-3 space-y-1">
              <div className="flex justify-between text-xs text-cyan-400 font-bold"><span>Live JSON: {liveApiResp.name}</span><button onClick={() => setLiveApiResp(null)}>✕</button></div>
              <pre dir="ltr" className="text-[11px] font-mono text-emerald-300 max-h-48 overflow-auto">{liveApiResp.json}</pre>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto text-xs">
            {filteredApis.slice(0, 60).map((api) => (
              <div key={`${api.category}-${api.name}`} className="bg-slate-900/75 p-3 rounded-xl flex flex-col justify-between gap-2">
                <div>
                  <div className="flex justify-between items-center gap-2">
                    <a href={api.url} target="_blank" rel="noreferrer" className="font-bold text-cyan-300 hover:underline">{api.name}</a>
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300">{api.category}</span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-1">{api.description}</p>
                </div>
                {api.sampleEndpoint && (
                  <button onClick={() => testPublicApi(api.name, api.sampleEndpoint!)} className="omni-btn omni-btn-primary text-[11px] py-1.5">
                    <Play className="w-3 h-3" /> تست زنده API
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Plugin System */}
      {tab === 'plugins' && (
        <div className="glass-card rounded-2xl p-4 space-y-3 text-xs">
          <h3 className="font-bold text-sm flex items-center gap-2"><Plug className="w-4 h-4 text-violet-400" /> سیستم پلاگین و اجرای اسکریپت‌های سفارشی</h3>
          <input dir="ltr" className="omni-input font-mono" value={pluginInput} onChange={(e) => setPluginInput(e.target.value)} placeholder="ورودی تست پلاگین" />
          {settings.plugins.map((pl) => (
            <div key={pl.id} className="bg-slate-900/70 p-3 rounded-xl flex items-center justify-between gap-2">
              <div><div className="font-bold">{pl.name} (v{pl.version})</div><div className="text-slate-400">{pl.description}</div></div>
              <button
                onClick={() => {
                  try {
                    const fn = new Function('weight', 'height', 'input', pl.code);
                    const res = fn(75, 178, pluginInput);
                    setPluginOut(JSON.stringify(res, null, 2));
                    onToast(`پلاگین «${pl.name}» با موفقیت اجرا شد`, 'success');
                  } catch (e) { setPluginOut(`Error: ${(e as Error).message}`); }
                }}
                className="omni-btn omni-btn-primary text-xs shrink-0"
              >
                اجرا
              </button>
            </div>
          ))}
          {pluginOut && <pre dir="ltr" className="rounded-xl bg-slate-950 p-3 font-mono text-emerald-300">{pluginOut}</pre>}
        </div>
      )}

      {/* Languages & RTL */}
      {tab === 'i18n' && (
        <div className="glass-card rounded-2xl p-4 space-y-3 text-xs">
          <h3 className="font-bold text-sm">انتخاب زبان رابط کاربری و جهت راست‌به‌چپ (RTL / LTR)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  onUpdateSettings({ language: l.code });
                  onToast(`زبان به ${l.label} تغییر یافت`, 'success');
                }}
                className={`rounded-xl p-2.5 font-semibold ${settings.language === l.code ? 'bg-cyan-500 text-slate-950' : 'bg-slate-900 text-slate-300'}`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Local Analytics & Crash Log */}
      {tab === 'analytics' && (
        <div className="glass-card rounded-2xl p-4 space-y-3 text-xs">
          <h3 className="font-bold text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4 text-emerald-400" /> آمار محلی پلتفرم ({CATEGORIES.length} دسته‌بندی · {ALL_TOOLS.length} ابزار فعال)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div className="bg-slate-900 p-3 rounded-xl">کل دسته‌بندی‌ها: <strong className="text-cyan-400 text-lg block">{CATEGORIES.length}</strong></div>
            <div className="bg-slate-900 p-3 rounded-xl">کل ابزارهای فعال: <strong className="text-emerald-400 text-lg block">{ALL_TOOLS.length}</strong></div>
            <div className="bg-slate-900 p-3 rounded-xl">ابزارهای استفاده‌شده: <strong className="text-amber-400 text-lg block">{Object.keys(toolStats).length}</strong></div>
          </div>
          {crashLogs.length > 0 && (
            <div className="bg-slate-950 p-3 rounded-xl font-mono text-[11px] max-h-40 overflow-y-auto" dir="ltr">
              {crashLogs.slice(0, 10).map((l, i) => <div key={i}>[{l.level}] {l.time}: {l.message}</div>)}
            </div>
          )}
        </div>
      )}

      {/* Live GitHub Release Update Checker */}
      {tab === 'updates' && (
        <div className="glass-card rounded-2xl p-4 space-y-3 text-xs">
          <h3 className="font-bold text-sm flex items-center gap-2"><RefreshCw className="w-4 h-4 text-cyan-400" /> بررسی زنده آپدیت APK از ریلیز گیت‌هاب</h3>
          <div>نسخه فعلی نصب‌شده: <strong className="font-mono text-emerald-400">v2.0.0 (OmniForge Pro)</strong></div>
          <button
            onClick={async () => {
              try {
                const rel = await fetchLatestAppRelease();
                setReleaseInfo(rel);
                onToast(`آخرین ریلیز گیت‌هاب: ${rel.tag_name}`, 'success');
              } catch {
                onToast('اتصال به GitHub Releases برقرار نشد', 'info');
              }
            }}
            className="omni-btn omni-btn-primary text-xs"
          >
            بررسی نسخه جدید از GitHub Releases
          </button>
          {releaseInfo && (
            <div className="bg-slate-900 p-3 rounded-xl space-y-1">
              <div className="font-bold text-cyan-300">{releaseInfo.name || releaseInfo.tag_name}</div>
              <a href={releaseInfo.html_url} target="_blank" rel="noreferrer" className="text-emerald-400 underline">صفحه دانلود ریلیز گیت‌هاب ↗</a>
            </div>
          )}
        </div>
      )}

      {/* Account & Free Forever */}
      {tab === 'account' && (
        <div className="glass-card rounded-2xl p-4 space-y-3 text-xs">
          <h3 className="font-bold text-sm flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-400" /> حساب کاربری و تضمین ۱۰۰٪ رایگان همیشگی</h3>
          <div className="rounded-xl bg-emerald-950/50 border border-emerald-500/40 p-3 text-emerald-200">
            ✅ اشتراک شما: <strong>OmniForge Pro — رایگان همیشگی و بدون تبلیغات (All 1,060+ Tools Unlocked)</strong>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label>نام کاربر<input className="omni-input mt-1" value={settings.userName} onChange={(e) => onUpdateSettings({ userName: e.target.value })} /></label>
            <label>ایمیل محلی<input className="omni-input mt-1" value={settings.userEmail} onChange={(e) => onUpdateSettings({ userEmail: e.target.value })} /></label>
          </div>
        </div>
      )}
    </div>
  );
};
