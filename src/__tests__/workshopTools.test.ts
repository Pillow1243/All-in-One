import { describe, expect, it } from 'vitest';
import {
  calcBoltTorque, calcCuttingParameters, calcCylinderForce, calcGearOutput, calcMaintenanceDue,
  calcPipeCapacity, calcPlateMass, calcToleranceStack, calcWeldConsumables, convertWorkshopValue,
  solveOhmsLaw,
} from '../services/workshopTools';

describe('Industrial workshop calculations', () => {
  it('converts common SI and imperial units, including temperature', () => {
    expect(convertWorkshopValue(25.4, 'length', 'mm', 'in')).toBeCloseTo(1, 8);
    expect(convertWorkshopValue(32, 'temperature', '°F', '°C')).toBeCloseTo(0, 8);
    expect(convertWorkshopValue(100, 'pressure', 'kPa', 'bar')).toBeCloseTo(1, 8);
  });

  it('estimates plate mass from material density and dimensions', () => {
    expect(calcPlateMass(1000, 1000, 10, 7850).massKg).toBeCloseTo(78.5, 5);
  });

  it('calculates spindle speed and feed from cutting parameters', () => {
    const result = calcCuttingParameters(100, 10, 4, 0.05);
    expect(result.spindleRpm).toBeCloseTo(3183.098, 2);
    expect(result.feedMmMin).toBeCloseTo(636.62, 1);
  });

  it('estimates bolt preload and torque using thread condition factor', () => {
    const result = calcBoltTorque(10, 58, 640, 0.2);
    expect(result.preloadKn).toBeCloseTo(25.984, 3);
    expect(result.torqueNm).toBeCloseTo(51.968, 3);
  });

  it('calculates cylinder extension and retraction forces', () => {
    const result = calcCylinderForce(200, 50, 25);
    expect(result.extendKn).toBeCloseTo(39.27, 2);
    expect(result.retractKn).toBeCloseTo(29.45, 2);
  });

  it('applies gear ratio and efficiency to speed and torque', () => {
    const result = calcGearOutput(1200, 20, 60, 10, 90);
    expect(result.ratio).toBe(3);
    expect(result.outputRpm).toBe(400);
    expect(result.outputTorqueNm).toBe(27);
  });

  it('solves Ohm’s law and guards division by zero', () => {
    expect(solveOhmsLaw('current', 24, 12).value).toBe(2);
    expect(solveOhmsLaw('voltage', 2, 12).value).toBe(24);
    expect(solveOhmsLaw('voltage', 2, 12).powerW).toBe(48);
    expect(Number.isNaN(solveOhmsLaw('resistance', 24, 0).value)).toBe(true);
  });

  it('calculates pipe capacity from internal diameter', () => {
    const result = calcPipeCapacity(60, 3, 6);
    expect(result.innerDiameterMm).toBe(54);
    expect(result.volumeLitres).toBeCloseTo(13.7413, 3);
  });

  it('estimates deposited weld metal and wire requirement', () => {
    const result = calcWeldConsumables(5, 6, 0.85);
    expect(result.depositedMassKg).toBeCloseTo(0.58875, 5);
    expect(result.wireRequiredKg).toBeCloseTo(0.69265, 4);
  });

  it('reports worst-case and RSS tolerance stacks', () => {
    const result = calcToleranceStack([3, -4]);
    expect(result.worstCase).toBe(7);
    expect(result.rootSumSquare).toBe(5);
  });

  it('calculates a maintenance due date in UTC-safe calendar days', () => {
    const result = calcMaintenanceDue('2026-01-01', 30, new Date('2026-01-15T12:00:00'));
    expect(result.dueDate).toBe('2026-01-31');
    expect(result.daysRemaining).toBe(16);
  });
});
