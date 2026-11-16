import React, { useEffect, useRef, useState } from 'react';
import { EngineProps } from '../types';
import { nativePrintHtml } from '../services/nativeBridge';
import { Printer, Box, Tag, Receipt } from 'lucide-react';

export const PrintScanEngine: React.FC<EngineProps> = ({ tool, onToast }) => {
  const [docTitle, setDocTitle] = useState('گزارش چاپی همه‌کاره پرو');
  const [docBody, setDocBody] = useState('این سند آماده چاپ مستقیم از طریق سرویس چاپ اندروید (Android PrintManager)، پرینتر Wi-Fi، USB یا خروجی PDF است.');
  const [receiptWidth, setReceiptWidth] = useState<'58mm' | '80mm'>('80mm');
  const [labelText, setLabelText] = useState('OMNIFORGE-SKU-2026');
  const canvas3dRef = useRef<HTMLCanvasElement | null>(null);
  const [rotY, setRotY] = useState(0.5);

  // Interactive 3D Print Model Wireframe Previewer
  useEffect(() => {
    const c = canvas3dRef.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    const W = (c.width = 480);
    const H = (c.height = 240);
    ctx.fillStyle = '#070b19';
    ctx.fillRect(0, 0, W, H);
    const verts = [
      [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
      [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
    ];
    const edges = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
    const proj = verts.map(([x, y, z]) => {
      const rx = x * Math.cos(rotY) - z * Math.sin(rotY);
      const rz = x * Math.sin(rotY) + z * Math.cos(rotY) + 3.6;
      const ry = y * Math.cos(0.4) - (rz - 3.6) * Math.sin(0.4);
      const scale = 220 / rz;
      return [W / 2 + rx * scale, H / 2 + ry * scale];
    });
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2;
    edges.forEach(([a, b]) => {
      ctx.beginPath();
      ctx.moveTo(proj[a][0], proj[a][1]);
      ctx.lineTo(proj[b][0], proj[b][1]);
      ctx.stroke();
    });
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px monospace';
    ctx.fillText('3D Print Preview (20×20×20mm · Layer 0.2mm · PLA)', 14, 22);
  }, [rotY]);

  const printStandard = () => {
    nativePrintHtml(`<html dir="rtl"><meta charset="utf-8"><body style="font-family:tahoma;padding:30px"><h1>${docTitle}</h1><p style="line-height:2">${docBody.replace(/\n/g, '<br/>')}</p></body></html>`, docTitle);
    onToast('فرمان چاپ به سیستم چاپگر ارسال شد', 'success');
  };

  const printThermalReceipt = () => {
    nativePrintHtml(`<html dir="rtl"><meta charset="utf-8"><body style="font-family:monospace;width:${receiptWidth};margin:0 auto;padding:8px;border:1px dashed #000"><h3 style="text-align:center">${docTitle}</h3><hr/><p>${docBody}</p><hr/><div style="text-align:center">${new Date().toLocaleString('fa-IR')}</div></body></html>`, 'Thermal Receipt');
  };

  const printLabel = () => {
    nativePrintHtml(`<html dir="rtl"><meta charset="utf-8"><body style="text-align:center;padding:24px"><div style="display:inline-block;border:2px solid #000;padding:16px 32px;font-family:monospace"><h2>${labelText}</h2><div>|||| || ||| |||| | |||</div></div></body></html>`, 'Label Print');
  };

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <h3 className="font-bold text-sm flex items-center gap-2"><Printer className="w-4 h-4 text-cyan-400" /> مرکز چاپ مستقیم (PDF / Wi-Fi / USB / رسید حرارتی / لیبل)</h3>
        <input className="omni-input text-xs" value={docTitle} onChange={(e) => setDocTitle(e.target.value)} />
        <textarea rows={3} className="omni-input text-xs" value={docBody} onChange={(e) => setDocBody(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          <button onClick={printStandard} className="omni-btn omni-btn-primary text-xs"><Printer className="w-4 h-4" /> چاپ سند A4</button>
          <button onClick={printThermalReceipt} className="omni-btn omni-btn-secondary text-xs"><Receipt className="w-4 h-4" /> چاپ رسید {receiptWidth}</button>
          <select className="omni-input !w-24 text-xs" value={receiptWidth} onChange={(e) => setReceiptWidth(e.target.value as any)}><option value="58mm">58mm</option><option value="80mm">80mm</option></select>
        </div>
        <div className="flex gap-2 pt-2">
          <input dir="ltr" className="omni-input font-mono text-xs" value={labelText} onChange={(e) => setLabelText(e.target.value)} />
          <button onClick={printLabel} className="omni-btn omni-btn-secondary text-xs shrink-0"><Tag className="w-3.5 h-3.5" /> چاپ لیبل</button>
        </div>
      </div>

      {/* 3D Print Previewer */}
      <div className="glass-card rounded-2xl p-4 space-y-2">
        <h3 className="font-bold text-sm flex items-center gap-2"><Box className="w-4 h-4 text-indigo-400" /> پیش‌نمایش چاپ سه‌بعدی (3D Print STL/Mesh Preview)</h3>
        <canvas ref={canvas3dRef} className="w-full rounded-xl border border-slate-700" />
        <input type="range" min={0} max={6.28} step={0.05} value={rotY} onChange={(e) => setRotY(Number(e.target.value))} className="w-full" />
      </div>
    </div>
  );
};
