import React, { useMemo, useState } from 'react';
import {
  Activity, ArrowLeftRight, Bolt, Calculator, Check, CircuitBoard, Clock3, Cog, Copy,
  Droplets, Gauge, Layers3, Ruler, Wrench, Zap,
} from 'lucide-react';
import type { EngineProps } from '../types';
import {
  calcBoltTorque, calcCuttingParameters, calcCylinderForce, calcGearOutput, calcMaintenanceDue,
  calcPipeCapacity, calcPlateMass, calcToleranceStack, calcWeldConsumables, convertWorkshopValue,
  solveOhmsLaw, type WorkshopUnitGroup,
} from '../services/workshopTools';

const MATERIALS: Record<string, { label: string; density: number }> = {
  steel: { label: 'فولاد کربنی', density: 7850 },
  stainless: { label: 'استنلس استیل', density: 8000 },
  aluminum: { label: 'آلومینیوم', density: 2700 },
  copper: { label: 'مس', density: 8960 },
  brass: { label: 'برنج', density: 8500 },
};

const UNIT_CHOICES: Record<WorkshopUnitGroup, string[]> = {
  length: ['mm', 'cm', 'm', 'in', 'ft'],
  torque: ['N·m', 'lbf·ft', 'lbf·in', 'kgf·m'],
  pressure: ['bar', 'kPa', 'MPa', 'psi'],
  mass: ['kg', 'g', 'lb', 'tonne'],
  power: ['W', 'kW', 'hp', 'BTU/h'],
  volume: ['L', 'mL', 'm³', 'US gal'],
  speed: ['m/min', 'ft/min', 'm/s', 'ft/s'],
  temperature: ['°C', '°F'],
};

const BOLTS: Record<string, { diameter: number; area: number }> = {
  M4: { diameter: 4, area: 8.78 }, M5: { diameter: 5, area: 14.2 },
  M6: { diameter: 6, area: 20.1 }, M8: { diameter: 8, area: 36.6 },
  M10: { diameter: 10, area: 58 }, M12: { diameter: 12, area: 84.3 },
  M16: { diameter: 16, area: 157 }, M20: { diameter: 20, area: 245 },
};

const MODULES: Record<string, { icon: React.ComponentType<{ className?: string }>; code: string; method: string }> = {
  unit: { icon: ArrowLeftRight, code: 'UNIT-X', method: 'Dimensional conversion / SI & imperial' },
  material: { icon: Layers3, code: 'MASS-01', method: 'Rectangular stock / nominal density' },
  cutting: { icon: Gauge, code: 'CNC-02', method: 'Vc, D, z, fz → spindle & feed' },
  bolt: { icon: Bolt, code: 'FAST-03', method: 'Preload estimate / K-factor method' },
  hydraulic: { icon: Droplets, code: 'HYD-04', method: 'P × piston area / extend & retract' },
  gear: { icon: Cog, code: 'DRIVE-05', method: 'Tooth ratio / efficiency corrected' },
  ohms: { icon: CircuitBoard, code: 'ELEC-06', method: 'Ohm’s law / DC resistive load' },
  pipe: { icon: Ruler, code: 'PIPE-07', method: 'Internal cylinder capacity' },
  weld: { icon: Zap, code: 'WELD-08', method: 'Equal-leg fillet / deposition efficiency' },
  tolerance: { icon: Calculator, code: 'QC-09', method: 'Worst-case & root-sum-square stack' },
  maintenance: { icon: Clock3, code: 'PM-10', method: 'Calendar interval / local schedule' },
  pneumatic: { icon: Activity, code: 'PNEU-11', method: 'Compressed-air cylinder force' },
};

const INITIAL: Record<string, string> = {
  value: '100', unitGroup: 'length', from: 'mm', to: 'in',
  length: '1000', width: '500', thickness: '10', material: 'steel',
  surfaceSpeed: '120', diameter: '10', flutes: '4', chipLoad: '0.05',
  bolt: 'M10', strengthClass: '8.8', lubrication: 'dry',
  pressure: '160', pneumaticPressure: '7', bore: '50', rod: '25',
  inputRpm: '1450', driverTeeth: '20', drivenTeeth: '60', torque: '12', efficiency: '92',
  solveFor: 'voltage', voltage: '24', current: '2', resistance: '12',
  outerDiameter: '60', wall: '3', pipeLength: '6',
  weldLeg: '5', weldLength: '6', deposition: '85',
  tolerances: '0.05, -0.03, 0.02, 0.04',
  lastService: new Date().toISOString().slice(0, 10), interval: '90',
};

