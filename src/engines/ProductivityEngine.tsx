import React, { useEffect, useRef, useState } from 'react';
import { EngineProps } from '../types';
import { fetchHackerNewsTop, fetchPublicHolidays, lookupDictionary } from '../services/freeApis';
import { loadData, saveData } from '../services/storage';
import { Clock, CheckSquare, Flame, BookOpen, PenTool, Newspaper, Keyboard } from 'lucide-react';

type ProdTab = 'timers' | 'tasks' | 'habits' | 'flashcards' | 'typing' | 'calendar' | 'whiteboard' | 'mindmap' | 'notes' | 'language' | 'news' | 'quiz' | 'reader' | 'teleprompter';

export const ProductivityEngine: React.FC<EngineProps> = ({ tool, onToast }) => {
  const [tab, setTab] = useState<ProdTab>((tool.mode as ProdTab) || 'timers');

  // Pomodoro & Stopwatch
  const [pomoSec, setPomoSec] = useState(25 * 60);
  const [pomoRun, setPomoRun] = useState(false);
  const [swMs, setSwMs] = useState(0);
  const [swRun, setSwRun] = useState(false);

  // To-Do / Kanban Tasks
  const [tasks, setTasks] = useState<{ id: string; title: string; status: 'todo' | 'doing' | 'done' }[]>(() =>
    loadData('prod_tasks', [
      { id: '1', title: 'بررسی امکانات OmniForge Pro', status: 'done' },
      { id: '2', title: 'برنامه‌ریزی اهداف هفته', status: 'todo' },
    ])
  );
  const [taskInput, setTaskInput] = useState('');

  // Habits
  const [habits, setHabits] = useState<{ id: string; name: string; streak: number }[]>(() =>
    loadData('prod_habits', [
      { id: 'h1', name: 'مطالعه ۳۰ دقیقه', streak: 5 },
      { id: 'h2', name: 'ورزش صبحگاهی', streak: 3 },
    ])
  );

  // Flashcards
  const [cards, setCards] = useState<{ q: string; a: string }[]>(() =>
    loadData('prod_flashcards', [
      { q: 'الگوریتم رمزنگاری AES-256 چیست؟', a: 'استاندارد رمزنگاری متقارن ۲۵۶ بیتی بسیار امن و مورد تایید جهانی' },
      { q: 'واحد SI برای نیرو چیست؟', a: 'نیوتن (Newton - kg·m/s²)' },
    ])
  );
  const [cardIdx, setCardIdx] = useState(0);
  const [cardFlip, setCardFlip] = useState(false);

  // Typing Speed Test
  const sampleTyping = 'OmniForge Pro empowers Android users with one thousand free smart utilities.';
  const [typed, setTyped] = useState('');
  const [typeStart, setTypeStart] = useState<number | null>(null);

  // Whiteboard Canvas
  const wbRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const [wbColor, setWbColor] = useState('#22d3ee');

  // Mind Map Nodes
  const [mindNodes, setMindNodes] = useState<{ id: string; label: string }[]>([
    { id: '1', label: 'ایده مرکزی: پروژه ۲۰۲۶' },
    { id: '2', label: 'طراحی رابط کاربری' },
    { id: '3', label: 'هوش مصنوعی رایگان' },
    { id: '4', label: 'انتشار نسخه اندروید' },
  ]);
  const [newNode, setNewNode] = useState('');

  // Journal / Notebook
  const [journal, setJournal] = useState<string>(() => loadData('prod_journal', '# یادداشت امروز\nهمه‌چیز عالی پیش می‌رود...'));

  // Dictionary & News & Holidays
  const [dictWord, setDictWord] = useState('innovation');
  const [dictRes, setDictRes] = useState<any>(null);
  const [news, setNews] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);

  useEffect(() => {
    const allowed: ProdTab[] = ['timers', 'tasks', 'habits', 'flashcards', 'typing', 'calendar', 'whiteboard', 'mindmap', 'notes', 'language', 'news', 'quiz', 'reader', 'teleprompter'];
    if (allowed.includes(tool.mode as ProdTab)) setTab(tool.mode as ProdTab);
  }, [tool.id, tool.mode]);

  useEffect(() => {
    if (!pomoRun) return;
    const id = setInterval(() => setPomoSec((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [pomoRun]);

  useEffect(() => {
    if (!swRun) return;
    const id = setInterval(() => setSwMs((m) => m + 50), 50);
    return () => clearInterval(id);
  }, [swRun]);

  useEffect(() => {
    if (tab === 'news' && news.length === 0) fetchHackerNewsTop(10).then(setNews).catch(() => {});
    if (tab === 'calendar' && holidays.length === 0) fetchPublicHolidays(2026, 'US').then((h) => setHolidays(h.slice(0, 10))).catch(() => {});
  }, [tab]);

  const wpm = (() => {
    if (!typeStart || typed.length < 3) return 0;
    const min = Math.max(0.05, (Date.now() - typeStart) / 60000);
    return Math.round((typed.length / 5) / min);
  })();

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 overflow-x-auto pb-2">
        {[
          ['timers', 'پومودورو و کرنومتر'],
          ['tasks', 'To-Do و کانبان'],
          ['habits', 'ردیاب عادت'],
          ['flashcards', 'فلش‌کارت'],
          ['typing', 'تست سرعت تایپ'],
          ['whiteboard', 'وایت‌برد نقاشی'],
          ['mindmap', 'نقشه ذهنی'],
          ['notes', 'دفترچه و ژورنال'],
          ['calendar', 'تقویم شمسی/تعطیلات'],
          ['language', 'دیکشنری زنده'],
          ['news', 'خبرخوان فناوری'],
        ].map(([id, lbl]) => (
          <button key={id} onClick={() => setTab(id as ProdTab)} className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold ${tab === id ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950' : 'bg-slate-800/70 text-slate-300'}`}>
            {lbl}
          </button>
        ))}
      </div>

      {tab === 'timers' && (
        <div className="glass-card rounded-2xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
          <div className="bg-slate-900/70 p-4 rounded-xl space-y-3">
            <div className="font-bold text-sm flex items-center justify-center gap-1.5"><Clock className="w-4 h-4 text-rose-400" /> پومودورو تمرکز</div>
            <div className="text-4xl font-mono font-black text-rose-400">{String(Math.floor(pomoSec / 60)).padStart(2, '0')}:{String(pomoSec % 60).padStart(2, '0')}</div>
            <div className="flex justify-center gap-2">
              <button onClick={() => setPomoRun(!pomoRun)} className="omni-btn omni-btn-primary text-xs">{pomoRun ? 'توقف' : 'شروع ۲۵ دقیقه'}</button>
              <button onClick={() => { setPomoRun(false); setPomoSec(25 * 60); }} className="omni-btn omni-btn-secondary text-xs">ریست</button>
            </div>
          </div>
          <div className="bg-slate-900/70 p-4 rounded-xl space-y-3">
            <div className="font-bold text-sm">⏱️ کرنومتر دقیق</div>
            <div className="text-4xl font-mono font-black text-cyan-400">{(swMs / 1000).toFixed(2)}s</div>
            <div className="flex justify-center gap-2">
              <button onClick={() => setSwRun(!swRun)} className="omni-btn omni-btn-primary text-xs">{swRun ? 'توقف' : 'شروع'}</button>
              <button onClick={() => { setSwRun(false); setSwMs(0); }} className="omni-btn omni-btn-secondary text-xs">صفر</button>
            </div>
          </div>
        </div>
      )}

      {tab === 'tasks' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2"><CheckSquare className="w-4 h-4 text-emerald-400" /> لیست کارها و برد کانبان (Kanban)</h3>
          <div className="flex gap-2">
            <input className="omni-input text-xs" value={taskInput} onChange={(e) => setTaskInput(e.target.value)} placeholder="کار جدید..." />
            <button onClick={() => { if (!taskInput.trim()) return; const next = [{ id: String(Date.now()), title: taskInput, status: 'todo' as const }, ...tasks]; setTasks(next); saveData('prod_tasks', next); setTaskInput(''); }} className="omni-btn omni-btn-primary text-xs">افزودن</button>
          </div>
          <div className="space-y-1.5">
            {tasks.map((t) => (
              <div key={t.id} className="bg-slate-900/70 p-3 rounded-xl flex items-center justify-between text-xs">
                <span className={t.status === 'done' ? 'line-through text-slate-500' : ''}>{t.title}</span>
                <select
                  className="bg-slate-800 rounded-lg px-2 py-1 text-xs"
                  value={t.status}
                  onChange={(e) => {
                    const next = tasks.map((x) => (x.id === t.id ? { ...x, status: e.target.value as any } : x));
                    setTasks(next);
                    saveData('prod_tasks', next);
                  }}
                >
                  <option value="todo">در انتظار</option>
                  <option value="doing">در حال انجام</option>
                  <option value="done">انجام شد ✅</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'habits' && (
        <div className="glass-card rounded-2xl p-4 space-y-2">
          <h3 className="font-bold text-sm flex items-center gap-2"><Flame className="w-4 h-4 text-orange-400" /> ردیاب عادت‌های روزانه</h3>
          {habits.map((h) => (
            <div key={h.id} className="bg-slate-900/70 p-3 rounded-xl flex items-center justify-between text-xs">
              <div><div className="font-bold">{h.name}</div><div className="text-orange-400">🔥 {h.streak} روز متوالی</div></div>
              <button onClick={() => { const next = habits.map((x) => (x.id === h.id ? { ...x, streak: x.streak + 1 } : x)); setHabits(next); saveData('prod_habits', next); onToast('عادت امروز ثبت شد! 🔥', 'success'); }} className="omni-btn omni-btn-primary text-xs">انجام شد (+1)</button>
            </div>
          ))}
        </div>
      )}

      {(tab === 'flashcards' || tab === 'quiz') && (
        <div className="glass-card rounded-2xl p-4 text-center space-y-3">
          <h3 className="font-bold text-sm">فلش‌کارت هوشمند (برای مشاهده پاسخ ضربه بزنید)</h3>
          <div onClick={() => setCardFlip(!cardFlip)} className="cursor-pointer rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 border border-cyan-500/30 p-8 min-h-[150px] flex items-center justify-center text-base font-bold">
            {cardFlip ? cards[cardIdx]?.a : cards[cardIdx]?.q}
          </div>
          <div className="flex justify-center gap-2">
            <button onClick={() => { setCardFlip(false); setCardIdx((cardIdx + 1) % cards.length); }} className="omni-btn omni-btn-primary text-xs">کارت بعدی</button>
          </div>
        </div>
      )}

      {tab === 'typing' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2"><Keyboard className="w-4 h-4 text-cyan-400" /> تست سرعت تایپ (WPM)</h3>
          <div dir="ltr" className="rounded-xl bg-slate-900 p-3 font-mono text-sm text-cyan-300">{sampleTyping}</div>
          <input dir="ltr" className="omni-input font-mono" value={typed} onChange={(e) => { if (!typeStart) setTypeStart(Date.now()); setTyped(e.target.value); }} placeholder="متن بالا را تایپ کنید..." />
          <div className="text-sm font-bold text-emerald-400">سرعت تایپ: {wpm} کلمه در دقیقه (WPM)</div>
        </div>
      )}

      {tab === 'whiteboard' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm flex items-center gap-2"><PenTool className="w-4 h-4 text-cyan-400" /> وایت‌برد آزاد و طراحی</h3>
            <div className="flex gap-2 items-center">
              <input type="color" value={wbColor} onChange={(e) => setWbColor(e.target.value)} className="w-8 h-8 rounded" />
              <button onClick={() => wbRef.current?.getContext('2d')?.clearRect(0, 0, 700, 320)} className="omni-btn omni-btn-secondary text-xs">پاک‌سازی</button>
            </div>
          </div>
          <canvas
            ref={wbRef}
            width={700}
            height={320}
            onPointerDown={(e) => {
              drawingRef.current = true;
              const r = e.currentTarget.getBoundingClientRect();
              const ctx = e.currentTarget.getContext('2d')!;
              ctx.strokeStyle = wbColor;
              ctx.lineWidth = 4;
              ctx.lineCap = 'round';
              ctx.beginPath();
              ctx.moveTo(((e.clientX - r.left) / r.width) * 700, ((e.clientY - r.top) / r.height) * 320);
            }}
            onPointerMove={(e) => {
              if (!drawingRef.current) return;
              const r = e.currentTarget.getBoundingClientRect();
              const ctx = e.currentTarget.getContext('2d')!;
              ctx.lineTo(((e.clientX - r.left) / r.width) * 700, ((e.clientY - r.top) / r.height) * 320);
              ctx.stroke();
            }}
            onPointerUp={() => (drawingRef.current = false)}
            className="w-full h-64 rounded-xl bg-slate-950 border border-slate-700 touch-none cursor-crosshair"
          />
        </div>
      )}

      {tab === 'mindmap' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm">سازنده نقشه ذهنی (Mind Map)</h3>
          <div className="flex gap-2">
            <input className="omni-input text-xs" value={newNode} onChange={(e) => setNewNode(e.target.value)} placeholder="شاخه یا ایده جدید..." />
            <button onClick={() => { if (!newNode) return; setMindNodes([...mindNodes, { id: String(Date.now()), label: newNode }]); setNewNode(''); }} className="omni-btn omni-btn-primary text-xs">+ شاخه</button>
          </div>
          <div className="flex flex-wrap gap-3 justify-center p-4 rounded-xl bg-slate-950 border border-slate-800">
            {mindNodes.map((n, i) => (
              <div key={n.id} className={`rounded-2xl px-4 py-2.5 text-xs font-bold ${i === 0 ? 'bg-gradient-to-r from-cyan-500 to-violet-600 text-white' : 'bg-slate-800 border border-cyan-500/40 text-cyan-200'}`}>
                {n.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {(tab === 'notes' || tab === 'reader' || tab === 'teleprompter') && (
        <div className="glass-card rounded-2xl p-4 space-y-2">
          <h3 className="font-bold text-sm flex items-center gap-2"><BookOpen className="w-4 h-4 text-amber-400" /> دفترچه یادداشت و ژورنال روزانه (ذخیره خودکار)</h3>
          <textarea rows={8} className="omni-input" value={journal} onChange={(e) => { setJournal(e.target.value); saveData('prod_journal', e.target.value); }} />
        </div>
      )}

      {tab === 'calendar' && (
        <div className="glass-card rounded-2xl p-4 space-y-3 text-xs">
          <div className="rounded-xl bg-slate-900 p-4 text-center">
            <div className="text-lg font-black text-cyan-400">{new Intl.DateTimeFormat('fa-IR-u-ca-persian', { dateStyle: 'full' }).format(new Date())}</div>
            <div className="text-slate-400 mt-1">{new Date().toDateString()}</div>
          </div>
          <div className="space-y-1">
            {holidays.map((h, i) => (
              <div key={i} className="bg-slate-900/70 p-2 rounded-lg flex justify-between"><span>{h.localName || h.name}</span><span className="font-mono text-amber-300">{h.date}</span></div>
            ))}
          </div>
        </div>
      )}

      {tab === 'language' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm">دیکشنری زنده انگلیسی (Free Dictionary Public API)</h3>
          <div className="flex gap-2" dir="ltr">
            <input className="omni-input" value={dictWord} onChange={(e) => setDictWord(e.target.value)} />
            <button onClick={async () => { try { const r = await lookupDictionary(dictWord); setDictRes(r[0]); } catch { onToast('کلمه یافت نشد', 'error'); } }} className="omni-btn omni-btn-primary text-xs">جستجو</button>
          </div>
          {dictRes && (
            <div dir="ltr" className="rounded-xl bg-slate-900 p-3 text-xs space-y-1.5">
              <div className="text-base font-bold text-cyan-400">{dictRes.word} <span className="text-slate-400 font-mono text-xs">{dictRes.phonetic}</span></div>
              {dictRes.meanings?.slice(0, 2).map((m: any, i: number) => (
                <div key={i}><strong className="text-amber-300">{m.partOfSpeech}:</strong> {m.definitions?.[0]?.definition}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'news' && (
        <div className="glass-card rounded-2xl p-4 space-y-2">
          <h3 className="font-bold text-sm flex items-center gap-2"><Newspaper className="w-4 h-4 text-orange-400" /> خبرخوان زنده فناوری (HackerNews Public API)</h3>
          {news.map((item) => (
            <a key={item.id} href={item.url || '#'} target="_blank" rel="noreferrer" className="block bg-slate-900/70 hover:bg-slate-800 p-3 rounded-xl text-xs transition" dir="ltr">
              <div className="font-bold text-slate-100">{item.title}</div>
              <div className="text-slate-400 mt-1">▲ {item.score} points · by {item.by}</div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};
