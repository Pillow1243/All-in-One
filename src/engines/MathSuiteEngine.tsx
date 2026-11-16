import React, { useEffect, useRef, useState } from 'react';
import { evaluate, derivative, det, inv, transpose, multiply } from 'mathjs';
import { EngineProps } from '../types';
import { MATH_FORMULAS } from '../data/referenceData';
import { Calculator, LineChart, Grid3X3, Sigma, Atom, BookOpen } from 'lucide-react';

type MathTab = 'calc' | 'programmer' | 'plot' | 'algebra' | 'matrix' | 'calculus' | 'stats' | 'numbers' | 'science' | 'everyday' | 'sudoku' | 'quiz' | 'formulas';

function solveSudokuBoard(board: number[][]): number[][] | null {
  const b = board.map((r) => [...r]);
  const valid = (r: number, c: number, v: number) => {
    for (let i = 0; i < 9; i++) {
      if (b[r][i] === v || b[i][c] === v) return false;
      const br = Math.floor(r / 3) * 3 + Math.floor(i / 3);
      const bc = Math.floor(c / 3) * 3 + (i % 3);
      if (b[br][bc] === v) return false;
    }
    return true;
  };
  const bt = (): boolean => {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (b[r][c] === 0) {
          for (let v = 1; v <= 9; v++) {
            if (valid(r, c, v)) {
              b[r][c] = v;
              if (bt()) return true;
              b[r][c] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  };
  return bt() ? b : null;
}

export const MathSuiteEngine: React.FC<EngineProps> = ({ tool, onToast }) => {
  const [tab, setTab] = useState<MathTab>((tool.mode as MathTab) || 'calc');
  // Scientific Calc
  const [expr, setExpr] = useState('sin(pi/4)^2 + sqrt(144) * 3');
  const [calcRes, setCalcRes] = useState('');
  const [history, setHistory] = useState<string[]>([]);

  // Programmer Calc
  const [progNum, setProgNum] = useState('255');
  const [progB, setProgB] = useState('170');

  // 2D / 3D Plotter
  const plotRef = useRef<HTMLCanvasElement | null>(null);
  const [plotExpr, setPlotExpr] = useState('sin(x) * cos(x/2) * 3');
  const [plot3d, setPlot3d] = useState(false);

  // Algebra Quadratic
  const [qa, setQa] = useState(1);
  const [qb, setQb] = useState(-5);
  const [qc, setQc] = useState(6);

  // Matrix
  const [matA, setMatA] = useState('[[2, 1], [5, 3]]');
  const [matB, setMatB] = useState('[[1, 4], [2, 0]]');
  const [matRes, setMatRes] = useState('');

  // Calculus
  const [calcFn, setCalcFn] = useState('x^3 + 2*x^2 - 5*x + 1');
  const [intA, setIntA] = useState(0);
  const [intB, setIntB] = useState(4);
  const [calculusOut, setCalculusOut] = useState('');

  // Stats
  const [statsInput, setStatsInput] = useState('12, 15, 18, 22, 25, 29, 31, 35');

  // Numbers
  const [numVal, setNumVal] = useState(360);
  const [numVal2, setNumVal2] = useState(48);

  // Science (Physics / Chem / Electronics)
  const [volts, setVolts] = useState(12);
  const [ohms, setOhms] = useState(4);
  const [massKg, setMassKg] = useState(10);
  const [velMs, setVelMs] = useState(15);
  const [hPlus, setHPlus] = useState(0.0001);

  // Sudoku Solver
  const [sudoku, setSudoku] = useState<number[][]>([
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9],
  ]);

  // Quiz
  const [quizQ, setQuizQ] = useState({ a: 14, b: 9, op: '*', ans: '' });
  const [quizScore, setQuizScore] = useState(0);

  useEffect(() => {
    const allowed: MathTab[] = ['calc', 'programmer', 'plot', 'algebra', 'matrix', 'calculus', 'stats', 'numbers', 'science', 'everyday', 'sudoku', 'quiz', 'formulas'];
    if (allowed.includes(tool.mode as MathTab)) setTab(tool.mode as MathTab);
  }, [tool.id, tool.mode]);

  const evalCalc = () => {
    try {
      const r = String(evaluate(expr));
      setCalcRes(r);
      setHistory((prev) => [`${expr} = ${r}`, ...prev].slice(0, 10));
    } catch (e) {
      setCalcRes(`خطا: ${(e as Error).message}`);
    }
  };

  // Plot 2D or 3D Surface
  useEffect(() => {
    if (tab !== 'plot' || !plotRef.current) return;
    const c = plotRef.current;
    const ctx = c.getContext('2d')!;
    const W = (c.width = 640);
    const H = (c.height = 360);
    ctx.fillStyle = '#070c1c';
    ctx.fillRect(0, 0, W, H);

    // Axes
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    if (!plot3d) {
      ctx.strokeStyle = '#475569';
      ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      let started = false;
      for (let px = 0; px < W; px++) {
        const x = ((px - W / 2) / 35);
        try {
          const y = Number(evaluate(plotExpr, { x, y: 0 }));
          if (!isFinite(y)) { started = false; continue; }
          const py = H / 2 - y * 35;
          if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py);
        } catch { started = false; }
      }
      ctx.stroke();
    } else {
      // Isometric 3D Wireframe Surface z = f(x, y)
      const gridN = 22;
      for (let i = -gridN / 2; i <= gridN / 2; i++) {
        ctx.beginPath();
        ctx.strokeStyle = `hsl(${185 + i * 6}, 85%, 60%)`;
        for (let j = -gridN / 2; j <= gridN / 2; j++) {
          const x = i * 0.45;
          const y = j * 0.45;
          let z = 0;
          try { z = Number(evaluate(plotExpr.includes('y') ? plotExpr : `sin(sqrt(x^2+y^2))*2`, { x, y })); } catch { z = 0; }
          const sx = W / 2 + (x - y) * 28;
          const sy = H / 2 + (x + y) * 14 - z * 24;
          if (j === -gridN / 2) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
        }
        ctx.stroke();
      }
    }
  }, [tab, plotExpr, plot3d]);

  // Stats computation
  const nums = statsInput.split(/[\s,،]+/).map(Number).filter((n) => !isNaN(n));
  const mean = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
  const sortedNums = [...nums].sort((a, b) => a - b);
  const median = sortedNums.length ? (sortedNums.length % 2 ? sortedNums[Math.floor(sortedNums.length / 2)] : (sortedNums[sortedNums.length / 2 - 1] + sortedNums[sortedNums.length / 2]) / 2) : 0;
  const stdDev = nums.length ? Math.sqrt(nums.reduce((s, x) => s + (x - mean) ** 2, 0) / nums.length) : 0;

  // Number theory helpers
  const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
  const factorize = (n: number) => {
    let x = Math.abs(Math.floor(n));
    if (x < 2) return [x];
    const f: number[] = [];
    for (let d = 2; d * d <= x; d++) {
      while (x % d === 0) { f.push(d); x /= d; }
    }
    if (x > 1) f.push(x);
    return f;
  };
  const factors = factorize(numVal);

  const pInt = parseInt(progNum, 10) || 0;
  const pIntB = parseInt(progB, 10) || 0;

  const disc = qb * qb - 4 * qa * qc;

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 overflow-x-auto pb-2">
        {[
          ['calc', 'علمی و ساده'],
          ['plot', 'نمودار 2D/3D'],
          ['programmer', 'برنامه‌نویسی/بیت'],
          ['algebra', 'معادله'],
          ['matrix', 'ماتریس'],
          ['calculus', 'مشتق/انتگرال/فوریه'],
          ['stats', 'آمار و احتمال'],
          ['numbers', 'اعداد اول/تجزیه'],
          ['science', 'فیزیک/شیمی/برق'],
          ['sudoku', 'حل سودوکو'],
          ['quiz', 'بازی ریاضی'],
          ['formulas', 'فرمول‌نامه'],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id as MathTab)}
            className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold ${
              tab === id ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white' : 'bg-slate-800/70 text-slate-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Scientific Calculator */}
      {(tab === 'calc' || tab === 'everyday') && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2"><Calculator className="w-4 h-4 text-emerald-400" /> ماشین‌حساب علمی پیشرفته (MathJS)</h3>
          <input dir="ltr" className="omni-input font-mono text-lg" value={expr} onChange={(e) => setExpr(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && evalCalc()} />
          <div className="flex flex-wrap gap-1.5" dir="ltr">
            {['sin(', 'cos(', 'tan(', 'sqrt(', 'log(', 'pi', 'e', '^', '!', '(', ')', 'abs('].map((tok) => (
              <button key={tok} onClick={() => setExpr((p) => p + tok)} className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-mono hover:bg-slate-700">{tok}</button>
            ))}
          </div>
          <button onClick={evalCalc} className="omni-btn omni-btn-primary w-full">محاسبه (=)</button>
          {calcRes && <div dir="ltr" className="rounded-xl bg-slate-950 p-4 text-2xl font-mono text-emerald-400 text-right">{calcRes}</div>}
          {history.length > 0 && (
            <div className="space-y-1 text-xs font-mono text-slate-400" dir="ltr">
              {history.map((h, i) => <div key={i}>{h}</div>)}
            </div>
          )}
        </div>
      )}

      {/* 2D / 3D Function Plotter */}
      {tab === 'plot' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-bold text-sm flex items-center gap-2"><LineChart className="w-4 h-4 text-cyan-400" /> رسم نمودار ۲ بعدی و ۳ بعدی توابع</h3>
            <button onClick={() => setPlot3d(!plot3d)} className="omni-btn omni-btn-secondary text-xs">
              {plot3d ? 'حالت 2D' : 'حالت 3D Surface'}
            </button>
          </div>
          <input dir="ltr" className="omni-input font-mono" value={plotExpr} onChange={(e) => setPlotExpr(e.target.value)} placeholder="e.g. sin(x)*2 or sin(sqrt(x^2+y^2))*2" />
          <canvas ref={plotRef} className="w-full rounded-xl border border-slate-700" />
        </div>
      )}

      {/* Programmer Calculator */}
      {tab === 'programmer' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm">ماشین‌حساب برنامه‌نویسی و عملیات Bitwise</h3>
          <div className="grid grid-cols-2 gap-2">
            <input type="number" className="omni-input font-mono" value={progNum} onChange={(e) => setProgNum(e.target.value)} placeholder="عدد A" />
            <input type="number" className="omni-input font-mono" value={progB} onChange={(e) => setProgB(e.target.value)} placeholder="عدد B" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono" dir="ltr">
            <div className="bg-slate-900 p-3 rounded-xl"><div className="text-slate-400">DEC</div>{pInt}</div>
            <div className="bg-slate-900 p-3 rounded-xl"><div className="text-slate-400">HEX</div>0x{pInt.toString(16).toUpperCase()}</div>
            <div className="bg-slate-900 p-3 rounded-xl"><div className="text-slate-400">OCT</div>0o{pInt.toString(8)}</div>
            <div className="bg-slate-900 p-3 rounded-xl"><div className="text-slate-400">BIN</div>{pInt.toString(2)}</div>
            <div className="bg-slate-900 p-3 rounded-xl"><div className="text-cyan-400">A & B</div>{pInt & pIntB}</div>
            <div className="bg-slate-900 p-3 rounded-xl"><div className="text-cyan-400">A | B</div>{pInt | pIntB}</div>
            <div className="bg-slate-900 p-3 rounded-xl"><div className="text-cyan-400">A ^ B</div>{pInt ^ pIntB}</div>
            <div className="bg-slate-900 p-3 rounded-xl"><div className="text-cyan-400">A &lt;&lt; 1</div>{pInt << 1}</div>
          </div>
        </div>
      )}

      {/* Algebra Equation Solver */}
      {tab === 'algebra' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm">حل معادله درجه دوم (ax² + bx + c = 0)</h3>
          <div className="grid grid-cols-3 gap-2" dir="ltr">
            <label className="text-xs">a<input type="number" className="omni-input mt-1" value={qa} onChange={(e) => setQa(Number(e.target.value))} /></label>
            <label className="text-xs">b<input type="number" className="omni-input mt-1" value={qb} onChange={(e) => setQb(Number(e.target.value))} /></label>
            <label className="text-xs">c<input type="number" className="omni-input mt-1" value={qc} onChange={(e) => setQc(Number(e.target.value))} /></label>
          </div>
          <div className="rounded-xl bg-slate-900 p-4 text-sm font-mono space-y-1" dir="ltr">
            <div>Δ = b² - 4ac = {disc}</div>
            {qa === 0 ? (
              <div>Linear root: x = {(-qc / (qb || 1)).toFixed(4)}</div>
            ) : disc >= 0 ? (
              <>
                <div className="text-emerald-400">x₁ = {((-qb + Math.sqrt(disc)) / (2 * qa)).toFixed(4)}</div>
                <div className="text-emerald-400">x₂ = {((-qb - Math.sqrt(disc)) / (2 * qa)).toFixed(4)}</div>
              </>
            ) : (
              <div className="text-amber-300">
                Complex roots: {(-qb / (2 * qa)).toFixed(3)} ± {(Math.sqrt(-disc) / (2 * qa)).toFixed(3)}i
              </div>
            )}
          </div>
        </div>
      )}

      {/* Matrix Calculator */}
      {tab === 'matrix' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2"><Grid3X3 className="w-4 h-4 text-emerald-400" /> محاسبات ماتریس (دترمینان، معکوس، ترانهاده، ضرب)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" dir="ltr">
            <input className="omni-input font-mono text-xs" value={matA} onChange={(e) => setMatA(e.target.value)} />
            <input className="omni-input font-mono text-xs" value={matB} onChange={(e) => setMatB(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              ['det', 'دترمینان A'],
              ['inv', 'معکوس A⁻¹'],
              ['trans', 'ترانهاده Aᵀ'],
              ['mul', 'ضرب A × B'],
            ].map(([op, lbl]) => (
              <button
                key={op}
                onClick={() => {
                  try {
                    const A = JSON.parse(matA);
                    const B = JSON.parse(matB);
                    const r = op === 'det' ? det(A) : op === 'inv' ? inv(A) : op === 'trans' ? transpose(A) : multiply(A, B);
                    setMatRes(JSON.stringify(r, null, 2));
                  } catch (e) {
                    setMatRes(`خطا: ${(e as Error).message}`);
                  }
                }}
                className="omni-btn omni-btn-primary text-xs"
              >
                {lbl}
              </button>
            ))}
          </div>
          {matRes && <pre dir="ltr" className="rounded-xl bg-slate-950 p-3 text-xs font-mono text-cyan-300 overflow-x-auto">{matRes}</pre>}
        </div>
      )}

      {/* Calculus: Derivative + Simpson Definite Integral */}
      {tab === 'calculus' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2"><Sigma className="w-4 h-4 text-cyan-400" /> مشتق نمادین، انتگرال معین (سیمپسون) و حد</h3>
          <input dir="ltr" className="omni-input font-mono" value={calcFn} onChange={(e) => setCalcFn(e.target.value)} />
          <div className="grid grid-cols-2 gap-2 text-xs">
            <label>کران پایین انتگرال (a)<input type="number" className="omni-input mt-1" value={intA} onChange={(e) => setIntA(Number(e.target.value))} /></label>
            <label>کران بالا انتگرال (b)<input type="number" className="omni-input mt-1" value={intB} onChange={(e) => setIntB(Number(e.target.value))} /></label>
          </div>
          <button
            onClick={() => {
              try {
                const d1 = derivative(calcFn, 'x').toString();
                const d2 = derivative(d1, 'x').toString();
                // Simpson's rule numerical integral
                const n = 200;
                const h = (intB - intA) / n;
                let sum = Number(evaluate(calcFn, { x: intA })) + Number(evaluate(calcFn, { x: intB }));
                for (let i = 1; i < n; i++) {
                  sum += (i % 2 === 0 ? 2 : 4) * Number(evaluate(calcFn, { x: intA + i * h }));
                }
                const integral = (h / 3) * sum;
                setCalculusOut(`f'(x) = ${d1}\nf''(x) = ${d2}\n∫[${intA}..${intB}] f(x)dx ≈ ${integral.toFixed(6)}`);
              } catch (e) {
                setCalculusOut(`خطا: ${(e as Error).message}`);
              }
            }}
            className="omni-btn omni-btn-primary w-full"
          >
            محاسبه مشتق اول، دوم و انتگرال
          </button>
          {calculusOut && <pre dir="ltr" className="rounded-xl bg-slate-950 p-4 font-mono text-sm text-emerald-400 whitespace-pre-wrap">{calculusOut}</pre>}
        </div>
      )}

      {/* Statistics */}
      {tab === 'stats' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm">آمار توصیفی، انحراف معیار و واریانس</h3>
          <input className="omni-input font-mono" dir="ltr" value={statsInput} onChange={(e) => setStatsInput(e.target.value)} />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-slate-900 p-3 rounded-xl"><div className="text-slate-400">تعداد</div><div className="text-lg font-bold">{nums.length}</div></div>
            <div className="bg-slate-900 p-3 rounded-xl"><div className="text-slate-400">میانگین (Mean)</div><div className="text-lg font-bold text-cyan-400">{mean.toFixed(3)}</div></div>
            <div className="bg-slate-900 p-3 rounded-xl"><div className="text-slate-400">میانه (Median)</div><div className="text-lg font-bold text-emerald-400">{median.toFixed(3)}</div></div>
            <div className="bg-slate-900 p-3 rounded-xl"><div className="text-slate-400">انحراف معیار (σ)</div><div className="text-lg font-bold text-amber-400">{stdDev.toFixed(3)}</div></div>
          </div>
        </div>
      )}

      {/* Number Theory */}
      {tab === 'numbers' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm">اعداد اول، تجزیه به عوامل اول، GCD و LCM</h3>
          <div className="grid grid-cols-2 gap-2">
            <input type="number" className="omni-input" value={numVal} onChange={(e) => setNumVal(Number(e.target.value))} />
            <input type="number" className="omni-input" value={numVal2} onChange={(e) => setNumVal2(Number(e.target.value))} />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-900 p-3 rounded-xl">عدد اول؟ <strong className="text-cyan-400">{factors.length === 1 && numVal > 1 ? 'بله (اول است)' : 'خیر (مرکب)'}</strong></div>
            <div className="bg-slate-900 p-3 rounded-xl">تجزیه اول: <strong dir="ltr" className="font-mono text-emerald-400">{factors.join(' × ')}</strong></div>
            <div className="bg-slate-900 p-3 rounded-xl">ب.م.م (GCD): <strong>{gcd(numVal, numVal2)}</strong></div>
            <div className="bg-slate-900 p-3 rounded-xl">ک.م.م (LCM): <strong>{Math.abs(numVal * numVal2) / (gcd(numVal, numVal2) || 1)}</strong></div>
          </div>
        </div>
      )}

      {/* Physics / Chemistry / Electronics */}
      {tab === 'science' && (
        <div className="glass-card rounded-2xl p-4 space-y-4">
          <h3 className="font-bold text-sm flex items-center gap-2"><Atom className="w-4 h-4 text-cyan-400" /> محاسبات فیزیک، شیمی و برق</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-900/70 p-3 rounded-xl space-y-2">
              <div className="font-bold text-amber-400">⚡ قانون اهم (برق)</div>
              <label>ولتاژ (V)<input type="number" className="omni-input mt-1" value={volts} onChange={(e) => setVolts(Number(e.target.value))} /></label>
              <label>مقاومت (Ω)<input type="number" className="omni-input mt-1" value={ohms} onChange={(e) => setOhms(Number(e.target.value))} /></label>
              <div>جریان: <strong>{(volts / (ohms || 1)).toFixed(2)} A</strong> | توان: <strong>{((volts * volts) / (ohms || 1)).toFixed(2)} W</strong></div>
            </div>
            <div className="bg-slate-900/70 p-3 rounded-xl space-y-2">
              <div className="font-bold text-cyan-400">🚀 انرژی جنبشی (فیزیک)</div>
              <label>جرم (kg)<input type="number" className="omni-input mt-1" value={massKg} onChange={(e) => setMassKg(Number(e.target.value))} /></label>
              <label>سرعت (m/s)<input type="number" className="omni-input mt-1" value={velMs} onChange={(e) => setVelMs(Number(e.target.value))} /></label>
              <div>انرژی K = <strong>{(0.5 * massKg * velMs * velMs).toFixed(1)} J</strong> | تکانه p = <strong>{(massKg * velMs).toFixed(1)}</strong></div>
            </div>
            <div className="bg-slate-900/70 p-3 rounded-xl space-y-2">
              <div className="font-bold text-emerald-400">🧪 شیمی (محاسبه pH)</div>
              <label>غلظت [H⁺] (مولار)<input type="number" step="0.0001" className="omni-input mt-1" value={hPlus} onChange={(e) => setHPlus(Number(e.target.value))} /></label>
              <div>pH = <strong>{(-Math.log10(Math.max(hPlus, 1e-14))).toFixed(2)}</strong> ({-Math.log10(Math.max(hPlus, 1e-14)) < 7 ? 'اسیدی' : 'بازی/خنثی'})</div>
            </div>
          </div>
        </div>
      )}

      {/* Real Backtracking Sudoku Solver */}
      {tab === 'sudoku' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm">حل‌کننده هوشمند سودوکو ۹×۹ (الگوریتم Backtracking)</h3>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const solved = solveSudokuBoard(sudoku);
                  if (solved) { setSudoku(solved); onToast('سودوکو با موفقیت حل شد!', 'success'); }
                  else onToast('این جدول سودوکو جواب معتبری ندارد', 'error');
                }}
                className="omni-btn omni-btn-primary text-xs"
              >
                حل خودکار
              </button>
              <button onClick={() => setSudoku(Array.from({ length: 9 }, () => Array(9).fill(0)))} className="omni-btn omni-btn-secondary text-xs">پاک‌سازی</button>
            </div>
          </div>
          <div className="grid grid-cols-9 gap-1 max-w-sm mx-auto" dir="ltr">
            {sudoku.map((row, r) =>
              row.map((val, c) => (
                <input
                  key={`${r}-${c}`}
                  type="number"
                  min={0}
                  max={9}
                  value={val || ''}
                  onChange={(e) => {
                    const v = Math.min(9, Math.max(0, Number(e.target.value) || 0));
                    setSudoku((prev) => prev.map((rw, ri) => (ri === r ? rw.map((cl, ci) => (ci === c ? v : cl)) : rw)));
                  }}
                  className={`h-9 w-full text-center font-mono font-bold rounded bg-slate-900 border ${
                    (Math.floor(r / 3) + Math.floor(c / 3)) % 2 === 0 ? 'border-cyan-500/40' : 'border-slate-700'
                  }`}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Math Quiz */}
      {tab === 'quiz' && (
        <div className="glass-card rounded-2xl p-4 text-center space-y-3">
          <div className="text-xs text-cyan-400">امتیاز فعلی: {quizScore}</div>
          <div className="text-3xl font-mono font-black" dir="ltr">{quizQ.a} {quizQ.op} {quizQ.b} = ?</div>
          <input
            type="number"
            className="omni-input max-w-xs mx-auto text-center font-mono text-lg"
            value={quizQ.ans}
            onChange={(e) => setQuizQ({ ...quizQ, ans: e.target.value })}
          />
          <button
            onClick={() => {
              const expected = quizQ.op === '+' ? quizQ.a + quizQ.b : quizQ.op === '-' ? quizQ.a - quizQ.b : quizQ.a * quizQ.b;
              if (Number(quizQ.ans) === expected) {
                setQuizScore((s) => s + 10);
                onToast('آفرین! پاسخ درست بود (+10)', 'success');
              } else {
                onToast(`پاسخ صحیح: ${expected}`, 'error');
              }
              const ops = ['+', '-', '*'];
              setQuizQ({ a: Math.floor(Math.random() * 25) + 3, b: Math.floor(Math.random() * 15) + 2, op: ops[Math.floor(Math.random() * 3)], ans: '' });
            }}
            className="omni-btn omni-btn-primary"
          >
            بررسی پاسخ
          </button>
        </div>
      )}

      {/* Formula Reference */}
      {tab === 'formulas' && (
        <div className="glass-card rounded-2xl p-4 space-y-2">
          <h3 className="font-bold text-sm flex items-center gap-2"><BookOpen className="w-4 h-4 text-amber-400" /> فرمول‌نامه جامع ریاضی، فیزیک، شیمی و مالی</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {MATH_FORMULAS.map((f, i) => (
              <div key={i} className="rounded-xl bg-slate-900/70 p-3 space-y-1">
                <div className="text-xs text-cyan-400 font-bold">{f.cat} — {f.title}</div>
                <div dir="ltr" className="font-mono text-xs text-slate-200">{f.formula}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
