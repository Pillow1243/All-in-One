import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { EngineProps } from '../types';
import { nativePrintHtml } from '../services/nativeBridge';
import { loadData, saveData } from '../services/storage';
import { Briefcase, FileSpreadsheet, Users, ShoppingBag, Calculator, Clock } from 'lucide-react';

type BizTab = 'invoice' | 'crm' | 'payroll' | 'pos' | 'sheet' | 'timetrack' | 'docs' | 'slides';

export const BusinessEngine: React.FC<EngineProps> = ({ tool, onToast }) => {
  const [tab, setTab] = useState<BizTab>((tool.mode as BizTab) || 'invoice');

  // Invoice Builder
  const [company, setCompany] = useState('شرکت فناوری همه‌کاره پرو');
  const [client, setClient] = useState('مشتری گرامی نمونه');
  const [taxRate, setTaxRate] = useState(10);
  const [invItems, setInvItems] = useState([
    { desc: 'طراحی و پیاده‌سازی اپلیکیشن موبایل', qty: 1, price: 25000000 },
    { desc: 'پشتیبانی و بهینه‌سازی سه‌ماهه', qty: 2, price: 4500000 },
  ]);

  // CRM Pipeline
  const [leads, setLeads] = useState<{ id: string; name: string; company: string; value: number; stage: string }[]>(() =>
    loadData('biz_crm', [
      { id: '1', name: 'مهندس رضایی', company: 'پارس سیستم', value: 45000000, stage: 'مذاکره' },
      { id: '2', name: 'دکتر کریمی', company: 'کلینیک مهر', value: 28000000, stage: 'تایید نهایی' },
    ])
  );
  const [leadName, setLeadName] = useState('');

  // Payroll
  const [baseSal, setBaseSal] = useState(18000000);
  const [overtimeH, setOvertimeH] = useState(15);
  const [insPct, setInsPct] = useState(7);
  const [taxPct, setTaxPct] = useState(10);

  // Inventory & POS
  const [inventory, setInventory] = useState([
    { sku: 'PRD-101', name: 'هدفون بی‌سیم پرو', price: 2850000, stock: 12 },
    { sku: 'PRD-102', name: 'پاوربانک ۲۰۰۰۰ فست', price: 1650000, stock: 24 },
    { sku: 'PRD-103', name: 'کابل Type-C اصلی', price: 320000, stock: 50 },
  ]);
  const [cart, setCart] = useState<{ name: string; price: number; qty: number }[]>([]);

  // Formula Spreadsheet (4x4 with XLSX export)
  const [grid, setGrid] = useState<string[][]>([
    ['شرح', 'تعداد', 'قیمت واحد', 'جمع'],
    ['سرور ابری', '3', '1200', '=B2*C2'],
    ['دامنه سالانه', '2', '450', '=B3*C3'],
    ['جمع کل', '', '', '=SUM'],
  ]);

  // Live Time Tracker
  const [ttRunning, setTtRunning] = useState(false);
  const [ttSec, setTtSec] = useState(0);

  useEffect(() => {
    const allowed: BizTab[] = ['invoice', 'crm', 'payroll', 'pos', 'sheet', 'timetrack', 'docs', 'slides'];
    if (allowed.includes(tool.mode as BizTab)) setTab(tool.mode as BizTab);
  }, [tool.id, tool.mode]);

  useEffect(() => {
    if (!ttRunning) return;
    const id = setInterval(() => setTtSec((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [ttRunning]);

  const subtotal = invItems.reduce((s, it) => s + it.qty * it.price, 0);
  const totalInv = Math.round(subtotal * (1 + taxRate / 100));

  const printInvoice = () => {
    const rows = invItems.map((it, i) => `<tr><td>${i + 1}</td><td>${it.desc}</td><td>${it.qty}</td><td>${it.price.toLocaleString()}</td><td>${(it.qty * it.price).toLocaleString()}</td></tr>`).join('');
    const html = `<html dir="rtl"><head><meta charset="utf-8"><style>body{font-family:tahoma,sans-serif;padding:24px}table{width:100%;border-collapse:collapse;margin-top:16px}td,th{border:1px solid #333;padding:8px;text-align:right}</style></head><body><h2>فاکتور رسمی — ${company}</h2><p>خریدار: ${client} | تاریخ: ${new Date().toLocaleDateString('fa-IR')}</p><table><thead><tr><th>ردیف</th><th>شرح کالا/خدمات</th><th>تعداد</th><th>فی</th><th>جمع</th></tr></thead><tbody>${rows}</tbody></table><h3>جمع کل (با ${taxRate}% مالیات): ${totalInv.toLocaleString()} تومان</h3></body></html>`;
    nativePrintHtml(html, 'OmniForge Invoice');
  };

  const evalCell = (val: string, rIdx: number) => {
    if (!val.startsWith('=')) return val;
    if (val === '=SUM') {
      let total = 0;
      for (let r = 1; r < rIdx; r++) total += (Number(grid[r][1]) || 0) * (Number(grid[r][2]) || 0);
      return String(total);
    }
    if (val.includes('*')) return String((Number(grid[rIdx][1]) || 0) * (Number(grid[rIdx][2]) || 0));
    return val;
  };

  const overtimePay = Math.round((baseSal / 220) * 1.4 * overtimeH);
  const grossPay = baseSal + overtimePay;
  const netPay = Math.round(grossPay * (1 - (insPct + taxPct) / 100));

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 overflow-x-auto pb-2">
        {[
          ['invoice', 'فاکتور و رسید PDF'],
          ['pos', 'انبارداری و صندوق POS'],
          ['payroll', 'حقوق و دستمزد'],
          ['crm', 'مدیریت مشتریان CRM'],
          ['sheet', 'صفحه‌گسترده اکسل'],
          ['timetrack', 'تایم‌شیت کاری'],
        ].map(([id, lbl]) => (
          <button key={id} onClick={() => setTab(id as BizTab)} className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold ${tab === id ? 'bg-gradient-to-r from-slate-600 to-blue-600 text-white' : 'bg-slate-800/70 text-slate-300'}`}>
            {lbl}
          </button>
        ))}
      </div>

      {(tab === 'invoice' || tab === 'docs' || tab === 'slides') && (
        <div className="glass-card rounded-2xl p-4 space-y-3 text-xs">
          <h3 className="font-bold text-sm flex items-center gap-2"><Briefcase className="w-4 h-4 text-blue-400" /> سازنده فاکتور رسمی، پیش‌فاکتور، رسید و سربرگ</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input className="omni-input" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="نام شرکت/فروشنده" />
            <input className="omni-input" value={client} onChange={(e) => setClient(e.target.value)} placeholder="نام مشتری" />
            <input type="number" className="omni-input" value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))} placeholder="مالیات %" />
          </div>
          {invItems.map((it, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-1.5">
              <input className="omni-input col-span-6" value={it.desc} onChange={(e) => setInvItems((p) => p.map((x, i) => (i === idx ? { ...x, desc: e.target.value } : x)))} />
              <input type="number" className="omni-input col-span-2" value={it.qty} onChange={(e) => setInvItems((p) => p.map((x, i) => (i === idx ? { ...x, qty: Number(e.target.value) } : x)))} />
              <input type="number" className="omni-input col-span-4 font-mono" value={it.price} onChange={(e) => setInvItems((p) => p.map((x, i) => (i === idx ? { ...x, price: Number(e.target.value) } : x)))} />
            </div>
          ))}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <button onClick={() => setInvItems([...invItems, { desc: 'خدمت جدید', qty: 1, price: 1000000 }])} className="omni-btn omni-btn-secondary text-xs">+ ردیف جدید</button>
            <div className="text-sm font-black text-emerald-400">مبلغ قابل پرداخت: {totalInv.toLocaleString()}</div>
            <button onClick={printInvoice} className="omni-btn omni-btn-primary text-xs">چاپ / خروجی PDF فاکتور</button>
          </div>
        </div>
      )}

      {tab === 'pos' && (
        <div className="glass-card rounded-2xl p-4 space-y-3 text-xs">
          <h3 className="font-bold text-sm flex items-center gap-2"><ShoppingBag className="w-4 h-4 text-emerald-400" /> صندوق فروشگاهی (POS) و کنترل انبار</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {inventory.map((item) => (
              <button
                key={item.sku}
                onClick={() => {
                  setCart((c) => [...c, { name: item.name, price: item.price, qty: 1 }]);
                  setInventory((inv) => inv.map((x) => (x.sku === item.sku ? { ...x, stock: Math.max(0, x.stock - 1) } : x)));
                }}
                className="rounded-xl bg-slate-900/80 border border-slate-700 hover:border-cyan-400 p-3 text-right transition"
              >
                <div className="font-bold">{item.name}</div>
                <div className="text-cyan-400 font-mono mt-1">{item.price.toLocaleString()}</div>
                <div className="text-[10px] text-slate-400">موجودی انبار: {item.stock} · {item.sku}</div>
              </button>
            ))}
          </div>
          <div className="rounded-xl bg-slate-950 p-3 flex items-center justify-between">
            <span>سبد خرید ({cart.length} قلم): <strong className="text-emerald-400 font-mono">{cart.reduce((s, c) => s + c.price, 0).toLocaleString()}</strong></span>
            <button onClick={() => { onToast('فروش ثبت و رسید صادر شد!', 'success'); setCart([]); }} className="omni-btn omni-btn-primary text-xs">تسویه و صدور رسید</button>
          </div>
        </div>
      )}

      {tab === 'payroll' && (
        <div className="glass-card rounded-2xl p-4 space-y-3 text-xs">
          <h3 className="font-bold text-sm flex items-center gap-2"><Calculator className="w-4 h-4 text-cyan-400" /> محاسبه‌گر حقوق، اضافه‌کار، بیمه و مالیات</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <label>حقوق پایه<input type="number" className="omni-input mt-1" value={baseSal} onChange={(e) => setBaseSal(Number(e.target.value))} /></label>
            <label>ساعت اضافه‌کار<input type="number" className="omni-input mt-1" value={overtimeH} onChange={(e) => setOvertimeH(Number(e.target.value))} /></label>
            <label>بیمه (%)<input type="number" className="omni-input mt-1" value={insPct} onChange={(e) => setInsPct(Number(e.target.value))} /></label>
            <label>مالیات (%)<input type="number" className="omni-input mt-1" value={taxPct} onChange={(e) => setTaxPct(Number(e.target.value))} /></label>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-900 p-3 rounded-xl">اضافه‌کار<strong className="block text-cyan-400 font-mono">{overtimePay.toLocaleString()}</strong></div>
            <div className="bg-slate-900 p-3 rounded-xl">ناخالص<strong className="block text-amber-300 font-mono">{grossPay.toLocaleString()}</strong></div>
            <div className="bg-slate-900 p-3 rounded-xl">خالص دریافتی<strong className="block text-emerald-400 text-base font-mono">{netPay.toLocaleString()}</strong></div>
          </div>
        </div>
      )}

      {tab === 'crm' && (
        <div className="glass-card rounded-2xl p-4 space-y-3 text-xs">
          <h3 className="font-bold text-sm flex items-center gap-2"><Users className="w-4 h-4 text-cyan-400" /> مدیریت مشتریان (Mini CRM)</h3>
          <div className="flex gap-2">
            <input className="omni-input" value={leadName} onChange={(e) => setLeadName(e.target.value)} placeholder="نام مشتری جدید..." />
            <button onClick={() => { if (!leadName) return; const next = [{ id: String(Date.now()), name: leadName, company: 'سرنخ جدید', value: 15000000, stage: 'تماس اولیه' }, ...leads]; setLeads(next); saveData('biz_crm', next); setLeadName(''); }} className="omni-btn omni-btn-primary text-xs">افزودن</button>
          </div>
          {leads.map((l) => (
            <div key={l.id} className="bg-slate-900/70 p-3 rounded-xl flex justify-between">
              <div><div className="font-bold">{l.name} — {l.company}</div><div className="text-cyan-400">{l.stage}</div></div>
              <span className="font-mono text-emerald-400">{l.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'sheet' && (
        <div className="glass-card rounded-2xl p-4 space-y-3 text-xs">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm flex items-center gap-2"><FileSpreadsheet className="w-4 h-4 text-emerald-400" /> صفحه‌گسترده فرمول‌دار با خروجی Excel (.xlsx)</h3>
            <button
              onClick={() => {
                const resolved = grid.map((row, ri) => row.map((cell) => evalCell(cell, ri)));
                const ws = XLSX.utils.aoa_to_sheet(resolved);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
                XLSX.writeFile(wb, `omniforge-sheet-${Date.now()}.xlsx`);
                onToast('فایل اکسل (.xlsx) دانلود شد!', 'success');
              }}
              className="omni-btn omni-btn-primary text-xs"
            >
              خروجی Excel (.xlsx)
            </button>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {grid.map((row, r) =>
              row.map((cell, c) => (
                <input
                  key={`${r}-${c}`}
                  value={cell.startsWith('=') ? evalCell(cell, r) : cell}
                  onChange={(e) => setGrid((g) => g.map((rw, ri) => (ri === r ? rw.map((cl, ci) => (ci === c ? e.target.value : cl)) : rw)))}
                  className={`rounded-lg px-2 py-2 border text-xs ${r === 0 ? 'bg-slate-800 font-bold border-slate-600' : 'bg-slate-950 border-slate-800'}`}
                />
              ))
            )}
          </div>
        </div>
      )}

      {tab === 'timetrack' && (
        <div className="glass-card rounded-2xl p-4 text-center space-y-3">
          <h3 className="font-bold text-sm flex items-center justify-center gap-2"><Clock className="w-4 h-4 text-cyan-400" /> ثبت ساعت کار پروژه (Time Tracking)</h3>
          <div className="text-4xl font-mono font-black text-cyan-400">
            {String(Math.floor(ttSec / 3600)).padStart(2, '0')}:{String(Math.floor((ttSec % 3600) / 60)).padStart(2, '0')}:{String(ttSec % 60).padStart(2, '0')}
          </div>
          <div className="flex justify-center gap-2">
            <button onClick={() => setTtRunning(!ttRunning)} className="omni-btn omni-btn-primary text-xs">{ttRunning ? 'توقف' : 'شروع کار'}</button>
            <button onClick={() => { setTtRunning(false); setTtSec(0); }} className="omni-btn omni-btn-secondary text-xs">ریست</button>
          </div>
        </div>
      )}
    </div>
  );
};
