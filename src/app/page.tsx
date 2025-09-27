export default function Home() {
  return (
    <main className="container-tight py-10">
      <h1 className="text-3xl font-bold mb-4">Afrirent Portal</h1>
      <div className="flex gap-3 mb-6">
        <a className="btn" href="/login">Sign in</a>
        <a className="navlink" href="#features">See features</a>
      </div>
      <section id="features" className="card p-6">
        <h2 className="text-xl font-semibold mb-2">Features</h2>
        <ul className="list-disc ml-6 text-white/80">
          <li>Quoting & PDF output</li>
          <li>Audits & photo evidence</li>
          <li>Waste Compactor module</li>
          <li>Analytics via external BI (Metabase/Superset/Redash/Looker Studio)</li>
        </ul>
      </section>
    </main>
  );
}