const formatNumber = (value: number, digits = 2) => {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: digits, minimumFractionDigits: 0 }).format(value);
};

type Metric = { label: string; value: string | number; unit?: string; detail?: string };

export const WorkshopEngine: React.FC<EngineProps> = ({ tool, lang, onToast }) => {
  const [values, setValues] = useState(INITIAL);
  const [copied, setCopied] = useState(false);
  const mode = tool.mode;
  const module = MODULES[mode] || MODULES.unit;
  const Icon = module.icon;
  const isFa = lang === 'fa' || lang === 'ar';
  const set = (key: string, value: string) => setValues((previous) => ({ ...previous, [key]: value }));
  const num = (key: string) => Number.parseFloat(values[key] || '0') || 0;
  const field = (label: string, key: string, unit?: string, step = 'any') => (
    <label key={key} className="block space-y-1.5">
      <span className="flex items-center justify-between gap-2 text-[11px] font-bold text-slate-300">
        <span>{label}</span>{unit && <span className="font-mono text-[10px] text-amber-300">{unit}</span>}
      </span>
      <input
        type="number"
        inputMode="decimal"
        step={step}
        value={values[key]}
        onChange={(event) => set(key, event.target.value)}
        className="omni-input workshop-input font-mono tabular-nums"
        aria-label={label}
      />
    </label>
  );
  const select = (label: string, key: string, options: [string, string][], onSelect?: (value: string) => void) => (
    <label key={key} className="block space-y-1.5">
      <span className="block text-[11px] font-bold text-slate-300">{label}</span>
      <select value={values[key]} onChange={(event) => onSelect ? onSelect(event.target.value) : set(key, event.target.value)} className="omni-input workshop-input font-mono">
        {options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
      </select>
    </label>
  );

  const metrics: Metric[] = useMemo(() => {
    if (mode === 'unit') {
      const group = values.unitGroup as WorkshopUnitGroup;
      const result = convertWorkshopValue(num('value'), group, values.from, values.to);
      return [
        { label: 'CONVERTED VALUE', value: formatNumber(result, 5), unit: values.to },
        { label: 'SOURCE VALUE', value: formatNumber(num('value'), 5), unit: values.from },
      ];
    }
    if (mode === 'material') {
      const material = MATERIALS[values.material] || MATERIALS.steel;
      const result = calcPlateMass(num('length'), num('width'), num('thickness'), material.density);
      return [
        { label: 'ESTIMATED MASS', value: formatNumber(result.massKg, 3), unit: 'kg', detail: material.label },
        { label: 'VOLUME', value: formatNumber(result.volumeM3 * 1_000_000, 2), unit: 'cm³' },
        { label: 'DENSITY', value: formatNumber(material.density), unit: 'kg/m³' },
      ];
    }
    if (mode === 'cutting') {
      const result = calcCuttingParameters(num('surfaceSpeed'), num('diameter'), num('flutes'), num('chipLoad'));
      return [
        { label: 'SPINDLE SPEED', value: formatNumber(result.spindleRpm, 0), unit: 'rpm' },
        { label: 'TABLE FEED', value: formatNumber(result.feedMmMin, 1), unit: 'mm/min' },
        { label: 'CUTTING SPEED', value: formatNumber(num('surfaceSpeed'), 1), unit: 'm/min' },
      ];
    }
    if (mode === 'bolt') {
      const bolt = BOLTS[values.bolt] || BOLTS.M10;
      const classYield: Record<string, number> = { '8.8': 640, '10.9': 900, '12.9': 1080 };
      const nutFactor = values.lubrication === 'lubricated' ? 0.15 : 0.2;
      const result = calcBoltTorque(bolt.diameter, bolt.area, classYield[values.strengthClass] || 640, nutFactor);
      return [
        { label: 'TORQUE ESTIMATE', value: formatNumber(result.torqueNm, 1), unit: 'N·m' },
        { label: 'TARGET PRELOAD', value: formatNumber(result.preloadKn, 2), unit: 'kN' },
        { label: 'MODEL', value: `${values.bolt} / ${values.strengthClass}`, unit: values.lubrication === 'dry' ? 'DRY K=0.20' : 'LUBE K=0.15' },
      ];
    }
    if (mode === 'hydraulic' || mode === 'pneumatic') {
      const pressure = mode === 'pneumatic' ? num('pneumaticPressure') : num('pressure');
      const result = calcCylinderForce(pressure, num('bore'), num('rod'));
      return [
        { label: 'EXTEND FORCE', value: formatNumber(result.extendKn, 2), unit: 'kN' },
        { label: 'RETRACT FORCE', value: formatNumber(result.retractKn, 2), unit: 'kN' },
        { label: 'PISTON AREA', value: formatNumber(result.boreAreaMm2 / 100, 2), unit: 'cm²' },
      ];
    }
    if (mode === 'gear') {
      const result = calcGearOutput(num('inputRpm'), num('driverTeeth'), num('drivenTeeth'), num('torque'), num('efficiency'));
      return [
        { label: 'REDUCTION RATIO', value: `${formatNumber(result.ratio, 3)} : 1` },
        { label: 'OUTPUT SPEED', value: formatNumber(result.outputRpm, 1), unit: 'rpm' },
        { label: 'OUTPUT TORQUE', value: formatNumber(result.outputTorqueNm, 2), unit: 'N·m' },
      ];
    }
    if (mode === 'ohms') {
      const solveFor = values.solveFor as 'voltage' | 'current' | 'resistance' | 'power';
      const pairs: Record<string, [number, number]> = {
        voltage: [num('current'), num('resistance')],
        current: [num('voltage'), num('resistance')],
        resistance: [num('voltage'), num('current')],
        power: [num('voltage'), num('current')],
      };
      const result = solveOhmsLaw(solveFor, ...pairs[solveFor]);
      return [
        { label: `SOLVED ${solveFor.toUpperCase()}`, value: formatNumber(result.value, 4), unit: result.unit },
        { label: 'POWER', value: formatNumber(result.powerW, 2), unit: 'W' },
        { label: 'INPUTS', value: `${formatNumber(pairs[solveFor][0], 3)} / ${formatNumber(pairs[solveFor][1], 3)}` },
      ];
    }
    if (mode === 'pipe') {
      const result = calcPipeCapacity(num('outerDiameter'), num('wall'), num('pipeLength'));
      return [
        { label: 'INTERNAL DIAMETER', value: formatNumber(result.innerDiameterMm, 2), unit: 'mm' },
        { label: 'CAPACITY', value: formatNumber(result.volumeLitres, 2), unit: 'L' },
        { label: 'PIPE LENGTH', value: formatNumber(num('pipeLength'), 2), unit: 'm' },
      ];
    }
    if (mode === 'weld') {
      const result = calcWeldConsumables(num('weldLeg'), num('weldLength'), num('deposition') / 100);
      return [
        { label: 'WIRE REQUIRED', value: formatNumber(result.wireRequiredKg, 3), unit: 'kg' },
        { label: 'DEPOSITED METAL', value: formatNumber(result.depositedMassKg, 3), unit: 'kg' },
        { label: 'DEPOSITION EFFICIENCY', value: formatNumber(num('deposition'), 0), unit: '%' },
      ];
    }
    if (mode === 'tolerance') {
      const parsed = values.tolerances.split(/[\s,;]+/).map((token) => token.trim()).filter(Boolean).map(Number).filter(Number.isFinite);
      const result = calcToleranceStack(parsed);
      return [
        { label: 'WORST-CASE STACK', value: `±${formatNumber(result.worstCase, 4)}`, unit: 'mm' },
        { label: 'RSS STACK', value: `±${formatNumber(result.rootSumSquare, 4)}`, unit: 'mm' },
        { label: 'FEATURE COUNT', value: result.count, unit: 'values' },
      ];
    }
    if (mode === 'maintenance') {
      const result = calcMaintenanceDue(values.lastService, num('interval'));
      return [
        { label: 'NEXT SERVICE', value: result.dueDate },
        { label: 'DAYS REMAINING', value: formatNumber(result.daysRemaining, 0), unit: 'days', detail: result.daysRemaining < 0 ? 'OVERDUE' : 'SCHEDULED' },
        { label: 'INTERVAL', value: formatNumber(num('interval'), 0), unit: 'days' },
      ];
    }
    return [];
  }, [mode, values]);

  const inputs = (() => {
    if (mode === 'unit') {
      const group = values.unitGroup as WorkshopUnitGroup;
      const units = UNIT_CHOICES[group] || UNIT_CHOICES.length;
      return <>
        {field('VALUE', 'value', 'INPUT')}
        {select('DIMENSION', 'unitGroup', Object.keys(UNIT_CHOICES).map((key) => [key, key.toUpperCase()] as [string, string]), (group) => {
          const choices = UNIT_CHOICES[group as WorkshopUnitGroup] || UNIT_CHOICES.length;
          setValues((previous) => ({ ...previous, unitGroup: group, from: choices[0], to: choices[1] || choices[0] }));
        })}
        {select('FROM', 'from', units.map((unit) => [unit, unit]))}
        {select('TO', 'to', units.map((unit) => [unit, unit]))}
      </>;
    }
    if (mode === 'material') return <>
      {select('MATERIAL', 'material', Object.entries(MATERIALS).map(([id, material]) => [id, material.label]))}
      {field('LENGTH', 'length', 'mm')}{field('WIDTH', 'width', 'mm')}{field('THICKNESS', 'thickness', 'mm')}
    </>;
    if (mode === 'cutting') return <>
      {field('SURFACE SPEED / Vc', 'surfaceSpeed', 'm/min')}{field('TOOL DIAMETER / D', 'diameter', 'mm')}
      {field('CUTTING EDGES / z', 'flutes', 'teeth', '1')}{field('CHIP LOAD / fz', 'chipLoad', 'mm/tooth', '0.001')}
    </>;
    if (mode === 'bolt') return <>
      {select('FASTENER SIZE', 'bolt', Object.keys(BOLTS).map((size) => [size, size]))}
      {select('PROPERTY CLASS', 'strengthClass', [['8.8', '8.8 · 640 MPa'], ['10.9', '10.9 · 900 MPa'], ['12.9', '12.9 · 1080 MPa']])}
      {select('THREAD CONDITION', 'lubrication', [['dry', 'DRY · K 0.20'], ['lubricated', 'LUBRICATED · K 0.15']])}
    </>;
    if (mode === 'hydraulic' || mode === 'pneumatic') return <>
      {field('SUPPLY PRESSURE', mode === 'pneumatic' ? 'pneumaticPressure' : 'pressure', mode === 'pneumatic' ? 'bar · max 16' : 'bar')}
      {field('PISTON BORE', 'bore', 'mm')}{field('ROD DIAMETER', 'rod', 'mm')}
    </>;
    if (mode === 'gear') return <>
      {field('INPUT SPEED', 'inputRpm', 'rpm')}{field('DRIVER TEETH', 'driverTeeth', 'T1', '1')}
      {field('DRIVEN TEETH', 'drivenTeeth', 'T2', '1')}{field('INPUT TORQUE', 'torque', 'N·m')}
      {field('MECHANICAL EFFICIENCY', 'efficiency', '%')}
    </>;
    if (mode === 'ohms') {
      const unknown = values.solveFor;
      const inputKeys = unknown === 'voltage' ? ['current', 'resistance']
        : unknown === 'current' ? ['voltage', 'resistance']
          : ['voltage', 'current'];
      const labels: Record<string, [string, string]> = {
        voltage: ['CURRENT', 'A'], current: ['VOLTAGE', 'V'], resistance: ['VOLTAGE', 'V'], power: ['VOLTAGE', 'V'],
      };
      const secondLabels: Record<string, [string, string]> = {
        voltage: ['RESISTANCE', 'Ω'], current: ['RESISTANCE', 'Ω'], resistance: ['CURRENT', 'A'], power: ['CURRENT', 'A'],
      };
      return <>
        {select('SOLVE FOR', 'solveFor', [['voltage', 'VOLTAGE · V'], ['current', 'CURRENT · A'], ['resistance', 'RESISTANCE · Ω'], ['power', 'POWER · W']])}
        {field(labels[unknown]?.[0] || 'INPUT 1', inputKeys[0], labels[unknown]?.[1])}
        {field(secondLabels[unknown]?.[0] || 'INPUT 2', inputKeys[1], secondLabels[unknown]?.[1])}
      </>;
    }
    if (mode === 'pipe') return <>
      {field('OUTSIDE DIAMETER', 'outerDiameter', 'mm')}{field('WALL THICKNESS', 'wall', 'mm')}{field('LENGTH', 'pipeLength', 'm')}
    </>;
    if (mode === 'weld') return <>
      {field('FILLET LEG SIZE', 'weldLeg', 'mm')}{field('WELD LENGTH', 'weldLength', 'm')}{field('DEPOSITION EFFICIENCY', 'deposition', '%')}
    </>;
    if (mode === 'tolerance') return <label className="block space-y-1.5 sm:col-span-2">
      <span className="block text-[11px] font-bold text-slate-300">INDIVIDUAL TOLERANCES <span className="font-mono text-amber-300">mm · comma-separated</span></span>
      <textarea value={values.tolerances} onChange={(event) => set('tolerances', event.target.value)} className="omni-input workshop-input min-h-28 font-mono" />
    </label>;
    if (mode === 'maintenance') return <>
      <label className="block space-y-1.5">
        <span className="block text-[11px] font-bold text-slate-300">LAST SERVICE DATE</span>
        <input type="date" value={values.lastService} onChange={(event) => set('lastService', event.target.value)} className="omni-input workshop-input font-mono" />
      </label>
      {field('SERVICE INTERVAL', 'interval', 'days', '1')}
    </>;
    return <>{field('INPUT', 'value')}</>;
  })();

  const outputText = metrics.map((metric) => `${metric.label}: ${metric.value}${metric.unit ? ` ${metric.unit}` : ''}`).join('\n');
  const copyOutput = async () => {
    try {
      await navigator.clipboard.writeText(outputText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
      onToast(isFa ? 'نتایج کپی شد' : 'Results copied', 'success');
    } catch {
      onToast(isFa ? 'دسترسی به clipboard ممکن نیست' : 'Clipboard access unavailable', 'error');
    }
  };

  return (
    <section className="workshop-engine space-y-3" aria-label={isFa ? 'موتور کارگاه صنعتی' : 'Industrial workshop engine'}>
      <div className="workshop-engine-head">
        <div className="flex min-w-0 items-center gap-3">
          <div className="workshop-engine-mark"><Icon className="h-5 w-5" /></div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="workshop-kicker">ANVIL / SHOP FLOOR</span>
              <span className="workshop-module-code">{module.code}</span>
            </div>
            <h2 className="mt-1 truncate text-base font-black sm:text-lg">{tool.nameFa}</h2>
          </div>
        </div>
        <div className="workshop-engine-state"><span /> {isFa ? 'موتور محلی / آماده' : 'LOCAL ENGINE / READY'}</div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.05fr_.95fr]">
        <div className="workshop-panel">
          <div className="workshop-panel-title"><span>01</span>{isFa ? 'پارامترهای ورودی' : 'INPUT PARAMETERS'}</div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{inputs}</div>
          <div className="mt-4 flex items-center gap-2 border-t border-white/10 pt-3 text-[10px] text-slate-500">
            <Activity className="h-3.5 w-3.5 text-amber-300" />
            <span>METHOD / {module.method}</span>
          </div>
        </div>

        <div className="workshop-results">
          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div className="workshop-panel-title !mb-0"><span>02</span>{isFa ? 'خروجی محاسبه' : 'CALCULATION OUTPUT'}</div>
            <button onClick={copyOutput} className="workshop-copy" aria-label={isFa ? 'کپی خروجی' : 'Copy output'}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{isFa ? 'کپی' : 'COPY'}</span>
            </button>
          </div>
          <div className="space-y-2.5 pt-3">
            {metrics.map((metric, index) => (
              <div className={`workshop-readout ${index === 0 ? 'workshop-readout-primary' : ''}`} key={metric.label}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="workshop-readout-label">{metric.label}</div>
                    {metric.detail && <div className="mt-1 text-[10px] text-slate-500">{metric.detail}</div>}
                  </div>
                  <div className="text-end">
                    <div className="workshop-led">{metric.value}</div>
                    {metric.unit && <div className="mt-0.5 font-mono text-[10px] text-amber-300">{metric.unit}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2 border-t border-white/10 pt-3 text-[10px] leading-relaxed text-slate-500">
            <Wrench className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
            <p>{isFa ? 'مقادیر محاسباتی، تخمینی و وابسته به ورودی هستند. برای طراحی یا کار ایمنی‌حساس، استاندارد و مشخصات سازنده را کنترل کنید.' : 'Calculated values are estimates. Verify against applicable standards and manufacturer data before safety-critical use.'}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WorkshopEngine;
