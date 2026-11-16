import React, { useEffect, useState } from 'react';
import { EngineProps } from '../types';
import { fetchRandomJokeFree } from '../services/freeApis';
import { Dices, Gamepad2, RotateCw, Sparkles, Trophy } from 'lucide-react';

type GameTab = 'xo' | 'chess' | 'sudoku' | 'memory' | 'puzzle15' | 'wheel' | 'esmfamil' | 'blackjack' | 'mafia' | 'rps' | 'random' | 'color' | 'guess' | 'fun' | 'bingo' | 'backgammon' | 'ludo' | 'domino' | 'poker' | 'crossword';

const CHESS_INIT = [
  ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'],
  ['♟', '♟', '♟', '♟', '♟', '♟', '♟', '♟'],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['♙', '♙', '♙', '♙', '♙', '♙', '♙', '♙'],
  ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖'],
];

const SUDOKU_PUZZLE = [
  [5, 3, 0, 0, 7, 0, 0, 0, 0],
  [6, 0, 0, 1, 9, 5, 0, 0, 0],
  [0, 9, 8, 0, 0, 0, 0, 6, 0],
  [8, 0, 0, 0, 6, 0, 0, 0, 3],
  [4, 0, 0, 8, 0, 3, 0, 0, 1],
  [7, 0, 0, 0, 2, 0, 0, 0, 6],
  [0, 6, 0, 0, 0, 0, 2, 8, 0],
  [0, 0, 0, 4, 1, 9, 0, 0, 5],
  [0, 0, 0, 0, 8, 0, 0, 7, 9],
];

const PERSIAN_LETTERS = ['الف', 'ب', 'پ', 'ت', 'ج', 'چ', 'خ', 'د', 'ر', 'ز', 'س', 'ش', 'ف', 'ک', 'گ', 'ل', 'م', 'ن', 'ه', 'ی'];

function checkXoWinner(b: (string | null)[]) {
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for (const [a, c, d] of lines) if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
  return b.every(Boolean) ? 'DRAW' : null;
}

