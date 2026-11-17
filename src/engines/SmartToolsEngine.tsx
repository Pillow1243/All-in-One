import React, { useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { marked } from 'marked';
import {
  ArrowLeftRight, Braces, CalendarClock, CaseSensitive, Copy, Download, Fingerprint,
  Hash, KeyRound, ListChecks, Palette, Percent, QrCode, RefreshCw, Shuffle, Sparkles,
  Table2, Timer, Type, Wallet, Wand2, Image as ImageIcon,
} from 'lucide-react';
import { EngineProps } from '../types';
import {
  buildPalette, calcPercentage, compareUnitPrice, contrastRatio, convertCase, diffJson,
  exactAge, explainCron, formatBytes, formatJalali, formatTimestamp, fromJalali, generateId,
  generatePassphrase, jsonToCsv, loremFa, luhnValid, numberToPersianWords, parseCsv,
  passphraseEntropyBits, pickRandom, qrPayload, toEnglishDigits, toPersianDigits, toSlug,
  validateNationalId, validateSheba, wcagGrade, type CaseMode, type PercentageMode,
} from '../services/smartTools';

type SmartMode =
  | 'words' | 'slug' | 'jsoncsv' | 'jsondiff' | 'cron' | 'ids' | 'time' | 'cases'
  | 'passphrase' | 'qr' | 'cards' | 'unitprice' | 'datediff' | 'percent' | 'color'
  | 'image' | 'csv' | 'markdown' | 'lorem' | 'random' | 'bill' | 'b64';

const MODES: { id: SmartMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'words', label: 'عدد به حروف', icon: Type },
  { id: 'slug', label: 'اسلاگ و شناسه', icon: Fingerprint },
  { id: 'jsoncsv', label: 'JSON ↔ CSV', icon: Braces },
  { id: 'jsondiff', label: 'مقایسه JSON', icon: ArrowLeftRight },
  { id: 'cron', label: 'توضیح Cron', icon: Timer },
  { id: 'ids', label: 'UUID / ULID', icon: Hash },
  { id: 'time', label: 'تاریخ و تایم‌استمپ', icon: CalendarClock },
  { id: 'cases', label: 'حالت متن', icon: CaseSensitive },
  { id: 'passphrase', label: 'عبارت عبور', icon: KeyRound },
  { id: 'qr', label: 'سازنده QR', icon: QrCode },
  { id: 'cards', label: 'اعتبارسنجی کارت/شبا', icon: Wallet },
  { id: 'unitprice', label: 'قیمت واحد', icon: Percent },
  { id: 'datediff', label: 'اختلاف تاریخ', icon: CalendarClock },
  { id: 'percent', label: 'درصد و تخفیف', icon: Percent },
  { id: 'color', label: 'آزمایشگاه رنگ', icon: Palette },
  { id: 'image', label: 'تصویر ↔ Base64', icon: ImageIcon },
  { id: 'csv', label: 'نمایشگر CSV', icon: Table2 },
  { id: 'markdown', label: 'پیش‌نمایش Markdown', icon: Sparkles },
  { id: 'lorem', label: 'متن نمونه فارسی', icon: ListChecks },
  { id: 'random', label: 'انتخاب تصادفی', icon: Shuffle },
  { id: 'bill', label: 'تقسیم صورتحساب', icon: Wallet },
  { id: 'b64', label: 'Base64 متن', icon: Braces },
];

const CopyButton: React.FC<{ value: string; onToast: EngineProps['onToast']; label?: string }> = ({ value, onToast, label = 'کپی' }) => (
  <button
    type="button"
    onClick={async () => {
      try {
        await navigator.clipboard.writeText(value);
        onToast('در حافظه کپی شد ✓', 'success');
      } catch {
        onToast('کپی ممکن نشد', 'error');
      }
    }}
    className="omni-btn omni-btn-secondary !px-2.5 !py-1.5 text-[11px] shrink-0"
  >
    <Copy className="w-3.5 h-3.5" /> {label}
  </button>
);

const Panel: React.FC<{ title: string; hint: string; children: React.ReactNode; action?: React.ReactNode }> = ({
  title, hint, children, action,
}) => (
  <section className="smart-panel">
    <div className="flex items-start justify-between gap-3">
      <div>
        <h3 className="font-black text-sm sm:text-base">{title}</h3>
        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{hint}</p>
      </div>
      {action}
    </div>
    <div className="mt-3 space-y-3">{children}</div>
  </section>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block space-y-1">
    <span className="text-[11px] font-bold text-slate-400">{label}</span>
    {children}
  </label>
);

const Result: React.FC<{ children: React.ReactNode; tone?: 'default' | 'good' | 'bad' }> = ({ children, tone = 'default' }) => (
  <div
    className={`rounded-xl border px-3 py-2.5 font-mono text-xs leading-relaxed break-words ${
      tone === 'good'
        ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
        : tone === 'bad'
          ? 'border-rose-400/40 bg-rose-500/10 text-rose-200'
          : 'border-white/10 bg-slate-950/60 text-slate-200'
    }`}
  >
    {children}
  </div>
);

