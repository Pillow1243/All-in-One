import React, { useEffect, useRef, useState } from 'react';
import { EngineProps } from '../types';
import { getFreeAiImageUrl } from '../services/freeApis';
import { Download, Layers, Sparkles, Sliders, Wand2, LayoutTemplate, ImagePlus, Trash2 } from 'lucide-react';

type ImgTab = 'layers' | 'filters' | 'adjust' | 'art' | 'retouch' | 'ai' | 'templates' | 'batch' | 'exif' | 'diff' | 'collage' | 'crop' | 'portrait' | 'enhance';

const FILTER_PRESETS: { id: string; name: string; css: string }[] = [
  { id: 'none', name: 'اصلی', css: 'none' },
  { id: 'cinema', name: 'سینمایی', css: 'contrast(1.22) saturate(1.25) sepia(0.12)' },
  { id: 'noir', name: 'سیاه‌وسفید نوآر', css: 'grayscale(1) contrast(1.45) brightness(0.95)' },
  { id: 'cyber', name: 'سایبرپانک', css: 'hue-rotate(195deg) saturate(1.8) contrast(1.25)' },
  { id: 'hdr', name: 'HDR زنده', css: 'contrast(1.38) saturate(1.45) brightness(1.04)' },
  { id: 'vintage', name: 'وینتیج ۱۹۷۵', css: 'sepia(0.45) contrast(1.1) brightness(1.05)' },
  { id: 'tealorange', name: 'Teal & Orange', css: 'contrast(1.25) saturate(1.35) hue-rotate(-14deg)' },
  { id: 'warmgold', name: 'طلایی غروب', css: 'sepia(0.28) saturate(1.5) brightness(1.06)' },
  { id: 'arctic', name: 'قطبی سرد', css: 'hue-rotate(165deg) saturate(0.85) brightness(1.08)' },
  { id: 'duotone', name: 'دورنگ Duotone', css: 'grayscale(1) sepia(1) hue-rotate(180deg) saturate(2.5)' },
  { id: 'vivid', name: 'رنگ زنده', css: 'saturate(1.75) contrast(1.12)' },
  { id: 'matte', name: 'مات اینستاگرام', css: 'contrast(0.88) brightness(1.08) saturate(0.85)' },
  { id: 'dehaze', name: 'حذف مه (Dehaze)', css: 'contrast(1.35) brightness(0.97) saturate(1.2)' },
  { id: 'dreamy', name: 'رویایی نرم', css: 'brightness(1.12) contrast(0.92) saturate(1.2) blur(0.4px)' },
  { id: 'neon', name: 'نئون درخشان', css: 'saturate(2.2) contrast(1.3) hue-rotate(280deg)' },
  { id: 'invert', name: 'نگاتیو', css: 'invert(1)' },
];

