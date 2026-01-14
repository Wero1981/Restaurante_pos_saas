import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { usePOS } from "../context/POSContext";

export default function Layout() {
  const { showSidebar } = usePOS();
  return (
    <div className="flex h-screen overflow-hidden">
      {showSidebar && <Sidebar />}
      <div className="flex-1 flex flex-col">
        <Topbar />
        <div className="flex-1 pl-1 overflow-auto bg-gray-50">
          <Outlet />
        </div>
      </div>
    </div>
  );
}