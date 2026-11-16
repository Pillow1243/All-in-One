import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { EngineProps } from '../types';
import { createSnapshot, exportAllAppData, importAllAppData, loadData, SnapshotVersion } from '../services/storage';
import { aesEncrypt } from '../services/cryptoEngine';
import { shareContent } from '../services/nativeBridge';
import { Cloud, Download, Upload, History, QrCode, Share2 } from 'lucide-react';

export const CloudSyncEngine: React.FC<EngineProps> = ({ tool, onToast }) => {
  const [snapshots, setSnapshots] = useState<SnapshotVersion[]>(() => loadData('snapshots', []));
  const [snapLabel, setSnapLabel] = useState('بکاپ دستی همه‌کاره پرو');
  const [encPwd, setEncPwd] = useState('');
  const [qrSharePayload, setQrSharePayload] = useState('OmniForge Sync Note');
  const [qrImg, setQrImg] = useState('');

  useEffect(() => {
    QRCode.toDataURL(qrSharePayload.slice(0, 400), { width: 220 }).then(setQrImg).catch(() => {});
  }, [qrSharePayload]);

  const downloadFullBackup = async (encrypted = false) => {
    const dump = JSON.stringify(exportAllAppData(), null, 2);
    const body = encrypted && encPwd ? await aesEncrypt(dump, encPwd) : dump;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([body], { type: 'application/json' }));
    a.download = `omniforge-backup-${Date.now()}.${encrypted ? 'enc' : 'json'}`;
    a.click();
    onToast(encrypted ? 'بکاپ رمزنگاری‌شده AES-256 دانلود شد' : 'فایل بکاپ کامل JSON دانلود شد', 'success');
  };

  const restoreBackupFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const obj = JSON.parse(await f.text());
      const count = importAllAppData(obj);
      onToast(`${count} کلید داده با موفقیت بازیابی شد!`, 'success');
    } catch {
      onToast('فایل بکاپ معتبر نیست', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <h3 className="font-bold text-sm flex items-center gap-2"><Cloud className="w-4 h-4 text-blue-400" /> پشتیبان‌گیری، بازیابی و همگام‌سازی یکپارچه</h3>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => downloadFullBackup(false)} className="omni-btn omni-btn-primary text-xs"><Download className="w-4 h-4" /> دانلود بکاپ کامل (JSON)</button>
          <label className="omni-btn omni-btn-secondary cursor-pointer text-xs">
            <Upload className="w-4 h-4" /> بازیابی از فایل بکاپ
            <input type="file" accept=".json" className="hidden" onChange={restoreBackupFile} />
          </label>
          <button onClick={() => shareContent('OmniForge Pro Backup', JSON.stringify(exportAllAppData()).slice(0, 800))} className="omni-btn omni-btn-secondary text-xs">
            <Share2 className="w-4 h-4" /> اشتراک‌گذاری سریع (Nearby/Local)
          </button>
        </div>
        <div className="flex gap-2 pt-2">
          <input type="password" className="omni-input text-xs" value={encPwd} onChange={(e) => setEncPwd(e.target.value)} placeholder="رمز برای بکاپ رمزنگاری‌شده AES-256" />
          <button onClick={() => encPwd ? downloadFullBackup(true) : onToast('رمز عبور وارد کنید', 'error')} className="omni-btn omni-btn-secondary text-xs shrink-0">بکاپ رمزنگاری‌شده</button>
        </div>
      </div>

      {/* Version History Snapshots */}
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <h3 className="font-bold text-sm flex items-center gap-2"><History className="w-4 h-4 text-cyan-400" /> تاریخچه نسخه‌ها (Version Snapshots)</h3>
        <div className="flex gap-2">
          <input className="omni-input text-xs" value={snapLabel} onChange={(e) => setSnapLabel(e.target.value)} />
          <button onClick={() => { createSnapshot(snapLabel); setSnapshots(loadData('snapshots', [])); onToast('اسنپ‌شات نسخه جدید ذخیره شد', 'success'); }} className="omni-btn omni-btn-primary text-xs shrink-0">ثبت نسخه</button>
        </div>
        <div className="space-y-1.5 text-xs">
          {snapshots.map((s) => (
            <div key={s.id} className="bg-slate-900/70 p-2.5 rounded-xl flex items-center justify-between">
              <div><div className="font-bold">{s.label}</div><div className="text-slate-400">{new Date(s.timestamp).toLocaleString('fa-IR')} · {(s.sizeBytes / 1024).toFixed(1)} KB</div></div>
              <button onClick={() => { importAllAppData(s.data); onToast('نسخه با موفقیت بازیابی شد!', 'success'); }} className="omni-btn omni-btn-secondary text-xs">بازیابی</button>
            </div>
          ))}
        </div>
      </div>

      {/* Cross-Device QR Transfer */}
      <div className="glass-card rounded-2xl p-4 text-center space-y-3">
        <h3 className="font-bold text-sm flex items-center justify-center gap-2"><QrCode className="w-4 h-4 text-emerald-400" /> انتقال سریع متن و تنظیمات بین دو دستگاه با QR</h3>
        <input className="omni-input text-xs" value={qrSharePayload} onChange={(e) => setQrSharePayload(e.target.value)} />
        {qrImg && <img src={qrImg} alt="QR Sync" className="mx-auto rounded-xl border-4 border-white w-44 h-44" />}
      </div>
    </div>
  );
};
