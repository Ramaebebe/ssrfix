import Link from "next/link";
export default function LandingPage() {
  return (
    <main className="container-tight">
      <section className="relative card overflow-hidden">
        <div className="absolute inset-0 p-6 z-10">
          <h1 className="text-3xl font-bold mb-2">The Future of Fleet Management is Here</h1>
          <p className="text-white/80 max-w-2xl mb-4">Live availability, downtime, utilisation, and on-the-fly leasing quotes.</p>
          <div className="flex gap-3">
            <Link href="/login" className="btn">Login</Link>
            <a href="#features" className="navlink">See features</a>
          </div>
        </div>
        <video autoPlay loop muted playsInline className="w-full h-[320px] object-cover opacity-50">
          <source src="https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4" type="video/mp4" />
        </video>
      </section>
    </main>
  );
}
