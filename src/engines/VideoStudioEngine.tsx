import React, { useEffect, useRef, useState } from 'react';
import { EngineProps } from '../types';
import { askFreeAi } from '../services/freeApis';
import { Film, Video, CircleDot, Square, Download, Sparkles, Monitor, Subtitles, ScrollText } from 'lucide-react';

type VidTab = 'timeline' | 'chroma' | 'effects' | 'speed' | 'gif' | 'subtitles' | 'recorder' | 'teleprompter' | 'ai' | 'creator' | 'audio' | 'export';

export const VideoStudioEngine: React.FC<EngineProps> = ({ tool, onToast }) => {
  const [tab, setTab] = useState<VidTab>((tool.mode as VidTab) || 'timeline');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [playbackRate, setPlaybackRate] = useState(1);
  const [filterCss, setFilterCss] = useState('none');
  const [chromaEnabled, setChromaEnabled] = useState(false);
  const [chromaSensitivity, setChromaSensitivity] = useState(65);
  const [subtitleText, setSubtitleText] = useState('ساخته شده با استودیو ویدیوی همه‌کاره پرو');
  const [srtContent, setSrtContent] = useState('1\n00:00:00,000 --> 00:00:04,000\nخوش آمدید به ویدیو استودیو OmniForge Pro\n\n2\n00:00:04,500 --> 00:00:09,000\nپشتیبانی از پرده سبز، تله‌پرامپتر و زیرنویس هوشمند');

  // Screen / Webcam Recording
  const [recording, setRecording] = useState(false);
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [recordedUrl, setRecordedUrl] = useState('');

  // Teleprompter
  const [promptScript, setPromptScript] = useState('سلام دوستان عزیز!\nامروز می‌خواهیم با اپلیکیشن قدرتمند همه‌کاره پرو آشنا شویم.\nاین اپلیکیشن دارای ۳۱ دسته‌بندی و بیش از ۱۰۶۰ ابزار کاربردی کاملاً رایگان است.\nبا استفاده از تله‌پرامپتر می‌توانید متن خود را روان و حرفه‌ای جلوی دوربین بخوانید...');
  const [promptScrolling, setPromptScrolling] = useState(false);
  const [promptMirror, setPromptMirror] = useState(false);
  const [promptSpeed, setPromptSpeed] = useState(2);
  const prompterBoxRef = useRef<HTMLDivElement | null>(null);

  // AI Scriptwriter / Storyboard
  const [scriptTopic, setScriptTopic] = useState('معرفی ۳۰ ثانیه‌ای یک اپلیکیشن جعبه ابزار هوشمند برای ریلز اینستاگرام');
  const [aiScript, setAiScript] = useState('');

  useEffect(() => {
    const allowed: VidTab[] = ['timeline', 'chroma', 'effects', 'speed', 'gif', 'subtitles', 'recorder', 'teleprompter', 'ai', 'creator', 'audio', 'export'];
    if (allowed.includes(tool.mode as VidTab)) setTab(tool.mode as VidTab);
  }, [tool.id, tool.mode]);

  // Real-time Video Canvas Compositor (Chroma Key + Filters + Subtitle Burn-in)
  useEffect(() => {
    if (!videoUrl) return;
    let raf = 0;
    const draw = () => {
      const v = videoRef.current;
      const c = canvasRef.current;
      if (v && c && v.readyState >= 2) {
        c.width = v.videoWidth || 640;
        c.height = v.videoHeight || 360;
        const ctx = c.getContext('2d')!;
        ctx.filter = filterCss;
        ctx.drawImage(v, 0, 0, c.width, c.height);
        ctx.filter = 'none';

        if (chromaEnabled) {
          const frame = ctx.getImageData(0, 0, c.width, c.height);
          const d = frame.data;
          for (let i = 0; i < d.length; i += 4) {
            const r = d[i], g = d[i + 1], b = d[i + 2];
            if (g > 90 && g - Math.max(r, b) > (100 - chromaSensitivity)) {
              d[i] = 12; d[i + 1] = 22; d[i + 2] = 56; // Replace green screen with studio backdrop
            }
          }
          ctx.putImageData(frame, 0, 0);
        }

        if (subtitleText) {
          ctx.fillStyle = 'rgba(0,0,0,0.62)';
          ctx.fillRect(20, c.height - 58, c.width - 40, 42);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 20px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(subtitleText, c.width / 2, c.height - 30);
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [videoUrl, filterCss, chromaEnabled, chromaSensitivity, subtitleText]);

  // Teleprompter Auto-scroll
  useEffect(() => {
    if (!promptScrolling) return;
    const id = setInterval(() => {
      if (prompterBoxRef.current) prompterBoxRef.current.scrollTop += promptSpeed;
    }, 35);
    return () => clearInterval(id);
  }, [promptScrolling, promptSpeed]);

  const startCapture = async (mode: 'webcam' | 'screen' | 'canvas') => {
    try {
      let stream: MediaStream;
      if (mode === 'screen') {
        stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      } else if (mode === 'webcam') {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } else {
        if (!canvasRef.current) return onToast('ابتدا ویدیو را بارگذاری کنید', 'error');
        stream = canvasRef.current.captureStream(30);
      }
      recordedChunksRef.current = [];
      const rec = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : undefined });
      rec.ondataavailable = (e) => e.data.size > 0 && recordedChunksRef.current.push(e.data);
      rec.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        setRecordedUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
        onToast('ویدیو با موفقیت ضبط و رندر شد!', 'success');
      };
      rec.start();
      mediaRecRef.current = rec;
      setRecording(true);
      onToast('ضبط ویدیو شروع شد...', 'info');
    } catch (err) {
      onToast(`عدم دسترسی به دوربین/صفحه: ${(err as Error).message}`, 'error');
    }
  };

  const stopCapture = () => {
    mediaRecRef.current?.stop();
    setRecording(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 overflow-x-auto pb-2">
        {[
          ['timeline', 'تایم‌لاین و افکت'],
          ['chroma', 'پرده سبز Chroma'],
          ['speed', 'سرعت و Slow-Mo'],
          ['subtitles', 'زیرنویس SRT'],
          ['recorder', 'ضبط صفحه/وب‌کم'],
          ['teleprompter', 'تله‌پرامپتر'],
          ['ai', 'فیلمنامه‌نویس AI'],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id as VidTab)}
            className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold ${
              tab === id ? 'bg-gradient-to-r from-violet-500 to-indigo-600 text-white' : 'bg-slate-800/70 text-slate-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {['timeline', 'chroma', 'effects', 'speed', 'gif', 'creator', 'audio', 'export'].includes(tab) && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="omni-btn omni-btn-primary cursor-pointer text-xs">
              <Film className="w-4 h-4" /> انتخاب فایل ویدیو (MP4/WebM)
              <input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setVideoUrl(URL.createObjectURL(f));
                    onToast('ویدیو وارد تایم‌لاین شد', 'success');
                  }
                }}
              />
            </label>
            <div className="flex gap-2">
              {!recording ? (
                <button onClick={() => startCapture('canvas')} className="omni-btn omni-btn-secondary text-xs">
                  <CircleDot className="w-3.5 h-3.5 text-rose-400" /> رندر خروجی با افکت
                </button>
              ) : (
                <button onClick={stopCapture} className="omni-btn bg-rose-600 text-white text-xs">
                  <Square className="w-3.5 h-3.5" /> توقف رندر
                </button>
              )}
            </div>
          </div>

          {videoUrl ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <video
                ref={videoRef}
                src={videoUrl}
                controls
                onLoadedMetadata={() => {
                  if (videoRef.current) videoRef.current.playbackRate = playbackRate;
                }}
                className="w-full rounded-xl bg-black max-h-64"
              />
              <canvas ref={canvasRef} className="w-full rounded-xl bg-slate-950 border border-violet-500/30 max-h-64 object-contain" />
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-xs text-slate-400">
              یک فایل ویدیو انتخاب کنید تا پیش‌نمایش زنده افکت‌ها، پرده سبز (Chroma Key)، تغییر سرعت و زیرنویس فعال شود.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-900/60 p-3 rounded-xl space-y-2">
              <div className="font-bold">سرعت پخش (Slow-Mo / Time-lapse): {playbackRate}x</div>
              <input
                type="range"
                min={0.25}
                max={4}
                step={0.25}
                value={playbackRate}
                onChange={(e) => {
                  const r = Number(e.target.value);
                  setPlaybackRate(r);
                  if (videoRef.current) videoRef.current.playbackRate = r;
                }}
                className="w-full"
              />
            </div>
            <div className="bg-slate-900/60 p-3 rounded-xl space-y-2">
              <label className="flex items-center gap-2 font-bold">
                <input type="checkbox" checked={chromaEnabled} onChange={(e) => setChromaEnabled(e.target.checked)} />
                حذف پرده سبز (Chroma Key)
              </label>
              <input type="range" min={10} max={95} value={chromaSensitivity} onChange={(e) => setChromaSensitivity(Number(e.target.value))} className="w-full" />
            </div>
            <div className="bg-slate-900/60 p-3 rounded-xl space-y-2">
              <div className="font-bold">فیلتر سینمایی ویدیو</div>
              <select className="omni-input text-xs" value={filterCss} onChange={(e) => setFilterCss(e.target.value)}>
                <option value="none">بدون فیلتر</option>
                <option value="contrast(1.3) saturate(1.4)">سینمایی HDR</option>
                <option value="grayscale(1) contrast(1.4)">سیاه‌وسفید کلاسیک</option>
                <option value="sepia(0.55) contrast(1.1)">نوستالژی وینتیج</option>
                <option value="hue-rotate(190deg) saturate(1.7)">سایبرپانک نئون</option>
              </select>
            </div>
          </div>

          <input className="omni-input text-xs" value={subtitleText} onChange={(e) => setSubtitleText(e.target.value)} placeholder="متن زیرنویس زنده روی ویدیو..." />
        </div>
      )}

      {/* Subtitles Editor */}
      {tab === 'subtitles' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2"><Subtitles className="w-4 h-4 text-cyan-400" /> ویرایشگر زیرنویس SRT / WebVTT</h3>
          <textarea rows={8} className="omni-input font-mono text-xs" dir="ltr" value={srtContent} onChange={(e) => setSrtContent(e.target.value)} />
          <div className="flex gap-2">
            <button
              onClick={() => {
                const vtt = 'WEBVTT\n\n' + srtContent.replace(/,/g, '.');
                const a = document.createElement('a');
                a.href = URL.createObjectURL(new Blob([vtt], { type: 'text/vtt' }));
                a.download = 'subtitles.vtt';
                a.click();
                onToast('فایل زیرنویس WebVTT دانلود شد', 'success');
              }}
              className="omni-btn omni-btn-primary text-xs"
            >
              تبدیل و دانلود VTT
            </button>
            <button
              onClick={() => {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(new Blob([srtContent], { type: 'text/plain' }));
                a.download = 'subtitles.srt';
                a.click();
              }}
              className="omni-btn omni-btn-secondary text-xs"
            >
              دانلود SRT
            </button>
          </div>
        </div>
      )}

      {/* Screen & Webcam Recorder */}
      {tab === 'recorder' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2"><Monitor className="w-4 h-4 text-rose-400" /> ضبط صفحه‌نمایش، بازی و وب‌کم (WebM)</h3>
          <div className="flex flex-wrap gap-2">
            {!recording ? (
              <>
                <button onClick={() => startCapture('webcam')} className="omni-btn omni-btn-primary"><Video className="w-4 h-4" /> شروع ضبط دوربین</button>
                <button onClick={() => startCapture('screen')} className="omni-btn omni-btn-secondary"><Monitor className="w-4 h-4" /> شروع ضبط صفحه‌نمایش</button>
              </>
            ) : (
              <button onClick={stopCapture} className="omni-btn bg-rose-600 text-white"><Square className="w-4 h-4" /> توقف و ذخیره ویدیو</button>
            )}
          </div>
          {recordedUrl && (
            <div className="space-y-2">
              <video src={recordedUrl} controls className="w-full rounded-xl max-h-72 bg-black" />
              <a href={recordedUrl} download={`omniforge-rec-${Date.now()}.webm`} className="omni-btn omni-btn-primary text-xs">
                <Download className="w-4 h-4" /> دانلود ویدیو ضبط‌شده
              </a>
            </div>
          )}
        </div>
      )}

      {/* Teleprompter */}
      {tab === 'teleprompter' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-bold text-sm flex items-center gap-2"><ScrollText className="w-4 h-4 text-amber-400" /> تله‌پرامپتر حرفه‌ای (اسکرول خودکار + آینه)</h3>
            <div className="flex items-center gap-2 text-xs">
              <button onClick={() => setPromptScrolling(!promptScrolling)} className="omni-btn omni-btn-primary text-xs">
                {promptScrolling ? '⏸ توقف' : '▶ شروع اسکرول'}
              </button>
              <button onClick={() => setPromptMirror(!promptMirror)} className="omni-btn omni-btn-secondary text-xs">
                🪞 آینه {promptMirror ? 'فعال' : 'خاموش'}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span>سرعت اسکرول: {promptSpeed}</span>
            <input type="range" min={1} max={8} value={promptSpeed} onChange={(e) => setPromptSpeed(Number(e.target.value))} className="flex-1" />
          </div>
          <div
            ref={prompterBoxRef}
            style={{ transform: promptMirror ? 'scaleX(-1)' : 'none' }}
            className="h-56 overflow-y-auto rounded-xl bg-black p-6 text-2xl font-bold leading-loose text-amber-200 border border-amber-500/30 whitespace-pre-wrap"
          >
            {promptScript}
          </div>
          <textarea rows={3} className="omni-input text-xs" value={promptScript} onChange={(e) => setPromptScript(e.target.value)} />
        </div>
      )}

      {/* AI Scriptwriter */}
      {tab === 'ai' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2"><Sparkles className="w-4 h-4 text-cyan-400" /> فیلمنامه‌نویس، استوری‌برد و سناریوساز AI</h3>
          <input className="omni-input" value={scriptTopic} onChange={(e) => setScriptTopic(e.target.value)} />
          <button
            onClick={async () => {
              const res = await askFreeAi(`Write a scene-by-scene video storyboard & script in Persian for: ${scriptTopic}`);
              setAiScript(res.reply);
            }}
            className="omni-btn omni-btn-primary"
          >
            تولید فیلمنامه و استوری‌برد
          </button>
          {aiScript && <div className="rounded-xl bg-slate-900 p-4 text-sm whitespace-pre-wrap leading-relaxed">{aiScript}</div>}
        </div>
      )}
    </div>
  );
};
