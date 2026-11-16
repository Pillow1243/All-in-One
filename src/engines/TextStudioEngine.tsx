import React, { useEffect, useRef, useState } from 'react';
import { marked } from 'marked';
import { EngineProps } from '../types';
import {
  analyzeSentiment, computePlagiarismSimilarity, computeReadability,
  convertNumerals, extractEntities, extractKeywords, persianVirastar, summarizeTextLocal,
} from '../services/localAi';
import { askFreeAi, translateTextFree } from '../services/freeApis';
import { speakText } from '../services/nativeBridge';
import { Type, Sparkles, Diff, Languages, Cloud, Volume2 } from 'lucide-react';

type TextTab = 'transform' | 'persian' | 'replace' | 'diff' | 'formats' | 'extract' | 'analyze' | 'ai' | 'visual' | 'srt' | 'speech' | 'emoji';

export const TextStudioEngine: React.FC<EngineProps> = ({ tool, onToast }) => {
  const [tab, setTab] = useState<TextTab>((tool.mode as TextTab) || 'transform');
  const [text, setText] = useState(
    'سلام! من می خواهم با اپلیکیشن همه کاره پرو کار کنم و متن های فارسی را به صورت استاندارد ویرایش کنم.\nایمیل: hello@omniforge.app | سایت: https://github.com/Pillow1243/All-in-One\nOmniForge Pro makes text editing, Persian half-space (ZWNJ), SEO analysis, and translation super fast.'
  );
  const [textB, setTextB] = useState('سلام! من می‌خواهم با اپلیکیشن همه‌کاره پرو کار کنم و متن‌های فارسی را ویرایش کنم.');
  const [findStr, setFindStr] = useState('همه کاره');
  const [replaceStr, setReplaceStr] = useState('همه‌کاره');
  const [useRegex, setUseRegex] = useState(false);

  // Translation & AI
  const [targetLang, setTargetLang] = useState('en');
  const [aiOut, setAiOut] = useState('');
  const [loading, setLoading] = useState(false);

  // Word Cloud / Quote Image
  const cloudCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [quoteBg, setQuoteBg] = useState('#0f172a');

  // SRT Shift
  const [srtShiftSec, setSrtShiftSec] = useState(2);

  useEffect(() => {
    const allowed: TextTab[] = ['transform', 'persian', 'replace', 'diff', 'formats', 'extract', 'analyze', 'ai', 'visual', 'srt', 'speech', 'emoji'];
    if (allowed.includes(tool.mode as TextTab)) setTab(tool.mode as TextTab);
  }, [tool.id, tool.mode]);

  const readability = computeReadability(text);
  const keywords = extractKeywords(text, 15);
  const entities = extractEntities(text);
  const sentiment = analyzeSentiment(text);
  const plag = computePlagiarismSimilarity(text, textB);

  // Render Word Cloud Canvas
  useEffect(() => {
    if (tab !== 'visual' || !cloudCanvasRef.current) return;
    const c = cloudCanvasRef.current;
    const ctx = c.getContext('2d')!;
    c.width = 680;
    c.height = 340;
    ctx.fillStyle = quoteBg;
    ctx.fillRect(0, 0, c.width, c.height);
    const colors = ['#22d3ee', '#a78bfa', '#f472b6', '#34d399', '#fbbf24', '#60a5fa'];
    keywords.forEach((kw, i) => {
      const size = Math.min(46, Math.max(16, 14 + kw.count * 7));
      ctx.font = `bold ${size}px sans-serif`;
      ctx.fillStyle = colors[i % colors.length];
      ctx.textAlign = 'center';
      const angle = i * 1.4;
      const radius = 25 + i * 16;
      const x = c.width / 2 + Math.cos(angle) * radius * 1.6;
      const y = c.height / 2 + Math.sin(angle) * radius * 0.75;
      ctx.fillText(kw.word, Math.max(80, Math.min(c.width - 80, x)), Math.max(40, Math.min(c.height - 25, y)));
    });
  }, [tab, text, quoteBg]);

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 overflow-x-auto pb-2">
        {[
          ['transform', 'ویرایش و شمارش'],
          ['persian', 'ویراستار فارسی/نیم‌فاصله'],
          ['replace', 'Find & Regex'],
          ['diff', 'مقایسه و سرقت ادبی'],
          ['analyze', 'سئو و خوانایی'],
          ['extract', 'استخراج ایمیل/لینک'],
          ['formats', 'Markdown/CSV/JSON'],
          ['ai', 'ترجمه و AI'],
          ['visual', 'ابر کلمات و نقل‌قول'],
          ['speech', 'TTS / STT'],
        ].map(([id, lbl]) => (
          <button key={id} onClick={() => setTab(id as TextTab)} className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold ${tab === id ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' : 'bg-slate-800/70 text-slate-300'}`}>
            {lbl}
          </button>
        ))}
      </div>

      {/* Live Stats Bar */}
      <div className="grid grid-cols-4 gap-2 text-center text-xs">
        <div className="glass-card rounded-xl p-2"><div className="text-slate-400">کلمات</div><div className="font-bold text-cyan-400">{readability.words}</div></div>
        <div className="glass-card rounded-xl p-2"><div className="text-slate-400">کاراکتر</div><div className="font-bold">{text.length}</div></div>
        <div className="glass-card rounded-xl p-2"><div className="text-slate-400">جمله</div><div className="font-bold">{readability.sentences}</div></div>
        <div className="glass-card rounded-xl p-2"><div className="text-slate-400">زمان مطالعه</div><div className="font-bold text-emerald-400">{readability.readingTimeMin} دقیقه</div></div>
      </div>

      <textarea rows={5} className="omni-input leading-relaxed" value={text} onChange={(e) => setText(e.target.value)} />

      {tab === 'transform' && (
        <div className="glass-card rounded-2xl p-4 flex flex-wrap gap-2 text-xs">
          <button onClick={() => setText(text.toUpperCase())} className="omni-btn omni-btn-secondary">UPPERCASE</button>
          <button onClick={() => setText(text.toLowerCase())} className="omni-btn omni-btn-secondary">lowercase</button>
          <button onClick={() => setText(text.replace(/\b\w/g, (c) => c.toUpperCase()))} className="omni-btn omni-btn-secondary">Title Case</button>
          <button onClick={() => setText(text.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim())} className="omni-btn omni-btn-secondary">حذف فاصله اضافی</button>
          <button onClick={() => setText(text.split('\n').sort().join('\n'))} className="omni-btn omni-btn-secondary">مرتب‌سازی خطوط</button>
          <button onClick={() => setText(Array.from(new Set(text.split('\n'))).join('\n'))} className="omni-btn omni-btn-secondary">حذف خطوط تکراری</button>
          <button onClick={() => setText(text.split('\n').map((l, i) => `${i + 1}. ${l}`).join('\n'))} className="omni-btn omni-btn-secondary">شماره‌گذاری خطوط</button>
          <button onClick={() => setText(text.split('').reverse().join(''))} className="omni-btn omni-btn-secondary">معکوس کردن</button>
          <button onClick={() => setText(text.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-'))} className="omni-btn omni-btn-secondary">ساخت URL Slug</button>
          <button onClick={() => setText('لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ و با استفاده از طراحان گرافیک است.')} className="omni-btn omni-btn-primary">متن ساختگی فارسی</button>
          <button onClick={() => { navigator.clipboard?.writeText(text); onToast('متن کپی شد', 'success'); }} className="omni-btn omni-btn-primary">کپی متن</button>
        </div>
      )}

      {tab === 'persian' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2"><Type className="w-4 h-4 text-cyan-400" /> ویراستار تخصصی فارسی (نیم‌فاصله، ی/ک، اعداد)</h3>
          <div className="flex flex-wrap gap-2 text-xs">
            <button onClick={() => { setText(persianVirastar(text)); onToast('نیم‌فاصله و نگارش فارسی اصلاح شد!', 'success'); }} className="omni-btn omni-btn-primary">✨ اصلاح کامل نیم‌فاصله (Virastar)</button>
            <button onClick={() => setText(convertNumerals(text, 'fa'))} className="omni-btn omni-btn-secondary">تبدیل اعداد به فارسی (۱۲۳)</button>
            <button onClick={() => setText(convertNumerals(text, 'en'))} className="omni-btn omni-btn-secondary">تبدیل اعداد به انگلیسی (123)</button>
            <button onClick={() => setText(convertNumerals(text, 'ar'))} className="omni-btn omni-btn-secondary">تبدیل اعداد به عربی (١٢٣)</button>
            <button onClick={() => setText(text.replace(/[\u{1F300}-\u{1FAFF}]/gu, ''))} className="omni-btn omni-btn-secondary">حذف ایموجی‌ها</button>
          </div>
        </div>
      )}

      {tab === 'replace' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input className="omni-input text-xs" value={findStr} onChange={(e) => setFindStr(e.target.value)} placeholder="جستجو (متن یا Regex)" />
            <input className="omni-input text-xs" value={replaceStr} onChange={(e) => setReplaceStr(e.target.value)} placeholder="جایگزین با" />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={useRegex} onChange={(e) => setUseRegex(e.target.checked)} /> حالت Regex</label>
            <button
              onClick={() => {
                try {
                  setText(useRegex ? text.replace(new RegExp(findStr, 'g'), replaceStr) : text.split(findStr).join(replaceStr));
                  onToast('جایگزینی انجام شد', 'success');
                } catch (e) { onToast(`خطای Regex: ${(e as Error).message}`, 'error'); }
              }}
              className="omni-btn omni-btn-primary text-xs"
            >
              جایگزینی همه
            </button>
          </div>
        </div>
      )}

      {tab === 'diff' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2"><Diff className="w-4 h-4 text-amber-400" /> مقایسه متن و سنجش شباهت / سرقت ادبی</h3>
          <textarea rows={4} className="omni-input text-xs" value={textB} onChange={(e) => setTextB(e.target.value)} placeholder="متن دوم برای مقایسه..." />
          <div className="rounded-xl bg-slate-900 p-3 flex items-center justify-between text-sm">
            <span>درصد شباهت (Plagiarism Similarity):</span>
            <strong className={plag.similarityPct > 50 ? 'text-rose-400 text-lg' : 'text-emerald-400 text-lg'}>{plag.similarityPct}%</strong>
          </div>
        </div>
      )}

      {tab === 'analyze' && (
        <div className="glass-card rounded-2xl p-4 space-y-3 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div className="bg-slate-900 p-3 rounded-xl">امتیاز خوانایی: <strong className="text-cyan-400">{readability.score}/100 ({readability.level})</strong></div>
            <div className="bg-slate-900 p-3 rounded-xl">تحلیل احساس: <strong>{sentiment.label}</strong></div>
            <div className="bg-slate-900 p-3 rounded-xl">میانگین کلمه در جمله: <strong>{readability.avgWordsPerSentence}</strong></div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {keywords.map((k) => (
              <span key={k.word} className="rounded-lg bg-slate-800 px-2.5 py-1 text-cyan-300">
                {k.word}: {k.count} ({k.density}%)
              </span>
            ))}
          </div>
        </div>
      )}

      {tab === 'extract' && (
        <div className="glass-card rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-900/70 p-3 rounded-xl"><div className="font-bold text-cyan-400 mb-1">ایمیل‌ها ({entities.emails.length})</div><div dir="ltr" className="font-mono break-all">{entities.emails.join('\n') || '—'}</div></div>
          <div className="bg-slate-900/70 p-3 rounded-xl"><div className="font-bold text-emerald-400 mb-1">لینک‌ها ({entities.urls.length})</div><div dir="ltr" className="font-mono break-all">{entities.urls.join('\n') || '—'}</div></div>
          <div className="bg-slate-900/70 p-3 rounded-xl"><div className="font-bold text-amber-400 mb-1">اعداد/شماره‌ها ({entities.numbers.length})</div><div dir="ltr" className="font-mono break-all">{entities.numbers.join(', ') || '—'}</div></div>
        </div>
      )}

      {tab === 'formats' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <div className="text-xs font-bold text-cyan-400">پیش‌نمایش زنده Markdown → HTML</div>
          <div className="rounded-xl bg-slate-950 p-4 prose prose-invert max-w-none text-sm" dangerouslySetInnerHTML={{ __html: marked.parse(text) as string }} />
        </div>
      )}

      {tab === 'ai' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <select className="omni-input !w-auto text-xs" value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
              <option value="en">ترجمه به انگلیسی</option>
              <option value="fa">ترجمه به فارسی</option>
              <option value="ar">ترجمه به عربی</option>
              <option value="de">ترجمه به آلمانی</option>
              <option value="fr">ترجمه به فرانسوی</option>
              <option value="tr">ترجمه به ترکی</option>
            </select>
            <button
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                const from = /[\u0600-\u06FF]/.test(text) ? 'fa' : 'en';
                const r = await translateTextFree(text, from, targetLang);
                setAiOut(`[${r.source}]\n${r.translated}`);
                setLoading(false);
              }}
              className="omni-btn omni-btn-primary text-xs"
            >
              <Languages className="w-4 h-4" /> ترجمه زنده
            </button>
            <button disabled={loading} onClick={async () => { setLoading(true); const r = await askFreeAi(`Summarize concisely:\n${text}`); setAiOut(r.reply || summarizeTextLocal(text)); setLoading(false); }} className="omni-btn omni-btn-secondary text-xs">
              <Sparkles className="w-4 h-4" /> خلاصه AI
            </button>
            <button disabled={loading} onClick={async () => { setLoading(true); const r = await askFreeAi(`Rewrite in formal professional tone in the same language:\n${text}`); setAiOut(r.reply); setLoading(false); }} className="omni-btn omni-btn-secondary text-xs">
              بازنویسی رسمی
            </button>
          </div>
          {aiOut && <div className="rounded-xl bg-slate-900 p-3.5 text-sm whitespace-pre-wrap">{aiOut}</div>}
        </div>
      )}

      {tab === 'visual' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm flex items-center gap-2"><Cloud className="w-4 h-4 text-cyan-400" /> ابر کلمات (Word Cloud) و کارت نقل‌قول</h3>
            <input type="color" value={quoteBg} onChange={(e) => setQuoteBg(e.target.value)} className="w-9 h-8 rounded" />
          </div>
          <canvas ref={cloudCanvasRef} className="w-full rounded-xl border border-slate-700" />
          <button
            onClick={() => {
              if (!cloudCanvasRef.current) return;
              const a = document.createElement('a');
              a.href = cloudCanvasRef.current.toDataURL('image/png');
              a.download = 'omniforge-wordcloud.png';
              a.click();
            }}
            className="omni-btn omni-btn-primary text-xs"
          >
            دانلود تصویر ابر کلمات (PNG)
          </button>
        </div>
      )}

      {(tab === 'speech' || tab === 'srt' || tab === 'emoji') && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <button onClick={() => speakText(text, 'fa-IR')} className="omni-btn omni-btn-primary text-xs"><Volume2 className="w-4 h-4" /> خوانش صوتی فارسی</button>
            <button onClick={() => speakText(text, 'en-US')} className="omni-btn omni-btn-secondary text-xs">خوانش انگلیسی</button>
            <div className="flex items-center gap-2 text-xs">
              <span>شیفت زیرنویس (ثانیه):</span>
              <input type="number" className="omni-input !w-20" value={srtShiftSec} onChange={(e) => setSrtShiftSec(Number(e.target.value))} />
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 text-xl">
            {['🔥', '🚀', '✨', '💡', '📱', '⚡', '🎯', '🛡️', '🎨', '🎵', '📊', '🌍', '❤️', '✅', '🧠', '🏆'].map((em) => (
              <button key={em} onClick={() => setText((p) => p + ' ' + em)} className="rounded-lg bg-slate-800 px-2.5 py-1 hover:bg-slate-700">{em}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
