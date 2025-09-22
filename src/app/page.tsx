import Link from "next/link";
export default function LandingPage() {
  return (
    <main className="container-tight">
      <section className="relative card overflow-hidden">
        <img src="/afrirent_holdings.png" alt="Afrirent Holdings" className="w-full h-[360px] object-cover opacity-90" />
        <div className="absolute inset-0 p-6 z-10 bg-gradient-to-t from-black/40 to-transparent">
          <h1 className="text-3xl font-bold mb-2">The Future of Fleet Management is Here</h1>
          <p className="text-white/80 max-w-2xl mb-4">Live availability, downtime, utilisation, and on-the-fly leasing quotes. Securely delivered to each client and cost centre.</p>
          <div className="flex gap-3">
            <Link href="/login" className="btn">Login</Link>
            <a href="#features" className="navlink">See features</a>
          </div>
        </div>
      </section>
      <section id="features" className="grid md:grid-cols-3 gap-4 mt-6">
        {[
          { t:"Executive KPIs", d:"Availability, Utilisation, Downtime, Rebills."},
          { t:"Client Segmentation", d:"Row-level access by entity, cost centre."},
          { t:"Quoting", d:"Real-time lease quotes from vehicle catalogue."}
        ].map((x,i)=>(<div key={i} className="card p-5"><h3 className="font-semibold">{x.t}</h3><p className="text-white/70">{x.d}</p></div>))}
      </section>
    </main>
  );
}
