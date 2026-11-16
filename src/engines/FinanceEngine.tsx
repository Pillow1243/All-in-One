import React, { useEffect, useState } from 'react';
import { EngineProps } from '../types';
import { loadData, saveData } from '../services/storage';
import { TrendingUp, Wallet, Calculator, CandlestickChart } from 'lucide-react';

type FinTab = 'loan' | 'compound' | 'ledger' | 'invest' | 'trading' | 'forex' | 'everyday' | 'markets';

interface LedgerEntry { id: string; type: 'income' | 'expense'; title: string; amount: number; date: string; }

export const FinanceEngine: React.FC<EngineProps> = ({ tool, onToast }) => {
  const [tab, setTab] = useState<FinTab>((tool.mode as FinTab) || 'loan');

  // Loan EMI
  const [loanPrincipal, setLoanPrincipal] = useState(500000000);
  const [loanRate, setLoanRate] = useState(23);
  const [loanMonths, setLoanMonths] = useState(36);

  // Compound Interest
  const [compP, setCompP] = useState(10000);
  const [compRate, setCompRate] = useState(12);
  const [compYears, setCompYears] = useState(10);
  const [compMonthly, setCompMonthly] = useState(500);

  // Persistent Budget / Expense / Income Ledger
  const [entries, setEntries] = useState<LedgerEntry[]>(() =>
    loadData('finance_ledger', [
      { id: '1', type: 'income', title: 'درآمد پروژه', amount: 35000000, date: 'امروز' },
      { id: '2', type: 'expense', title: 'خرید خواربار', amount: 4200000, date: 'امروز' },
    ])
  );
  const [eType, setEType] = useState<'income' | 'expense'>('expense');
  const [eTitle, setETitle] = useState('');
  const [eAmount, setEAmount] = useState('');

  // Invest CAGR / ROI / Inflation / Break-even
  const [initVal, setInitVal] = useState(1000);
  const [endVal, setEndVal] = useState(2400);
  const [invYears, setInvYears] = useState(4);

  // Technical Analysis RSI / EMA / SMA
  const [priceSeries, setPriceSeries] = useState('100, 102, 101, 105, 108, 107, 111, 115, 114, 118, 121, 119, 124, 128, 127, 132');

  // Forex Risk / Lot / Pip / Margin
  const [accountBal, setAccountBal] = useState(5000);
  const [riskPct, setRiskPct] = useState(1.5);
  const [stopLossPips, setStopLossPips] = useState(30);
  const [leverage, setLeverage] = useState(100);

  useEffect(() => {
    const allowed: FinTab[] = ['loan', 'compound', 'ledger', 'invest', 'trading', 'forex', 'everyday', 'markets'];
    if (allowed.includes(tool.mode as FinTab)) setTab(tool.mode as FinTab);
  }, [tool.id, tool.mode]);

  const rMonthly = loanRate / 100 / 12;
  const emi = rMonthly === 0 ? loanPrincipal / loanMonths : (loanPrincipal * rMonthly * Math.pow(1 + rMonthly, loanMonths)) / (Math.pow(1 + rMonthly, loanMonths) - 1);
  const totalPay = emi * loanMonths;

  // Compound growth
  let compFinal = compP;
  for (let m = 0; m < compYears * 12; m++) compFinal = compFinal * (1 + compRate / 100 / 12) + compMonthly;

  // Technical Analysis RSI-14 & SMA/EMA
  const prices = priceSeries.split(/[\s,]+/).map(Number).filter((n) => !isNaN(n));
  const sma = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
  let gains = 0, losses = 0;
  for (let i = 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) gains += diff; else losses += Math.abs(diff);
  }
  const rs = losses === 0 ? 100 : gains / losses;
  const rsi = 100 - 100 / (1 + rs);

  // Forex Lot Size
  const riskUsd = (accountBal * riskPct) / 100;
  const lotSize = riskUsd / Math.max(1, stopLossPips * 10);
  const requiredMargin = (lotSize * 100000) / Math.max(1, leverage);

  const totalInc = entries.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const totalExp = entries.filter((e) => e.type === 'expense').reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 overflow-x-auto pb-2">
        {[
          ['loan', 'قسط و وام'],
          ['compound', 'سود مرکب و پس‌انداز'],
          ['ledger', 'دفتر دخل و خرج'],
          ['invest', 'ROI / CAGR / تورم'],
          ['trading', 'تحلیل تکنیکال RSI'],
          ['forex', 'فارکس (پیپ/لات/مارجین)'],
        ].map(([id, lbl]) => (
          <button key={id} onClick={() => setTab(id as FinTab)} className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold ${tab === id ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' : 'bg-slate-800/70 text-slate-300'}`}>
            {lbl}
          </button>
        ))}
      </div>

      {(tab === 'loan' || tab === 'everyday' || tab === 'markets') && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2"><Calculator className="w-4 h-4 text-emerald-400" /> ماشین‌حساب اقساط وام، مسکن و لیزینگ</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <label>مبلغ وام<input type="number" className="omni-input mt-1 font-mono" value={loanPrincipal} onChange={(e) => setLoanPrincipal(Number(e.target.value))} /></label>
            <label>نرخ سود سالانه (%)<input type="number" className="omni-input mt-1 font-mono" value={loanRate} onChange={(e) => setLoanRate(Number(e.target.value))} /></label>
            <label>تعداد اقساط (ماه)<input type="number" className="omni-input mt-1 font-mono" value={loanMonths} onChange={(e) => setLoanMonths(Math.max(1, Number(e.target.value)))} /></label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-slate-900 p-3 rounded-xl"><div className="text-slate-400">قسط ماهانه</div><div className="text-lg font-black text-emerald-400 font-mono">{Math.round(emi).toLocaleString()}</div></div>
            <div className="bg-slate-900 p-3 rounded-xl"><div className="text-slate-400">کل سود پرداختی</div><div className="text-lg font-black text-amber-400 font-mono">{Math.round(totalPay - loanPrincipal).toLocaleString()}</div></div>
            <div className="bg-slate-900 p-3 rounded-xl"><div className="text-slate-400">مجموع بازپرداخت</div><div className="text-lg font-black text-cyan-400 font-mono">{Math.round(totalPay).toLocaleString()}</div></div>
          </div>
        </div>
      )}

      {tab === 'compound' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-400" /> ماشین‌حساب سود مرکب، پس‌انداز و بازنشستگی</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <label>سرمایه اولیه<input type="number" className="omni-input mt-1" value={compP} onChange={(e) => setCompP(Number(e.target.value))} /></label>
            <label>واریز ماهانه<input type="number" className="omni-input mt-1" value={compMonthly} onChange={(e) => setCompMonthly(Number(e.target.value))} /></label>
            <label>بازده سالانه (%)<input type="number" className="omni-input mt-1" value={compRate} onChange={(e) => setCompRate(Number(e.target.value))} /></label>
            <label>مدت (سال)<input type="number" className="omni-input mt-1" value={compYears} onChange={(e) => setCompYears(Number(e.target.value))} /></label>
          </div>
          <div className="rounded-xl bg-slate-950 p-4 text-center">
            <div className="text-xs text-slate-400">ارزش نهایی سرمایه پس از {compYears} سال</div>
            <div className="text-3xl font-black font-mono text-emerald-400 mt-1">{Math.round(compFinal).toLocaleString()}</div>
            <div className="text-xs text-cyan-300 mt-1">کل واریزی: {(compP + compMonthly * compYears * 12).toLocaleString()} | سود خالص مرکب: {Math.round(compFinal - (compP + compMonthly * compYears * 12)).toLocaleString()}</div>
          </div>
        </div>
      )}

      {tab === 'ledger' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2"><Wallet className="w-4 h-4 text-cyan-400" /> دفترچه مدیریت بودجه، درآمد و هزینه</h3>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-emerald-950/60 border border-emerald-500/30 p-2.5 rounded-xl">درآمد: <strong className="block text-emerald-400 font-mono">{totalInc.toLocaleString()}</strong></div>
            <div className="bg-rose-950/60 border border-rose-500/30 p-2.5 rounded-xl">هزینه: <strong className="block text-rose-400 font-mono">{totalExp.toLocaleString()}</strong></div>
            <div className="bg-slate-900 p-2.5 rounded-xl">مانده: <strong className="block text-cyan-400 font-mono">{(totalInc - totalExp).toLocaleString()}</strong></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <select className="omni-input text-xs" value={eType} onChange={(e) => setEType(e.target.value as any)}><option value="expense">هزینه (-)</option><option value="income">درآمد (+)</option></select>
            <input className="omni-input text-xs" value={eTitle} onChange={(e) => setETitle(e.target.value)} placeholder="عنوان تراکنش" />
            <input type="number" className="omni-input text-xs font-mono" value={eAmount} onChange={(e) => setEAmount(e.target.value)} placeholder="مبلغ" />
            <button onClick={() => { if (!eTitle || !eAmount) return; const next = [{ id: String(Date.now()), type: eType, title: eTitle, amount: Number(eAmount), date: new Date().toLocaleDateString('fa-IR') }, ...entries]; setEntries(next); saveData('finance_ledger', next); setETitle(''); setEAmount(''); onToast('تراکنش ثبت شد', 'success'); }} className="omni-btn omni-btn-primary text-xs">ثبت</button>
          </div>
          <div className="space-y-1.5 max-h-52 overflow-y-auto text-xs">
            {entries.map((en) => (
              <div key={en.id} className="bg-slate-900/70 p-2.5 rounded-xl flex justify-between">
                <span>{en.title} <span className="text-slate-500">({en.date})</span></span>
                <span className={`font-mono font-bold ${en.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>{en.type === 'income' ? '+' : '-'}{en.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'invest' && (
        <div className="glass-card rounded-2xl p-4 space-y-3 text-xs">
          <h3 className="font-bold text-sm">محاسبه ROI و نرخ رشد مرکب سالانه (CAGR)</h3>
          <div className="grid grid-cols-3 gap-2">
            <label>ارزش اولیه<input type="number" className="omni-input mt-1" value={initVal} onChange={(e) => setInitVal(Number(e.target.value))} /></label>
            <label>ارزش نهایی<input type="number" className="omni-input mt-1" value={endVal} onChange={(e) => setEndVal(Number(e.target.value))} /></label>
            <label>تعداد سال<input type="number" className="omni-input mt-1" value={invYears} onChange={(e) => setInvYears(Math.max(1, Number(e.target.value)))} /></label>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-slate-900 p-3 rounded-xl">ROI کل: <strong className="text-xl text-emerald-400 block">{(((endVal - initVal) / Math.max(1, initVal)) * 100).toFixed(2)}%</strong></div>
            <div className="bg-slate-900 p-3 rounded-xl">CAGR سالانه: <strong className="text-xl text-cyan-400 block">{((Math.pow(Math.max(0.01, endVal / Math.max(1, initVal)), 1 / invYears) - 1) * 100).toFixed(2)}%</strong></div>
          </div>
        </div>
      )}

      {tab === 'trading' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2"><CandlestickChart className="w-4 h-4 text-emerald-400" /> تحلیل تکنیکال (RSI-14, SMA, سیگنال اشباع)</h3>
          <input dir="ltr" className="omni-input font-mono text-xs" value={priceSeries} onChange={(e) => setPriceSeries(e.target.value)} />
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-slate-900 p-3 rounded-xl"><div className="text-slate-400">میانگین SMA</div><div className="text-lg font-bold text-cyan-400 font-mono">{sma.toFixed(2)}</div></div>
            <div className="bg-slate-900 p-3 rounded-xl"><div className="text-slate-400">اندیکاتور RSI</div><div className={`text-lg font-bold font-mono ${rsi > 70 ? 'text-rose-400' : rsi < 30 ? 'text-emerald-400' : 'text-amber-300'}`}>{rsi.toFixed(1)}</div></div>
            <div className="bg-slate-900 p-3 rounded-xl"><div className="text-slate-400">وضعیت بازار</div><div className="font-bold">{rsi > 70 ? 'اشباع خرید' : rsi < 30 ? 'اشباع فروش' : 'خنثی / روند'}</div></div>
          </div>
        </div>
      )}

      {tab === 'forex' && (
        <div className="glass-card rounded-2xl p-4 space-y-3 text-xs">
          <h3 className="font-bold text-sm">ماشین‌حساب فارکس (حجم معامله Lot Size، مدیریت ریسک و مارجین)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <label>موجودی حساب ($)<input type="number" className="omni-input mt-1" value={accountBal} onChange={(e) => setAccountBal(Number(e.target.value))} /></label>
            <label>درصد ریسک (%)<input type="number" step="0.5" className="omni-input mt-1" value={riskPct} onChange={(e) => setRiskPct(Number(e.target.value))} /></label>
            <label>حد ضرر (Pips)<input type="number" className="omni-input mt-1" value={stopLossPips} onChange={(e) => setStopLossPips(Number(e.target.value))} /></label>
            <label>اهرم (Leverage 1:X)<input type="number" className="omni-input mt-1" value={leverage} onChange={(e) => setLeverage(Number(e.target.value))} /></label>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-900 p-3 rounded-xl">مبلغ ریسک<strong className="block text-lg text-rose-400 font-mono">${riskUsd.toFixed(2)}</strong></div>
            <div className="bg-slate-900 p-3 rounded-xl">حجم پیشنهادی (Lots)<strong className="block text-lg text-emerald-400 font-mono">{lotSize.toFixed(2)} Lot</strong></div>
            <div className="bg-slate-900 p-3 rounded-xl">مارجین مورد نیاز<strong className="block text-lg text-cyan-400 font-mono">${requiredMargin.toFixed(2)}</strong></div>
          </div>
        </div>
      )}
    </div>
  );
};
