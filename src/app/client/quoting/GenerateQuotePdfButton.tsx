"use client";
import { useState } from "react";

export default function GenerateQuotePdfButton({ quoteId }:{quoteId:string}){
  const [url,setUrl] = useState<string| null>(null);
  const [loading,setLoading]=useState(false);
  const go = async ()=>{
    setLoading(true);
    const res = await fetch("/api/quotes/pdf",{
      method:"POST",
      headers:{ "Content-Type":"application/json"},
      body: JSON.stringify({ quoteId })
    });
    const j = await res.json();
    setLoading(false);
    if (res.ok) setUrl(j.signedUrl);
    else alert(j.error || "Failed to generate PDF");
  };
  return (
    <div className="space-x-3">
      <button className="btn" onClick={go} disabled={loading}>{loading?"Generating…":"Generate PDF"}</button>
      {url && <a className="navlink" href={url} target="_blank">Download PDF</a>}
    </div>
  );
}
