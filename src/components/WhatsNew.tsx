import React from 'react';
import { APP_NAME, APP_VERSION, CHANGELOG } from '../data/changelog';
import { Check, Cpu, X } from 'lucide-react';

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
    <div className="fixed inset-0 z-[75] flex items-end justify-center p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="release-title">
      <button className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose} aria-label={isRtl ? 'بستن' : 'Close'} />
      <div className="anvil-release relative max-h-[92vh] w-full overflow-y-auto sm:max-w-xl">
        <div className="anvil-release-top">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <img src="./icons/icon-192.png" alt={APP_NAME} className="h-12 w-12 rounded-xl border border-amber-300/30" />
              <div className="min-w-0">
                <div className="font-mono text-[10px] tracking-[0.18em] text-amber-300">RELEASE RECORD / {release.codename}</div>
                <h2 id="release-title" className="mt-1 truncate text-lg font-black sm:text-xl">{APP_NAME} <span className="font-mono text-amber-300">v{APP_VERSION}</span></h2>
                <p className="mt-1 font-mono text-[10px] text-slate-400">{categoryCount} CATEGORIES · {toolCount} TOOLS · {release.date}</p>
              </div>
            </div>
            <button onClick={onClose} className="rounded-lg border border-white/10 bg-black/30 p-2 text-slate-300 hover:text-white" aria-label={isRtl ? 'بستن' : 'Close'}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-5 flex items-center gap-2 border-t border-white/10 pt-3 font-mono text-[10px] text-slate-400">
            <Cpu className="h-3.5 w-3.5 text-amber-300" /> BUILD 03.00.00 <span className="text-amber-300">/</span> ANVIL SYSTEM UPDATE
          </div>
        </div>

        <div className="space-y-4 px-5 py-5">
          {release.highlights.map((item, index) => (
            <div key={item.title} className="anvil-release-item">
              <span className="anvil-release-index">{String(index + 1).padStart(2, '0')}</span>
              <div>
                <h3 className="text-sm font-bold">{item.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">{item.detail}</p>
              </div>
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 bg-black/20 p-5">
          <button onClick={onClose} className="omni-btn omni-btn-primary w-full">
            {isRtl ? 'بازگشت به ابزارها' : 'Return to tools'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WhatsNew;
