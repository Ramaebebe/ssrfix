type Vehicle = { base_price:number; ev?:boolean };
type Accessory = { price:number };

export function priceQuote({ vehicle, termMonths, limitKm, accessories }:{
  vehicle: Vehicle; termMonths:number; limitKm:number; accessories: Accessory[];
}){
  // simple example: finance factor + km factor + accessories
  const rate = vehicle.ev ? 0.012 : 0.015; // EV slightly cheaper
  const kmFactor = Math.max(1, limitKm/180000);
  const accTotal = accessories.reduce((s,a)=>s + (a.price||0),0);
  const total = vehicle.base_price*kmFactor + accTotal;
  const monthly = total * rate;
  return { monthly: Math.round(monthly), total: Math.round(total) };
}
