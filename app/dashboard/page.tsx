import { Navbar } from "@/components/navbar";
import { DashboardClient } from "@/components/dashboard-client";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return <div className="min-h-screen"><Navbar /><DashboardClient /></div>;
}
