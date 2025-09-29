export default function EmbedFrame({ src, title }:{src:string; title:string}){
  if (!src) return <div className="card p-6">No analytics URL configured.</div>;
  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-4 py-2 text-sm opacity-70">{title}</div>
      <iframe src={src} className="w-full h-[360px]" />
    </div>
  );
}
