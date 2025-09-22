import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-tight grid grid-cols-12 gap-4">
      <aside className="col-span-12 md:col-span-3 lg:col-span-2"><Sidebar /></aside>
      <div className="col-span-12 md:col-span-9 lg:col-span-10">
        <Topbar />
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
