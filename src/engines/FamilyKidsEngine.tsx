import React, { useState } from 'react';
import { EngineProps } from '../types';
import { speakText } from '../services/nativeBridge';
import { Baby, ShieldAlert, PhoneCall, BookOpen, Lock } from 'lucide-react';

const KIDS_STORIES = [
  { title: 'روباه کوچولو و ستاره درخشان', body: 'روزی روزگاری در جنگلی پر از درختان بلند، روباه کوچولویی به نام فندق زندگی می‌کرد که عاشق تماشای ستاره‌ها بود. یک شب ستاره‌ای مهربان به او یاد داد که با مهربانی و کنجکاوی می‌تواند هر رویایی را بسازد.' },
  { title: 'سفر ابر سفید مهربان', body: 'یک ابر کوچک سفید از روی کوه‌های بلند عبور کرد تا به باغچه‌ای تشنه برسد. وقتی باران لطیفی بارید، همه گل‌ها لبخند زدند و از ابر کوچولو تشکر کردند.' },
];

export const FamilyKidsEngine: React.FC<EngineProps> = ({ settings, onUpdateSettings, onToast }) => {
  const [sosPhone, setSosPhone] = useState('115');
  const [safeUrl, setSafeUrl] = useState('');
  const [kidAns, setKidAns] = useState('');
  const [kidQ, setKidQ] = useState({ a: 4, b: 3 });

  const blockedWords = ['gambling', 'casino', 'adult', 'violence'];
  const checkSafe = () => {
    const bad = blockedWords.some((w) => safeUrl.toLowerCase().includes(w));
    onToast(bad ? '⛔ محتوای نامناسب شناسایی و مسدود شد!' : '✅ این آدرس برای کودک امن به نظر می‌رسد', bad ? 'error' : 'success');
  };

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <h3 className="font-bold text-sm flex items-center gap-2"><Lock className="w-4 h-4 text-amber-400" /> کنترل والدین، محدودیت زمان و حالت کودک</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <label>پین‌کد والدین<input className="omni-input mt-1 font-mono" value={settings.parentalPin} onChange={(e) => onUpdateSettings({ parentalPin: e.target.value })} /></label>
          <label>محدودیت زمان روزانه (دقیقه)<input type="number" className="omni-input mt-1" value={settings.screenTimeLimitMin} onChange={(e) => onUpdateSettings({ screenTimeLimitMin: Number(e.target.value) })} /></label>
          <div className="flex items-end">
            <button onClick={() => onUpdateSettings({ kidsMode: !settings.kidsMode })} className="omni-btn omni-btn-primary w-full text-xs">
              <Baby className="w-4 h-4" /> {settings.kidsMode ? 'خروج از حالت کودک' : 'ورود به حالت کودک'}
            </button>
          </div>
        </div>
      </div>

      {/* Emergency SOS & Safe Filter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="glass-card rounded-2xl p-4 space-y-2 text-xs">
          <h3 className="font-bold text-sm flex items-center gap-2 text-rose-400"><ShieldAlert className="w-4 h-4" /> تماس اضطراری یک‌لمسی (SOS)</h3>
          <input className="omni-input font-mono" value={sosPhone} onChange={(e) => setSosPhone(e.target.value)} placeholder="شماره والدین یا اورژانس" />
          <a href={`tel:${sosPhone}`} className="omni-btn bg-rose-600 hover:bg-rose-500 text-white w-full">
            <PhoneCall className="w-4 h-4" /> تماس فوری اضطراری ({sosPhone})
          </a>
        </div>
        <div className="glass-card rounded-2xl p-4 space-y-2 text-xs">
          <h3 className="font-bold text-sm">🛡️ فیلتر محتوای مرورگر امن کودک</h3>
          <input className="omni-input" value={safeUrl} onChange={(e) => setSafeUrl(e.target.value)} placeholder="بررسی امن بودن سایت یا عبارت..." />
          <button onClick={checkSafe} className="omni-btn omni-btn-secondary w-full">بررسی امنیت محتوا</button>
        </div>
      </div>

      {/* Kids Educational Math + TTS Storyteller */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="glass-card rounded-2xl p-4 text-center space-y-2">
          <h3 className="font-bold text-sm">🎈 بازی ریاضی آموزشی کودک</h3>
          <div className="text-3xl font-black text-amber-400" dir="ltr">{kidQ.a} + {kidQ.b} = ?</div>
          <div className="flex gap-2 justify-center">
            <input type="number" className="omni-input !w-24 text-center" value={kidAns} onChange={(e) => setKidAns(e.target.value)} />
            <button onClick={() => { if (Number(kidAns) === kidQ.a + kidQ.b) { onToast('آفرین ستاره طلایی گرفتی! ⭐', 'success'); setKidQ({ a: Math.floor(Math.random() * 9) + 1, b: Math.floor(Math.random() * 9) + 1 }); setKidAns(''); } else onToast('دوباره تلاش کن عزیزم!', 'info'); }} className="omni-btn omni-btn-primary text-xs">جواب</button>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-4 space-y-2 text-xs">
          <h3 className="font-bold text-sm flex items-center gap-2"><BookOpen className="w-4 h-4 text-cyan-400" /> قصه‌گوی صوتی شب بخیر (TTS)</h3>
          {KIDS_STORIES.map((st) => (
            <div key={st.title} className="bg-slate-900/70 p-2.5 rounded-xl flex items-center justify-between gap-2">
              <span className="font-bold">{st.title}</span>
              <button onClick={() => speakText(`${st.title}. ${st.body}`, 'fa-IR', 0.9)} className="omni-btn omni-btn-primary text-xs shrink-0">🔊 بخوان</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
