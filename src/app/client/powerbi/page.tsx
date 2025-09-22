"use client";
export const dynamic = 'force-dynamic';
export default function PowerBIPage(){
  return (
    <main>
      <div className="card p-8 watermark">
        <h1 className="text-3xl font-bold mb-3">Power BI</h1>
        <p className="text-white/80">Paste your embedded Power BI report URL in the iframe below.</p>
        <div className="mt-6 rounded-3xl overflow-hidden border border-white/10 shadow-soft">
          <iframe src="about:blank" title="Power BI Placeholder" className="w-full h-[560px] bg-black/40"></iframe>
        </div>
      </div>
    </main>
  );
}
