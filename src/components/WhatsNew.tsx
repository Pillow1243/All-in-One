import React from 'react';
import { APP_NAME, APP_VERSION, CHANGELOG } from '../data/changelog';
import { Sparkles, Rocket, X } from 'lucide-react';

interface WhatsNewProps {
  open: boolean;
  onClose: () => void;
  isRtl: boolean;
  toolCount: number;
  categoryCount: number;
}

export const WhatsNew: React.FC<WhatsNewProps> = ({ open, onClose, isRtl, toolCount, categoryCount }) => {
  if (!open) return null;
  const release = CHANGELOG[0];

  return (
    <div className="fixed inset-0 z-[75] flex items-end sm:items-center justify-center p-0 sm:p-6" role="dialog" aria-modal="true">
      <button className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} aria-label={isRtl ? 'بستن' : 'Close'} />
      <div className="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-white/10 bg-slate-950/95 shadow-2xl animate-pop">
        <div className="relative overflow-hidden px-5 pt-6 pb-5 border-b border-white/10">
          <div className="absolute inset-0 grid-mask opacity-60" aria-hidden />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <img src="./icons/icon-192.png" alt={APP_NAME} className="w-12 h-12 rounded-2xl shadow-lg shadow-cyan-500/20" />
              <div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-cyan-300">
                  {isRtl ? 'نسخه تازه نصب شد' : 'You are up to date'}
                </div>
                <h2 className="text-xl font-black leading-tight">
                  {APP_NAME} <span className="gradient-text">v{APP_VERSION}</span>
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {isRtl ? `اسم رمز: ${release.codename} · ${categoryCount} دسته · ${toolCount} ابزار` : `Codename ${release.codename} · ${categoryCount} categories · ${toolCount} tools`}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="rounded-xl bg-white/5 hover:bg-white/10 p-2" aria-label={isRtl ? 'بستن' : 'Close'}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-5 py-4 space-y-3">
          {release.highlights.map((item) => (
            <div key={item.title} className="flex gap-3">
              <span className="mt-0.5 w-6 h-6 shrink-0 rounded-lg bg-gradient-to-br from-cyan-500/25 to-violet-500/25 border border-cyan-400/25 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              </span>
              <div>
                <div className="text-xs font-bold">{item.title}</div>
                <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 pb-5 pt-1">
          <button onClick={onClose} className="omni-btn omni-btn-primary w-full">
            <Rocket className="w-4 h-4" />
            {isRtl ? 'شروع کار با نسخه جدید' : 'Start exploring'}
          </button>
          <p className="text-[10px] text-slate-500 text-center mt-2">
            {isRtl ? 'همیشه رایگان · بدون تبلیغات · بدون حساب کاربری' : 'Always free · No ads · No account'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default WhatsNew;
