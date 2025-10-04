// src/lib/quoteEngine.ts
/**
 * Very simple PMT calc for illustration.
 */
export function pmt(ratePerMonth: number, termMonths: number, principal: number): number {
  if (ratePerMonth === 0) return -(principal / termMonths);
  const r = ratePerMonth;
  return -(principal * r) / (1 - Math.pow(1 + r, -termMonths));
}

export function priceQuote({
  basePrice,
  accessoriesTotal,
  ratePerAnnum,
  termMonths,
}: {
  basePrice: number;
  accessoriesTotal: number;
  ratePerAnnum: number; // e.g. 0.12
  termMonths: number;   // e.g. 36
}) {
  const principal = basePrice + accessoriesTotal;
  const ratePerMonth = ratePerAnnum / 12;
  const monthly = pmt(ratePerMonth, termMonths, principal);
  return {
    principal,
    monthly: Math.round(Math.abs(monthly)),
  };
}
