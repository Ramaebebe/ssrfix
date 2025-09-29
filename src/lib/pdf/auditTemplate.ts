import { PDFDocument, StandardFonts } from "pdf-lib";

export async function buildAuditPdf(
  data: {
    id:string; date:string; inspector:string;
    vehicle:{ reg:string; vin?:string; make?:string; model?:string };
    location:string; findings:string; notes:string;
    photos: { filename:string; bytes:Uint8Array }[];
  },
  logoBytes: Uint8Array
){
  const pdf = await PDFDocument.create();
  const pageSize:[number,number]=[595.28,841.89];
  let page = pdf.addPage(pageSize);
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  // header
  if (logoBytes.length){
    try { const img = await pdf.embedPng(logoBytes).catch(async()=>await pdf.embedJpg(logoBytes)); page.drawImage(img,{x:40,y:780,width:80,height:80}); } catch {}
  }
  page.drawText("Vehicle Audit Report",{ x:140, y:820, size:18, font });

  let y=760;
  const ln=(t:string)=>{ page.drawText(t,{ x:40, y, size:12, font }); y-=16; };
  ln(`Audit ID: ${data.id}`);
  ln(`Date: ${new Date(data.date).toLocaleString()}`);
  ln(`Inspector: ${data.inspector}`);
  ln(`Vehicle: ${data.vehicle.reg} ${data.vehicle.make||""} ${data.vehicle.model||""}`);
  ln(`Location: ${data.location}`);
  y-=10; ln("Findings:"); for (const l of wrap(data.findings, 88)){ ln("  "+l); }
  y-=10; ln("Notes:"); for (const l of wrap(data.notes||"-", 88)){ ln("  "+l); }

  y-=10; ln("Photos:");
  const left=40, maxW=515; let x=left, rowH=0;
  for (const p of data.photos){
    const img = await pdf.embedPng(p.bytes).catch(async()=>await pdf.embedJpg(p.bytes));
    const scale = 120 / Math.max(img.width, img.height);
    const w = img.width*scale, h=img.height*scale;
    if (x + w > maxW){ x=left; y -= (rowH + 18); rowH=0; }
    if (y - h < 60){ page = pdf.addPage(pageSize); y=780; x=left; rowH=0; }
    page.drawImage(img,{ x, y: y-h, width: w, height: h });
    page.drawText(p.filename,{ x, y: y-h-12, size:9, font });
    x += w + 12; rowH = Math.max(rowH, h);
  }

  return await pdf.save();
}
function wrap(s:string, n:number){ const w:string[]=[]; let cur=""; for (const word of s.split(/\s+/)){ if ((cur+" "+word).trim().length>n){ w.push(cur.trim()); cur=word; } else { cur += " "+word; } } if (cur.trim()) w.push(cur.trim()); return w; }
