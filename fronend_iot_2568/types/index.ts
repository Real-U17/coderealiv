export interface SensorData {
  timestamp: string;
  voltage: number;
  current: number;
  power: number;
  energy: number;
  frequency: number;
  pf: number;
}

export interface ElectricityRates {
  range: [number, number];
  rate: number;
}

export const RATES_UNDER_150: ElectricityRates[] = [
  { range: [1, 15], rate: 2.3488 },
  { range: [16, 25], rate: 2.9882 },
  { range: [26, 35], rate: 3.2405 },
  { range: [36, 100], rate: 3.6237 },
  { range: [101, 150], rate: 3.7171 },
  { range: [151, 400], rate: 4.2218 },
  { range: [401, Infinity], rate: 4.4217 }
];

export const RATES_OVER_150: ElectricityRates[] = [
  { range: [1, 150], rate: 3.2484 },
  { range: [151, 400], rate: 4.2218 },
  { range: [401, Infinity], rate: 4.4217 }
];

export const SERVICE_CHARGE_LOW = 8.19;
export const SERVICE_CHARGE_HIGH = 38.22;