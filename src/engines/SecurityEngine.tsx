import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { EngineProps } from '../types';
import {
  aesDecrypt, aesEncrypt, digestText, evaluatePasswordStrength, generateEccKeyPair,
  generateRsaKeyPair, generateSecurePassword, generateTotp, hmacSign, md5,
  stegoExtractMessage, stegoHideMessage,
} from '../services/cryptoEngine';
import { checkPasswordBreachHibp } from '../services/freeApis';
import { getAndroidInstalledApps } from '../services/nativeBridge';
import { loadData, saveData } from '../services/storage';
import { KeyRound, Shield, Lock, QrCode, EyeOff, AlertTriangle, CheckCircle2 } from 'lucide-react';

type SecTab = 'generator' | '2fa' | 'vault' | 'crypto' | 'hash' | 'encode' | 'qr' | 'stego' | 'audit' | 'privacy' | 'shredder';

export const SecurityEngine: React.FC<EngineProps> = ({ tool, onToast, settings, onUpdateSettings }) => {
  const [tab, setTab] = useState<SecTab>((tool.mode as SecTab) || 'generator');

  // Password Generator
  const [pwdLen, setPwdLen] = useState(16);
  const [genPwd, setGenPwd] = useState(() => generateSecurePassword({ length: 16, upper: true, lower: true, numbers: true, symbols: true }));
  const [uuidOut, setUuidOut] = useState(() => crypto.randomUUID());

  // 2FA TOTP Authenticator
  const [totpAccounts, setTotpAccounts] = useState<{ id: string; name: string; secret: string }[]>(() =>
    loadData('totp_accounts', [{ id: 'demo', name: 'OmniForge Demo 2FA', secret: 'JBSWY3DPEHPK3PXP' }])
  );
  const [totpCodes, setTotpCodes] = useState<Record<string, { code: string; remaining: number }>>({});
  const [newTotpName, setNewTotpName] = useState('');
  const [newTotpSecret, setNewTotpSecret] = useState('');

  // Encrypted AES-256 Vault
  const [vaultMaster, setVaultMaster] = useState('');
  const [vaultItems, setVaultItems] = useState<{ id: string; title: string; encrypted: string; decrypted?: string }[]>(() => loadData('aes_vault', []));
  const [vaultTitle, setVaultTitle] = useState('');
  const [vaultSecret, setVaultSecret] = useState('');

  // AES / RSA / ECC Crypto
  const [cryptoPlain, setCryptoPlain] = useState('پیام کاملاً محرمانه همه‌کاره پرو');
  const [cryptoPass, setCryptoPass] = useState('OmniForge2026!');
  const [cryptoOut, setCryptoOut] = useState('');
  const [keyPairPem, setKeyPairPem] = useState('');

  // Hash & Encode
  const [hashInput, setHashInput] = useState('OmniForge Pro');
  const [hmacKey, setHmacKey] = useState('secret-key');
  const [hashes, setHashes] = useState<Record<string, string>>({});

  // QR Generator & Scanner
  const [qrText, setQrText] = useState('https://github.com/Pillow1243/All-in-One');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [qrScanResult, setQrScanResult] = useState('');

  // LSB Steganography
  const stegoCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stegoSecret, setStegoSecret] = useState('راز نهان‌نگاری‌شده در پیکسل‌های عکس!');
  const [stegoExtracted, setStegoExtracted] = useState('');

  // Breach & Phishing Audit
  const [breachPwd, setBreachPwd] = useState('');
  const [breachResult, setBreachResult] = useState('');
  const [phishUrl, setPhishUrl] = useState('http://paypa1-verify-account.login-secure.xyz/auth');
  const [installedApps, setInstalledApps] = useState<{ name: string; packageName: string; version: string; permissionsCount: number }[]>([]);

  useEffect(() => {
    const allowed: SecTab[] = ['generator', '2fa', 'vault', 'crypto', 'hash', 'encode', 'qr', 'stego', 'audit', 'privacy', 'shredder'];
    if (allowed.includes(tool.mode as SecTab)) setTab(tool.mode as SecTab);
  }, [tool.id, tool.mode]);

  // Live 1s tick for real RFC 6238 TOTP codes
  useEffect(() => {
    const update = async () => {
      const map: Record<string, { code: string; remaining: number }> = {};
      for (const acc of totpAccounts) {
        map[acc.id] = await generateTotp(acc.secret);
      }
      setTotpCodes(map);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [totpAccounts]);

  // Compute live hashes
  useEffect(() => {
    (async () => {
      setHashes({
        MD5: md5(hashInput),
        'SHA-1': await digestText(hashInput, 'SHA-1'),
        'SHA-256': await digestText(hashInput, 'SHA-256'),
        'SHA-512': await digestText(hashInput, 'SHA-512'),
        'HMAC-SHA256': await hmacSign(hashInput, hmacKey),
        Base64: btoa(unescape(encodeURIComponent(hashInput))),
      });
    })();
  }, [hashInput, hmacKey]);

  // Generate QR
  useEffect(() => {
    if (!qrText) return;
    QRCode.toDataURL(qrText, { width: 280, margin: 2, color: { dark: '#050814', light: '#ffffff' } })
      .then(setQrDataUrl)
      .catch(() => {});
  }, [qrText]);

  useEffect(() => {
    if (tab === 'privacy') getAndroidInstalledApps().then(setInstalledApps);
  }, [tab]);

  const strength = evaluatePasswordStrength(genPwd);

  const scanQrFromFile = (file: File) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, c.width, c.height);
      const code = jsQR(data.data, data.width, data.height);
      setQrScanResult(code ? code.data : 'کد QR در این تصویر یافت نشد');
      if (code) onToast('کد QR با موفقیت خوانده شد!', 'success');
    };
    img.src = URL.createObjectURL(file);
  };

  const checkPhishing = (u: string) => {
    const flags: string[] = [];
    if (!u.startsWith('https://')) flags.push('عدم استفاده از HTTPS امن');
    if (/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(u)) flags.push('استفاده از آی‌پی مستقیم به‌جای دامنه');
    if (/(login|verify|secure|account|bank|wallet)/i.test(u) && /\.(xyz|top|tk|ml|click|zip)/i.test(u)) flags.push('ترکیب مشکوک کلمات حساس با پسوند دامنه پرخطر');
    if ((u.match(/\./g) || []).length > 3) flags.push('زیردامنه‌های بیش از حد زیاد (مشکوک به جعل)');
    return flags;
  };
  const phishFlags = checkPhishing(phishUrl);

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 overflow-x-auto pb-2">
        {[
          ['generator', 'مولد رمز و UUID'],
          ['2fa', 'احراز هویت 2FA'],
          ['vault', 'گاوصندوق AES-256'],
          ['crypto', 'AES / RSA / ECC'],
          ['hash', 'هش و Base64'],
          ['qr', 'تولید و اسکن QR'],
          ['stego', 'نهان‌نگاری عکس'],
          ['audit', 'نشت رمز و فیشینگ'],
          ['privacy', 'قفل اپ و مجوزها'],
        ].map(([id, lbl]) => (
          <button key={id} onClick={() => setTab(id as SecTab)} className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold ${tab === id ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white' : 'bg-slate-800/70 text-slate-300'}`}>
            {lbl}
          </button>
        ))}
      </div>

      {/* Password & Key Generator */}
      {tab === 'generator' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2"><KeyRound className="w-4 h-4 text-rose-400" /> مولد رمز فوق‌امن، پین‌کد و UUID</h3>
          <div dir="ltr" className="rounded-xl bg-slate-950 p-4 font-mono text-lg text-cyan-300 break-all flex justify-between items-center gap-2">
            <span>{genPwd}</span>
            <button onClick={() => { navigator.clipboard?.writeText(genPwd); onToast('کپی شد', 'success'); }} className="omni-btn omni-btn-secondary text-xs shrink-0">کپی</button>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span>قدرت: <strong style={{ color: strength.color }}>{strength.labelFa} ({strength.entropyBits} bit)</strong></span>
            <span>زمان شکست: <strong>{strength.crackTime}</strong></span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span>طول رمز: {pwdLen}</span>
            <input type="range" min={8} max={48} value={pwdLen} onChange={(e) => { const n = Number(e.target.value); setPwdLen(n); setGenPwd(generateSecurePassword({ length: n, upper: true, lower: true, numbers: true, symbols: true })); }} className="flex-1" />
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setGenPwd(generateSecurePassword({ length: pwdLen, upper: true, lower: true, numbers: true, symbols: true }))} className="omni-btn omni-btn-primary text-xs">تولید رمز جدید</button>
            <button onClick={() => setGenPwd(String(Math.floor(100000 + Math.random() * 900000)))} className="omni-btn omni-btn-secondary text-xs">پین ۶ رقمی</button>
            <button onClick={() => setUuidOut(crypto.randomUUID())} className="omni-btn omni-btn-secondary text-xs">UUID جدید</button>
          </div>
          <div dir="ltr" className="text-xs font-mono text-slate-400 bg-slate-900 p-2.5 rounded-xl">UUID v4: {uuidOut}</div>
        </div>
      )}

      {/* Real RFC 6238 TOTP 2FA Authenticator */}
      {tab === '2fa' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2"><Shield className="w-4 h-4 text-emerald-400" /> مدیر احراز هویت دو مرحله‌ای (TOTP RFC 6238)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input className="omni-input text-xs" value={newTotpName} onChange={(e) => setNewTotpName(e.target.value)} placeholder="نام سرویس (مثلاً GitHub)" />
            <input dir="ltr" className="omni-input font-mono text-xs" value={newTotpSecret} onChange={(e) => setNewTotpSecret(e.target.value)} placeholder="کلید Base32 (مثلاً JBSWY3DPEHPK3PXP)" />
            <button
              onClick={() => {
                if (!newTotpName || !newTotpSecret) return;
                const next = [...totpAccounts, { id: String(Date.now()), name: newTotpName, secret: newTotpSecret }];
                setTotpAccounts(next);
                saveData('totp_accounts', next);
                setNewTotpName(''); setNewTotpSecret('');
                onToast('حساب 2FA اضافه شد', 'success');
              }}
              className="omni-btn omni-btn-primary text-xs"
            >
              افزودن 2FA
            </button>
          </div>
          <div className="space-y-2">
            {totpAccounts.map((acc) => {
              const info = totpCodes[acc.id] || { code: '------', remaining: 30 };
              return (
                <div key={acc.id} className="rounded-xl bg-slate-900/80 p-3.5 flex items-center justify-between">
                  <div><div className="font-bold text-sm">{acc.name}</div><div className="text-[11px] text-slate-400">بروزرسانی تا {info.remaining} ثانیه</div></div>
                  <button onClick={() => { navigator.clipboard?.writeText(info.code); onToast('کد 2FA کپی شد', 'success'); }} dir="ltr" className="text-2xl font-mono font-black tracking-widest text-cyan-400">
                    {info.code.slice(0, 3)} {info.code.slice(3)}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AES-256 Encrypted Vault */}
      {tab === 'vault' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2"><Lock className="w-4 h-4 text-rose-400" /> گاوصندوق رمزنگاری‌شده AES-256-GCM</h3>
          <input type="password" className="omni-input" value={vaultMaster} onChange={(e) => setVaultMaster(e.target.value)} placeholder="رمز مستر گاوصندوق (برای رمزنگاری و رمزگشایی)" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input className="omni-input text-xs" value={vaultTitle} onChange={(e) => setVaultTitle(e.target.value)} placeholder="عنوان (مثلاً رمز ایمیل یا یادداشت محرمانه)" />
            <input className="omni-input text-xs" value={vaultSecret} onChange={(e) => setVaultSecret(e.target.value)} placeholder="متن یا رمز عبور مخفی" />
          </div>
          <button
            onClick={async () => {
              if (!vaultMaster || !vaultTitle || !vaultSecret) return onToast('تمام فیلدها و رمز مستر را وارد کنید', 'error');
              const encrypted = await aesEncrypt(vaultSecret, vaultMaster);
              const next = [{ id: String(Date.now()), title: vaultTitle, encrypted }, ...vaultItems];
              setVaultItems(next);
              saveData('aes_vault', next.map(({ id, title, encrypted: enc }) => ({ id, title, encrypted: enc })));
              setVaultTitle(''); setVaultSecret('');
              onToast('داده با AES-256-GCM رمزنگاری و ذخیره شد', 'success');
            }}
            className="omni-btn omni-btn-primary text-xs"
          >
            ذخیره رمزنگاری‌شده در گاوصندوق
          </button>
          <div className="space-y-2">
            {vaultItems.map((it) => (
              <div key={it.id} className="rounded-xl bg-slate-900/70 p-3 flex items-center justify-between gap-2 text-xs">
                <div className="truncate">
                  <div className="font-bold">{it.title}</div>
                  <div className="font-mono text-slate-400 truncate max-w-xs">{it.decrypted || '🔒 ' + it.encrypted.slice(0, 28) + '...'}</div>
                </div>
                <button
                  onClick={async () => {
                    try {
                      const plain = await aesDecrypt(it.encrypted, vaultMaster);
                      setVaultItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, decrypted: plain } : x)));
                    } catch {
                      onToast('رمز مستر اشتباه است!', 'error');
                    }
                  }}
                  className="omni-btn omni-btn-secondary text-xs shrink-0"
                >
                  رمزگشایی
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AES / RSA / ECC */}
      {tab === 'crypto' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm">رمزنگاری AES-256-GCM و تولید جفت‌کلید RSA-2048 / ECC P-256</h3>
          <textarea rows={3} className="omni-input text-xs" value={cryptoPlain} onChange={(e) => setCryptoPlain(e.target.value)} />
          <input className="omni-input text-xs" value={cryptoPass} onChange={(e) => setCryptoPass(e.target.value)} placeholder="کلید رمزنگاری AES" />
          <div className="flex flex-wrap gap-2">
            <button onClick={async () => setCryptoOut(await aesEncrypt(cryptoPlain, cryptoPass))} className="omni-btn omni-btn-primary text-xs">رمزنگاری AES-256</button>
            <button onClick={async () => { try { setCryptoOut(await aesDecrypt(cryptoPlain, cryptoPass)); } catch { onToast('کلید یا متن نامعتبر است', 'error'); } }} className="omni-btn omni-btn-secondary text-xs">رمزگشایی AES-256</button>
            <button onClick={async () => { const kp = await generateRsaKeyPair(); setKeyPairPem(kp.publicPem + '\n\n' + kp.privatePem); }} className="omni-btn omni-btn-secondary text-xs">تولید کلید RSA-2048</button>
            <button onClick={async () => { const kp = await generateEccKeyPair(); setKeyPairPem(kp.publicPem + '\n\n' + kp.privatePem); }} className="omni-btn omni-btn-secondary text-xs">تولید کلید ECC P-256</button>
          </div>
          {cryptoOut && <textarea rows={3} dir="ltr" readOnly className="omni-input font-mono text-xs text-emerald-300" value={cryptoOut} />}
          {keyPairPem && <textarea rows={6} dir="ltr" readOnly className="omni-input font-mono text-[11px] text-cyan-300" value={keyPairPem} />}
        </div>
      )}

      {/* Hash & Encode */}
      {(tab === 'hash' || tab === 'encode') && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm">تولید هم‌زمان MD5, SHA-1, SHA-256, SHA-512, HMAC و Base64</h3>
          <input className="omni-input" value={hashInput} onChange={(e) => setHashInput(e.target.value)} placeholder="متن ورودی" />
          <input className="omni-input text-xs" value={hmacKey} onChange={(e) => setHmacKey(e.target.value)} placeholder="کلید HMAC" />
          <div className="space-y-2 text-xs font-mono" dir="ltr">
            {Object.entries(hashes).map(([k, v]) => (
              <div key={k} className="bg-slate-900/70 p-2.5 rounded-xl break-all">
                <span className="text-cyan-400 font-bold">{k}: </span>{v}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QR Code Generator & Scanner */}
      {tab === 'qr' && (
        <div className="glass-card rounded-2xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3 text-center">
            <h3 className="font-bold text-sm flex items-center justify-center gap-2"><QrCode className="w-4 h-4 text-cyan-400" /> مولد جهانی QR Code</h3>
            <input dir="ltr" className="omni-input text-xs" value={qrText} onChange={(e) => setQrText(e.target.value)} />
            {qrDataUrl && <img src={qrDataUrl} alt="QR" className="mx-auto rounded-xl border-4 border-white w-48 h-48" />}
            {qrDataUrl && <a href={qrDataUrl} download="omniforge-qr.png" className="omni-btn omni-btn-primary text-xs">دانلود PNG</a>}
          </div>
          <div className="space-y-3">
            <h3 className="font-bold text-sm">اسکنر QR از تصویر / دوربین</h3>
            <label className="omni-btn omni-btn-secondary w-full cursor-pointer text-xs">
              📷 انتخاب یا عکس گرفتن از کد QR
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && scanQrFromFile(e.target.files[0])} />
            </label>
            {qrScanResult && <div dir="ltr" className="rounded-xl bg-slate-950 p-3 text-xs font-mono text-emerald-400 break-all">{qrScanResult}</div>}
          </div>
        </div>
      )}

      {/* Real LSB Image Steganography */}
      {tab === 'stego' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2"><EyeOff className="w-4 h-4 text-fuchsia-400" /> نهان‌نگاری واقعی پیام محرمانه داخل پیکسل‌های PNG (LSB)</h3>
          <input className="omni-input text-xs" value={stegoSecret} onChange={(e) => setStegoSecret(e.target.value)} placeholder="پیام مخفی برای پنهان‌سازی در تصویر" />
          <input
            type="file"
            accept="image/*"
            className="omni-input text-xs"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const img = new Image();
              img.onload = () => {
                const c = stegoCanvasRef.current!;
                c.width = Math.min(img.width, 800);
                c.height = Math.round((c.width / img.width) * img.height);
                c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
              };
              img.src = URL.createObjectURL(f);
            }}
          />
          <canvas ref={stegoCanvasRef} width={400} height={200} className="w-full max-h-56 object-contain rounded-xl bg-slate-950 border border-slate-700" />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                const c = stegoCanvasRef.current;
                if (!c) return;
                const ctx = c.getContext('2d')!;
                const next = stegoHideMessage(ctx.getImageData(0, 0, c.width, c.height), stegoSecret);
                ctx.putImageData(next, 0, 0);
                const a = document.createElement('a');
                a.href = c.toDataURL('image/png');
                a.download = 'stego-secret.png';
                a.click();
                onToast('پیام درون پیکسل‌های تصویر پنهان و دانلود شد!', 'success');
              }}
              className="omni-btn omni-btn-primary text-xs"
            >
              پنهان کردن پیام و دانلود PNG
            </button>
            <button
              onClick={() => {
                const c = stegoCanvasRef.current;
                if (!c) return;
                const msg = stegoExtractMessage(c.getContext('2d')!.getImageData(0, 0, c.width, c.height));
                setStegoExtracted(msg || 'پیام مخفی در این تصویر پیدا نشد');
              }}
              className="omni-btn omni-btn-secondary text-xs"
            >
              استخراج پیام مخفی
            </button>
          </div>
          {stegoExtracted && <div className="rounded-xl bg-emerald-950/60 border border-emerald-500/40 p-3 text-sm text-emerald-300">{stegoExtracted}</div>}
        </div>
      )}

      {/* Breach Check (HIBP k-Anonymity) & Phishing Detector */}
      {tab === 'audit' && (
        <div className="glass-card rounded-2xl p-4 space-y-4">
          <div className="space-y-2">
            <h3 className="font-bold text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-400" /> بررسی نشت رمز عبور در دیتابیس جهانی (HIBP k-Anonymity — کاملاً امن)</h3>
            <div className="flex gap-2">
              <input type="password" className="omni-input" value={breachPwd} onChange={(e) => setBreachPwd(e.target.value)} placeholder="رمز عبور برای بررسی نشت (فقط ۵ کاراکتر هش ارسال می‌شود)" />
              <button
                onClick={async () => {
                  const sha1 = await digestText(breachPwd, 'SHA-1');
                  const res = await checkPasswordBreachHibp(sha1);
                  if (res.offline) setBreachResult('نیاز به اتصال اینترنت برای استعلام از Have I Been Pwned');
                  else if (res.pwned) setBreachResult(`⚠️ هشدار! این رمز عبور ${res.count.toLocaleString()} بار در نشت‌های اطلاعاتی جهان دیده شده است!`);
                  else setBreachResult('✅ عالی! این رمز عبور در هیچ نشت اطلاعاتی شناخته شده‌ای یافت نشد.');
                }}
                className="omni-btn omni-btn-primary shrink-0"
              >
                بررسی نشت
              </button>
            </div>
            {breachResult && <div className="rounded-xl bg-slate-900 p-3 text-xs">{breachResult}</div>}
          </div>

          <div className="space-y-2 border-t border-slate-800 pt-3">
            <h3 className="font-bold text-sm">تشخیص لینک فیشینگ و کلاهبرداری</h3>
            <input dir="ltr" className="omni-input font-mono text-xs" value={phishUrl} onChange={(e) => setPhishUrl(e.target.value)} />
            {phishFlags.length > 0 ? (
              <ul className="space-y-1 text-xs text-rose-300 bg-rose-950/40 border border-rose-500/30 p-3 rounded-xl">
                {phishFlags.map((f, i) => <li key={i}>⚠️ {f}</li>)}
              </ul>
            ) : (
              <div className="text-xs text-emerald-400 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> نشانه‌ای از فیشینگ در ساختار URL دیده نشد</div>
            )}
          </div>
        </div>
      )}

      {/* App Lock & Permissions & Shredder */}
      {(tab === 'privacy' || tab === 'shredder') && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm">قفل برنامه با پین‌کد و مشاهده مجوزهای اپ‌ها</h3>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={settings.appLockEnabled} onChange={(e) => onUpdateSettings({ appLockEnabled: e.target.checked })} />
              فعال‌سازی قفل پین‌کد هنگام ورود
            </label>
            <input className="omni-input !w-32 font-mono text-xs" value={settings.appLockPin} onChange={(e) => onUpdateSettings({ appLockPin: e.target.value })} placeholder="PIN" />
          </div>
          <div className="space-y-1.5">
            <div className="text-xs font-bold text-slate-400">اپلیکیشن‌های شناسایی‌شده و تعداد مجوزها:</div>
            {installedApps.map((a) => (
              <div key={a.packageName} className="rounded-xl bg-slate-900/70 p-2.5 flex justify-between text-xs">
                <div><div className="font-bold">{a.name}</div><div className="text-[11px] text-slate-400 font-mono">{a.packageName}</div></div>
                <span className="rounded-lg bg-slate-800 px-2 py-1 h-fit">{a.permissionsCount} مجوز</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
