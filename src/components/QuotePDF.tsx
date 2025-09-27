"use client";
import { useCallback } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
type Props={ refEl: React.RefObject<HTMLDivElement>; vehicle: string; input: any; output: { monthlyPayment:number; totalCost:number } };
export default function QuotePDF({ refEl, vehicle }: Props){
  const onExport = useCallback(async()=>{
    const node = refEl.current; if(!node) return;
    const canvas = await html2canvas(node,{ scale:2, useCORS:true, backgroundColor:"#ffffff" });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ unit:"px", format:"a4" });
    const w = pdf.internal.pageSize.getWidth();
    const h = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, "PNG", 0, 0, w, h);
    const fname = `Afrirent_Quote_${vehicle.replace(/[^a-z0-9]+/gi,"_").slice(0,50)}.pdf`;
    pdf.save(fname);
  },[refEl,vehicle]);
  return (<button className="btn" onClick={onExport}>Download PDF</button>);
}

