import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Layout() {
  return (
    <div className="d-flex vh-100 overflow-hidden">
      <Sidebar />
      <div className="flex-grow-1 d-flex flex-column">
        <Topbar />
        <div className="flex-grow-1 p-4 overflow-auto bg-light">
          <Outlet />
        </div>
      </div>
    </div>
  );
}