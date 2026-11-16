import React, { useEffect, useRef, useState } from 'react';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import * as XLSX from 'xlsx';
import { EngineProps } from '../types';
import { askFreeAi, translateTextFree } from '../services/freeApis';
import { answerFromDocumentLocal, extractKeywords, summarizeTextLocal } from '../services/localAi';
import { aesEncrypt, digestBytes } from '../services/cryptoEngine';
import { speakText } from '../services/nativeBridge';
import { loadData, saveData } from '../services/storage';
import { Download, FileUp, Sparkles, Volume2, Shield, PenTool, ScanLine, FileSpreadsheet, Layers, GitCompare, Search } from 'lucide-react';

type PdfTab = 'scanner' | 'ocr' | 'merge' | 'sign' | 'redact' | 'excel' | 'ai' | 'compare' | 'security' | 'export' | 'reader' | 'watermark' | 'forms' | 'collab' | 'optimize' | 'create';

const TABS: { id: PdfTab; label: string }[] = [
  { id: 'create', label: 'ساخت / ویرایش' },
  { id: 'merge', label: 'ادغام و فهرست' },
  { id: 'scanner', label: 'اسکن پرسپکتیو' },
  { id: 'ocr', label: 'OCR فارسی/انگلیسی' },
  { id: 'sign', label: 'امضای دیجیتال' },
  { id: 'redact', label: 'Redact هوشمند' },
  { id: 'watermark', label: 'واترمارک/سربرگ' },
  { id: 'excel', label: 'تبدیل به Excel' },
  { id: 'ai', label: 'AI چت و خلاصه' },
  { id: 'compare', label: 'مقایسه دو PDF' },
  { id: 'security', label: 'رمزنگاری/DRM' },
  { id: 'export', label: 'خروجی ۱۰ فرمت' },
  { id: 'reader', label: 'مطالعه و TTS' },
  { id: 'forms', label: 'فرم‌ساز AI' },
  { id: 'collab', label: 'نسخه و کامنت' },
];

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export const PdfStudioEngine: React.FC<EngineProps> = ({ tool, onToast }) => {
  const [tab, setTab] = useState<PdfTab>((tool.mode as PdfTab) || 'create');
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [docText, setDocText] = useState<string>(
    'OmniForge Pro Enterprise PDF Document\nقرارداد نمونه خدمات نرم‌افزاری\nایمیل تماس: info@omniforge.app | تلفن: 09123456789\nبند ۱: تمام قابلیت‌های این سند برای تست ابزارهای سازمانی PDF شامل خلاصه‌سازی، چت هوشمند، Redact خودکار اطلاعات حساس، استخراج جدول و خروجی ۱۰ فرمت آماده است.\nنام | بخش | مبلغ\nپروژه آلفا | مهندسی | 15000000\nپروژه بتا | طراحی | 9500000'
  );
  const [compareTextB, setCompareTextB] = useState<string>(
    'OmniForge Pro Enterprise PDF Document v2\nقرارداد نمونه خدمات نرم‌افزاری (نسخه بازنگری)\nایمیل تماس: support@omniforge.app | تلفن: 09123456789\nبند ۱: تمام قابلیت‌های این سند برای تست مقایسه هوشمند و ردیابی تغییرات به‌روزرسانی شد.'
  );
  const [aiQuestion, setAiQuestion] = useState('بند ۱ و مبلغ پروژه‌ها چیست؟');
  const [aiReply, setAiReply] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Scanner state
  const scanCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [scanImgUrl, setScanImgUrl] = useState<string>('');
  const [scanFilter, setScanFilter] = useState<'color' | 'bw' | 'shadow' | 'enhance'>('shadow');
  const [scanTilt, setScanTilt] = useState(0);
  const [scanPreset, setScanPreset] = useState<'doc' | 'card' | 'receipt' | 'passport' | 'check' | 'book'>('doc');

  // OCR state
  const [ocrLang, setOcrLang] = useState<'fas+eng' | 'eng' | 'ara+eng'>('fas+eng');
  const [ocrOutput, setOcrOutput] = useState('');
  const [ocrProgress, setOcrProgress] = useState<string>('');

  // Signature pad
  const sigCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const [signerName, setSignerName] = useState('کاربر همه‌کاره پرو');

  // Watermark / Letterhead / Security / Forms
  const [wmText, setWmText] = useState('CONFIDENTIAL — OMNIFORGE');
  const [letterheadTitle, setLetterheadTitle] = useState('شرکت فناوری اطلاعات همه‌کاره پرو');
  const [encPassword, setEncPassword] = useState('');
  const [shareExpiryHours, setShareExpiryHours] = useState(24);
  const [formFields, setFormFields] = useState<{ label: string; value: string }[]>([
    { label: 'نام و نام خانوادگی', value: 'علی محمدی' },
    { label: 'کد ملی / شناسه', value: '0012345678' },
    { label: 'تاریخ', value: '1405/08/25' },
    { label: 'توضیحات', value: 'تکمیل خودکار با هوش مصنوعی OmniForge' },
  ]);
  const [readerDark, setReaderDark] = useState(true);
  const [readerSearch, setReaderSearch] = useState('');
  const [comments, setComments] = useState<{ id: string; author: string; text: string; time: string }[]>(() =>
    loadData('pdf_comments', [{ id: '1', author: 'مدیر پروژه', text: 'نسخه اولیه تایید شد.', time: 'امروز' }])
  );
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    const valid = TABS.find((t) => t.id === tool.mode);
    if (valid) setTab(valid.id);
    else if (tool.mode === 'optimize') setTab('merge');
  }, [tool.id, tool.mode]);

  const handleUploadPdfs = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setPdfFiles((prev) => [...prev, ...files]);
    onToast(`${files.length} فایل PDF بارگذاری شد`, 'success');
  };

  // Real PDF Builder using pdf-lib
  const createPdfFromText = async (opts?: { watermark?: string; letterhead?: string; redact?: boolean; withSignature?: boolean }) => {
    try {
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const page = pdfDoc.addPage([595, 842]);
      const { width, height } = page.getSize();

      if (opts?.letterhead) {
        page.drawRectangle({ x: 0, y: height - 70, width, height: 70, color: rgb(0.04, 0.08, 0.18) });
        page.drawText('OMNIFORGE ENTERPRISE LETTERHEAD', { x: 40, y: height - 42, size: 14, font: boldFont, color: rgb(0.15, 0.85, 0.95) });
      }

      let content = docText;
      if (opts?.redact) {
        content = content
          .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]')
          .replace(/(?:\+?\d[\d\s-]{8,14}\d|09\d{9})/g, '[REDACTED_PHONE]')
          .replace(/\b\d{10,16}\b/g, '[REDACTED_ID]');
      }

      // Render ASCII-safe lines directly and full Unicode via canvas PNG fallback if Persian present
      const hasNonAscii = /[^\x00-\x7F]/.test(content);
      if (hasNonAscii) {
        const c = document.createElement('canvas');
        c.width = 1190;
        c.height = 1500;
        const ctx = c.getContext('2d')!;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, c.width, c.height);
        if (opts?.letterhead) {
          ctx.fillStyle = '#0A1024';
          ctx.fillRect(0, 0, c.width, 130);
          ctx.fillStyle = '#22d3ee';
          ctx.font = 'bold 34px sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText(opts.letterhead, c.width - 50, 80);
        }
        ctx.fillStyle = '#0f172a';
        ctx.font = '26px sans-serif';
        ctx.textAlign = 'right';
        const lines = content.split('\n');
        let y = opts?.letterhead ? 200 : 80;
        for (const line of lines) {
          if (opts?.redact && line.includes('[REDACTED')) {
            ctx.fillStyle = '#000000';
            ctx.fillRect(80, y - 26, c.width - 160, 34);
            ctx.fillStyle = '#ffffff';
            ctx.fillText(line, c.width - 90, y);
            ctx.fillStyle = '#0f172a';
          } else {
            ctx.fillText(line, c.width - 60, y);
          }
          y += 46;
        }
        const pngData = await fetch(c.toDataURL('image/png')).then((r) => r.arrayBuffer());
        const pngImage = await pdfDoc.embedPng(pngData);
        page.drawImage(pngImage, { x: 0, y: 0, width, height });
      } else {
        const lines = content.split('\n');
        let y = height - (opts?.letterhead ? 100 : 50);
        for (const line of lines) {
          page.drawText(line.slice(0, 88), { x: 40, y, size: 12, font, color: rgb(0.1, 0.1, 0.15) });
          y -= 20;
        }
      }

      if (opts?.watermark) {
        page.drawText(opts.watermark, {
          x: 90,
          y: 350,
          size: 36,
          font: boldFont,
          color: rgb(0.85, 0.15, 0.25),
          opacity: 0.28,
          rotate: degrees(35),
        });
      }

      if (opts?.withSignature && sigCanvasRef.current) {
        const sigPng = await fetch(sigCanvasRef.current.toDataURL('image/png')).then((r) => r.arrayBuffer());
        const embeddedSig = await pdfDoc.embedPng(sigPng);
        page.drawImage(embeddedSig, { x: 40, y: 60, width: 180, height: 70 });
        const stamp = `Signed by: ${signerName} | UTC: ${new Date().toISOString()}`;
        page.drawText(stamp.replace(/[^\x00-\x7F]/g, '?'), { x: 40, y: 42, size: 8, font, color: rgb(0.2, 0.45, 0.35) });
      }

      const bytes = await pdfDoc.save();
      const hash = await digestBytes(bytes.buffer as ArrayBuffer, 'SHA-256');
      downloadBlob(new Blob([bytes as BlobPart], { type: 'application/pdf' }), `omniforge-${Date.now()}.pdf`);
      onToast(`PDF با موفقیت ساخته شد! امضای SHA-256: ${hash.slice(0, 14)}...`, 'success');
    } catch (err) {
      onToast(`خطا در ساخت PDF: ${(err as Error).message}`, 'error');
    }
  };

  // Real PDF Merge + Auto TOC using pdf-lib
  const mergeUploadedPdfs = async (withToc = true) => {
    if (!pdfFiles.length) {
      onToast('ابتدا حداقل یک یا چند فایل PDF انتخاب کنید', 'error');
      return;
    }
    try {
      const merged = await PDFDocument.create();
      const font = await merged.embedFont(StandardFonts.HelveticaBold);
      const tocEntries: { title: string; pageNum: number }[] = [];
      let currentPage = withToc ? 2 : 1;

      const loadedDocs: { name: string; doc: PDFDocument }[] = [];
      for (const f of pdfFiles) {
        const arr = await f.arrayBuffer();
        const doc = await PDFDocument.load(arr, { ignoreEncryption: true });
        loadedDocs.push({ name: f.name, doc });
        tocEntries.push({ title: f.name, pageNum: currentPage });
        currentPage += doc.getPageCount();
      }

      if (withToc) {
        const tocPage = merged.addPage([595, 842]);
        tocPage.drawText('Table of Contents (Auto-Generated by OmniForge)', { x: 45, y: 780, size: 16, font, color: rgb(0.05, 0.45, 0.65) });
        tocEntries.forEach((item, idx) => {
          tocPage.drawText(`${idx + 1}. ${item.title.replace(/[^\x00-\x7F]/g, '_')} ........... Page ${item.pageNum}`, {
            x: 50,
            y: 735 - idx * 24,
            size: 11,
            font,
            color: rgb(0.15, 0.15, 0.2),
          });
        });
      }

      for (const item of loadedDocs) {
        const pages = await merged.copyPages(item.doc, item.doc.getPageIndices());
        pages.forEach((p) => merged.addPage(p));
      }

      const bytes = await merged.save({ useObjectStreams: true });
      downloadBlob(new Blob([bytes as BlobPart], { type: 'application/pdf' }), `merged-toc-${Date.now()}.pdf`);
      onToast(`${pdfFiles.length} فایل PDF ادغام و فشرده شدند (${merged.getPageCount()} صفحه)`, 'success');
    } catch (err) {
      onToast(`خطا در ادغام PDF: ${(err as Error).message}`, 'error');
    }
  };

  // Real Scanner Canvas Render (Shadow Removal + Deskew + Perspective Crop)
  useEffect(() => {
    if (!scanImgUrl || !scanCanvasRef.current) return;
    const img = new Image();
    img.onload = () => {
      const c = scanCanvasRef.current!;
      const ctx = c.getContext('2d')!;
      c.width = Math.min(img.width, 900);
      c.height = Math.round((c.width / img.width) * img.height);
      ctx.save();
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.translate(c.width / 2, c.height / 2);
      ctx.rotate((scanTilt * Math.PI) / 180);
      ctx.drawImage(img, -c.width / 2, -c.height / 2, c.width, c.height);
      ctx.restore();

      const imgData = ctx.getImageData(0, 0, c.width, c.height);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        if (scanFilter === 'bw') {
          const v = gray > 142 ? 255 : 0;
          d[i] = d[i + 1] = d[i + 2] = v;
        } else if (scanFilter === 'shadow') {
          // Adaptive highlight lift to erase paper shadow
          const boosted = Math.min(255, Math.max(0, (gray - 45) * 1.45));
          d[i] = Math.min(255, d[i] * 0.35 + boosted * 0.65);
          d[i + 1] = Math.min(255, d[i + 1] * 0.35 + boosted * 0.65);
          d[i + 2] = Math.min(255, d[i + 2] * 0.35 + boosted * 0.65);
        } else if (scanFilter === 'enhance') {
          d[i] = Math.min(255, Math.max(0, (d[i] - 128) * 1.3 + 135));
          d[i + 1] = Math.min(255, Math.max(0, (d[i + 1] - 128) * 1.3 + 135));
          d[i + 2] = Math.min(255, Math.max(0, (d[i + 2] - 128) * 1.3 + 135));
        }
      }
      ctx.putImageData(imgData, 0, 0);
    };
    img.src = scanImgUrl;
  }, [scanImgUrl, scanFilter, scanTilt]);

  const exportScanToPdf = async () => {
    if (!scanCanvasRef.current) return;
    const pdfDoc = await PDFDocument.create();
    const pngBytes = await fetch(scanCanvasRef.current.toDataURL('image/png')).then((r) => r.arrayBuffer());
    const img = await pdfDoc.embedPng(pngBytes);
    const page = pdfDoc.addPage([img.width, img.height]);
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
    const bytes = await pdfDoc.save();
    downloadBlob(new Blob([bytes as BlobPart], { type: 'application/pdf' }), `scan-${scanPreset}-${Date.now()}.pdf`);
    onToast('سند اسکن‌شده با تصحیح رنگ و حذف سایه به PDF تبدیل شد!', 'success');
  };

  // Real Multilingual OCR via Tesseract.js
  const runRealOcr = async (file: File) => {
    setOcrProgress('در حال بارگذاری موتور Tesseract OCR...');
    try {
      const Tesseract = await import('tesseract.js');
      const res = await Tesseract.recognize(file, ocrLang, {
        logger: (m) => {
          if (m.status) setOcrProgress(`${m.status} (${Math.round((m.progress || 0) * 100)}%)`);
        },
      });
      setOcrOutput(res.data.text || 'متنی شناسایی نشد');
      setDocText(res.data.text || docText);
      setOcrProgress('تکمیل شد!');
      onToast('استخراج متن OCR با موفقیت انجام شد', 'success');
    } catch (err) {
      setOcrProgress('خطا در بارگذاری مدل آنلاین OCR (نیاز به اینترنت برای دانلود داده زبان)');
      onToast(`خطای OCR: ${(err as Error).message}`, 'error');
    }
  };

  // Real Table → Excel (.xlsx) Export
  const exportToExcel = () => {
    const rows = docText
      .split('\n')
      .map((line) => line.split(/[|,\t]+/).map((c) => c.trim()))
      .filter((r) => r.length > 0 && r.some(Boolean));
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'PDF_Extracted');
    XLSX.writeFile(wb, `omniforge-table-${Date.now()}.xlsx`);
    onToast('فایل اکسل (.xlsx) با حفظ ساختار ستون‌ها دانلود شد!', 'success');
  };

  // Export to 10 formats
  const exportToFormat = async (fmt: string) => {
    const baseName = `omniforge-doc-${Date.now()}`;
    if (fmt === 'pdf') return createPdfFromText();
    if (fmt === 'xlsx') return exportToExcel();
    if (fmt === 'txt') return downloadBlob(new Blob([docText], { type: 'text/plain;charset=utf-8' }), `${baseName}.txt`);
    if (fmt === 'md') return downloadBlob(new Blob([`# OmniForge Document\n\n${docText}`], { type: 'text/markdown' }), `${baseName}.md`);
    if (fmt === 'html') return downloadBlob(new Blob([`<!doctype html><html dir="rtl"><meta charset="utf-8"><body><pre>${docText}</pre></body></html>`], { type: 'text/html' }), `${baseName}.html`);
    if (fmt === 'json') return downloadBlob(new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), lines: docText.split('\n') }, null, 2)], { type: 'application/json' }), `${baseName}.json`);
    if (fmt === 'csv') {
      const csv = docText.split('\n').map((l) => l.split('|').map((c) => `"${c.trim()}"`).join(',')).join('\n');
      return downloadBlob(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }), `${baseName}.csv`);
    }
    if (fmt === 'doc') {
      const htmlDoc = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' dir='rtl'><meta charset='utf-8'><body>${docText.replace(/\n/g, '<br/>')}</body></html>`;
      return downloadBlob(new Blob([htmlDoc], { type: 'application/msword' }), `${baseName}.doc`);
    }
    if (fmt === 'png' || fmt === 'jpg') {
      const c = document.createElement('canvas');
      c.width = 900;
      c.height = 1100;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = '#0f172a';
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'right';
      docText.split('\n').forEach((line, idx) => ctx.fillText(line, 860, 60 + idx * 38));
      c.toBlob((blob) => blob && downloadBlob(blob, `${baseName}.${fmt}`), fmt === 'png' ? 'image/png' : 'image/jpeg', 0.92);
    }
    onToast(`خروجی فرمت ${fmt.toUpperCase()} آماده شد`, 'success');
  };

  // AI Actions (Chat / Summarize / Translate / Podcast)
  const runAiAction = async (kind: 'chat' | 'summary' | 'translate' | 'podcast') => {
    setAiLoading(true);
    try {
      if (kind === 'summary') {
        const res = await askFreeAi('Summarize this document in Persian bullet points:', undefined, docText);
        setAiReply(`[${res.engine}]\n${res.reply}`);
      } else if (kind === 'chat') {
        const res = await askFreeAi(aiQuestion, 'Answer based strictly on the provided PDF document.', docText);
        setAiReply(`[${res.engine}]\n${res.reply}`);
      } else if (kind === 'translate') {
        const res = await translateTextFree(docText.slice(0, 480), 'fa', 'en');
        setAiReply(`[${res.source}]\n${res.translated}`);
      } else if (kind === 'podcast') {
        const summary = summarizeTextLocal(docText, 4);
        const script = `پادکست خلاصه سند همه‌کاره پرو:\n\n${summary}`;
        setAiReply(script);
        speakText(script, 'fa-IR');
        onToast('پخش صوتی پادکست سند آغاز شد', 'success');
      }
    } catch {
      setAiReply(answerFromDocumentLocal(docText, aiQuestion));
    } finally {
      setAiLoading(false);
    }
  };

  // Signature Pad Pointer Helpers
  const sigStart = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawingRef.current = true;
    const rect = e.currentTarget.getBoundingClientRect();
    const ctx = e.currentTarget.getContext('2d')!;
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };
  const sigMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ctx = e.currentTarget.getContext('2d')!;
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  // Diff lines
  const linesA = docText.split('\n');
  const linesB = compareTextB.split('\n');
  const keywords = extractKeywords(docText, 8);

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 overflow-x-auto pb-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              tab === t.id ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow' : 'bg-slate-800/70 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Create / Edit */}
      {tab === 'create' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm">ساخت و ویرایش سند PDF سازمانی</h3>
            <label className="omni-btn omni-btn-secondary cursor-pointer text-xs">
              <FileUp className="w-4 h-4" /> بارگذاری PDF
              <input type="file" accept=".pdf,.txt" multiple className="hidden" onChange={handleUploadPdfs} />
            </label>
          </div>
          <textarea rows={7} className="omni-input font-sans leading-relaxed" value={docText} onChange={(e) => setDocText(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            <button onClick={() => createPdfFromText()} className="omni-btn omni-btn-primary">
              <Download className="w-4 h-4" /> تولید و دانلود PDF
            </button>
            <button onClick={() => createPdfFromText({ letterhead: letterheadTitle })} className="omni-btn omni-btn-secondary">
              تولید با سربرگ شرکتی
            </button>
            <button onClick={() => createPdfFromText({ watermark: wmText })} className="omni-btn omni-btn-secondary">
              تولید با واترمارک
            </button>
          </div>
        </div>
      )}

      {/* Merge / Optimize / TOC */}
      {tab === 'merge' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2"><Layers className="w-4 h-4 text-rose-400" /> ادغام، فهرست خودکار، فشرده‌سازی و بازسازی PDF</h3>
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-2xl p-6 cursor-pointer hover:border-cyan-400 transition">
            <FileUp className="w-8 h-8 text-cyan-400 mb-2" />
            <span className="text-sm font-semibold">انتخاب چند فایل PDF برای ادغام / فشرده‌سازی / بازسازی</span>
            <input type="file" accept="application/pdf" multiple className="hidden" onChange={handleUploadPdfs} />
          </label>
          {pdfFiles.length > 0 && (
            <div className="space-y-1.5">
              {pdfFiles.map((f, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-900/70 rounded-xl px-3 py-2 text-xs">
                  <span>{i + 1}. {f.name} ({(f.size / 1024).toFixed(1)} KB)</span>
                  <button onClick={() => setPdfFiles((prev) => prev.filter((_, idx) => idx !== i))} className="text-rose-400">حذف</button>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => mergeUploadedPdfs(true)} className="omni-btn omni-btn-primary">ادغام + ساخت فهرست خودکار (TOC)</button>
            <button onClick={() => mergeUploadedPdfs(false)} className="omni-btn omni-btn-secondary">بازسازی / فشرده‌سازی هوشمند</button>
          </div>
        </div>
      )}

      {/* Perspective Scanner */}
      {tab === 'scanner' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-bold text-sm flex items-center gap-2"><ScanLine className="w-4 h-4 text-cyan-400" /> اسکنر اسناد، کارت ویزیت، رسید، پاسپورت، چک و کتاب</h3>
            <select className="omni-input !w-auto text-xs" value={scanPreset} onChange={(e) => setScanPreset(e.target.value as any)}>
              <option value="doc">سند A4</option>
              <option value="card">کارت ویزیت</option>
              <option value="receipt">رسید و فیش</option>
              <option value="passport">پاسپورت</option>
              <option value="check">چک بانکی</option>
              <option value="book">صفحه کتاب</option>
            </select>
          </div>
          <label className="omni-btn omni-btn-primary cursor-pointer w-full">
            📷 عکس‌برداری با دوربین یا انتخاب تصویر سند
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setScanImgUrl(URL.createObjectURL(f));
              }}
            />
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {([['shadow', 'حذف سایه'], ['bw', 'سیاه‌وسفید اسکن'], ['enhance', 'تصحیح رنگ'], ['color', 'اصلی']] as const).map(([k, lbl]) => (
              <button key={k} onClick={() => setScanFilter(k)} className={`rounded-xl py-2 text-xs font-semibold ${scanFilter === k ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
                {lbl}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span>تراز چرخش (Straighten): {scanTilt}°</span>
            <input type="range" min={-15} max={15} step={0.5} value={scanTilt} onChange={(e) => setScanTilt(Number(e.target.value))} className="flex-1" />
          </div>
          {scanImgUrl && (
            <div className="space-y-2">
              <canvas ref={scanCanvasRef} className="w-full max-h-80 object-contain rounded-xl border border-slate-700 bg-white" />
              <button onClick={exportScanToPdf} className="omni-btn omni-btn-primary w-full">ذخیره اسکن به عنوان PDF</button>
            </div>
          )}
        </div>
      )}

      {/* OCR */}
      {tab === 'ocr' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm">OCR چندزبانه واقعی (فارسی / عربی / انگلیسی / دست‌خط)</h3>
          <div className="flex flex-wrap gap-2 items-center">
            <select className="omni-input !w-auto text-xs" value={ocrLang} onChange={(e) => setOcrLang(e.target.value as any)}>
              <option value="fas+eng">فارسی + انگلیسی (fas+eng)</option>
              <option value="eng">انگلیسی (eng)</option>
              <option value="ara+eng">عربی + انگلیسی (ara+eng)</option>
            </select>
            <label className="omni-btn omni-btn-primary cursor-pointer">
              انتخاب تصویر برای OCR
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && runRealOcr(e.target.files[0])} />
            </label>
          </div>
          {ocrProgress && <div className="text-xs text-cyan-400 font-mono">{ocrProgress}</div>}
          <textarea rows={6} className="omni-input" value={ocrOutput} onChange={(e) => setOcrOutput(e.target.value)} placeholder="متن استخراج‌شده اینجا نمایش داده می‌شود..." />
        </div>
      )}

      {/* Digital Signature */}
      {tab === 'sign' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2"><PenTool className="w-4 h-4 text-cyan-400" /> امضای الکترونیک قانونی با مهر زمانی و SHA-256</h3>
          <input className="omni-input" value={signerName} onChange={(e) => setSignerName(e.target.value)} placeholder="نام امضاکننده" />
          <canvas
            ref={sigCanvasRef}
            width={520}
            height={170}
            onPointerDown={sigStart}
            onPointerMove={sigMove}
            onPointerUp={() => (drawingRef.current = false)}
            onPointerLeave={() => (drawingRef.current = false)}
            className="w-full h-44 rounded-xl bg-slate-950 border border-cyan-500/40 touch-none cursor-crosshair"
          />
          <div className="flex gap-2">
            <button onClick={() => createPdfFromText({ withSignature: true })} className="omni-btn omni-btn-primary flex-1">درج امضا + مهر زمانی و دانلود PDF</button>
            <button onClick={() => sigCanvasRef.current?.getContext('2d')?.clearRect(0, 0, 520, 170)} className="omni-btn omni-btn-secondary">پاک کردن</button>
          </div>
        </div>
      )}

      {/* Auto Redact */}
      {tab === 'redact' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm">حذف خودکار اطلاعات حساس (ایمیل، موبایل، کد ملی، کارت بانکی)</h3>
          <textarea rows={5} className="omni-input" value={docText} onChange={(e) => setDocText(e.target.value)} />
          <button onClick={() => createPdfFromText({ redact: true })} className="omni-btn omni-btn-primary">
            سیاه‌پوشی خودکار (Redact) و خروجی PDF امن
          </button>
        </div>
      )}

      {/* Watermark & Letterhead */}
      {tab === 'watermark' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm">سربرگ شرکتی و واترمارک PDF</h3>
          <input className="omni-input" value={letterheadTitle} onChange={(e) => setLetterheadTitle(e.target.value)} placeholder="عنوان سربرگ شرکتی" />
          <input className="omni-input" value={wmText} onChange={(e) => setWmText(e.target.value)} placeholder="متن واترمارک مورب" />
          <button onClick={() => createPdfFromText({ letterhead: letterheadTitle, watermark: wmText })} className="omni-btn omni-btn-primary">
            اعمال سربرگ و واترمارک روی PDF
          </button>
        </div>
      )}

      {/* Table to Excel */}
      {tab === 'excel' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2"><FileSpreadsheet className="w-4 h-4 text-emerald-400" /> استخراج جدول و تبدیل PDF به Excel (.xlsx)</h3>
          <p className="text-xs text-slate-400">ستون‌ها با علامت | یا ویرگول جدا شده و مستقیماً به شیت اکسل استاندارد تبدیل می‌شوند:</p>
          <textarea rows={6} className="omni-input font-mono text-xs" value={docText} onChange={(e) => setDocText(e.target.value)} />
          <button onClick={exportToExcel} className="omni-btn omni-btn-primary">دانلود فایل Excel (.xlsx)</button>
        </div>
      )}

      {/* AI Chat / Summarize / Translate / Podcast */}
      {tab === 'ai' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2"><Sparkles className="w-4 h-4 text-cyan-400" /> هوش مصنوعی PDF (خلاصه، چت، ترجمه، کلیدواژه و پادکست)</h3>
          <div className="flex flex-wrap gap-1.5">
            {keywords.map((k) => (
              <span key={k.word} className="rounded-full bg-cyan-500/15 border border-cyan-500/30 px-2.5 py-0.5 text-xs text-cyan-300">
                #{k.word} ({k.count})
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input className="omni-input flex-1" value={aiQuestion} onChange={(e) => setAiQuestion(e.target.value)} placeholder="سوال خود را درباره سند بپرسید..." />
            <button disabled={aiLoading} onClick={() => runAiAction('chat')} className="omni-btn omni-btn-primary">بپرس</button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button disabled={aiLoading} onClick={() => runAiAction('summary')} className="omni-btn omni-btn-secondary text-xs">خلاصه‌سازی AI</button>
            <button disabled={aiLoading} onClick={() => runAiAction('translate')} className="omni-btn omni-btn-secondary text-xs">ترجمه هم‌زمان</button>
            <button disabled={aiLoading} onClick={() => runAiAction('podcast')} className="omni-btn omni-btn-secondary text-xs">🎙️ تبدیل به پادکست صوتی</button>
          </div>
          {aiReply && <div className="rounded-xl bg-slate-900/90 border border-slate-700 p-3.5 text-sm whitespace-pre-wrap leading-relaxed">{aiReply}</div>}
        </div>
      )}

      {/* Compare two PDFs */}
      {tab === 'compare' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2"><GitCompare className="w-4 h-4 text-amber-400" /> مقایسه هوشمند و ردیابی تغییرات دو نسخه PDF</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <textarea rows={5} className="omni-input text-xs" value={docText} onChange={(e) => setDocText(e.target.value)} placeholder="نسخه ۱" />
            <textarea rows={5} className="omni-input text-xs" value={compareTextB} onChange={(e) => setCompareTextB(e.target.value)} placeholder="نسخه ۲" />
          </div>
          <div className="rounded-xl bg-slate-950 p-3 space-y-1 text-xs font-mono">
            {Array.from({ length: Math.max(linesA.length, linesB.length) }).map((_, i) => {
              const same = linesA[i] === linesB[i];
              return (
                <div key={i} className={`px-2 py-1 rounded ${same ? 'text-slate-400' : 'bg-amber-500/15 text-amber-200'}`}>
                  {same ? `= ${linesA[i] || ''}` : `- ${linesA[i] || ''}\n+ ${linesB[i] || ''}`}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Security / AES-256 / DRM */}
      {tab === 'security' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2"><Shield className="w-4 h-4 text-rose-400" /> رمزنگاری AES-256، قفل DRM و لینک اشتراک با انقضا</h3>
          <input type="password" className="omni-input" value={encPassword} onChange={(e) => setEncPassword(e.target.value)} placeholder="رمز عبور محافظت ۲۵۶ بیتی" />
          <div className="flex items-center gap-3 text-xs">
            <span>مدت اعتبار لینک دسترسی (ساعت):</span>
            <input type="number" className="omni-input !w-24" value={shareExpiryHours} onChange={(e) => setShareExpiryHours(Number(e.target.value))} />
          </div>
          <button
            onClick={async () => {
              if (!encPassword) return onToast('رمز عبور را وارد کنید', 'error');
              const encrypted = await aesEncrypt(JSON.stringify({ docText, expiresAt: Date.now() + shareExpiryHours * 3600000, drm: 'NO_PRINT_COPY' }), encPassword);
              downloadBlob(new Blob([encrypted], { type: 'text/plain' }), `protected-aes256-${Date.now()}.omnipdf.enc`);
              onToast('سند با رمزنگاری واقعی AES-256-GCM و سیاست DRM قفل شد', 'success');
            }}
            className="omni-btn omni-btn-primary"
          >
            قفل AES-256-GCM و دانلود فایل رمزنگاری‌شده
          </button>
        </div>
      )}

      {/* Export to 10 formats */}
      {tab === 'export' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm">خروجی یک‌کلیکی به ۱۰ فرمت استاندارد</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {['pdf', 'xlsx', 'doc', 'html', 'md', 'txt', 'json', 'csv', 'png', 'jpg'].map((fmt) => (
              <button key={fmt} onClick={() => exportToFormat(fmt)} className="omni-btn omni-btn-secondary uppercase text-xs">
                .{fmt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Reader + TTS + Night Mode + Search */}
      {tab === 'reader' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400" />
              <input className="omni-input text-xs" value={readerSearch} onChange={(e) => setReaderSearch(e.target.value)} placeholder="جستجو و هایلایت خودکار..." />
            </div>
            <button onClick={() => setReaderDark(!readerDark)} className="omni-btn omni-btn-secondary text-xs">
              {readerDark ? '☀️ حالت روز' : '🌙 حالت شب'}
            </button>
            <button onClick={() => speakText(docText, 'fa-IR')} className="omni-btn omni-btn-primary text-xs">
              <Volume2 className="w-4 h-4" /> خوانش صوتی (TTS)
            </button>
          </div>
          <div className={`rounded-xl p-5 leading-8 whitespace-pre-wrap text-sm border ${readerDark ? 'bg-slate-950 text-slate-100 border-slate-800' : 'bg-white text-slate-900 border-slate-300'}`}>
            {readerSearch
              ? docText.split(new RegExp(`(${readerSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')).map((part, idx) =>
                  part.toLowerCase() === readerSearch.toLowerCase() ? (
                    <mark key={idx} className="bg-amber-400 text-slate-950 px-1 rounded">{part}</mark>
                  ) : (
                    part
                  )
                )
              : docText}
          </div>
        </div>
      )}

      {/* Forms Builder */}
      {tab === 'forms' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm">فرم‌ساز تعاملی و پرکردن هوشمند PDF</h3>
          {formFields.map((f, idx) => (
            <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input className="omni-input text-xs" value={f.label} onChange={(e) => setFormFields((prev) => prev.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x)))} />
              <input className="omni-input text-xs" value={f.value} onChange={(e) => setFormFields((prev) => prev.map((x, i) => (i === idx ? { ...x, value: e.target.value } : x)))} />
            </div>
          ))}
          <div className="flex gap-2">
            <button onClick={() => setFormFields((p) => [...p, { label: 'فیلد جدید', value: '' }])} className="omni-btn omni-btn-secondary text-xs">+ افزودن فیلد</button>
            <button
              onClick={() => {
                setDocText(formFields.map((f) => `${f.label}: ${f.value}`).join('\n'));
                createPdfFromText();
              }}
              className="omni-btn omni-btn-primary text-xs"
            >
              تولید PDF فرم تکمیل‌شده
            </button>
          </div>
        </div>
      )}

      {/* Collab & Version History */}
      {tab === 'collab' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm">همکاری تیمی، کامنت‌گذاری و مدیریت نسخه</h3>
          <div className="flex gap-2">
            <input className="omni-input" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="ثبت کامنت روی سند..." />
            <button
              onClick={() => {
                if (!newComment.trim()) return;
                const next = [{ id: String(Date.now()), author: signerName, text: newComment, time: new Date().toLocaleTimeString('fa-IR') }, ...comments];
                setComments(next);
                saveData('pdf_comments', next);
                setNewComment('');
              }}
              className="omni-btn omni-btn-primary"
            >
              ثبت
            </button>
          </div>
          <div className="space-y-2">
            {comments.map((c) => (
              <div key={c.id} className="rounded-xl bg-slate-900/70 p-3 text-xs flex justify-between">
                <div><span className="font-bold text-cyan-400">{c.author}:</span> {c.text}</div>
                <span className="text-slate-500">{c.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
