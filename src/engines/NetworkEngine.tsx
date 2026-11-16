import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { EngineProps } from '../types';
import { dnsLookupFree, lookupGeoIp, lookupRdapWhois, shortenUrlFree } from '../services/freeApis';
import { Wifi, Globe, Gauge, Link2, Search } from 'lucide-react';

type NetTab = 'speed' | 'ping' | 'dns' | 'geoip' | 'subnet' | 'http' | 'shortener' | 'wifiqr' | 'scan' | 'servers';

export const NetworkEngine: React.FC<EngineProps> = ({ tool, onToast }) => {
  const [tab, setTab] = useState<NetTab>((tool.mode as NetTab) || 'dns');

  // DNS / Whois
  const [domain, setDomain] = useState('github.com');
  const [dnsType, setDnsType] = useState('A');
  const [dnsOut, setDnsOut] = useState<any>(null);
  const [whoisOut, setWhoisOut] = useState('');

  // GeoIP
  const [ipQuery, setIpQuery] = useState('');
  const [geoData, setGeoData] = useState<Record<string, any> | null>(null);

  // Speed & Ping
  const [pingTarget, setPingTarget] = useState('https://api.github.com');
  const [pings, setPings] = useState<number[]>([]);
  const [speedMbps, setSpeedMbps] = useState<number | null>(null);

  // URL Shortener
  const [longUrl, setLongUrl] = useState('https://github.com/Pillow1243/All-in-One');
  const [shortUrl, setShortUrl] = useState('');

  // Wi-Fi QR
  const [wifiSsid, setWifiSsid] = useState('OmniForge_5G');
  const [wifiPass, setWifiPass] = useState('SuperSecure2026');
  const [wifiSec, setWifiSec] = useState('WPA');
  const [wifiQr, setWifiQr] = useState('');

  useEffect(() => {
    const allowed: NetTab[] = ['speed', 'ping', 'dns', 'geoip', 'subnet', 'http', 'shortener', 'wifiqr', 'scan', 'servers'];
    if (allowed.includes(tool.mode as NetTab)) setTab(tool.mode as NetTab);
  }, [tool.id, tool.mode]);

  useEffect(() => {
    const payload = `WIFI:T:${wifiSec};S:${wifiSsid};P:${wifiPass};;`;
    QRCode.toDataURL(payload, { width: 240, margin: 2 }).then(setWifiQr).catch(() => {});
  }, [wifiSsid, wifiPass, wifiSec]);

  const runPing = async () => {
    const arr: number[] = [];
    for (let i = 0; i < 4; i++) {
      const t0 = performance.now();
      try {
        await fetch(pingTarget, { mode: 'no-cors', cache: 'no-store' });
        arr.push(Math.round(performance.now() - t0));
      } catch {
        arr.push(-1);
      }
    }
    setPings(arr);
    onToast('تست پینگ انجام شد', 'success');
  };

  const runSpeedTest = async () => {
    const t0 = performance.now();
    try {
      const res = await fetch('https://api.github.com/repos/public-apis/public-apis', { cache: 'no-store' });
      const buf = await res.arrayBuffer();
      const sec = Math.max(0.05, (performance.now() - t0) / 1000);
      const mbps = Number((((buf.byteLength * 8) / sec) / 1_000_000).toFixed(2));
      setSpeedMbps(mbps);
      onToast(`سرعت اندازه‌گیری‌شده: ${mbps} Mbps`, 'success');
    } catch {
      onToast('خطا در اتصال اینترنت برای تست سرعت', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 overflow-x-auto pb-2">
        {[
          ['dns', 'DNS و Whois زنده'],
          ['geoip', 'GeoIP و تست VPN'],
          ['speed', 'تست سرعت و پینگ'],
          ['shortener', 'کوتاه‌کننده لینک'],
          ['wifiqr', 'QR اتصال وای‌فای'],
          ['http', 'تحلیلگر URL و UA'],
        ].map(([id, lbl]) => (
          <button key={id} onClick={() => setTab(id as NetTab)} className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold ${tab === id ? 'bg-gradient-to-r from-cyan-500 to-sky-600 text-white' : 'bg-slate-800/70 text-slate-300'}`}>
            {lbl}
          </button>
        ))}
      </div>

      {tab === 'dns' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2"><Search className="w-4 h-4 text-cyan-400" /> استعلام زنده DNS (Cloudflare/Google DoH) و RDAP Whois</h3>
          <div className="flex flex-wrap gap-2" dir="ltr">
            <input className="omni-input flex-1 font-mono text-xs" value={domain} onChange={(e) => setDomain(e.target.value)} />
            <select className="omni-input !w-24 font-mono text-xs" value={dnsType} onChange={(e) => setDnsType(e.target.value)}>
              {['A', 'AAAA', 'MX', 'TXT', 'NS', 'CNAME', 'SOA'].map((t) => <option key={t}>{t}</option>)}
            </select>
            <button onClick={async () => { try { setDnsOut(await dnsLookupFree(domain, dnsType)); } catch { onToast('خطای اتصال DNS', 'error'); } }} className="omni-btn omni-btn-primary text-xs">DNS</button>
            <button onClick={async () => { try { const r = await lookupRdapWhois(domain); setWhoisOut(JSON.stringify({ handle: r.handle, status: r.status, events: r.events }, null, 2)); } catch { onToast('خطای Whois', 'error'); } }} className="omni-btn omni-btn-secondary text-xs">Whois</button>
          </div>
          {dnsOut && (
            <div className="space-y-1 text-xs font-mono" dir="ltr">
              <div className="text-cyan-400">Provider: {dnsOut.provider}</div>
              {(dnsOut.records || []).map((r: any, i: number) => (
                <div key={i} className="bg-slate-900 p-2 rounded-lg flex justify-between"><span>{r.name} (TTL {r.TTL})</span><span className="text-emerald-300">{r.data}</span></div>
              ))}
            </div>
          )}
          {whoisOut && <pre dir="ltr" className="rounded-xl bg-slate-950 p-3 text-xs font-mono text-amber-300 overflow-x-auto">{whoisOut}</pre>}
        </div>
      )}

      {tab === 'geoip' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2"><Globe className="w-4 h-4 text-emerald-400" /> مکان‌یابی آی‌پی (GeoIP) و تشخیص VPN / ISP</h3>
          <div className="flex gap-2" dir="ltr">
            <input className="omni-input flex-1 font-mono text-xs" value={ipQuery} onChange={(e) => setIpQuery(e.target.value)} placeholder="خالی = IP فعلی شما یا مثلاً 8.8.8.8" />
            <button onClick={async () => { try { setGeoData(await lookupGeoIp(ipQuery)); } catch { onToast('خطا در دریافت GeoIP', 'error'); } }} className="omni-btn omni-btn-primary text-xs">استعلام</button>
          </div>
          {geoData && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="bg-slate-900 p-2.5 rounded-xl">IP: <strong className="font-mono text-cyan-400">{geoData.ip}</strong></div>
              <div className="bg-slate-900 p-2.5 rounded-xl">کشور: <strong>{geoData.country} ({geoData.country_code})</strong></div>
              <div className="bg-slate-900 p-2.5 rounded-xl">شهر: <strong>{geoData.city}</strong></div>
              <div className="bg-slate-900 p-2.5 rounded-xl">ISP: <strong>{geoData.connection?.isp || '—'}</strong></div>
              <div className="bg-slate-900 p-2.5 rounded-xl">منطقه زمانی: <strong>{geoData.timezone?.id || '—'}</strong></div>
              <div className="bg-slate-900 p-2.5 rounded-xl">مختصات: <strong className="font-mono">{geoData.latitude}, {geoData.longitude}</strong></div>
            </div>
          )}
        </div>
      )}

      {(tab === 'speed' || tab === 'ping' || tab === 'scan' || tab === 'servers' || tab === 'subnet') && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2"><Gauge className="w-4 h-4 text-amber-400" /> تست سرعت اینترنت و سنجش پایداری پینگ</h3>
          <div className="flex flex-wrap gap-2">
            <input dir="ltr" className="omni-input flex-1 font-mono text-xs" value={pingTarget} onChange={(e) => setPingTarget(e.target.value)} />
            <button onClick={runPing} className="omni-btn omni-btn-primary text-xs">تست ۴ مرحله‌ای پینگ</button>
            <button onClick={runSpeedTest} className="omni-btn omni-btn-secondary text-xs">تست سرعت دانلود</button>
          </div>
          {pings.length > 0 && (
            <div className="grid grid-cols-4 gap-2 text-center font-mono text-xs">
              {pings.map((p, i) => <div key={i} className="bg-slate-900 p-3 rounded-xl"><div className="text-slate-400">Ping #{i + 1}</div><div className="text-lg font-bold text-cyan-400">{p >= 0 ? `${p} ms` : 'ERR'}</div></div>)}
            </div>
          )}
          {speedMbps !== null && <div className="rounded-xl bg-emerald-950/60 border border-emerald-500/30 p-4 text-center text-2xl font-mono font-black text-emerald-400">{speedMbps} Mbps</div>}
        </div>
      )}

      {tab === 'shortener' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2"><Link2 className="w-4 h-4 text-cyan-400" /> کوتاه‌کننده رایگان لینک (TinyURL / is.gd)</h3>
          <div className="flex gap-2" dir="ltr">
            <input className="omni-input flex-1 font-mono text-xs" value={longUrl} onChange={(e) => setLongUrl(e.target.value)} />
            <button onClick={async () => { try { setShortUrl(await shortenUrlFree(longUrl)); onToast('لینک کوتاه ساخته شد!', 'success'); } catch (e) { onToast((e as Error).message, 'error'); } }} className="omni-btn omni-btn-primary text-xs">کوتاه کن</button>
          </div>
          {shortUrl && <div dir="ltr" className="rounded-xl bg-slate-950 p-3 font-mono text-sm text-emerald-400">{shortUrl}</div>}
        </div>
      )}

      {tab === 'wifiqr' && (
        <div className="glass-card rounded-2xl p-4 text-center space-y-3">
          <h3 className="font-bold text-sm flex items-center justify-center gap-2"><Wifi className="w-4 h-4 text-cyan-400" /> کارت QR اتصال سریع به Wi-Fi</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input className="omni-input text-xs" value={wifiSsid} onChange={(e) => setWifiSsid(e.target.value)} placeholder="نام شبکه (SSID)" />
            <input className="omni-input text-xs" value={wifiPass} onChange={(e) => setWifiPass(e.target.value)} placeholder="رمز عبور" />
            <select className="omni-input text-xs" value={wifiSec} onChange={(e) => setWifiSec(e.target.value)}><option value="WPA">WPA/WPA2</option><option value="WEP">WEP</option><option value="nopass">باز (بدون رمز)</option></select>
          </div>
          {wifiQr && <img src={wifiQr} alt="WiFi QR" className="mx-auto rounded-xl border-4 border-white w-48 h-48" />}
        </div>
      )}

      {tab === 'http' && (
        <div className="glass-card rounded-2xl p-4 space-y-2 text-xs font-mono" dir="ltr">
          <div className="bg-slate-900 p-3 rounded-xl"><span className="text-cyan-400">User-Agent: </span>{navigator.userAgent}</div>
          <div className="bg-slate-900 p-3 rounded-xl"><span className="text-emerald-400">Online: </span>{String(navigator.onLine)} | <span className="text-amber-400">Language: </span>{navigator.language}</div>
        </div>
      )}
    </div>
  );
};
