import { RATES_UNDER_150, RATES_OVER_150, SERVICE_CHARGE_LOW, SERVICE_CHARGE_HIGH } from '../types/index';

export function calculateElectricityCost(energy: number): number {
  if (energy === 0) return 0;

  // Convert to monthly equivalent for daily calculations
  const monthlyEquivalent = energy * 30;
  const rates = monthlyEquivalent <= 150 ? RATES_UNDER_150 : RATES_OVER_150;
  const serviceCharge = monthlyEquivalent <= 150 ? SERVICE_CHARGE_LOW : SERVICE_CHARGE_HIGH;

  let totalCost = 0;
  let remainingEnergy = energy;

  for (const { range, rate } of rates) {
    const [min, max] = range;
    const rangeSize = max - min + 1;
    const energyInRange = Math.min(remainingEnergy, rangeSize);
    
    if (energyInRange <= 0) break;
    
    totalCost += energyInRange * rate;
    remainingEnergy -= energyInRange;
  }

  // Add service charge (proportional for daily calculation)
  totalCost += serviceCharge / 30;

  return Number(totalCost.toFixed(2));
}