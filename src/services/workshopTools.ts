export type WorkshopUnitGroup = 'length' | 'torque' | 'pressure' | 'mass' | 'power' | 'volume' | 'speed' | 'temperature';

const UNIT_FACTORS: Record<Exclude<WorkshopUnitGroup, 'temperature'>, Record<string, number>> = {
  length: { mm: 0.001, cm: 0.01, m: 1, in: 0.0254, ft: 0.3048 },
  torque: { 'N·m': 1, 'lbf·ft': 1.3558179483, 'lbf·in': 0.112984829, 'kgf·m': 9.80665 },
  pressure: { bar: 100000, kPa: 1000, MPa: 1000000, psi: 6894.757293 },
  mass: { kg: 1, g: 0.001, lb: 0.45359237, tonne: 1000 },
  power: { W: 1, kW: 1000, hp: 745.699872, 'BTU/h': 0.29307107 },
  volume: { L: 1, mL: 0.001, 'm³': 1000, 'US gal': 3.785411784 },
  speed: { 'm/min': 1, 'ft/min': 0.3048, 'm/s': 60, 'ft/s': 18.288 },
};

export function convertWorkshopValue(value: number, group: WorkshopUnitGroup, from: string, to: string): number {
  if (!Number.isFinite(value)) return Number.NaN;
  if (group === 'temperature') {
    const celsius = from === '°F' ? (value - 32) * (5 / 9) : value;
    return to === '°F' ? celsius * (9 / 5) + 32 : celsius;
  }
  const factors = UNIT_FACTORS[group];
  if (!(from in factors) || !(to in factors)) return Number.NaN;
  return (value * factors[from]) / factors[to];
}

export function calcPlateMass(lengthMm: number, widthMm: number, thicknessMm: number, densityKgM3: number) {
  const volumeM3 = (lengthMm * widthMm * thicknessMm) / 1_000_000_000;
  const massKg = volumeM3 * densityKgM3;
  return { volumeM3, massKg };
}

export function calcCuttingParameters(
  surfaceSpeedMMin: number,
  diameterMm: number,
  flutes: number,
  chipLoadMmTooth: number,
) {
  if (surfaceSpeedMMin <= 0 || diameterMm <= 0 || flutes <= 0 || chipLoadMmTooth < 0) {
    return { spindleRpm: 0, feedMmMin: 0 };
  }
  const spindleRpm = (surfaceSpeedMMin * 1000) / (Math.PI * diameterMm);
  return { spindleRpm, feedMmMin: spindleRpm * flutes * chipLoadMmTooth };
}

export function calcBoltTorque(
  diameterMm: number,
  tensileAreaMm2: number,
  yieldStrengthMpa: number,
  nutFactor: number,
  preloadRatio = 0.7,
) {
  const preloadKn = (tensileAreaMm2 * yieldStrengthMpa * preloadRatio) / 1000;
  const torqueNm = nutFactor * preloadKn * diameterMm;
  return { preloadKn, torqueNm };
}

export function calcCylinderForce(pressureBar: number, boreMm: number, rodMm = 0) {
  const boreAreaMm2 = (Math.PI * boreMm ** 2) / 4;
  const annularAreaMm2 = (Math.PI * Math.max(0, boreMm ** 2 - rodMm ** 2)) / 4;
  const forceFromArea = (areaMm2: number) => (pressureBar * areaMm2) / 10_000;
  return { extendKn: forceFromArea(boreAreaMm2), retractKn: forceFromArea(annularAreaMm2), boreAreaMm2, annularAreaMm2 };
}

export function calcGearOutput(
  inputRpm: number,
  driverTeeth: number,
  drivenTeeth: number,
  inputTorqueNm: number,
  efficiencyPercent = 100,
) {
  if (driverTeeth <= 0 || drivenTeeth <= 0) return { ratio: 0, outputRpm: 0, outputTorqueNm: 0 };
  const ratio = drivenTeeth / driverTeeth;
  return {
    ratio,
    outputRpm: inputRpm / ratio,
    outputTorqueNm: inputTorqueNm * ratio * Math.min(100, Math.max(0, efficiencyPercent)) / 100,
  };
}

export function solveOhmsLaw(
  solveFor: 'voltage' | 'current' | 'resistance' | 'power',
  first: number,
  second: number,
) {
  if (solveFor === 'voltage') return { value: first * second, unit: 'V', powerW: first * first * second };
  if (solveFor === 'current') return second === 0
    ? { value: Number.NaN, unit: 'A', powerW: Number.NaN }
    : { value: first / second, unit: 'A', powerW: (first ** 2) / second };
  if (solveFor === 'resistance') return second === 0
    ? { value: Number.NaN, unit: 'Ω', powerW: Number.NaN }
    : { value: first / second, unit: 'Ω', powerW: first * second };
  return { value: first * second, unit: 'W', powerW: first * second };
}

export function calcPipeCapacity(outerDiameterMm: number, wallThicknessMm: number, lengthM: number) {
  const innerDiameterMm = Math.max(0, outerDiameterMm - 2 * wallThicknessMm);
  const volumeLitres = (Math.PI * (innerDiameterMm / 2) ** 2 * lengthM) / 1000;
  return { innerDiameterMm, volumeLitres };
}

export function calcWeldConsumables(
  legMm: number,
  lengthM: number,
  depositionEfficiency = 0.85,
  densityKgM3 = 7850,
) {
  const weldVolumeM3 = (0.5 * legMm ** 2 * lengthM * 1000) / 1_000_000_000;
  const depositedMassKg = weldVolumeM3 * densityKgM3;
  const efficiency = Math.max(0.01, Math.min(1, depositionEfficiency));
  return { weldVolumeM3, depositedMassKg, wireRequiredKg: depositedMassKg / efficiency };
}

export function calcToleranceStack(tolerances: number[]) {
  const values = tolerances.filter(Number.isFinite).map(Math.abs);
  return {
    count: values.length,
    worstCase: values.reduce((sum, value) => sum + value, 0),
    rootSumSquare: Math.sqrt(values.reduce((sum, value) => sum + value ** 2, 0)),
  };
}

export function calcMaintenanceDue(lastServiceDate: string, intervalDays: number, today = new Date()) {
  const [year, month, day] = lastServiceDate.split('-').map(Number);
  if (![year, month, day, intervalDays].every(Number.isFinite) || month < 1 || month > 12 || day < 1 || day > 31) {
    return { dueDate: '—', daysRemaining: Number.NaN };
  }
  const last = new Date(Date.UTC(year, month - 1, day));
  if (last.getUTCFullYear() !== year || last.getUTCMonth() !== month - 1 || last.getUTCDate() !== day) {
    return { dueDate: '—', daysRemaining: Number.NaN };
  }
  const due = new Date(last.getTime() + intervalDays * 86_400_000);
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const daysRemaining = Math.ceil((due.getTime() - todayUtc) / 86_400_000);
  return { dueDate: due.toISOString().slice(0, 10), daysRemaining };
}
