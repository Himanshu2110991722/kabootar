import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { Home, Send, Package, MessageCircle, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/trips", icon: Send, label: "Trips" },
  { to: "/parcels", icon: Package, label: "Parcels" },
  { to: "/messages", icon: MessageCircle, label: "Chat" },
  { to: "/profile", icon: User, label: "Me" },
];

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto bg-stone-50 relative">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-stone-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🕊️</span>
          <span className="font-bold text-lg tracking-tight text-stone-900">kabootar</span>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 pb-20 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white/95 backdrop-blur-md border-t border-stone-100 z-40">
        <div className="flex justify-around items-center py-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-150 ${
                  isActive
                    ? "text-orange-500"
                    : "text-stone-400 hover:text-stone-600"
                }`
              }
            >
              <Icon size={20} strokeWidth={1.8} />
              <span className="text-[10px] font-medium">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
