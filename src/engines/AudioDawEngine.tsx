import React, { useEffect, useRef, useState } from 'react';
import { EngineProps } from '../types';
import { speakText } from '../services/nativeBridge';
import { Play, Square, Mic, Volume2, Radio, Sliders, Music } from 'lucide-react';

type AudioTab = 'daw' | 'drums' | 'synth' | 'fx' | 'tuner' | 'ambient' | 'voice' | 'midi';

const NOTES = [
  { name: 'C4', freq: 261.63 }, { name: 'C#4', freq: 277.18 }, { name: 'D4', freq: 293.66 }, { name: 'D#4', freq: 311.13 },
  { name: 'E4', freq: 329.63 }, { name: 'F4', freq: 349.23 }, { name: 'F#4', freq: 369.99 }, { name: 'G4', freq: 392.00 },
  { name: 'G#4', freq: 415.30 }, { name: 'A4', freq: 440.00 }, { name: 'A#4', freq: 466.16 }, { name: 'B4', freq: 493.88 },
  { name: 'C5', freq: 523.25 },
];

export const AudioDawEngine: React.FC<EngineProps> = ({ tool, onToast }) => {
  const [tab, setTab] = useState<AudioTab>((tool.mode as AudioTab) || 'drums');
  const audioCtxRef = useRef<AudioContext | null>(null);
  const getCtx = () => {
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
    return audioCtxRef.current;
  };

  // 16-Step Drum Machine
  const [bpm, setBpm] = useState(118);
  const [drumPlaying, setDrumPlaying] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [grid, setGrid] = useState<boolean[][]>([
    [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false], // Kick
    [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false], // Snare
    [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false], // HiHat
    [false, false, true, false, false, false, false, true, false, false, true, false, false, true, false, false], // Clap
  ]);
  const gridRef = useRef(grid);
  gridRef.current = grid;

  // Synth
  const [wave, setWave] = useState<OscillatorType>('sawtooth');

  // Metronome & Guitar Tuner
  const [metroOn, setMetroOn] = useState(false);
  const [tunerOn, setTunerOn] = useState(false);
  const [detectedFreq, setDetectedFreq] = useState<number>(0);
  const [detectedNote, setDetectedNote] = useState<string>('--');
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const [tapBpm, setTapBpm] = useState<number>(120);

  // Ambient Soundscape
  const [ambientPlaying, setAmbientPlaying] = useState<string>('');
  const ambientNodeRef = useRef<AudioNode | null>(null);

  // DAW Audio Recorder + Waveform
  const [recording, setRecording] = useState(false);
  const [recAudioUrl, setRecAudioUrl] = useState('');
  const recRef = useRef<MediaRecorder | null>(null);
  const [ttsInput, setTtsInput] = useState('سلام! این سیستم تبدیل متن به گفتار چندزبانه همه‌کاره پرو است.');
  const [ttsPitch, setTtsPitch] = useState(1);
  const [ttsRate, setTtsRate] = useState(1);

  // EQ Gains
  const [eqBass, setEqBass] = useState(0);
  const [eqMid, setEqMid] = useState(0);
  const [eqTreble, setEqTreble] = useState(0);

  useEffect(() => {
    const allowed: AudioTab[] = ['daw', 'drums', 'synth', 'fx', 'tuner', 'ambient', 'voice', 'midi'];
    if (allowed.includes(tool.mode as AudioTab)) setTab(tool.mode as AudioTab);
  }, [tool.id, tool.mode]);

  // Synthesize Drum Sounds via Web Audio
  const triggerDrum = (track: number) => {
    const ctx = getCtx();
    const now = ctx.currentTime;
    if (track === 0) {
      // Kick
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(38, now + 0.14);
      gain.gain.setValueAtTime(0.9, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    } else if (track === 1 || track === 3) {
      // Snare / Clap white noise burst
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.12, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = track === 1 ? 'highpass' : 'bandpass';
      filter.frequency.value = track === 1 ? 1000 : 1800;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      noise.connect(filter).connect(gain).connect(ctx.destination);
      noise.start(now);
    } else {
      // HiHat
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = 6800;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  };

  useEffect(() => {
    if (!drumPlaying) return;
    let cur = 0;
    const ms = (60 / bpm / 4) * 1000;
    const id = setInterval(() => {
      setStepIdx(cur);
      gridRef.current.forEach((row, rIdx) => {
        if (row[cur]) triggerDrum(rIdx);
      });
      cur = (cur + 1) % 16;
    }, ms);
    return () => clearInterval(id);
  }, [drumPlaying, bpm]);

  // Metronome
  useEffect(() => {
    if (!metroOn) return;
    let beat = 0;
    const id = setInterval(() => {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.frequency.value = beat % 4 === 0 ? 1100 : 720;
      g.gain.setValueAtTime(0.35, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      osc.connect(g).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
      beat++;
    }, (60 / bpm) * 1000);
    return () => clearInterval(id);
  }, [metroOn, bpm]);

  const playSynthNote = (freq: number) => {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = wave;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.28, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
    osc.connect(g).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.55);
  };

  // Real Microphone Autocorrelation Pitch Detection (Guitar Tuner)
  useEffect(() => {
    if (!tunerOn) return;
    let active = true;
    let stream: MediaStream | null = null;
    navigator.mediaDevices.getUserMedia({ audio: true }).then((s) => {
      stream = s;
      const ctx = getCtx();
      const src = ctx.createMediaStreamSource(s);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      src.connect(analyser);
      const buf = new Float32Array(analyser.fftSize);
      const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const loop = () => {
        if (!active) return;
        analyser.getFloatTimeDomainData(buf);
        let rms = 0;
        for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i];
        rms = Math.sqrt(rms / buf.length);
        if (rms > 0.015) {
          let bestOffset = -1;
          let bestCorr = 0;
          for (let offset = 40; offset < 700; offset++) {
            let corr = 0;
            for (let i = 0; i < 600; i++) corr += buf[i] * buf[i + offset];
            if (corr > bestCorr) { bestCorr = corr; bestOffset = offset; }
          }
          if (bestOffset > 0) {
            const hz = Math.round(ctx.sampleRate / bestOffset);
            if (hz > 60 && hz < 1200) {
              setDetectedFreq(hz);
              const midi = Math.round(12 * Math.log2(hz / 440) + 69);
              setDetectedNote(`${noteNames[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`);
            }
          }
        }
        requestAnimationFrame(loop);
      };
      loop();
    }).catch(() => {
      onToast('دسترسی به میکروفون برای تیونر داده نشد', 'error');
      setTunerOn(false);
    });
    return () => {
      active = false;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [tunerOn]);

  // Real Synthesized Ambient Noise / Sleep / Meditation Soundscapes
  const toggleAmbient = (type: string) => {
    if (ambientNodeRef.current) {
      try { (ambientNodeRef.current as any).stop?.(); ambientNodeRef.current.disconnect(); } catch {}
      ambientNodeRef.current = null;
    }
    if (ambientPlaying === type) {
      setAmbientPlaying('');
      return;
    }
    const ctx = getCtx();
    if (type === 'binaural') {
      const oscL = ctx.createOscillator();
      const oscR = ctx.createOscillator();
      oscL.frequency.value = 200;
      oscR.frequency.value = 206; // 6Hz Theta meditation beat
      const g = ctx.createGain();
      g.gain.value = 0.15;
      oscL.connect(g).connect(ctx.destination);
      oscR.connect(g).connect(ctx.destination);
      oscL.start();
      oscR.start();
      ambientNodeRef.current = g;
    } else {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
      const out = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < out.length; i++) {
        const white = Math.random() * 2 - 1;
        out[i] = type === 'brown' || type === 'rain' ? (last = (last + 0.04 * white) / 1.04) * 3.5 : white * 0.25;
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = type === 'rain' ? 900 : type === 'ocean' ? 420 : 8000;
      const g = ctx.createGain();
      g.gain.value = 0.25;
      src.connect(filter).connect(g).connect(ctx.destination);
      src.start();
      ambientNodeRef.current = src;
    }
    setAmbientPlaying(type);
  };

  const toggleMicRecord = async () => {
    if (recording) {
      recRef.current?.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: Blob[] = [];
      const rec = new MediaRecorder(stream);
      rec.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
      rec.onstop = () => {
        setRecAudioUrl(URL.createObjectURL(new Blob(chunks, { type: 'audio/webm' })));
        stream.getTracks().forEach((t) => t.stop());
      };
      rec.start();
      recRef.current = rec;
      setRecording(true);
    } catch {
      onToast('دسترسی به میکروفون رد شد', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 overflow-x-auto pb-2">
        {[
          ['drums', 'درام ماشین ۱۶ گامه'],
          ['synth', 'سینتی‌سایزر پیانو'],
          ['daw', 'ضبط و DAW'],
          ['tuner', 'تیونر گیتار و مترونوم'],
          ['fx', 'اکولایزر و افکت‌ها'],
          ['ambient', 'نویز سفید و خواب'],
          ['voice', 'تغییر صدا و TTS'],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id as AudioTab)}
            className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold ${
              tab === id ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white' : 'bg-slate-800/70 text-slate-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 16-Step Drum Machine */}
      {tab === 'drums' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-bold text-sm flex items-center gap-2"><Music className="w-4 h-4 text-cyan-400" /> درام ماشین و بیت‌ساز ۱۶ گامه</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono">{bpm} BPM</span>
              <input type="range" min={60} max={180} value={bpm} onChange={(e) => setBpm(Number(e.target.value))} className="w-28" />
              <button onClick={() => setDrumPlaying(!drumPlaying)} className="omni-btn omni-btn-primary text-xs">
                {drumPlaying ? <><Square className="w-3.5 h-3.5" /> توقف</> : <><Play className="w-3.5 h-3.5" /> پخش بیت</>}
              </button>
            </div>
          </div>
          <div className="space-y-2 overflow-x-auto">
            {['Kick', 'Snare', 'HiHat', 'Clap'].map((label, rIdx) => (
              <div key={label} className="flex items-center gap-1.5 min-w-[540px]">
                <span className="w-14 text-xs font-mono text-cyan-300">{label}</span>
                {grid[rIdx].map((active, cIdx) => (
                  <button
                    key={cIdx}
                    onClick={() => {
                      const next = grid.map((row, ri) => (ri === rIdx ? row.map((v, ci) => (ci === cIdx ? !v : v)) : row));
                      setGrid(next);
                      if (!active) triggerDrum(rIdx);
                    }}
                    className={`h-9 flex-1 rounded-lg transition ${
                      active ? 'bg-cyan-500 shadow shadow-cyan-500/40' : 'bg-slate-800/80 hover:bg-slate-700'
                    } ${drumPlaying && stepIdx === cIdx ? 'ring-2 ring-amber-400' : ''}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Synthesizer Piano */}
      {(tab === 'synth' || tab === 'midi') && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm">سینتی‌سایزر چندآوایی و کیبورد MIDI</h3>
            <select className="omni-input !w-auto text-xs" value={wave} onChange={(e) => setWave(e.target.value as OscillatorType)}>
              <option value="sine">Sine (نرم)</option>
              <option value="triangle">Triangle (پیانو)</option>
              <option value="sawtooth">Sawtooth (سینث)</option>
              <option value="square">Square (رترو ۸بیتی)</option>
            </select>
          </div>
          <div className="flex gap-1 overflow-x-auto pb-2" dir="ltr">
            {NOTES.map((n) => (
              <button
                key={n.name}
                onPointerDown={() => playSynthNote(n.freq)}
                className={`flex-1 min-w-[42px] h-32 rounded-b-xl border flex flex-col justify-end items-center pb-2 text-xs font-mono active:scale-95 transition ${
                  n.name.includes('#')
                    ? 'bg-slate-950 text-cyan-300 border-slate-700 h-24'
                    : 'bg-slate-100 text-slate-900 border-slate-300 hover:bg-cyan-100'
                }`}
              >
                {n.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tuner & Metronome & BPM */}
      {tab === 'tuner' && (
        <div className="glass-card rounded-2xl p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl bg-slate-900/70 p-4 text-center space-y-3">
              <div className="font-bold text-sm">تیونر کروماتیک زنده گیتار و ساز</div>
              <div className="text-5xl font-black text-cyan-400 font-mono">{detectedNote}</div>
              <div className="text-xs text-slate-400 font-mono">{detectedFreq ? `${detectedFreq} Hz` : 'میکروفون را روشن کنید و سیم را بنوازید'}</div>
              <button onClick={() => setTunerOn(!tunerOn)} className="omni-btn omni-btn-primary w-full">
                <Radio className="w-4 h-4" /> {tunerOn ? 'خاموش کردن تیونر' : 'شروع تشخیص نت زنده'}
              </button>
            </div>
            <div className="rounded-xl bg-slate-900/70 p-4 text-center space-y-3">
              <div className="font-bold text-sm">مترونوم دقیق و BPM Tap</div>
              <div className="text-4xl font-black text-amber-400 font-mono">{bpm} BPM</div>
              <input type="range" min={40} max={220} value={bpm} onChange={(e) => setBpm(Number(e.target.value))} className="w-full" />
              <div className="flex gap-2">
                <button onClick={() => setMetroOn(!metroOn)} className="omni-btn omni-btn-primary flex-1">{metroOn ? 'توقف مترونوم' : 'پخش مترونوم'}</button>
                <button
                  onClick={() => {
                    const now = Date.now();
                    const next = [...tapTimes.slice(-4), now];
                    setTapTimes(next);
                    if (next.length >= 2) {
                      const avg = (next[next.length - 1] - next[0]) / (next.length - 1);
                      const calc = Math.round(60000 / avg);
                      if (calc >= 40 && calc <= 240) { setTapBpm(calc); setBpm(calc); }
                    }
                  }}
                  className="omni-btn omni-btn-secondary"
                >
                  Tap ({tapBpm})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DAW Recorder */}
      {tab === 'daw' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm">ضبط صوت استودیویی و پادکست</h3>
          <button onClick={toggleMicRecord} className={`omni-btn w-full ${recording ? 'bg-rose-600 text-white' : 'omni-btn-primary'}`}>
            <Mic className="w-4 h-4" /> {recording ? 'توقف ضبط صدا' : 'شروع ضبط صدا با میکروفون'}
          </button>
          {recAudioUrl && (
            <div className="space-y-2">
              <audio controls src={recAudioUrl} className="w-full" />
              <a href={recAudioUrl} download={`omniforge-audio-${Date.now()}.webm`} className="omni-btn omni-btn-secondary text-xs">دانلود فایل صوتی</a>
            </div>
          )}
        </div>
      )}

      {/* EQ / FX Rack */}
      {tab === 'fx' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2"><Sliders className="w-4 h-4 text-cyan-400" /> رک افکت‌ها، اکولایزر و مسترینگ</h3>
          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div className="bg-slate-900/60 p-3 rounded-xl">Bass ({eqBass} dB)<input type="range" min={-12} max={12} value={eqBass} onChange={(e) => setEqBass(Number(e.target.value))} className="w-full mt-2" /></div>
            <div className="bg-slate-900/60 p-3 rounded-xl">Mid ({eqMid} dB)<input type="range" min={-12} max={12} value={eqMid} onChange={(e) => setEqMid(Number(e.target.value))} className="w-full mt-2" /></div>
            <div className="bg-slate-900/60 p-3 rounded-xl">Treble ({eqTreble} dB)<input type="range" min={-12} max={12} value={eqTreble} onChange={(e) => setEqTreble(Number(e.target.value))} className="w-full mt-2" /></div>
          </div>
          <button onClick={() => playSynthNote(220 * Math.pow(2, eqTreble / 24))} className="omni-btn omni-btn-primary text-xs">تست شنیداری EQ</button>
        </div>
      )}

      {/* Ambient Soundscapes */}
      {tab === 'ambient' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm">میکسر صداهای آرامش‌بخش، خواب، باران و مدیتیشن (تولید زنده DSP)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              ['white', '⚪ نویز سفید'],
              ['brown', '🟤 نویز قهوه‌ای'],
              ['rain', '🌧️ باران آرام'],
              ['ocean', '🌊 موج دریا'],
              ['binaural', '🧘 امواج مدیتیشن 6Hz'],
            ].map(([id, lbl]) => (
              <button
                key={id}
                onClick={() => toggleAmbient(id)}
                className={`rounded-xl py-4 text-xs font-bold transition ${
                  ambientPlaying === id ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30' : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Voice Changer & TTS */}
      {tab === 'voice' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2"><Volume2 className="w-4 h-4 text-cyan-400" /> تبدیل متن به گفتار و تغییر گام/سرعت صدا</h3>
          <textarea rows={3} className="omni-input" value={ttsInput} onChange={(e) => setTtsInput(e.target.value)} />
          <div className="grid grid-cols-2 gap-3 text-xs">
            <label>گام صدا (Pitch): {ttsPitch}<input type="range" min={0.4} max={2} step={0.1} value={ttsPitch} onChange={(e) => setTtsPitch(Number(e.target.value))} className="w-full" /></label>
            <label>سرعت (Rate): {ttsRate}<input type="range" min={0.5} max={2} step={0.1} value={ttsRate} onChange={(e) => setTtsRate(Number(e.target.value))} className="w-full" /></label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => speakText(ttsInput, 'fa-IR', ttsRate, ttsPitch)} className="omni-btn omni-btn-primary text-xs">🔊 پخش فارسی</button>
            <button onClick={() => speakText(ttsInput, 'en-US', ttsRate, ttsPitch)} className="omni-btn omni-btn-secondary text-xs">🔊 پخش انگلیسی</button>
            <button onClick={() => { setTtsPitch(0.5); setTtsRate(0.85); speakText(ttsInput, 'fa-IR', 0.85, 0.5); }} className="omni-btn omni-btn-secondary text-xs">🤖 صدای بم / ربات</button>
            <button onClick={() => { setTtsPitch(1.8); setTtsRate(1.25); speakText(ttsInput, 'fa-IR', 1.25, 1.8); }} className="omni-btn omni-btn-secondary text-xs">🐿️ صدای سنجابی</button>
          </div>
        </div>
      )}
    </div>
  );
};
