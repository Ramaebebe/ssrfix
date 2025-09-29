"use client";
export default function Scanner({ onVehicle }:{ onVehicle:(v:any)=>void }){
  return (
    <div className="card p-4">
      <div className="text-sm opacity-70 mb-2">License disc scan (placeholder)</div>
      <button className="btn" onClick={()=>onVehicle({ id:"demo-veh-id", vin:"VIN123", reg:"FZC504L" })}>Simulate Scan</button>
    </div>
  );
}
