import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home, Send, Package, MessageCircle, User, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAuthGate } from '../hooks/useAuthGate';

export default function Layout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const authGate = useAuthGate();

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto bg-stone-50 relative">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-stone-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🕊️</span>
          <span className="font-bold text-lg tracking-tight text-stone-900">kabutar</span>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 pb-20 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white/95 backdrop-blur-md border-t border-stone-100 z-40">
        <div className="flex justify-around items-center py-2">
          {/* Home — always public */}
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-150 ${isActive ? 'text-orange-500' : 'text-stone-400 hover:text-stone-600'}`
            }
          >
            <Home size={20} strokeWidth={1.8} />
            <span className="text-[10px] font-medium">Home</span>
          </NavLink>

          {/* Trips — public */}
          <NavLink
            to="/trips"
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-150 ${isActive ? 'text-orange-500' : 'text-stone-400 hover:text-stone-600'}`
            }
          >
            <Send size={20} strokeWidth={1.8} />
            <span className="text-[10px] font-medium">Trips</span>
          </NavLink>

          {/* Parcels — public */}
          <NavLink
            to="/parcels"
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-150 ${isActive ? 'text-orange-500' : 'text-stone-400 hover:text-stone-600'}`
            }
          >
            <Package size={20} strokeWidth={1.8} />
            <span className="text-[10px] font-medium">Parcels</span>
          </NavLink>

          {/* Chat — private */}
          <button
            onClick={() => authGate(() => navigate('/messages'))}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-150 ${
              location.pathname === '/messages' || location.pathname.startsWith('/chat')
                ? 'text-orange-500'
                : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            <MessageCircle size={20} strokeWidth={1.8} />
            <span className="text-[10px] font-medium">Chat</span>
          </button>

          {/* Me / Login — private */}
          {user ? (
            <button
              onClick={() => navigate('/profile')}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-150 ${
                location.pathname === '/profile' ? 'text-orange-500' : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              <User size={20} strokeWidth={1.8} />
              <span className="text-[10px] font-medium">Me</span>
            </button>
          ) : (
            <button
              onClick={() => navigate('/login', { state: { from: location.pathname } })}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-150 text-orange-500"
            >
              <LogIn size={20} strokeWidth={1.8} />
              <span className="text-[10px] font-medium">Login</span>
            </button>
          )}
        </div>
      </nav>
    </div>
  );
}
