export type QuoteInput={mmCode:string;capex:number;termMonths:number;residualPct:number;rateApr:number;mileageKmPerMonth:number;maintenanceRpm:number;tyresRpm:number;insuranceRpm:number;adminRpm:number;riskGrade:'A'|'B'|'C'|'D'|'E';excessCpkCents:number};
export type QuoteOutput={monthlyPayment:number;totalCost:number};
export function priceQuote(input: QuoteInput): QuoteOutput {
  const { capex, termMonths, residualPct, rateApr, maintenanceRpm, tyresRpm, insuranceRpm, adminRpm } = input;
  const residual = capex * (residualPct / 100);
  const financed = capex - residual;
  const monthlyRate = rateApr / 100 / 12;
  const basePayment = (financed * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -termMonths));
  const monthlyPayment = basePayment + maintenanceRpm + tyresRpm + insuranceRpm + adminRpm;
  return { monthlyPayment: Number(monthlyPayment.toFixed(2)), totalCost: Number((monthlyPayment * termMonths).toFixed(2)) };
}