export const SmartToolsEngine: React.FC<EngineProps> = ({ tool, onToast, settings }) => {
  const [mode, setMode] = useState<SmartMode>((tool.mode as SmartMode) || 'words');
  const isRtl = settings.language === 'fa' || settings.language === 'ar';

  useEffect(() => {
    if (MODES.some((m) => m.id === tool.mode)) setMode(tool.mode as SmartMode);
  }, [tool.id, tool.mode]);

  // words / slug / cases
  const [numberInput, setNumberInput] = useState('1234567');
  const [slugInput, setSlugInput] = useState('همه‌کاره پرو ۲۰۲۶ — OmniForge Pro');
  const [caseInput, setCaseInput] = useState('omni forge pro smart tools');
  const [caseMode, setCaseMode] = useState<CaseMode>('camel');

  // json ↔ csv + diff
  const [jsonInput, setJsonInput] = useState('[\n  { "name": "علی", "age": 31, "city": "تهران" },\n  { "name": "Sara", "age": 27, "city": "Shiraz" }\n]');
  const [csvOutput, setCsvOutput] = useState('');
  const [jsonLeft, setJsonLeft] = useState('{ "name": "OmniForge", "version": "1.0.0", "tools": 995 }');
  const [jsonRight, setJsonRight] = useState('{ "name": "OmniForge Pro", "version": "3.0.0", "tools": 1072 }');

  // cron
  const [cronExpr, setCronExpr] = useState('*/15 9-18 * * 1-5');

  // ids
  const [idKind, setIdKind] = useState<'uuid' | 'ulid' | 'nano'>('uuid');
  const [idList, setIdList] = useState<string[]>([]);

  // time
  const [timestamp, setTimestamp] = useState(String(Math.floor(Date.now() / 1000)));
  const [jalaliInput, setJalaliInput] = useState(formatJalali(new Date()));

  // passphrase
  const [wordCount, setWordCount] = useState(4);
  const [passphraseSeed, setPassphraseSeed] = useState(3);

  // qr
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [qrKind, setQrKind] = useState<'text' | 'wifi' | 'vcard' | 'sms'>('text');
  const [qrFields, setQrFields] = useState<Record<string, string>>({
    text: 'https://github.com/Pillow1243/All-in-One',
    ssid: 'OmniForge-WiFi',
    password: 'super-secret-pass',
    security: 'WPA',
    name: 'OmniForge Pro',
    org: 'OmniForge',
    phone: '+989120000000',
    email: 'hello@omniforge.app',
    url: 'https://github.com/Pillow1243/All-in-One',
    message: 'سلام از OmniForge Pro',
  });

  // cards
  const [cardInput, setCardInput] = useState('6104337712345678');

  // unit price
  const [priceA, setPriceA] = useState(120000);
  const [qtyA, setQtyA] = useState(1500);
  const [priceB, setPriceB] = useState(95000);
  const [qtyB, setQtyB] = useState(1000);

  // dates
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().slice(0, 10));
  const [dateTo, setDateTo] = useState(new Date(Date.now() + 45 * 86400000).toISOString().slice(0, 10));
  const [birthDate, setBirthDate] = useState('1995-04-18');

  // percent
  const [percentMode, setPercentMode] = useState<PercentageMode>('of');
  const [percentA, setPercentA] = useState(20);
  const [percentB, setPercentB] = useState(250000);

  // color
  const [baseColor, setBaseColor] = useState('#12b8a6');
  const [fgColor, setFgColor] = useState('#ffffff');

  // image
  const [imageBase64, setImageBase64] = useState('');
  const [imageMeta, setImageMeta] = useState('');

  // csv viewer
  const [csvText, setCsvText] = useState('name,release,version,tools\nOmniForge,ANVIL,3.0.0,1072\nInterface,Industrial,Yellow-black,32');
  // markdown
  const [markdownText, setMarkdownText] = useState('## OmniForge Pro · ANVIL\n\n- ۳۲ دسته‌بندی\n- **۱۰۷۲** ابزار\n- کارگاه صنعتی با ۱۲ ماژول محاسباتی\n\n> رابط صنعتی زرد و مشکی');
  // lorem
  const [loremParas, setLoremParas] = useState(2);
  const [loremSentences, setLoremSentences] = useState(3);
  // bill split
  const [billTotal, setBillTotal] = useState(1250000);
  const [billPeople, setBillPeople] = useState(4);
  const [billTip, setBillTip] = useState(10);
  // text base64
  const [b64Text, setB64Text] = useState('سلام OmniForge Pro 2.0');
  const [b64Mode, setB64Mode] = useState<'encode' | 'decode'>('encode');
  // random
  const [randomPool, setRandomPool] = useState('علی\nسارا\nرضا\nمریم\nکیان');
  const [randomCount, setRandomCount] = useState(2);
  const [randomSeed, setRandomSeed] = useState(42);
  const [randomResult, setRandomResult] = useState<string[]>([]);

  const wordsResult = useMemo(() => numberToPersianWords(numberInput), [numberInput]);
  const slugResult = useMemo(() => toSlug(slugInput), [slugInput]);
  const caseResult = useMemo(() => convertCase(caseInput, caseMode), [caseInput, caseMode]);
  const cronResult = useMemo(() => explainCron(cronExpr), [cronExpr]);
  const timeResult = useMemo(() => formatTimestamp(Number(toEnglishDigits(timestamp)) || 0), [timestamp]);
  const passphrase = useMemo(() => generatePassphrase(wordCount, '-', passphraseSeed), [wordCount, passphraseSeed]);
  const cardChecks = useMemo(() => {
    const digits = toEnglishDigits(cardInput).replace(/[^0-9]/g, '');
    return {
      card: digits.length >= 12 ? luhnValid(digits) : null,
      sheba: cardInput.toUpperCase().includes('IR') || digits.length === 24 ? validateSheba(cardInput) : null,
      national: digits.length === 10 ? validateNationalId(digits) : null,
    };
  }, [cardInput]);
  const unitCompare = useMemo(() => compareUnitPrice(priceA, qtyA, priceB, qtyB), [priceA, qtyA, priceB, qtyB]);
  const dateStats = useMemo(() => {
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    const days = Math.round((to.getTime() - from.getTime()) / 86400000);
    const birth = new Date(birthDate);
    return {
      days,
      weeks: Math.round((days / 7) * 10) / 10,
      months: Math.round((days / 30.44) * 10) / 10,
      age: Number.isNaN(birth.getTime()) ? null : exactAge(birth),
    };
  }, [dateFrom, dateTo, birthDate]);
  const percentResult = useMemo(() => calcPercentage(percentMode, percentA, percentB), [percentMode, percentA, percentB]);
  const palette = useMemo(() => buildPalette(baseColor, 6), [baseColor]);
  const contrast = useMemo(() => {
    const ratio = contrastRatio(baseColor, fgColor);
    return { ratio, grade: wcagGrade(ratio) };
  }, [baseColor, fgColor]);
  const csvRows = useMemo(() => parseCsv(csvText).slice(0, 60), [csvText]);
  const markdownHtml = useMemo(
    () =>
      String(marked.parse(markdownText, { async: false }))
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/ on[a-z]+="[^"]*"/gi, ''),
    [markdownText],
  );
  const loremResult = useMemo(() => loremFa(loremParas, loremSentences, 5), [loremParas, loremSentences]);
  const billResult = useMemo(() => {
    const total = Number.isFinite(billTotal) ? billTotal : 0;
    const people = Math.max(1, billPeople || 1);
    const tipAmount = (total * Math.max(0, billTip)) / 100;
    const grand = total + tipAmount;
    return { tipAmount, grand, perPerson: grand / people, total, people };
  }, [billTotal, billPeople, billTip]);
  const b64Result = useMemo(() => {
    try {
      if (b64Mode === 'encode') {
        const bytes = new TextEncoder().encode(b64Text);
        let binary = '';
        bytes.forEach((b) => { binary += String.fromCharCode(b); });
        return btoa(binary);
      }
      const binary = atob(b64Text.trim());
      const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
      return new TextDecoder().decode(bytes);
    } catch {
      return 'ورودی Base64 معتبر نیست';
    }
  }, [b64Text, b64Mode]);
  const qrValue = useMemo(() => qrPayload(qrKind, qrFields), [qrKind, qrFields]);

  // Live QR rendering
  useEffect(() => {
    const canvas = qrCanvasRef.current;
    if (!canvas || mode !== 'qr') return;
    QRCode.toCanvas(canvas, qrValue || 'OmniForge Pro', {
      width: 260,
      margin: 1,
      color: { dark: '#0b1020', light: '#ffffff' },
    }).catch(() => {});
  }, [qrValue, mode]);

  const convertJsonToCsv = () => {
    try {
      setCsvOutput(jsonToCsv(JSON.parse(jsonInput)));
      onToast('تبدیل انجام شد ✓', 'success');
    } catch {
      onToast('JSON نامعتبر است', 'error');
    }
  };

  const jsonDiffResult = useMemo(() => {
    try {
      return { rows: diffJson(JSON.parse(jsonLeft), JSON.parse(jsonRight)), error: '' };
    } catch {
      return { rows: [], error: 'یکی از دو JSON نامعتبر است' };
    }
  }, [jsonLeft, jsonRight]);

  const downloadQr = () => {
    const canvas = qrCanvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'omniforge-qr.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    onToast('تصویر QR ذخیره شد ✓', 'success');
  };

  const renderPanel = () => {
    switch (mode) {
      case 'words':
        return (
          <Panel title="تبدیل عدد به حروف فارسی" hint="برای چک، فاکتور و قرارداد — با پشتیبانی از تومان و میلیارد" action={<CopyButton value={wordsResult} onToast={onToast} />}>
            <Field label="عدد (لاتین یا فارسی)">
              <input dir="ltr" className="omni-input font-mono" value={numberInput} onChange={(e) => setNumberInput(e.target.value)} />
            </Field>
            <Result tone="good">{wordsResult || 'عددی وارد کنید'}</Result>
            <div className="flex flex-wrap gap-2">
              {['500000', '2500000', '1200000000', '987654321'].map((preset) => (
                <button key={preset} onClick={() => setNumberInput(preset)} className="chip">{toPersianDigits(preset)}</button>
              ))}
            </div>
          </Panel>
        );

      case 'slug':
        return (
          <Panel title="اسلاگ و شناسه لاتین" hint="آواگردانی درست فارسی به لاتین برای URL، نام فایل و SEO" action={<CopyButton value={slugResult} onToast={onToast} />}>
            <Field label="متن فارسی/انگلیسی">
              <input className="omni-input" value={slugInput} onChange={(e) => setSlugInput(e.target.value)} />
            </Field>
            <Result tone="good">{slugResult || '—'}</Result>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-xl bg-slate-950/60 border border-white/10 p-2 font-mono break-all">underscore: {slugResult.replace(/-/g, '_')}</div>
              <div className="rounded-xl bg-slate-950/60 border border-white/10 p-2 font-mono break-all">dots: {slugResult.replace(/-/g, '.')}</div>
            </div>
          </Panel>
        );

      case 'jsoncsv':
        return (
          <Panel title="JSON ↔ CSV" hint="تبدیل آرایه‌ای از آبجکت‌ها به CSV و بالعکس، بدون ارسال داده به سرور">
            <Field label="JSON ورودی">
              <textarea className="omni-input font-mono text-[11px] min-h-[130px]" value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} dir="ltr" />
            </Field>
            <div className="flex gap-2">
              <button className="omni-btn omni-btn-primary text-xs" onClick={convertJsonToCsv}>JSON → CSV</button>
              <button
                className="omni-btn omni-btn-secondary text-xs"
                onClick={() => {
                  try {
                    const rows = parseCsv(csvOutput);
                    const [header, ...body] = rows;
                    const objects = body.map((row) => Object.fromEntries(header.map((h, i) => [h, row[i] ?? ''])));
                    setJsonInput(JSON.stringify(objects, null, 2));
                    onToast('CSV به JSON تبدیل شد ✓', 'success');
                  } catch {
                    onToast('ابتدا CSV بسازید', 'error');
                  }
                }}
              >
                CSV → JSON
              </button>
              <CopyButton value={csvOutput} onToast={onToast} label="کپی CSV" />
            </div>
            <Field label="خروجی CSV">
              <textarea className="omni-input font-mono text-[11px] min-h-[130px]" value={csvOutput} readOnly dir="ltr" placeholder="اینجا خروجی CSV ظاهر می‌شود..." />
            </Field>
          </Panel>
        );

      case 'jsondiff':
        return (
          <Panel title="مقایسه ساختاری JSON" hint="تفاوت کلیدها و مقادیر را با path دقیق نشان می‌دهد">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              <Field label="JSON قدیمی">
                <textarea className="omni-input font-mono text-[11px] min-h-[110px]" value={jsonLeft} onChange={(e) => setJsonLeft(e.target.value)} dir="ltr" />
              </Field>
              <Field label="JSON جدید">
                <textarea className="omni-input font-mono text-[11px] min-h-[110px]" value={jsonRight} onChange={(e) => setJsonRight(e.target.value)} dir="ltr" />
              </Field>
            </div>
            {jsonDiffResult.error ? (
              <Result tone="bad">{jsonDiffResult.error}</Result>
            ) : jsonDiffResult.rows.length === 0 ? (
              <Result tone="good">دو سند یکسان هستند ✓</Result>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full text-[11px]">
                  <thead className="bg-slate-900/80 text-slate-400">
                    <tr><th className="text-start p-2">مسیر</th><th className="text-start p-2">قبل</th><th className="text-start p-2">بعد</th></tr>
                  </thead>
                  <tbody>
                    {jsonDiffResult.rows.map((row) => (
                      <tr key={row.path} className="border-t border-white/5 font-mono">
                        <td className="p-2 text-cyan-300" dir="ltr">{row.path}</td>
                        <td className="p-2 text-rose-300" dir="ltr">{row.before}</td>
                        <td className="p-2 text-emerald-300" dir="ltr">{row.after}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        );

      case 'cron':
        return (
          <Panel title="توضیح‌گر Cron" hint="عبارت ۵ فیلدی را به فارسی روان ترجمه می‌کند" action={<CopyButton value={cronResult.description} onToast={onToast} />}>
            <Field label="عبارت Cron">
              <input dir="ltr" className="omni-input font-mono" value={cronExpr} onChange={(e) => setCronExpr(e.target.value)} />
            </Field>
            <Result tone={cronResult.valid ? 'good' : 'bad'}>{cronResult.description}</Result>
            <div className="flex flex-wrap gap-1.5">
              {['*/5 * * * *', '0 * * * *', '0 9 * * 1-5', '30 2 1 * *', '0 0 * * 5'].map((preset) => (
                <button key={preset} onClick={() => setCronExpr(preset)} className="chip font-mono">{preset}</button>
              ))}
            </div>
          </Panel>
        );

      case 'ids':
        return (
          <Panel title="تولید شناسه یکتا" hint="UUID v4، ULID زمان‌مرتب و NanoID — همه با crypto امن">
            <div className="flex flex-wrap gap-2">
              {(['uuid', 'ulid', 'nano'] as const).map((kind) => (
                <button key={kind} onClick={() => setIdKind(kind)} className={`chip ${idKind === kind ? 'chip-active' : ''}`}>{kind.toUpperCase()}</button>
              ))}
              <button
                className="omni-btn omni-btn-primary text-xs"
                onClick={() => {
                  setIdList((prev) => [generateId(idKind), ...prev].slice(0, 8));
                  onToast('شناسه جدید ساخته شد', 'success');
                }}
              >
                <RefreshCw className="w-3.5 h-3.5" /> ساخت
              </button>
            </div>
            <div className="space-y-1.5">
              {(idList.length ? idList : ['— هنوز شناسه‌ای ساخته نشده —']).map((id, index) => (
                <div key={`${id}-${index}`} className="flex items-center gap-2 rounded-xl bg-slate-950/60 border border-white/10 px-3 py-2">
                  <code className="font-mono text-[11px] flex-1 break-all" dir="ltr">{id}</code>
                  {id !== '— هنوز شناسه‌ای ساخته نشده —' && <CopyButton value={id} onToast={onToast} label="" />}
                </div>
              ))}
            </div>
          </Panel>
        );

      case 'time':
        return (
          <Panel title="تاریخ، تایم‌استمپ و شمسی" hint="تبدیل دوطرفه Unix ↔ میلادی ↔ جلالی با زمان نسبی">
            <Field label="تایم‌استمپ (ثانیه یا میلی‌ثانیه)">
              <div className="flex gap-2">
                <input dir="ltr" className="omni-input font-mono" value={timestamp} onChange={(e) => setTimestamp(e.target.value)} />
                <button className="omni-btn omni-btn-secondary text-xs shrink-0" onClick={() => setTimestamp(String(Math.floor(Date.now() / 1000)))}>اکنون</button>
              </div>
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <Result><span className="text-slate-400">جلالی: </span>{timeResult.jalali}</Result>
              <Result><span className="text-slate-400">میلادی: </span>{timeResult.gregorian}</Result>
              <Result><span className="text-slate-400">ISO: </span>{timeResult.iso}</Result>
              <Result><span className="text-slate-400">نسبی: </span>{timeResult.relative}</Result>
            </div>
            <Field label="تاریخ جلالی (YYYY/MM/DD) → میلادی">
              <div className="flex gap-2">
                <input dir="ltr" className="omni-input font-mono" value={jalaliInput} onChange={(e) => setJalaliInput(e.target.value)} />
                <button
                  className="omni-btn omni-btn-secondary text-xs shrink-0"
                  onClick={() => {
                    const [jy, jm, jd] = toEnglishDigits(jalaliInput).split(/[\/\-.]/).map(Number);
                    if (!jy || !jm || !jd) return onToast('قالب تاریخ درست نیست', 'error');
                    const date = fromJalali(jy, jm, jd);
                    setTimestamp(String(Math.floor(date.getTime() / 1000)));
                    onToast(`${jy}/${jm}/${jd} → ${date.toISOString().slice(0, 10)}`, 'success');
                  }}
                >
                  تبدیل
                </button>
              </div>
            </Field>
          </Panel>
        );

      case 'cases':
        return (
          <Panel title="تبدیل حالت متن" hint="camelCase، snake_case، kebab-case و Title Case برای متغیرها و فایل‌ها" action={<CopyButton value={caseResult} onToast={onToast} />}>
            <Field label="متن ورودی">
              <input className="omni-input" value={caseInput} onChange={(e) => setCaseInput(e.target.value)} />
            </Field>
            <div className="flex flex-wrap gap-1.5">
              {(['camel', 'pascal', 'snake', 'kebab', 'constant', 'title', 'sentence'] as CaseMode[]).map((m) => (
                <button key={m} onClick={() => setCaseMode(m)} className={`chip font-mono ${caseMode === m ? 'chip-active' : ''}`}>{m}</button>
              ))}
            </div>
            <Result tone="good">{caseResult || '—'}</Result>
          </Panel>
        );

      case 'passphrase':
        return (
          <Panel title="عبارت عبور به‌یادماندنی" hint="ترکیب واژه‌های فارسی با آنتروپی قابل محاسبه — امن‌تر از رمزهای کوتاه">
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-[11px] font-bold text-slate-400">تعداد واژه: {toPersianDigits(wordCount)}</label>
              <input type="range" min={3} max={8} value={wordCount} onChange={(e) => setWordCount(Number(e.target.value))} className="flex-1 min-w-[140px]" />
              <button className="omni-btn omni-btn-primary text-xs" onClick={() => setPassphraseSeed((s) => s + 1)}>
                <RefreshCw className="w-3.5 h-3.5" /> واژه‌های تازه
              </button>
            </div>
            <Result tone="good">
              <span className="text-base">{passphrase}</span>
            </Result>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-xl border border-white/10 bg-slate-950/60 p-2">آنتروپی: <strong className="text-emerald-300">{toPersianDigits(passphraseEntropyBits(wordCount))} بیت</strong></div>
              <div className="rounded-xl border border-white/10 bg-slate-950/60 p-2">تخمین شکستن: <strong className="text-cyan-300">{wordCount >= 5 ? 'قرن‌ها' : wordCount === 4 ? 'چند سال' : 'چند ماه'}</strong></div>
            </div>
            <CopyButton value={passphrase} onToast={onToast} label="کپی عبارت" />
          </Panel>
        );

      case 'qr':
        return (
          <Panel title="سازنده QR" hint="متن، وای‌فای، کارت ویزیت و پیامک — کاملاً آفلاین" action={<button onClick={downloadQr} className="omni-btn omni-btn-secondary text-[11px]"><Download className="w-3.5 h-3.5" /> PNG</button>}>
            <div className="flex flex-wrap gap-1.5">
              {([['text', 'متن/لینک'], ['wifi', 'وای‌فای'], ['vcard', 'کارت ویزیت'], ['sms', 'پیامک']] as const).map(([id, label]) => (
                <button key={id} onClick={() => setQrKind(id)} className={`chip ${qrKind === id ? 'chip-active' : ''}`}>{label}</button>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-3 items-start">
              <div className="space-y-2">
                {qrKind === 'text' && (
                  <Field label="متن">
                    <textarea className="omni-input min-h-[80px]" value={qrFields.text} onChange={(e) => setQrFields({ ...qrFields, text: e.target.value })} />
                  </Field>
                )}
                {qrKind === 'wifi' && (
                  <>
                    <Field label="نام شبکه (SSID)"><input className="omni-input" value={qrFields.ssid} onChange={(e) => setQrFields({ ...qrFields, ssid: e.target.value })} /></Field>
                    <Field label="رمز"><input className="omni-input" value={qrFields.password} onChange={(e) => setQrFields({ ...qrFields, password: e.target.value })} /></Field>
                  </>
                )}
                {qrKind === 'vcard' && (
                  <>
                    <Field label="نام"><input className="omni-input" value={qrFields.name} onChange={(e) => setQrFields({ ...qrFields, name: e.target.value })} /></Field>
                    <Field label="شرکت"><input className="omni-input" value={qrFields.org} onChange={(e) => setQrFields({ ...qrFields, org: e.target.value })} /></Field>
                    <Field label="تلفن"><input className="omni-input" value={qrFields.phone} onChange={(e) => setQrFields({ ...qrFields, phone: e.target.value })} /></Field>
                  </>
                )}
                {qrKind === 'sms' && (
                  <>
                    <Field label="شماره"><input className="omni-input" value={qrFields.phone} onChange={(e) => setQrFields({ ...qrFields, phone: e.target.value })} /></Field>
                    <Field label="متن پیام"><input className="omni-input" value={qrFields.message} onChange={(e) => setQrFields({ ...qrFields, message: e.target.value })} /></Field>
                  </>
                )}
                <Result>{qrValue}</Result>
              </div>
              <div className="rounded-2xl bg-white p-2 mx-auto">
                <canvas ref={qrCanvasRef} className="rounded-lg" />
              </div>
            </div>
          </Panel>
        );

      case 'cards':
        return (
          <Panel title="اعتبارسنجی کارت، شبا و کد ملی" hint="الگوریتم Luhn، چک‌سام ISO 13616 و کد ملی ایران — بدون ارسال داده">
            <Field label="شماره کارت / شبا / کد ملی">
              <input dir="ltr" className="omni-input font-mono" value={cardInput} onChange={(e) => setCardInput(e.target.value)} />
            </Field>
            <div className="grid gap-2 text-xs">
              <Result tone={cardChecks.card === null ? 'default' : cardChecks.card ? 'good' : 'bad'}>
                کارت بانکی: {cardChecks.card === null ? 'طول نامعتبر' : cardChecks.card ? 'شماره معتبر است ✓' : 'شماره نامعتبر ✗'}
              </Result>
              {cardChecks.sheba && (
                <Result tone={cardChecks.sheba.valid ? 'good' : 'bad'}>
                  شبا: {cardChecks.sheba.valid ? 'معتبر ✓' : 'نامعتبر ✗'} — {cardChecks.sheba.normalized}
                </Result>
              )}
              {cardChecks.national !== null && (
                <Result tone={cardChecks.national ? 'good' : 'bad'}>
                  کد ملی: {cardChecks.national ? 'معتبر ✓' : 'نامعتبر ✗'}
                </Result>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['6104337712345678', 'IR820540102680020817909002', '0012345678'].map((sample) => (
                <button key={sample} onClick={() => setCardInput(sample)} className="chip font-mono">{sample}</button>
              ))}
            </div>
          </Panel>
        );

      case 'unitprice':
        return (
          <Panel title="مقایسه قیمت واحد" hint="کدام بسته واقعاً ارزان‌تر است؟ قیمت به ازای هر گرم/میلی‌لیتر را مقایسه کنید">
            <div className="grid grid-cols-2 gap-2">
              <Field label="قیمت بسته A"><input type="number" className="omni-input font-mono" value={priceA} onChange={(e) => setPriceA(Number(e.target.value))} /></Field>
              <Field label="مقدار A (گرم/میلی‌لیتر)"><input type="number" className="omni-input font-mono" value={qtyA} onChange={(e) => setQtyA(Number(e.target.value))} /></Field>
              <Field label="قیمت بسته B"><input type="number" className="omni-input font-mono" value={priceB} onChange={(e) => setPriceB(Number(e.target.value))} /></Field>
              <Field label="مقدار B (گرم/میلی‌لیتر)"><input type="number" className="omni-input font-mono" value={qtyB} onChange={(e) => setQtyB(Number(e.target.value))} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Result>واحد A: {unitCompare.pricePerUnitA.toFixed(2)}</Result>
              <Result>واحد B: {unitCompare.pricePerUnitB.toFixed(2)}</Result>
            </div>
            <Result tone="good">
              {unitCompare.winner === 'equal'
                ? 'هر دو گزینه قیمت یکسانی دارند'
                : `بسته ${unitCompare.winner === 'a' ? 'A' : 'B'} ارزان‌تر است — ${toPersianDigits(unitCompare.savingsPct)}٪ صرفه‌جویی`}
            </Result>
          </Panel>
        );

      case 'datediff':
        return (
          <Panel title="اختلاف تاریخ و سن" hint="فاصله دو تاریخ + محاسبه سن دقیق به سال، ماه و روز" action={<CopyButton value={`${dateStats.days} روز`} onToast={onToast} />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Field label="از تاریخ"><input type="date" className="omni-input" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></Field>
              <Field label="تا تاریخ"><input type="date" className="omni-input" value={dateTo} onChange={(e) => setDateTo(e.target.value)} /></Field>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-xl border border-white/10 bg-slate-950/60 p-2"><div className="text-lg font-black text-cyan-300">{toPersianDigits(dateStats.days)}</div><div className="text-slate-400">روز</div></div>
              <div className="rounded-xl border border-white/10 bg-slate-950/60 p-2"><div className="text-lg font-black text-violet-300">{toPersianDigits(dateStats.weeks)}</div><div className="text-slate-400">هفته</div></div>
              <div className="rounded-xl border border-white/10 bg-slate-950/60 p-2"><div className="text-lg font-black text-emerald-300">{toPersianDigits(dateStats.months)}</div><div className="text-slate-400">ماه</div></div>
            </div>
            <Field label="تاریخ تولد (محاسبه سن دقیق)">
              <input type="date" className="omni-input" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
            </Field>
            {dateStats.age && (
              <Result tone="good">
                {toPersianDigits(`${dateStats.age.years} سال و ${dateStats.age.months} ماه و ${dateStats.age.days} روز`)} — مجموع {toPersianDigits(dateStats.age.totalDays.toLocaleString('en-US'))} روز
              </Result>
            )}
          </Panel>
        );

      case 'percent':
        return (
          <Panel title="درصد، تخفیف و تغییر" hint="چهار حالت پرکاربرد با محاسبه لحظه‌ای">
            <div className="flex flex-wrap gap-1.5">
              {([['of', 'X٪ از Y'], ['change', 'درصد تغییر'], ['discount', 'قیمت با تخفیف'], ['reverse', 'X چند٪ از Y']] as const).map(([id, label]) => (
                <button key={id} onClick={() => setPercentMode(id)} className={`chip ${percentMode === id ? 'chip-active' : ''}`}>{label}</button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="مقدار اول"><input type="number" className="omni-input font-mono" value={percentA} onChange={(e) => setPercentA(Number(e.target.value))} /></Field>
              <Field label="مقدار دوم"><input type="number" className="omni-input font-mono" value={percentB} onChange={(e) => setPercentB(Number(e.target.value))} /></Field>
            </div>
            <Result tone="good">
              نتیجه: {toPersianDigits(Number(percentResult.toFixed(2)).toLocaleString('en-US'))}
            </Result>
          </Panel>
        );

      case 'color':
        return (
          <Panel title="آزمایشگاه رنگ و کنتراست" hint="پالت مشتق‌شده + نسبت کنتراست WCAG برای دسترسی‌پذیری" action={<CopyButton value={palette.join(', ')} onToast={onToast} />}>
            <div className="grid grid-cols-2 gap-2">
              <Field label="رنگ پایه"><input type="color" className="omni-input !p-1 h-11" value={baseColor} onChange={(e) => setBaseColor(e.target.value)} /></Field>
              <Field label="رنگ متن"><input type="color" className="omni-input !p-1 h-11" value={fgColor} onChange={(e) => setFgColor(e.target.value)} /></Field>
            </div>
            <div className="flex rounded-xl overflow-hidden border border-white/10 h-20" style={{ background: baseColor, color: fgColor }}>
              <div className="m-auto text-xs font-bold">پیش‌نمایش متن روی رنگ</div>
            </div>
            <div className="grid grid-cols-6 gap-1.5">
              {palette.map((color) => (
                <button key={color} onClick={() => setBaseColor(color)} className="h-12 rounded-lg border border-white/10" style={{ background: color }} title={color} />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Result>نسبت کنتراست: {toPersianDigits(contrast.ratio)}:1</Result>
              <Result tone={contrast.grade.normal === 'Fail' ? 'bad' : 'good'}>سطح WCAG: {contrast.grade.normal} (متن بزرگ: {contrast.grade.large})</Result>
            </div>
          </Panel>
        );

      case 'image':
        return (
          <Panel title="تصویر ↔ Base64" hint="برای جاسازی در CSS/JSON یا بررسی حجم داده — پردازش محلی">
            <input
              type="file"
              accept="image/*"
              className="omni-input text-xs"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  setImageBase64(String(reader.result));
                  setImageMeta(`${file.name} — ${formatBytes(file.size)}`);
                  onToast('تصویر به Base64 تبدیل شد ✓', 'success');
                };
                reader.readAsDataURL(file);
              }}
            />
            {imageBase64 && (
              <>
                <div className="flex items-center gap-3">
                  <img src={imageBase64} alt="preview" className="w-20 h-20 object-cover rounded-xl border border-white/10" />
                  <div className="text-[11px] text-slate-400 space-y-1">
                    <div>{imageMeta}</div>
                    <div>حجم Base64: {formatBytes(imageBase64.length)}</div>
                    <CopyButton value={imageBase64} onToast={onToast} label="کپی Base64" />
                  </div>
                </div>
                <textarea readOnly dir="ltr" className="omni-input font-mono text-[10px] min-h-[90px]" value={imageBase64.slice(0, 4000)} />
              </>
            )}
          </Panel>
        );

      case 'csv':
        return (
          <Panel title="نمایشگر CSV" hint="چسباندن CSV و مشاهده جدولی با شمارش ردیف و ستون">
            <Field label="محتوای CSV">
              <textarea dir="ltr" className="omni-input font-mono text-[11px] min-h-[110px]" value={csvText} onChange={(e) => setCsvText(e.target.value)} />
            </Field>
            <div className="text-[11px] text-slate-400">
              {toPersianDigits(csvRows.length)} ردیف · {toPersianDigits(csvRows[0]?.length ?? 0)} ستون
            </div>
            <div className="overflow-auto max-h-72 rounded-xl border border-white/10">
              <table className="w-full text-[11px]">
                <tbody>
                  {csvRows.map((row, index) => (
                    <tr key={index} className={index === 0 ? 'bg-slate-900/80 font-bold' : 'border-t border-white/5'}>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="p-2 whitespace-nowrap">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        );

      case 'markdown':
        return (
          <Panel title="پیش‌نمایش Markdown" hint="با پاک‌سازی اسکریپت‌ها — مناسب یادداشت و مستندسازی">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              <Field label="Markdown">
                <textarea className="omni-input font-mono text-[11px] min-h-[220px]" value={markdownText} onChange={(e) => setMarkdownText(e.target.value)} dir="ltr" />
              </Field>
              <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3 min-h-[220px] overflow-auto text-xs leading-relaxed md-preview" dangerouslySetInnerHTML={{ __html: markdownHtml }} />
            </div>
          </Panel>
        );

      case 'lorem':
        return (
          <Panel title="متن نمونه فارسی" hint="متن پرکننده طبیعی برای طراحی و تست رابط کاربری" action={<CopyButton value={loremResult} onToast={onToast} />}>
            <div className="grid grid-cols-2 gap-2">
              <Field label={`پاراگراف: ${toPersianDigits(loremParas)}`}>
                <input type="range" min={1} max={5} value={loremParas} onChange={(e) => setLoremParas(Number(e.target.value))} className="w-full" />
              </Field>
              <Field label={`جمله در هر پاراگراف: ${toPersianDigits(loremSentences)}`}>
                <input type="range" min={1} max={6} value={loremSentences} onChange={(e) => setLoremSentences(Number(e.target.value))} className="w-full" />
              </Field>
            </div>
            <Result>{loremResult}</Result>
          </Panel>
        );

      case 'random':
        return (
          <Panel title="انتخاب تصادفی قابل بازتولید" hint="قرعه‌کشی با seed ثابت — نتیجه همیشه قابل بازبینی است">
            <Field label="گزینه‌ها (هر خط یک مورد)">
              <textarea className="omni-input text-xs min-h-[100px]" value={randomPool} onChange={(e) => setRandomPool(e.target.value)} />
            </Field>
            <div className="grid grid-cols-3 gap-2">
              <Field label="تعداد انتخاب"><input type="number" min={1} className="omni-input font-mono" value={randomCount} onChange={(e) => setRandomCount(Number(e.target.value))} /></Field>
              <Field label="Seed"><input type="number" className="omni-input font-mono" value={randomSeed} onChange={(e) => setRandomSeed(Number(e.target.value))} /></Field>
              <div className="flex items-end">
                <button
                  className="omni-btn omni-btn-primary text-xs w-full"
                  onClick={() => setRandomResult(pickRandom(randomPool.split('\n').map((s) => s.trim()).filter(Boolean), randomCount, randomSeed))}
                >
                  <Shuffle className="w-3.5 h-3.5" /> انتخاب
                </button>
              </div>
            </div>
            {randomResult.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {randomResult.map((item, index) => (
                  <span key={`${item}-${index}`} className="rounded-xl bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-400/30 px-3 py-1.5 text-xs font-bold">
                    {toPersianDigits(index + 1)}. {item}
                  </span>
                ))}
              </div>
            )}
          </Panel>
        );


      case 'bill':
        return (
          <Panel title="تقسیم صورتحساب و انعام" hint="مبلغ کل، تعداد نفرات و درصد انعام را وارد کنید">
            <div className="grid grid-cols-3 gap-2">
              <Field label="مبلغ کل"><input type="number" className="omni-input font-mono" value={billTotal} onChange={(e) => setBillTotal(Number(e.target.value))} /></Field>
              <Field label="تعداد نفرات"><input type="number" min={1} className="omni-input font-mono" value={billPeople} onChange={(e) => setBillPeople(Number(e.target.value))} /></Field>
              <Field label="انعام ٪"><input type="number" min={0} className="omni-input font-mono" value={billTip} onChange={(e) => setBillTip(Number(e.target.value))} /></Field>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-xl border border-white/10 bg-slate-950/60 p-2"><div className="text-lg font-black text-cyan-300">{toPersianDigits(Math.round(billResult.perPerson).toLocaleString('en-US'))}</div><div className="text-slate-400">سهم هر نفر</div></div>
              <div className="rounded-xl border border-white/10 bg-slate-950/60 p-2"><div className="text-lg font-black text-amber-300">{toPersianDigits(Math.round(billResult.tipAmount).toLocaleString('en-US'))}</div><div className="text-slate-400">انعام</div></div>
              <div className="rounded-xl border border-white/10 bg-slate-950/60 p-2"><div className="text-lg font-black text-emerald-300">{toPersianDigits(Math.round(billResult.grand).toLocaleString('en-US'))}</div><div className="text-slate-400">جمع نهایی</div></div>
            </div>
            <Result tone="good">{numberToPersianWords(Math.round(billResult.perPerson))} تومان برای هر نفر</Result>
          </Panel>
        );

      case 'b64':
        return (
          <Panel title="Base64 متن (UTF-8)" hint="پشتیبانی کامل از فارسی و ایموجی — بدون خرابی کاراکترها" action={<CopyButton value={b64Result} onToast={onToast} />}>
            <div className="flex gap-1.5">
              {([['encode', 'متن → Base64'], ['decode', 'Base64 → متن']] as const).map(([id, label]) => (
                <button key={id} onClick={() => setB64Mode(id)} className={`chip ${b64Mode === id ? 'chip-active' : ''}`}>{label}</button>
              ))}
            </div>
            <Field label={b64Mode === 'encode' ? 'متن ورودی' : 'Base64 ورودی'}>
              <textarea dir={b64Mode === 'encode' ? 'auto' : 'ltr'} className="omni-input font-mono text-xs min-h-[100px]" value={b64Text} onChange={(e) => setB64Text(e.target.value)} />
            </Field>
            <Result tone="good">{b64Result}</Result>
          </Panel>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5 overflow-x-auto pb-1 omni-scroll">
        {MODES.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setMode(item.id)}
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-bold transition ${
                mode === item.id
                  ? 'bg-gradient-to-r from-cyan-500 to-violet-500 text-white shadow-lg shadow-cyan-500/20'
                  : 'bg-slate-800/70 text-slate-300 hover:bg-slate-700/80'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>
      {renderPanel()}
      <div className="text-[10px] text-slate-500 text-center">
        {isRtl ? 'همه محاسبات روی همین دستگاه انجام می‌شود؛ هیچ داده‌ای ارسال نمی‌شود.' : 'Everything is computed on-device. Nothing is uploaded.'}
        <span className="mx-1">·</span>
        <Wand2 className="inline w-3 h-3" />
      </div>
    </div>
  );
};

export default SmartToolsEngine;
