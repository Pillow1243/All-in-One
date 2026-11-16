import React, { useEffect, useState } from 'react';
import { EngineProps } from '../types';
import { askFreeAi, getFreeAiImageUrl } from '../services/freeApis';
import { analyzeSentiment, answerFromDocumentLocal, extractEntities, summarizeTextLocal } from '../services/localAi';
import { speakText } from '../services/nativeBridge';
import { Sparkles, Send, Code2, Image as ImgIcon, FileText, Brain, Mic } from 'lucide-react';

type AiTab = 'chat' | 'assistants' | 'code' | 'image' | 'docchat' | 'nlp' | 'text' | 'voice' | 'vision' | 'creative';

const ASSISTANTS = [
  { id: 'personal', label: 'دستیار شخصی', sys: 'You are a helpful personal productivity assistant. Reply in Persian.' },
  { id: 'coding', label: 'متخصص کدنویسی', sys: 'You are a senior full-stack software engineer. Write clean, bug-free code.' },
  { id: 'writing', label: 'نویسنده و ویراستار', sys: 'You are an expert Persian & English copywriter and editor.' },
  { id: 'study', label: 'معلم خصوصی', sys: 'You are a patient tutor explaining concepts step-by-step in Persian.' },
  { id: 'travel', label: 'راهنمای سفر', sys: 'You are a world travel planner giving itineraries and tips in Persian.' },
  { id: 'health', label: 'مربی سلامت', sys: 'You provide general fitness & nutrition guidance in Persian.' },
  { id: 'finance', label: 'مشاور مالی', sys: 'You explain budgeting, investing, and financial math clearly in Persian.' },
];

