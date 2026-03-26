import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import { useSport } from "@/contexts/SportContext";

const AppLayout = () => {
  const { sportClass } = useSport();

  return (
    <div className={`${sportClass} flex h-screen overflow-hidden bg-background`}>
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-6 py-6 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