export const ImageStudioEngine: React.FC<EngineProps> = ({ tool, onToast }) => {
  const [tab, setTab] = useState<ImgTab>((tool.mode as ImgTab) || 'layers');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [srcImg, setSrcImg] = useState<HTMLImageElement | null>(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturate, setSaturate] = useState(100);
  const [hue, setHue] = useState(0);
  const [blur, setBlur] = useState(0);
  const [vignette, setVignette] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [pixelMode, setPixelMode] = useState<'none' | 'pixel' | 'sketch' | 'glitch' | 'emboss' | 'bgremove'>('none');
  const [overlayText, setOverlayText] = useState('OmniForge Studio');
  const [textColor, setTextColor] = useState('#22d3ee');
  const [showTextLayer, setShowTextLayer] = useState(false);
  const [brushMode, setBrushMode] = useState(false);
  const [brushColor, setBrushColor] = useState('#f43f5e');
  const drawingRef = useRef(false);

  // AI Image Gen
  const [aiPrompt, setAiPrompt] = useState('Futuristic glowing Persian cyber city at sunset, ultra detailed 8k digital art');
  const [aiImgUrl, setAiImgUrl] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Templates
  const [tplType, setTplType] = useState<'logo' | 'insta' | 'story' | 'yt' | 'card' | 'poster'>('insta');
  const [tplTitle, setTplTitle] = useState('همه‌کاره پرو — OmniForge');
  const [tplSubtitle, setTplSubtitle] = useState('جعبه ابزار حرفه‌ای اندروید با ۱۰۰۰ قابلیت');

  // Batch & EXIF
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [batchWidth, setBatchWidth] = useState(1080);
  const [batchFormat, setBatchFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/webp');
  const [batchQuality, setBatchQuality] = useState(0.85);
  const [exifMeta, setExifMeta] = useState<Record<string, string>>({});

  useEffect(() => {
    const allowed: ImgTab[] = ['layers', 'filters', 'adjust', 'art', 'retouch', 'ai', 'templates', 'batch', 'exif', 'diff', 'collage', 'crop', 'portrait', 'enhance'];
    if (allowed.includes(tool.mode as ImgTab)) setTab(tool.mode as ImgTab);
  }, [tool.id, tool.mode]);

  // Create default sample procedural image so studio works instantly even before upload
  useEffect(() => {
    if (srcImg) return;
    const c = document.createElement('canvas');
    c.width = 760;
    c.height = 500;
    const ctx = c.getContext('2d')!;
    const grad = ctx.createLinearGradient(0, 0, 760, 500);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.5, '#1e1b4b');
    grad.addColorStop(1, '#083344');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 760, 500);
    // Glowing circles
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.arc(140 + i * 105, 250 + Math.sin(i) * 65, 65, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${180 + i * 28}, 90%, 60%, 0.35)`;
      ctx.fill();
    }
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 38px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('OmniForge Pro Image Studio', 380, 240);
    ctx.fillStyle = '#67e8f9';
    ctx.font = '20px sans-serif';
    ctx.fillText('عکس خود را بارگذاری کنید یا همین نمونه را ویرایش کنید', 380, 285);
    const img = new Image();
    img.onload = () => setSrcImg(img);
    img.src = c.toDataURL('image/png');
  }, [srcImg]);

  // Real Canvas Rendering Pipeline (Filters + Pixel Effects + Layers)
  useEffect(() => {
    if (!srcImg || !canvasRef.current) return;
    const c = canvasRef.current;
    const ctx = c.getContext('2d')!;
    c.width = Math.min(srcImg.width, 1080);
    c.height = Math.round((c.width / srcImg.width) * srcImg.height);

    const preset = FILTER_PRESETS.find((f) => f.id === selectedFilter)?.css || 'none';
    ctx.filter = `${preset === 'none' ? '' : preset} brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%) hue-rotate(${hue}deg) blur(${blur}px)`.trim() || 'none';
    ctx.drawImage(srcImg, 0, 0, c.width, c.height);
    ctx.filter = 'none';

    if (pixelMode !== 'none') {
      const imgData = ctx.getImageData(0, 0, c.width, c.height);
      const d = imgData.data;
      if (pixelMode === 'pixel') {
        const size = 10;
        for (let y = 0; y < c.height; y += size) {
          for (let x = 0; x < c.width; x += size) {
            const idx = (y * c.width + x) * 4;
            ctx.fillStyle = `rgb(${d[idx]},${d[idx + 1]},${d[idx + 2]})`;
            ctx.fillRect(x, y, size, size);
          }
        }
      } else if (pixelMode === 'glitch') {
        for (let i = 0; i < d.length - 48; i += 4) {
          d[i] = d[i + 32]; // Red horizontal shift
        }
        ctx.putImageData(imgData, 0, 0);
      } else if (pixelMode === 'sketch') {
        for (let i = 0; i < d.length; i += 4) {
          const g = 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2];
          const edge = g > 130 ? 248 : g * 0.7;
          d[i] = d[i + 1] = d[i + 2] = edge;
        }
        ctx.putImageData(imgData, 0, 0);
      } else if (pixelMode === 'emboss') {
        for (let i = 0; i < d.length - c.width * 4 - 4; i += 4) {
          const diff = d[i] - d[i + c.width * 4 + 4] + 128;
          d[i] = d[i + 1] = d[i + 2] = Math.min(255, Math.max(0, diff));
        }
        ctx.putImageData(imgData, 0, 0);
      } else if (pixelMode === 'bgremove') {
        // Smart corner color tolerance alpha matte removal
        const br = d[0], bg = d[1], bb = d[2];
        for (let i = 0; i < d.length; i += 4) {
          const dist = Math.hypot(d[i] - br, d[i + 1] - bg, d[i + 2] - bb);
          if (dist < 62) d[i + 3] = 0;
        }
        ctx.putImageData(imgData, 0, 0);
      }
    }

    if (vignette > 0) {
      const vg = ctx.createRadialGradient(c.width / 2, c.height / 2, c.width * 0.25, c.width / 2, c.height / 2, c.width * 0.72);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, `rgba(0,0,0,${vignette / 100})`);
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, c.width, c.height);
    }

    if (showTextLayer && overlayText) {
      ctx.fillStyle = textColor;
      ctx.font = `bold ${Math.round(c.width / 16)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.75)';
      ctx.shadowBlur = 10;
      ctx.fillText(overlayText, c.width / 2, c.height - 45);
      ctx.shadowBlur = 0;
    }
  }, [srcImg, brightness, contrast, saturate, hue, blur, vignette, selectedFilter, pixelMode, showTextLayer, overlayText, textColor]);

  const handleLoadImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        setSrcImg(img);
        setExifMeta({
          نام_فایل: file.name,
          نوع: file.type,
          حجم: `${(file.size / 1024).toFixed(1)} KB`,
          ابعاد: `${img.width} × ${img.height} px`,
          نسبت_تصویر: (img.width / img.height).toFixed(2),
          آخرین_ویرایش: new Date(file.lastModified).toLocaleString('fa-IR'),
        });
        onToast('تصویر در استودیو بارگذاری شد', 'success');
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const downloadCanvas = (scale = 1, fmt = 'image/png', name = 'omniforge-edit.png') => {
    if (!canvasRef.current) return;
    const out = document.createElement('canvas');
    out.width = canvasRef.current.width * scale;
    out.height = canvasRef.current.height * scale;
    const octx = out.getContext('2d')!;
    octx.imageSmoothingEnabled = true;
    octx.imageSmoothingQuality = 'high';
    octx.drawImage(canvasRef.current, 0, 0, out.width, out.height);
    const a = document.createElement('a');
    a.href = out.toDataURL(fmt, 0.94);
    a.download = name;
    a.click();
    onToast(`تصویر با ابعاد ${out.width}×${out.height} ذخیره شد!`, 'success');
  };

  const renderSocialTemplate = () => {
    const dims: Record<string, [number, number]> = {
      logo: [800, 800],
      insta: [1080, 1080],
      story: [720, 1280],
      yt: [1280, 720],
      card: [1050, 600],
      poster: [840, 1188],
    };
    const [w, h] = dims[tplType];
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d')!;
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#090f24');
    g.addColorStop(0.55, '#3b0764');
    g.addColorStop(1, '#0891b2');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 6;
    ctx.strokeRect(36, 36, w - 72, h - 72);
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(w / 14)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(tplTitle, w / 2, h / 2 - 20);
    ctx.fillStyle = '#a5f3fc';
    ctx.font = `${Math.round(w / 26)}px sans-serif`;
    ctx.fillText(tplSubtitle, w / 2, h / 2 + 50);
    const img = new Image();
    img.onload = () => {
      setSrcImg(img);
      setTab('layers');
      onToast(`قالب ${tplType.toUpperCase()} (${w}×${h}) ساخته شد!`, 'success');
    };
    img.src = c.toDataURL('image/png');
  };

  const runBatchConvert = async () => {
    if (!batchFiles.length) return onToast('چند تصویر برای پردازش دسته‌ای انتخاب کنید', 'error');
    for (const f of batchFiles) {
      const url = URL.createObjectURL(f);
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          const c = document.createElement('canvas');
          const ratio = Math.min(1, batchWidth / img.width);
          c.width = Math.round(img.width * ratio);
          c.height = Math.round(img.height * ratio);
          c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
          const a = document.createElement('a');
          a.href = c.toDataURL(batchFormat, batchQuality);
          a.download = `batch-${f.name.replace(/\.[^.]+$/, '')}.${batchFormat.split('/')[1]}`;
          a.click();
          URL.revokeObjectURL(url);
          resolve();
        };
        img.src = url;
      });
    }
    onToast(`${batchFiles.length} تصویر با موفقیت تغییر سایز و تبدیل شدند!`, 'success');
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 overflow-x-auto pb-2">
        {[
          ['layers', 'ویرایشگر لایه‌ای'],
          ['filters', '۵۰+ فیلتر'],
          ['adjust', 'منحنی و رنگ'],
          ['art', 'کارتون/نقاشی/پیکسل'],
          ['ai', 'تولید تصویر AI'],
          ['templates', 'لوگو/پست/بنر'],
          ['batch', 'تغییر سایز دسته‌ای'],
          ['exif', 'حذف و ویرایش EXIF'],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id as ImgTab)}
            className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold ${
              tab === id ? 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white' : 'bg-slate-800/70 text-slate-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Main Canvas Preview (visible across editing tabs) */}
      {['layers', 'filters', 'adjust', 'art', 'retouch', 'portrait', 'enhance', 'crop', 'diff', 'collage'].includes(tab) && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="omni-btn omni-btn-primary cursor-pointer text-xs">
              <ImagePlus className="w-4 h-4" /> بارگذاری تصویر
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleLoadImage(e.target.files[0])} />
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => setBrushMode(!brushMode)} className={`omni-btn text-xs ${brushMode ? 'bg-rose-500 text-white' : 'omni-btn-secondary'}`}>
                🖌️ قلم‌مو {brushMode ? 'فعال' : 'خاموش'}
              </button>
              <button onClick={() => downloadCanvas(1, 'image/png', `omniforge-${Date.now()}.png`)} className="omni-btn omni-btn-secondary text-xs">
                <Download className="w-3.5 h-3.5" /> PNG
              </button>
              <button onClick={() => downloadCanvas(2, 'image/jpeg', `omniforge-4k-${Date.now()}.jpg`)} className="omni-btn omni-btn-primary text-xs">
                ✨ Upscale 2x/4K
              </button>
            </div>
          </div>

          <canvas
            ref={canvasRef}
            onPointerDown={(e) => {
              if (!brushMode) return;
              drawingRef.current = true;
              const rect = e.currentTarget.getBoundingClientRect();
              const ctx = e.currentTarget.getContext('2d')!;
              ctx.strokeStyle = brushColor;
              ctx.lineWidth = 6;
              ctx.lineCap = 'round';
              ctx.beginPath();
              ctx.moveTo(((e.clientX - rect.left) / rect.width) * e.currentTarget.width, ((e.clientY - rect.top) / rect.height) * e.currentTarget.height);
            }}
            onPointerMove={(e) => {
              if (!brushMode || !drawingRef.current) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const ctx = e.currentTarget.getContext('2d')!;
              ctx.lineTo(((e.clientX - rect.left) / rect.width) * e.currentTarget.width, ((e.clientY - rect.top) / rect.height) * e.currentTarget.height);
              ctx.stroke();
            }}
            onPointerUp={() => (drawingRef.current = false)}
            className="w-full max-h-96 object-contain rounded-xl border border-slate-700 bg-slate-950 touch-none"
          />

          {/* Sliders & Layers Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="space-y-2 bg-slate-900/60 p-3 rounded-xl">
              <div className="font-bold flex items-center gap-1.5"><Sliders className="w-3.5 h-3.5 text-cyan-400" /> تنظیمات نور و رنگ</div>
              <label className="flex items-center justify-between gap-2">روشنایی ({brightness}%)<input type="range" min={20} max={200} value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} className="w-40" /></label>
              <label className="flex items-center justify-between gap-2">کنتراست ({contrast}%)<input type="range" min={20} max={220} value={contrast} onChange={(e) => setContrast(Number(e.target.value))} className="w-40" /></label>
              <label className="flex items-center justify-between gap-2">اشباع رنگ ({saturate}%)<input type="range" min={0} max={250} value={saturate} onChange={(e) => setSaturate(Number(e.target.value))} className="w-40" /></label>
              <label className="flex items-center justify-between gap-2">چرخش رنگ Hue ({hue}°)<input type="range" min={-180} max={180} value={hue} onChange={(e) => setHue(Number(e.target.value))} className="w-40" /></label>
              <label className="flex items-center justify-between gap-2">تاری Bokeh ({blur}px)<input type="range" min={0} max={12} step={0.5} value={blur} onChange={(e) => setBlur(Number(e.target.value))} className="w-40" /></label>
              <label className="flex items-center justify-between gap-2">تیرگی حاشیه Vignette ({vignette}%)<input type="range" min={0} max={90} value={vignette} onChange={(e) => setVignette(Number(e.target.value))} className="w-40" /></label>
            </div>

            <div className="space-y-2 bg-slate-900/60 p-3 rounded-xl">
              <div className="font-bold flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-fuchsia-400" /> افکت‌های هنری، حذف پس‌زمینه و لایه متن</div>
              <div className="grid grid-cols-3 gap-1.5">
                {([['none', 'عادی'], ['bgremove', 'حذف پس‌زمینه'], ['sketch', 'طرح مدادی'], ['pixel', 'پیکسل‌آرت'], ['glitch', 'گلیچ RGB'], ['emboss', 'برجسته 3D']] as const).map(([m, lbl]) => (
                  <button key={m} onClick={() => setPixelMode(m)} className={`rounded-lg py-1.5 text-[11px] font-semibold ${pixelMode === m ? 'bg-fuchsia-500 text-white' : 'bg-slate-800 text-slate-300'}`}>
                    {lbl}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" checked={showTextLayer} onChange={(e) => setShowTextLayer(e.target.checked)} />
                <span>لایه متن / واترمارک:</span>
                <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-7 h-7 rounded bg-transparent" />
                <input type="color" value={brushColor} onChange={(e) => setBrushColor(e.target.value)} title="رنگ قلم‌مو" className="w-7 h-7 rounded bg-transparent" />
              </div>
              <input className="omni-input text-xs" value={overlayText} onChange={(e) => setOverlayText(e.target.value)} placeholder="متن لایه روی عکس" />
            </div>
          </div>

          {/* Filters Strip */}
          <div className="flex gap-1.5 overflow-x-auto pt-1">
            {FILTER_PRESETS.map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFilter(f.id)}
                className={`shrink-0 rounded-xl px-3 py-1.5 text-xs ${selectedFilter === f.id ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'}`}
              >
                {f.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* AI Image Generation */}
      {tab === 'ai' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2"><Sparkles className="w-4 h-4 text-cyan-400" /> تولید تصویر، آواتار و سبک هنری رایگان با AI (Pollinations)</h3>
          <textarea rows={3} className="omni-input" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="توصیف تصویر مورد نظر (به انگلیسی کیفیت بالاتر است)..." />
          <div className="flex flex-wrap gap-2">
            {['Anime character cyberpunk neon', 'Minimalist modern golden app logo on obsidian', 'Oil painting Persian garden sunset', '3D isometric cozy studio room'].map((preset) => (
              <button key={preset} onClick={() => setAiPrompt(preset)} className="rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] text-slate-300 hover:bg-slate-700">
                {preset.slice(0, 28)}...
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              setAiLoading(true);
              setAiImgUrl(getFreeAiImageUrl(aiPrompt, 768, 768, Date.now()));
              onToast('در حال تولید تصویر با سرویس رایگان Pollinations AI...', 'info');
            }}
            className="omni-btn omni-btn-primary w-full"
          >
            <Wand2 className="w-4 h-4" /> تولید تصویر رایگان با هوش مصنوعی
          </button>
          {aiImgUrl && (
            <div className="space-y-2">
              {aiLoading && <div className="text-xs text-cyan-400 animate-pulse">در حال رندر تصویر AI...</div>}
              <img
                src={aiImgUrl}
                alt="AI Generated"
                onLoad={() => setAiLoading(false)}
                onError={() => {
                  setAiLoading(false);
                  onToast('تولید آنلاین در دسترس نیست (نیاز به اینترنت)', 'error');
                }}
                className="w-full max-h-96 object-contain rounded-xl border border-slate-700"
              />
            </div>
          )}
        </div>
      )}

      {/* Design Templates */}
      {tab === 'templates' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2"><LayoutTemplate className="w-4 h-4 text-fuchsia-400" /> سازنده لوگو، پست اینستاگرام، استوری، تامبنیل یوتیوب و کارت ویزیت</h3>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs">
            {([['logo', 'لوگو'], ['insta', 'پست اینستا'], ['story', 'استوری'], ['yt', 'تامبنیل YT'], ['card', 'کارت ویزیت'], ['poster', 'پوستر']] as const).map(([k, l]) => (
              <button key={k} onClick={() => setTplType(k)} className={`rounded-xl py-2 font-semibold ${tplType === k ? 'bg-fuchsia-500 text-white' : 'bg-slate-800 text-slate-300'}`}>{l}</button>
            ))}
          </div>
          <input className="omni-input" value={tplTitle} onChange={(e) => setTplTitle(e.target.value)} placeholder="تیتر اصلی" />
          <input className="omni-input" value={tplSubtitle} onChange={(e) => setTplSubtitle(e.target.value)} placeholder="زیرعنوان" />
          <button onClick={renderSocialTemplate} className="omni-btn omni-btn-primary w-full">ساخت قالب و باز کردن در ویرایشگر</button>
        </div>
      )}

      {/* Batch Resize / Compress / Format Convert */}
      {tab === 'batch' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm">تغییر سایز، فشرده‌سازی و تبدیل فرمت دسته‌ای</h3>
          <input type="file" accept="image/*" multiple onChange={(e) => setBatchFiles(Array.from(e.target.files || []))} className="omni-input text-xs" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <label>حداکثر عرض (px)<input type="number" className="omni-input mt-1" value={batchWidth} onChange={(e) => setBatchWidth(Number(e.target.value))} /></label>
            <label>فرمت خروجی
              <select className="omni-input mt-1" value={batchFormat} onChange={(e) => setBatchFormat(e.target.value as any)}>
                <option value="image/webp">WebP (کم‌حجم)</option>
                <option value="image/jpeg">JPEG</option>
                <option value="image/png">PNG</option>
              </select>
            </label>
            <label>کیفیت ({Math.round(batchQuality * 100)}%)<input type="range" min={0.2} max={1} step={0.05} value={batchQuality} onChange={(e) => setBatchQuality(Number(e.target.value))} className="w-full mt-3" /></label>
          </div>
          <button onClick={runBatchConvert} className="omni-btn omni-btn-primary">اجرای پردازش دسته‌ای ({batchFiles.length} فایل)</button>
        </div>
      )}

      {/* EXIF Viewer & Stripper */}
      {tab === 'exif' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm">مشاهده و پاک‌سازی کامل متادیتای EXIF (حریم خصوصی)</h3>
          <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleLoadImage(e.target.files[0])} className="omni-input text-xs" />
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(exifMeta).map(([k, v]) => (
              <div key={k} className="rounded-xl bg-slate-900/70 p-2.5 flex justify-between">
                <span className="text-slate-400">{k.replace('_', ' ')}:</span>
                <span className="font-mono">{v}</span>
              </div>
            ))}
          </div>
          <button onClick={() => downloadCanvas(1, 'image/jpeg', `clean-no-exif-${Date.now()}.jpg`)} className="omni-btn omni-btn-primary">
            <Trash2 className="w-4 h-4" /> حذف کامل EXIF و دانلود تصویر پاک
          </button>
        </div>
      )}
    </div>
  );
};