export const AiStudioEngine: React.FC<EngineProps> = ({ tool, onToast }) => {
  const [tab, setTab] = useState<AiTab>((tool.mode as AiTab) || 'chat');
  const [assistantIdx, setAssistantIdx] = useState(0);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string; engine?: string }[]>([
    { role: 'ai', text: 'سلام! من هوش مصنوعی رایگان همه‌کاره پرو (OmniForge AI) هستم. هر سوالی در مورد کدنویسی، ترجمه، خلاصه‌سازی، یادگیری یا اسناد دارید بپرسید!', engine: 'Hybrid Free AI' },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);

  // Code AI
  const [codePrompt, setCodePrompt] = useState('Write a clean TypeScript function for debounce with full types');
  const [codeReply, setCodeReply] = useState('');

  // Image Gen
  const [imgPrompt, setImgPrompt] = useState('Futuristic glowing crystal Persian library floating in space, cinematic 8k');
  const [imgUrl, setImgUrl] = useState('');

  // Chat with Document / PDF / Website / YouTube
  const [docSource, setDocSource] = useState('متن سند، مقاله وب‌سایت یا زیرنویس ویدیو یوتیوب را اینجا قرار دهید تا هوش مصنوعی به سوالات شما پاسخ دهد...');
  const [docQuestion, setDocQuestion] = useState('نکات اصلی این متن چیست؟');
  const [docReply, setDocReply] = useState('');

  // Local Offline NLP
  const [nlpText, setNlpText] = useState('اپلیکیشن همه‌کاره پرو فوق‌العاده عالی و سریع است! ایمیل info@omniforge.app در تاریخ 2026-11-16');

  useEffect(() => {
    const allowed: AiTab[] = ['chat', 'assistants', 'code', 'image', 'docchat', 'nlp', 'text', 'voice', 'vision', 'creative'];
    if (allowed.includes(tool.mode as AiTab)) setTab(tool.mode as AiTab);
  }, [tool.id, tool.mode]);

  const sendChat = async () => {
    if (!input.trim() || busy) return;
    const q = input.trim();
    setMessages((m) => [...m, { role: 'user', text: q }]);
    setInput('');
    setBusy(true);
    const res = await askFreeAi(q, ASSISTANTS[assistantIdx].sys);
    setMessages((m) => [...m, { role: 'ai', text: res.reply, engine: res.engine }]);
    setBusy(false);
  };

  const startVoicePrompt = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return onToast('تبدیل گفتار به متن در این مرورگر پشتیبانی نمی‌شود', 'error');
    const rec = new SR();
    rec.lang = 'fa-IR';
    rec.onresult = (e: any) => {
      const spoken = e.results[0][0].transcript;
      setInput(spoken);
      onToast(`شنیده شد: ${spoken}`, 'success');
    };
    rec.start();
  };

  const sent = analyzeSentiment(nlpText);
  const ents = extractEntities(nlpText);

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 overflow-x-auto pb-2">
        {[
          ['chat', 'چت‌بات و دستیارها'],
          ['code', 'کدنویسی و دیباگ AI'],
          ['image', 'تولید تصویر AI'],
          ['docchat', 'چت با PDF / وب / یوتیوب'],
          ['nlp', 'تحلیل احساسات و NER آفلاین'],
        ].map(([id, lbl]) => (
          <button key={id} onClick={() => setTab(id as AiTab)} className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold ${tab === id ? 'bg-gradient-to-r from-cyan-500 via-violet-500 to-fuchsia-500 text-white' : 'bg-slate-800/70 text-slate-300'}`}>
            {lbl}
          </button>
        ))}
      </div>

      {['chat', 'assistants', 'text', 'voice'].includes(tab) && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {ASSISTANTS.map((a, idx) => (
              <button key={a.id} onClick={() => setAssistantIdx(idx)} className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-semibold ${assistantIdx === idx ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
                {a.label}
              </button>
            ))}
          </div>
          <div className="space-y-2.5 max-h-80 overflow-y-auto p-2 rounded-xl bg-slate-950/70">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-100'}`}>
                  {m.text}
                  {m.engine && <div className="text-[10px] text-cyan-300/70 mt-1 flex items-center justify-between gap-2"><span>{m.engine}</span><button onClick={() => speakText(m.text, 'fa-IR')}>🔊</button></div>}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={startVoicePrompt} className="omni-btn omni-btn-secondary px-3" title="ورودی صوتی"><Mic className="w-4 h-4 text-cyan-400" /></button>
            <input className="omni-input flex-1 text-xs" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendChat()} placeholder="پیام خود را به هوش مصنوعی رایگان بنویسید..." />
            <button disabled={busy} onClick={sendChat} className="omni-btn omni-btn-primary px-4"><Send className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {tab === 'code' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2"><Code2 className="w-4 h-4 text-cyan-400" /> تولید، توضیح و دیباگ کد با هوش مصنوعی رایگان</h3>
          <textarea rows={4} dir="ltr" className="omni-input font-mono text-xs" value={codePrompt} onChange={(e) => setCodePrompt(e.target.value)} />
          <div className="flex flex-wrap gap-2 text-xs">
            <button onClick={async () => { const r = await askFreeAi(codePrompt, 'Return clean code with brief explanation.'); setCodeReply(r.reply); }} className="omni-btn omni-btn-primary">تولید کد</button>
            <button onClick={async () => { const r = await askFreeAi(`Explain this code step by step in Persian:\n${codePrompt}`); setCodeReply(r.reply); }} className="omni-btn omni-btn-secondary">توضیح کد</button>
            <button onClick={async () => { const r = await askFreeAi(`Find bugs and optimize this code:\n${codePrompt}`); setCodeReply(r.reply); }} className="omni-btn omni-btn-secondary">دیباگ کد</button>
          </div>
          {codeReply && <pre dir="ltr" className="rounded-xl bg-slate-950 p-3.5 text-xs font-mono text-emerald-300 whitespace-pre-wrap overflow-x-auto">{codeReply}</pre>}
        </div>
      )}

      {(tab === 'image' || tab === 'vision' || tab === 'creative') && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2"><ImgIcon className="w-4 h-4 text-fuchsia-400" /> تولید تصویر رایگان با AI (Pollinations Zero-Auth)</h3>
          <input className="omni-input text-xs" dir="ltr" value={imgPrompt} onChange={(e) => setImgPrompt(e.target.value)} />
          <button onClick={() => setImgUrl(getFreeAiImageUrl(imgPrompt, 768, 768, Date.now()))} className="omni-btn omni-btn-primary w-full"><Sparkles className="w-4 h-4" /> تولید تصویر</button>
          {imgUrl && <img src={imgUrl} alt="AI Output" className="w-full max-h-80 object-contain rounded-xl border border-slate-700" />}
        </div>
      )}

      {tab === 'docchat' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2"><FileText className="w-4 h-4 text-cyan-400" /> چت هوشمند با سند، PDF، مقاله وب یا زیرنویس یوتیوب</h3>
          <textarea rows={4} className="omni-input text-xs" value={docSource} onChange={(e) => setDocSource(e.target.value)} />
          <div className="flex gap-2">
            <input className="omni-input flex-1 text-xs" value={docQuestion} onChange={(e) => setDocQuestion(e.target.value)} />
            <button onClick={async () => { const r = await askFreeAi(docQuestion, 'Answer based on the provided document.', docSource); setDocReply(r.reply || answerFromDocumentLocal(docSource, docQuestion)); }} className="omni-btn omni-btn-primary text-xs">پاسخ بده</button>
            <button onClick={() => setDocReply(summarizeTextLocal(docSource, 3))} className="omni-btn omni-btn-secondary text-xs">خلاصه آفلاین</button>
          </div>
          {docReply && <div className="rounded-xl bg-slate-900 p-3.5 text-sm whitespace-pre-wrap">{docReply}</div>}
        </div>
      )}

      {tab === 'nlp' && (
        <div className="glass-card rounded-2xl p-4 space-y-3 text-xs">
          <h3 className="font-bold text-sm flex items-center gap-2"><Brain className="w-4 h-4 text-emerald-400" /> تحلیل احساسات و استخراج موجودیت‌ها (۱۰۰٪ آفلاین)</h3>
          <textarea rows={3} className="omni-input" value={nlpText} onChange={(e) => setNlpText(e.target.value)} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="bg-slate-900 p-3 rounded-xl">احساس متن: <strong className="block text-sm text-cyan-400 mt-1">{sent.label} ({sent.score})</strong></div>
            <div className="bg-slate-900 p-3 rounded-xl">ایمیل‌ها: <strong className="block font-mono text-emerald-300 mt-1">{ents.emails.join(', ') || '—'}</strong></div>
            <div className="bg-slate-900 p-3 rounded-xl">تاریخ‌ها و اعداد: <strong className="block font-mono text-amber-300 mt-1">{[...ents.dates, ...ents.numbers.slice(0, 4)].join(', ') || '—'}</strong></div>
          </div>
        </div>
      )}
    </div>
  );
};
