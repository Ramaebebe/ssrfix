import Link from "next/link";
export default function LandingPage() {
  return (
    <main>
      <section className="hero-full">
        <div className="hero-bg">
          <img src="/brand/afrirent_holdings.png" alt="Afrirent Holdings" />
        </div>
        <div className="hero-overlay" />
        <div className="hero-content">
          <div className="container-tight">
            <img src="/brand/afrirent_logo.png" alt="Afrirent" className="w-28 mb-6 drop-shadow-xl" />
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-3">The Future of Fleet Management is Here</h1>
            <p className="text-white/80 max-w-3xl text-lg md:text-xl mb-6">
              Live availability, downtime, utilisation, and on-the-fly leasing quotes. Securely delivered to each client and cost centre.
            </p>
            <div className="flex gap-3">
              <Link href="/login" className="btn">Login</Link>
              <a href="#features" className="navlink">See features</a>
            </div>
          </div>
        </div>
      </section>
      <section id="features" className="container-tight float-cards">
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { t:"Executive KPIs", d:"Availability, Utilisation, Downtime, Rebills."},
            { t:"Client Segmentation", d:"Row-level access by entity, cost centre."},
            { t:"Quoting", d:"Real-time lease quotes from vehicle catalogue."}
          ].map((x,i)=>(
            <div key={i} className="card p-6 watermark">
              <h3 className="font-semibold text-lg">{x.t}</h3>
              <p className="text-white/70">{x.d}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
