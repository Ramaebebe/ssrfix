import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="bg-gradient-to-r from-brand-700/30 to-brand-500/20 border-b border-white/10">
        <div className="container-tight py-4"><Topbar /></div>
      </div>
      <div className="container-tight grid grid-cols-12 gap-6 mt-6">
        <aside className="col-span-12 md:col-span-3 lg:col-span-2"><Sidebar /></aside>
        <div className="col-span-12 md:col-span-9 lg:col-span-10">{children}</div>
      </div>
    </div>
  );
}
