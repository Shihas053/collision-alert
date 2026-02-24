import { Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, UploadCloud, Users, History, ShieldAlert } from "lucide-react";

const Layout = () => {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/analyze", label: "Analyze", icon: UploadCloud },
    { path: "/contacts", label: "Contacts", icon: Users },
    { path: "/history", label: "History", icon: History },
  ];

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex min-h-screen bg-[#09090b]">
      {/* Sidebar */}
      <div className="w-64 bg-[#0f172a] border-r border-white/10 backdrop-blur-xl flex flex-col">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-blue-600 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                COLLISION AI
              </h1>
              <p className="text-xs text-muted-foreground uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Analysis System
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                data-testid={`nav-${item.label.toLowerCase()}`}
                className={`sidebar-nav-item flex items-center gap-3 px-4 py-3 rounded-md border-l-2 transition-all ${
                  active
                    ? "bg-blue-600/20 border-blue-600 text-blue-400"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium uppercase tracking-wider text-xs" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              System Status
            </p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-green-500 font-medium">OPERATIONAL</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;