export const GamesArcadeEngine: React.FC<EngineProps> = ({ tool, onToast }) => {
  const [tab, setTab] = useState<GameTab>((tool.mode as GameTab) || 'xo');

  // XO (Tic-Tac-Toe vs Smart AI)
  const [xo, setXo] = useState<(string | null)[]>(Array(9).fill(null));
  const xoWin = checkXoWinner(xo);

  // Chess Board
  const [chess, setChess] = useState<string[][]>(() => CHESS_INIT.map((r) => [...r]));
  const [chessSel, setChessSel] = useState<[number, number] | null>(null);
  const [chessTurn, setChessTurn] = useState<'W' | 'B'>('W');

  // Memory Match
  const emojis = ['🚀', '🔥', '💎', '🎯', '⚡', '🎵', '🛡️', '🌟'];
  const [memDeck, setMemDeck] = useState<{ id: number; icon: string; open: boolean; matched: boolean }[]>(() =>
    [...emojis, ...emojis].sort(() => Math.random() - 0.5).map((icon, id) => ({ id, icon, open: false, matched: false }))
  );
  const [memPick, setMemPick] = useState<number[]>([]);

  // 15-Puzzle
  const [tiles, setTiles] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 14, 0]);

  // Spin Wheel
  const [wheelItems, setWheelItems] = useState('پیتزا\nکباب\nپاستا\nبرگر\nسالاد\nسوشی');
  const [wheelAngle, setWheelAngle] = useState(0);
  const [wheelWinner, setWheelWinner] = useState('');

  // Esm-Famil
  const [efLetter, setEfLetter] = useState('س');
  const [efFields, setEfFields] = useState<Record<string, string>>({ اسم: '', فامیل: '', شهر: '', کشور: '', میوه: '', غذا: '', حیوان: '', اشیا: '' });

  // Blackjack 21
  const drawCard = () => Math.min(11, Math.floor(Math.random() * 11) + 2);
  const [bjPlayer, setBjPlayer] = useState<number[]>([drawCard(), drawCard()]);
  const [bjDealer, setBjDealer] = useState<number[]>([drawCard(), drawCard()]);
  const [bjDone, setBjDone] = useState(false);

  // Mafia Role Moderator
  const [mafiaPlayers, setMafiaPlayers] = useState('علی\nسارا\nرضا\nمریم\nامیر\nنگار');
  const [mafiaRoles, setMafiaRoles] = useState<{ name: string; role: string }[]>([]);

  // Dice / Coin / RPS / Guess / Color / Sudoku / Jokes
  const [dice, setDice] = useState<number[]>([4, 6]);
  const [coin, setCoin] = useState('شیر 🦁');
  const [rpsScore, setRpsScore] = useState({ win: 0, lose: 0, draw: 0, last: '' });
  const [secretNum, setSecretNum] = useState(() => Math.floor(Math.random() * 100) + 1);
  const [guessIn, setGuessIn] = useState('');
  const [guessHint, setGuessHint] = useState('عددی بین ۱ تا ۱۰۰ حدس بزنید');
  const [colorOdd, setColorOdd] = useState(() => Math.floor(Math.random() * 9));
  const [colorLvl, setColorLvl] = useState(1);
  const [sudoku, setSudoku] = useState<number[][]>(() => SUDOKU_PUZZLE.map((r) => [...r]));
  const [joke, setJoke] = useState('برای دریافت لطیفه جدید کلیک کنید!');

  useEffect(() => {
    const allowed: GameTab[] = ['xo', 'chess', 'sudoku', 'memory', 'puzzle15', 'wheel', 'esmfamil', 'blackjack', 'mafia', 'rps', 'random', 'color', 'guess', 'fun', 'bingo', 'backgammon', 'ludo', 'domino', 'poker', 'crossword'];
    if (allowed.includes(tool.mode as GameTab)) setTab(tool.mode as GameTab);
  }, [tool.id, tool.mode]);

  const playXo = (idx: number) => {
    if (xo[idx] || xoWin) return;
    const next = [...xo];
    next[idx] = 'X';
    if (!checkXoWinner(next)) {
      const empties = next.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
      if (empties.length) {
        // Smart AI: win or block or center
        let move = empties[Math.floor(Math.random() * empties.length)];
        if (empties.includes(4)) move = 4;
        for (const e of empties) {
          const test = [...next]; test[e] = 'O';
          if (checkXoWinner(test) === 'O') { move = e; break; }
        }
        next[move] = 'O';
      }
    }
    setXo(next);
  };

  const clickChess = (r: number, c: number) => {
    if (!chessSel) {
      if (chess[r][c]) setChessSel([r, c]);
      return;
    }
    const [sr, sc] = chessSel;
    if (sr === r && sc === c) { setChessSel(null); return; }
    const next = chess.map((row) => [...row]);
    next[r][c] = next[sr][sc];
    next[sr][sc] = '';
    setChess(next);
    setChessSel(null);
    setChessTurn(chessTurn === 'W' ? 'B' : 'W');
  };

  const flipMem = (idx: number) => {
    if (memPick.length === 2 || memDeck[idx].open || memDeck[idx].matched) return;
    const next = memDeck.map((c, i) => (i === idx ? { ...c, open: true } : c));
    setMemDeck(next);
    const picks = [...memPick, idx];
    setMemPick(picks);
    if (picks.length === 2) {
      const [a, b] = picks;
      if (next[a].icon === next[b].icon) {
        setTimeout(() => {
          setMemDeck((d) => d.map((c, i) => (i === a || i === b ? { ...c, matched: true } : c)));
          setMemPick([]);
        }, 300);
      } else {
        setTimeout(() => {
          setMemDeck((d) => d.map((c, i) => (i === a || i === b ? { ...c, open: false } : c)));
          setMemPick([]);
        }, 650);
      }
    }
  };

  const move15 = (idx: number) => {
    const zero = tiles.indexOf(0);
    const r1 = Math.floor(idx / 4), c1 = idx % 4;
    const r0 = Math.floor(zero / 4), c0 = zero % 4;
    if (Math.abs(r1 - r0) + Math.abs(c1 - c0) === 1) {
      const next = [...tiles];
      [next[idx], next[zero]] = [next[zero], next[idx]];
      setTiles(next);
    }
  };

  const spinWheel = () => {
    const list = wheelItems.split('\n').map((s) => s.trim()).filter(Boolean);
    if (!list.length) return;
    const extra = 1440 + Math.floor(Math.random() * 720);
    setWheelAngle((a) => a + extra);
    const winner = list[Math.floor(Math.random() * list.length)];
    setTimeout(() => { setWheelWinner(winner); onToast(`🎉 برنده گردونه: ${winner}`, 'success'); }, 1100);
  };

  const bjSum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 overflow-x-auto pb-2">
        {[
          ['xo', 'دوز (XO)'],
          ['chess', 'شطرنج'],
          ['sudoku', 'سودوکو'],
          ['memory', 'حافظه'],
          ['puzzle15', 'پازل ۱۵'],
          ['wheel', 'گردونه شانس'],
          ['esmfamil', 'اسم‌فامیل'],
          ['blackjack', 'بلک‌جک ۲۱'],
          ['mafia', 'مافیا'],
          ['rps', 'سنگ‌کاغذقیچی'],
          ['color', 'رنگ‌یاب'],
          ['guess', 'حدس عدد'],
          ['random', 'تاس/سکه/منچ'],
          ['fun', 'لطیفه و معما'],
        ].map(([id, lbl]) => (
          <button key={id} onClick={() => setTab(id as GameTab)} className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold ${tab === id ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white' : 'bg-slate-800/70 text-slate-300'}`}>
            {lbl}
          </button>
        ))}
      </div>

      {/* XO */}
      {tab === 'xo' && (
        <div className="glass-card rounded-2xl p-4 text-center space-y-3">
          <h3 className="font-bold text-sm">بازی دوز (XO) مقابل هوش مصنوعی</h3>
          <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto" dir="ltr">
            {xo.map((cell, i) => (
              <button key={i} onClick={() => playXo(i)} className="h-20 rounded-xl bg-slate-900 border border-slate-700 text-3xl font-black text-cyan-400 hover:bg-slate-800">
                {cell}
              </button>
            ))}
          </div>
          {xoWin && <div className="text-amber-400 font-bold">{xoWin === 'DRAW' ? 'مساوی!' : `برنده: ${xoWin} 🏆`}</div>}
          <button onClick={() => setXo(Array(9).fill(null))} className="omni-btn omni-btn-primary text-xs">بازی جدید</button>
        </div>
      )}

      {/* Chess */}
      {tab === 'chess' && (
        <div className="glass-card rounded-2xl p-4 text-center space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm">شطرنج کامل (نوبت: {chessTurn === 'W' ? 'سفید ♔' : 'سیاه ♚'})</h3>
            <button onClick={() => { setChess(CHESS_INIT.map((r) => [...r])); setChessSel(null); setChessTurn('W'); }} className="omni-btn omni-btn-secondary text-xs">شروع مجدد</button>
          </div>
          <div className="grid grid-cols-8 max-w-sm mx-auto border-2 border-slate-700 rounded-lg overflow-hidden" dir="ltr">
            {chess.map((row, r) =>
              row.map((piece, c) => {
                const isSel = chessSel?.[0] === r && chessSel?.[1] === c;
                return (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => clickChess(r, c)}
                    className={`aspect-square flex items-center justify-center text-2xl sm:text-3xl ${
                      isSel ? 'bg-cyan-500/60' : (r + c) % 2 === 0 ? 'bg-slate-300 text-slate-950' : 'bg-slate-700 text-white'
                    }`}
                  >
                    {piece}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Sudoku */}
      {tab === 'sudoku' && (
        <div className="glass-card rounded-2xl p-4 text-center space-y-3">
          <h3 className="font-bold text-sm">سودوکو ۹×۹ قابل بازی</h3>
          <div className="grid grid-cols-9 gap-1 max-w-sm mx-auto" dir="ltr">
            {sudoku.map((row, r) =>
              row.map((v, c) => (
                <input
                  key={`${r}-${c}`}
                  type="number"
                  min={1}
                  max={9}
                  value={v || ''}
                  onChange={(e) => {
                    const n = Math.max(0, Math.min(9, Number(e.target.value) || 0));
                    setSudoku((p) => p.map((rw, ri) => (ri === r ? rw.map((cl, ci) => (ci === c ? n : cl)) : rw)));
                  }}
                  className="h-9 w-full text-center rounded bg-slate-900 border border-slate-700 font-mono font-bold text-cyan-300"
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Memory */}
      {tab === 'memory' && (
        <div className="glass-card rounded-2xl p-4 text-center space-y-3">
          <h3 className="font-bold text-sm">بازی حافظه کارت‌های جفت</h3>
          <div className="grid grid-cols-4 gap-2 max-w-xs mx-auto">
            {memDeck.map((card, i) => (
              <button key={card.id} onClick={() => flipMem(i)} className={`h-16 rounded-xl text-2xl transition ${card.open || card.matched ? 'bg-indigo-600' : 'bg-slate-800 hover:bg-slate-700'}`}>
                {card.open || card.matched ? card.icon : '❓'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 15-Puzzle */}
      {tab === 'puzzle15' && (
        <div className="glass-card rounded-2xl p-4 text-center space-y-3">
          <h3 className="font-bold text-sm">پازل کشویی ۱۵ عددی</h3>
          <div className="grid grid-cols-4 gap-2 max-w-[260px] mx-auto" dir="ltr">
            {tiles.map((t, i) => (
              <button key={i} onClick={() => move15(i)} className={`h-14 rounded-xl font-mono font-black text-lg ${t === 0 ? 'bg-slate-950/40' : 'bg-gradient-to-br from-violet-600 to-indigo-700 text-white'}`}>
                {t || ''}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Spin the Wheel */}
      {tab === 'wheel' && (
        <div className="glass-card rounded-2xl p-4 space-y-3 text-center">
          <h3 className="font-bold text-sm flex items-center justify-center gap-2"><RotateCw className="w-4 h-4 text-fuchsia-400" /> گردونه شانس سفارشی</h3>
          <div
            style={{ transform: `rotate(${wheelAngle}deg)`, transition: 'transform 1.1s cubic-bezier(0.17, 0.67, 0.25, 1)' }}
            className="w-44 h-44 mx-auto rounded-full border-4 border-fuchsia-400 bg-gradient-to-tr from-cyan-500 via-purple-600 to-amber-500 flex items-center justify-center shadow-xl"
          >
            <span className="rounded-full bg-slate-950 px-4 py-2 text-xs font-bold">🎡 SPIN</span>
          </div>
          {wheelWinner && <div className="text-lg font-black text-amber-400">🏆 نتیجه: {wheelWinner}</div>}
          <textarea rows={3} className="omni-input text-xs" value={wheelItems} onChange={(e) => setWheelItems(e.target.value)} />
          <button onClick={spinWheel} className="omni-btn omni-btn-primary">چرخاندن گردونه</button>
        </div>
      )}

      {/* Esm-Famil */}
      {(tab === 'esmfamil' || tab === 'crossword') && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm">بازی اسم‌فامیل فارسی — حرف فعلی: <span className="text-2xl text-amber-400 mx-2">{efLetter}</span></h3>
            <button onClick={() => { setEfLetter(PERSIAN_LETTERS[Math.floor(Math.random() * PERSIAN_LETTERS.length)]); setEfFields({ اسم: '', فامیل: '', شهر: '', کشور: '', میوه: '', غذا: '', حیوان: '', اشیا: '' }); }} className="omni-btn omni-btn-primary text-xs">حرف تصادفی جدید</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {Object.entries(efFields).map(([k, v]) => (
              <label key={k}>{k}<input className="omni-input mt-1" value={v} onChange={(e) => setEfFields({ ...efFields, [k]: e.target.value })} placeholder={`${k} با «${efLetter}»`} /></label>
            ))}
          </div>
          <div className="text-xs text-emerald-400">امتیاز تخمینی: {Object.values(efFields).filter((v) => v.trim().length > 1).length * 10} امتیاز</div>
        </div>
      )}

      {/* Blackjack 21 */}
      {(tab === 'blackjack' || tab === 'poker') && (
        <div className="glass-card rounded-2xl p-4 text-center space-y-3">
          <h3 className="font-bold text-sm">بلک‌جک ۲۱ (Blackjack)</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-slate-900 p-3 rounded-xl">دست شما: <strong className="text-cyan-400 block text-xl">{bjPlayer.join(' + ')} = {bjSum(bjPlayer)}</strong></div>
            <div className="bg-slate-900 p-3 rounded-xl">دیـلر: <strong className="text-amber-400 block text-xl">{bjDone ? `${bjDealer.join(' + ')} = ${bjSum(bjDealer)}` : `${bjDealer[0]} + ?`}</strong></div>
          </div>
          <div className="flex justify-center gap-2">
            {!bjDone && bjSum(bjPlayer) < 21 && (
              <>
                <button onClick={() => setBjPlayer([...bjPlayer, drawCard()])} className="omni-btn omni-btn-primary text-xs">کارت جدید (Hit)</button>
                <button onClick={() => setBjDone(true)} className="omni-btn omni-btn-secondary text-xs">توقف (Stand)</button>
              </>
            )}
            <button onClick={() => { setBjPlayer([drawCard(), drawCard()]); setBjDealer([drawCard(), drawCard()]); setBjDone(false); }} className="omni-btn omni-btn-secondary text-xs">دست جدید</button>
          </div>
        </div>
      )}

      {/* Mafia Role Moderator */}
      {tab === 'mafia' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm">گرداننده هوشمند مافیا و پخش تصادفی نقش‌ها</h3>
          <textarea rows={4} className="omni-input text-xs" value={mafiaPlayers} onChange={(e) => setMafiaPlayers(e.target.value)} />
          <button
            onClick={() => {
              const names = mafiaPlayers.split('\n').map((s) => s.trim()).filter(Boolean);
              const pool = ['پدرخوانده 🎩', 'دکتر 🩺', 'کارآگاه 🔍', 'مافیا ساده 🔫', 'تک‌تیرانداز 🎯', 'شهروند ساده 🧑', 'شهروند ساده 🧑', 'شهروند ساده 🧑'];
              const shuffled = pool.slice(0, names.length).sort(() => Math.random() - 0.5);
              setMafiaRoles(names.map((name, i) => ({ name, role: shuffled[i] || 'شهروند ساده 🧑' })));
            }}
            className="omni-btn omni-btn-primary text-xs"
          >
            توزیع تصادفی نقش‌ها
          </button>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {mafiaRoles.map((r) => (
              <div key={r.name} className="bg-slate-900 p-2.5 rounded-xl flex justify-between"><span>{r.name}</span><strong className="text-fuchsia-300">{r.role}</strong></div>
            ))}
          </div>
        </div>
      )}

      {/* RPS */}
      {tab === 'rps' && (
        <div className="glass-card rounded-2xl p-4 text-center space-y-3">
          <h3 className="font-bold text-sm">سنگ، کاغذ، قیچی — برد: {rpsScore.win} | باخت: {rpsScore.lose} | مساوی: {rpsScore.draw}</h3>
          <div className="flex justify-center gap-3 text-3xl">
            {[['🪨', 0], ['📄', 1], ['✂️', 2]].map(([icon, idx]) => (
              <button
                key={String(icon)}
                onClick={() => {
                  const ai = Math.floor(Math.random() * 3);
                  const icons = ['🪨', '📄', '✂️'];
                  const res = idx === ai ? 'draw' : (Number(idx) - ai + 3) % 3 === 1 ? 'win' : 'lose';
                  setRpsScore((s) => ({ ...s, [res]: (s as any)[res] + 1, last: `شما ${icon} مقابل ربات ${icons[ai]} ← ${res === 'win' ? 'بردید!' : res === 'lose' ? 'باختید' : 'مساوی'}` }));
                }}
                className="w-16 h-16 rounded-2xl bg-slate-800 hover:bg-slate-700"
              >
                {icon}
              </button>
            ))}
          </div>
          {rpsScore.last && <div className="text-sm text-cyan-400 font-bold">{rpsScore.last}</div>}
        </div>
      )}

      {/* Color Finder */}
      {tab === 'color' && (
        <div className="glass-card rounded-2xl p-4 text-center space-y-3">
          <h3 className="font-bold text-sm flex items-center justify-center gap-1.5"><Trophy className="w-4 h-4 text-amber-400" /> بازی رنگ‌یاب (مرحله {colorLvl})</h3>
          <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
            {Array.from({ length: 9 }).map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  if (i === colorOdd) { setColorLvl((l) => l + 1); setColorOdd(Math.floor(Math.random() * 9)); onToast('آفرین! مرحله بعد', 'success'); }
                  else onToast('اشتباه بود! دوباره دقت کن', 'error');
                }}
                style={{ backgroundColor: i === colorOdd ? `hsl(${(colorLvl * 47) % 360}, 78%, ${52 + Math.max(4, 18 - colorLvl)}%)` : `hsl(${(colorLvl * 47) % 360}, 78%, 50%)` }}
                className="h-16 rounded-xl"
              />
            ))}
          </div>
        </div>
      )}

      {/* Number Guess */}
      {tab === 'guess' && (
        <div className="glass-card rounded-2xl p-4 text-center space-y-3">
          <h3 className="font-bold text-sm">{guessHint}</h3>
          <div className="flex gap-2 max-w-xs mx-auto">
            <input type="number" className="omni-input text-center font-mono" value={guessIn} onChange={(e) => setGuessIn(e.target.value)} />
            <button onClick={() => {
              const g = Number(guessIn);
              if (g === secretNum) { setGuessHint('🎉 تبریک! دقیق حدس زدید! عدد جدید انتخاب شد.'); setSecretNum(Math.floor(Math.random() * 100) + 1); }
              else setGuessHint(g < secretNum ? '⬆️ عدد مخفی بزرگ‌تر است' : '⬇️ عدد مخفی کوچک‌تر است');
            }} className="omni-btn omni-btn-primary text-xs">حدس</button>
          </div>
        </div>
      )}

      {/* Dice / Coin / Backgammon / Ludo / Bingo */}
      {['random', 'bingo', 'backgammon', 'ludo', 'domino'].includes(tab) && (
        <div className="glass-card rounded-2xl p-4 text-center space-y-4">
          <h3 className="font-bold text-sm flex items-center justify-center gap-2"><Dices className="w-4 h-4 text-fuchsia-400" /> تاس تخته‌نرد/منچ، شیر یا خط و شماره‌خوان بینگو</h3>
          <div className="flex justify-center gap-4 text-5xl font-black text-cyan-400 font-mono">
            {dice.map((d, i) => <div key={i} className="w-20 h-20 rounded-2xl bg-slate-900 border border-cyan-500/40 flex items-center justify-center">{d}</div>)}
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <button onClick={() => setDice([Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1])} className="omni-btn omni-btn-primary text-xs">🎲 پرتاب ۲ تاس</button>
            <button onClick={() => setCoin(Math.random() > 0.5 ? 'شیر 🦁' : 'خط 🪙')} className="omni-btn omni-btn-secondary text-xs">🪙 سکه: {coin}</button>
            <button onClick={() => onToast(`شماره بینگو: B-${Math.floor(Math.random() * 75) + 1}`, 'info')} className="omni-btn omni-btn-secondary text-xs">🔢 شماره بینگو</button>
          </div>
        </div>
      )}

      {/* Jokes & Riddles */}
      {tab === 'fun' && (
        <div className="glass-card rounded-2xl p-4 text-center space-y-3">
          <h3 className="font-bold text-sm flex items-center justify-center gap-2"><Sparkles className="w-4 h-4 text-amber-400" /> لطیفه روز (Official Joke Public API)</h3>
          <div className="rounded-xl bg-slate-900 p-4 text-sm whitespace-pre-wrap">{joke}</div>
          <button onClick={async () => { const j = await fetchRandomJokeFree(); setJoke(`${j.setup}\n\n😂 ${j.punchline}`); }} className="omni-btn omni-btn-primary text-xs">دریافت لطیفه جدید</button>
        </div>
      )}
    </div>
  );
};
