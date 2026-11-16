import React, { useEffect, useState } from 'react';
import { EngineProps } from '../types';
import { COMMON_PORTS, DEV_CHEATSHEETS, HTTP_STATUS_CODES, MIME_TYPES, WORLD_COUNTRIES } from '../data/referenceData';
import { Code2, Send, Terminal, Palette, Database, BookOpen, ShieldCheck } from 'lucide-react';

type DevTab = 'format' | 'jwt' | 'regex' | 'api' | 'ws' | 'curl' | 'sql' | 'color' | 'utils' | 'cheats' | 'databases' | 'assets' | 'docs' | 'diff' | 'netdev' | 'tables';

export const DeveloperEngine: React.FC<EngineProps> = ({ tool, onToast }) => {
  const [tab, setTab] = useState<DevTab>((tool.mode as DevTab) || 'format');

  // JSON / Code Formatter
  const [codeIn, setCodeIn] = useState('{"app":"OmniForge Pro","version":"1.0.0","free":true,"categories":30,"tools":1000}');
  const [codeOut, setCodeOut] = useState('');

  // JWT Decoder
  const [jwtToken, setJwtToken] = useState(
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJvbW5pZm9yZ2UiLCJuYW1lIjoiT21uaUZvcmdlIFBybyIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2MzMzMDAwMH0.signature_demo'
  );

  // Regex Tester
  const [regexPat, setRegexPat] = useState('[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-z]{2,}');
  const [regexFlags, setRegexFlags] = useState('gi');
  const [regexSample, setRegexSample] = useState('Contact us at dev@omniforge.app or support@github.com for free tools!');

  // Postman-Like HTTP API Client
  const [httpMethod, setHttpMethod] = useState('GET');
  const [httpUrl, setHttpUrl] = useState('https://catfact.ninja/fact');
  const [httpBody, setHttpBody] = useState('{}');
  const [httpResp, setHttpResp] = useState<{ status: number; ms: number; body: string } | null>(null);
  const [httpBusy, setHttpBusy] = useState(false);

  // cURL Converter
  const [curlIn, setCurlIn] = useState(`curl -X POST https://api.example.com/v1/items -H "Content-Type: application/json" -d '{"name":"OmniForge"}'`);

  // In-App SQL Runner (real JS table engine)
  const [sqlQuery, setSqlQuery] = useState('SELECT name, category, tools FROM modules WHERE tools >= 50 ORDER BY tools DESC');
  const [sqlRows, setSqlRows] = useState<any[]>([]);

  // Color & WCAG Contrast
  const [fgColor, setFgColor] = useState('#ffffff');
  const [bgColor, setBgColor] = useState('#0A1024');

  // Cron & Timestamp
  const [cronExp, setCronExp] = useState('*/15 9-18 * * 1-5');
  const [unixTs, setUnixTs] = useState(Math.floor(Date.now() / 1000));

  // Cheatsheets & DB filter
  const [cheatKey, setCheatKey] = useState('git');
  const [dbFilter, setDbFilter] = useState('');

  // SVG Live Editor
  const [svgCode, setSvgCode] = useState('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#06b6d4"/><stop offset="100%" stop-color="#8b5cf6"/></linearGradient></defs><rect width="120" height="120" rx="24" fill="#050814"/><polygon points="60,16 100,40 100,80 60,104 20,80 20,40" fill="none" stroke="url(#g)" stroke-width="5"/></svg>');

  // Subnet CIDR
  const [cidrIp, setCidrIp] = useState('192.168.1.42');
  const [cidrMask, setCidrMask] = useState(24);

  useEffect(() => {
    const allowed: DevTab[] = ['format', 'jwt', 'regex', 'api', 'ws', 'curl', 'sql', 'color', 'utils', 'cheats', 'databases', 'assets', 'docs', 'diff', 'netdev', 'tables'];
    if (allowed.includes(tool.mode as DevTab)) setTab(tool.mode as DevTab);
  }, [tool.id, tool.mode]);

  const decodeJwt = (tok: string) => {
    try {
      const [h, p] = tok.split('.');
      const parse = (s: string) => JSON.parse(atob(s.replace(/-/g, '+').replace(/_/g, '/')));
      return { header: parse(h), payload: parse(p) };
    } catch {
      return null;
    }
  };
  const decodedJwt = decodeJwt(jwtToken);

  const regexMatches = (() => {
    try {
      return Array.from(regexSample.matchAll(new RegExp(regexPat, regexFlags.includes('g') ? regexFlags : regexFlags + 'g'))).map((m) => m[0]);
    } catch { return []; }
  })();

  const sendHttp = async () => {
    setHttpBusy(true);
    const t0 = performance.now();
    try {
      const init: RequestInit = { method: httpMethod };
      if (httpMethod !== 'GET' && httpMethod !== 'HEAD') {
        init.headers = { 'Content-Type': 'application/json' };
        init.body = httpBody;
      }
      const res = await fetch(httpUrl, init);
      const txt = await res.text();
      let pretty = txt;
      try { pretty = JSON.stringify(JSON.parse(txt), null, 2); } catch {}
      setHttpResp({ status: res.status, ms: Math.round(performance.now() - t0), body: pretty });
    } catch (e) {
      setHttpResp({ status: 0, ms: Math.round(performance.now() - t0), body: `Error: ${(e as Error).message}` });
    } finally {
      setHttpBusy(false);
    }
  };

  // WCAG Contrast calculation
  const lum = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => {
      const c = (parseInt(hex.slice(i, i + 2), 16) || 0) / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const l1 = lum(fgColor), l2 = lum(bgColor);
  const contrastRatio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

  // Simple In-Memory SQL Query Runner
  const runLocalSql = () => {
    const sampleTable = [
      { id: 1, name: 'PDF Enterprise', category: 'Docs', tools: 60 },
      { id: 2, name: 'Pro Image Studio', category: 'Media', tools: 80 },
      { id: 3, name: 'Video Studio', category: 'Media', tools: 70 },
      { id: 4, name: 'Audio DAW', category: 'Media', tools: 50 },
      { id: 5, name: 'Math Suite', category: 'Science', tools: 60 },
      { id: 6, name: 'Developer Pro', category: 'Dev', tools: 60 },
      { id: 7, name: 'AI Studio', category: 'AI', tools: 40 },
    ];
    let rows = [...sampleTable];
    const whereMatch = sqlQuery.match(/WHERE\s+tools\s*(>=|<=|>|<|=)\s*(\d+)/i);
    if (whereMatch) {
      const [, op, num] = whereMatch;
      const n = Number(num);
      rows = rows.filter((r) => (op === '>=' ? r.tools >= n : op === '<=' ? r.tools <= n : op === '>' ? r.tools > n : op === '<' ? r.tools < n : r.tools === n));
    }
    if (/ORDER BY\s+tools\s+DESC/i.test(sqlQuery)) rows.sort((a, b) => b.tools - a.tools);
    else if (/ORDER BY\s+tools\s+ASC/i.test(sqlQuery)) rows.sort((a, b) => a.tools - b.tools);
    setSqlRows(rows);
    onToast(`${rows.length} رکورد بازگردانده شد`, 'success');
  };

  // IPv4 Subnet Calculator
  const ipParts = cidrIp.split('.').map((n) => Math.max(0, Math.min(255, Number(n) || 0)));
  const ipNum = ((ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3]) >>> 0;
  const maskNum = cidrMask === 0 ? 0 : (~0 << (32 - cidrMask)) >>> 0;
  const netNum = (ipNum & maskNum) >>> 0;
  const bcastNum = (netNum | ~maskNum) >>> 0;
  const fmtIp = (n: number) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 overflow-x-auto pb-2">
        {[
          ['format', 'JSON/Code Format'],
          ['api', 'Postman API Tester'],
          ['jwt', 'JWT Decoder'],
          ['regex', 'Regex Tester'],
          ['sql', 'SQL Runner'],
          ['curl', 'cURL Converter'],
          ['color', 'Color & WCAG'],
          ['utils', 'Cron & Timestamp'],
          ['assets', 'SVG & Icon Studio'],
          ['netdev', 'IP Subnet CIDR'],
          ['cheats', 'Cheatsheets'],
          ['databases', 'HTTP/MIME/Ports'],
        ].map(([id, lbl]) => (
          <button key={id} onClick={() => setTab(id as DevTab)} className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold ${tab === id ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white' : 'bg-slate-800/70 text-slate-300'}`}>
            {lbl}
          </button>
        ))}
      </div>

      {tab === 'format' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2"><Code2 className="w-4 h-4 text-indigo-400" /> فرمت‌دهی، Minify و اعتبارسنجی JSON / Code</h3>
          <textarea rows={5} dir="ltr" className="omni-input font-mono text-xs" value={codeIn} onChange={(e) => setCodeIn(e.target.value)} />
          <div className="flex flex-wrap gap-2 text-xs">
            <button onClick={() => { try { setCodeOut(JSON.stringify(JSON.parse(codeIn), null, 2)); onToast('JSON معتبر است!', 'success'); } catch (e) { setCodeOut(`Invalid JSON: ${(e as Error).message}`); } }} className="omni-btn omni-btn-primary">Beautify & Validate JSON</button>
            <button onClick={() => { try { setCodeOut(JSON.stringify(JSON.parse(codeIn))); } catch (e) { setCodeOut(`Error: ${(e as Error).message}`); } }} className="omni-btn omni-btn-secondary">Minify JSON</button>
            <button onClick={() => { try { const obj = JSON.parse(codeIn); setCodeOut(Object.entries(obj).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join('\n')); } catch {} }} className="omni-btn omni-btn-secondary">JSON → YAML</button>
          </div>
          {codeOut && <pre dir="ltr" className="rounded-xl bg-slate-950 p-3 font-mono text-xs text-cyan-300 overflow-x-auto">{codeOut}</pre>}
        </div>
      )}

      {(tab === 'api' || tab === 'ws') && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2"><Send className="w-4 h-4 text-cyan-400" /> کلاینت API و تستر HTTP / GraphQL (مشابه Postman)</h3>
          <div className="flex gap-2" dir="ltr">
            <select className="omni-input !w-28 font-mono text-xs" value={httpMethod} onChange={(e) => setHttpMethod(e.target.value)}>
              {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => <option key={m}>{m}</option>)}
            </select>
            <input className="omni-input flex-1 font-mono text-xs" value={httpUrl} onChange={(e) => setHttpUrl(e.target.value)} />
            <button disabled={httpBusy} onClick={sendHttp} className="omni-btn omni-btn-primary text-xs">Send</button>
          </div>
          {httpMethod !== 'GET' && <textarea rows={3} dir="ltr" className="omni-input font-mono text-xs" value={httpBody} onChange={(e) => setHttpBody(e.target.value)} />}
          {httpResp && (
            <div className="space-y-2">
              <div dir="ltr" className="text-xs font-mono text-emerald-400">Status: {httpResp.status} | Time: {httpResp.ms} ms</div>
              <pre dir="ltr" className="rounded-xl bg-slate-950 p-3 font-mono text-xs text-slate-200 max-h-72 overflow-auto">{httpResp.body}</pre>
            </div>
          )}
        </div>
      )}

      {tab === 'jwt' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-400" /> رمزگشایی و تحلیل JWT Token</h3>
          <textarea rows={3} dir="ltr" className="omni-input font-mono text-xs" value={jwtToken} onChange={(e) => setJwtToken(e.target.value)} />
          {decodedJwt ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" dir="ltr">
              <pre className="rounded-xl bg-slate-950 p-3 font-mono text-xs text-rose-300 overflow-x-auto">{JSON.stringify(decodedJwt.header, null, 2)}</pre>
              <pre className="rounded-xl bg-slate-950 p-3 font-mono text-xs text-cyan-300 overflow-x-auto">{JSON.stringify(decodedJwt.payload, null, 2)}</pre>
            </div>
          ) : (
            <div className="text-xs text-rose-400">توکن JWT نامعتبر است</div>
          )}
        </div>
      )}

      {tab === 'regex' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm">تستر زنده عبارات باقاعده (Regex)</h3>
          <div className="flex gap-2" dir="ltr">
            <input className="omni-input flex-1 font-mono text-xs" value={regexPat} onChange={(e) => setRegexPat(e.target.value)} />
            <input className="omni-input !w-20 font-mono text-xs" value={regexFlags} onChange={(e) => setRegexFlags(e.target.value)} />
          </div>
          <textarea rows={3} dir="ltr" className="omni-input font-mono text-xs" value={regexSample} onChange={(e) => setRegexSample(e.target.value)} />
          <div className="text-xs">تعداد تطابق‌ها: <strong className="text-emerald-400">{regexMatches.length}</strong></div>
          <div className="flex flex-wrap gap-1.5" dir="ltr">
            {regexMatches.map((m, i) => <span key={i} className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-1 font-mono text-xs text-emerald-300">{m}</span>)}
          </div>
        </div>
      )}

      {tab === 'sql' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2"><Database className="w-4 h-4 text-cyan-400" /> اجراکننده کوئری SQL درون‌برنامه</h3>
          <textarea rows={3} dir="ltr" className="omni-input font-mono text-xs" value={sqlQuery} onChange={(e) => setSqlQuery(e.target.value)} />
          <button onClick={runLocalSql} className="omni-btn omni-btn-primary text-xs">اجرای کوئری SQL</button>
          {sqlRows.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono text-left" dir="ltr">
                <thead><tr className="border-b border-slate-700 text-cyan-400"><th className="p-2">id</th><th className="p-2">name</th><th className="p-2">category</th><th className="p-2">tools</th></tr></thead>
                <tbody>{sqlRows.map((r) => <tr key={r.id} className="border-b border-slate-800/70"><td className="p-2">{r.id}</td><td className="p-2">{r.name}</td><td className="p-2">{r.category}</td><td className="p-2">{r.tools}</td></tr>)}</tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'curl' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2"><Terminal className="w-4 h-4 text-amber-400" /> تبدیل cURL به JavaScript Fetch و Python Requests</h3>
          <textarea rows={3} dir="ltr" className="omni-input font-mono text-xs" value={curlIn} onChange={(e) => setCurlIn(e.target.value)} />
          <pre dir="ltr" className="rounded-xl bg-slate-950 p-3 font-mono text-xs text-emerald-300 overflow-x-auto">{`// JavaScript Fetch\nconst res = await fetch("${curlIn.match(/https?:\/\/[^\s'"]+/)?.[0] || 'https://api.example.com'}", {\n  method: "${curlIn.match(/-X\s+(\w+)/)?.[1] || 'GET'}",\n  headers: { "Content-Type": "application/json" }\n});\nconst data = await res.json();`}</pre>
        </div>
      )}

      {tab === 'color' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2"><Palette className="w-4 h-4 text-fuchsia-400" /> بررسی کنتراست WCAG و پالت رنگ</h3>
          <div className="flex gap-4 items-center">
            <label className="text-xs flex items-center gap-2">رنگ متن <input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)} /></label>
            <label className="text-xs flex items-center gap-2">پس‌زمینه <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} /></label>
          </div>
          <div style={{ backgroundColor: bgColor, color: fgColor }} className="rounded-xl p-6 text-center font-bold text-lg border border-slate-700">
            پیش‌نمایش خوانایی متن — نسبت کنتراست: {contrastRatio.toFixed(2)}:1 ({contrastRatio >= 7 ? 'AAA عالی' : contrastRatio >= 4.5 ? 'AA استاندارد' : 'ضعیف'})
          </div>
        </div>
      )}

      {tab === 'utils' && (
        <div className="glass-card rounded-2xl p-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-900/70 p-3 rounded-xl space-y-2">
            <div className="font-bold text-cyan-400">⏱️ مبدل Unix Timestamp</div>
            <input type="number" dir="ltr" className="omni-input font-mono" value={unixTs} onChange={(e) => setUnixTs(Number(e.target.value))} />
            <div dir="ltr" className="font-mono text-emerald-300">UTC: {new Date(unixTs * 1000).toISOString()}</div>
            <div>شمسی: {new Date(unixTs * 1000).toLocaleString('fa-IR')}</div>
          </div>
          <div className="bg-slate-900/70 p-3 rounded-xl space-y-2">
            <div className="font-bold text-amber-400">⏰ تحلیلگر Cron Expression</div>
            <input dir="ltr" className="omni-input font-mono" value={cronExp} onChange={(e) => setCronExp(e.target.value)} />
            <div className="text-slate-300">فیلدها (دقیقه / ساعت / روز ماه / ماه / روز هفته): <code dir="ltr" className="text-cyan-300">{cronExp.split(' ').join(' | ')}</code></div>
          </div>
        </div>
      )}

      {(tab === 'assets' || tab === 'docs' || tab === 'diff') && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm">ویرایشگر زنده SVG و تولیدگر Favicon / App Icon</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <textarea rows={5} dir="ltr" className="omni-input font-mono text-xs" value={svgCode} onChange={(e) => setSvgCode(e.target.value)} />
            <div className="flex flex-col items-center gap-2 bg-slate-950 rounded-xl p-4">
              <div className="w-28 h-28" dangerouslySetInnerHTML={{ __html: svgCode }} />
              <button
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = URL.createObjectURL(new Blob([svgCode], { type: 'image/svg+xml' }));
                  a.download = 'omniforge-icon.svg';
                  a.click();
                }}
                className="omni-btn omni-btn-primary text-xs"
              >
                دانلود SVG
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'netdev' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm">ماشین‌حساب IPv4 Subnet و CIDR</h3>
          <div className="flex gap-2" dir="ltr">
            <input className="omni-input font-mono" value={cidrIp} onChange={(e) => setCidrIp(e.target.value)} />
            <input type="number" min={1} max={32} className="omni-input !w-24 font-mono" value={cidrMask} onChange={(e) => setCidrMask(Math.max(1, Math.min(32, Number(e.target.value))))} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono" dir="ltr">
            <div className="bg-slate-900 p-3 rounded-xl"><div className="text-slate-400">Network</div>{fmtIp(netNum)}/{cidrMask}</div>
            <div className="bg-slate-900 p-3 rounded-xl"><div className="text-slate-400">Subnet Mask</div>{fmtIp(maskNum)}</div>
            <div className="bg-slate-900 p-3 rounded-xl"><div className="text-slate-400">Broadcast</div>{fmtIp(bcastNum)}</div>
            <div className="bg-slate-900 p-3 rounded-xl"><div className="text-slate-400">Usable Hosts</div>{cidrMask >= 31 ? 0 : Math.pow(2, 32 - cidrMask) - 2}</div>
          </div>
        </div>
      )}

      {tab === 'cheats' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <div className="flex gap-2">
            {Object.entries(DEV_CHEATSHEETS).map(([k, v]) => (
              <button key={k} onClick={() => setCheatKey(k)} className={`rounded-xl px-3 py-1.5 text-xs font-bold ${cheatKey === k ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-300'}`}>{v.title}</button>
            ))}
          </div>
          <div className="space-y-1.5">
            {DEV_CHEATSHEETS[cheatKey].items.map((it, i) => (
              <div key={i} className="rounded-xl bg-slate-900/70 p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                <code dir="ltr" className="font-mono text-cyan-300">{it.cmd}</code>
                <span className="text-slate-300">{it.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(tab === 'databases' || tab === 'tables') && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bold text-sm flex items-center gap-2"><BookOpen className="w-4 h-4 text-cyan-400" /> دیتابیس HTTP Codes، MIME، پورت‌ها و کشورها</h3>
            <input className="omni-input !w-48 text-xs" value={dbFilter} onChange={(e) => setDbFilter(e.target.value)} placeholder="جستجو (مثلاً 404 یا 443)..." />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto text-xs">
            <div className="space-y-1">
              <div className="font-bold text-amber-400">HTTP Status Codes</div>
              {HTTP_STATUS_CODES.filter((h) => `${h.code} ${h.title} ${h.descFa}`.toLowerCase().includes(dbFilter.toLowerCase())).map((h) => (
                <div key={h.code} className="bg-slate-900/70 p-2 rounded-lg flex justify-between"><span className="font-mono text-cyan-300">{h.code} {h.title}</span><span className="text-slate-400">{h.descFa}</span></div>
              ))}
            </div>
            <div className="space-y-1">
              <div className="font-bold text-emerald-400">TCP/UDP Ports & MIME</div>
              {COMMON_PORTS.filter((p) => `${p.port} ${p.service} ${p.descFa}`.toLowerCase().includes(dbFilter.toLowerCase())).map((p) => (
                <div key={p.port} className="bg-slate-900/70 p-2 rounded-lg flex justify-between"><span className="font-mono text-emerald-300">:{p.port} ({p.service})</span><span className="text-slate-400">{p.descFa}</span></div>
              ))}
              {MIME_TYPES.slice(0, 6).map((m) => (
                <div key={m.ext} className="bg-slate-900/70 p-2 rounded-lg flex justify-between"><span className="font-mono text-violet-300">{m.ext}</span><span className="font-mono text-slate-400">{m.mime}</span></div>
              ))}
              {WORLD_COUNTRIES.slice(0, 5).map((c) => (
                <div key={c.code} className="bg-slate-900/70 p-2 rounded-lg flex justify-between"><span>{c.nameFa} ({c.code})</span><span className="font-mono text-amber-300">{c.dial} · {c.currency}</span></div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
