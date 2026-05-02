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

      {/* Header — white with purple-tinted border (stone-100 = #ede9ff) */}
      <header className="sticky top-0 z-40 bg-white/92 backdrop-blur-md border-b border-stone-100 px-4 py-3 flex items-center justify-between"
              style={{ boxShadow: '0 2px 16px rgba(109,40,217,.06)' }}>
        <div className="flex items-center gap-2">
          <span className="text-xl" style={{ animation: 'birdBob 3s ease-in-out infinite', display:'inline-block' }}>🕊️</span>
          {/* Logo text with subtle gradient — matches landing page */}
          <span className="font-bold text-lg tracking-tight"
                style={{ background:'linear-gradient(135deg,#16142e,#6d28d9)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
            kabutar
          </span>
        </div>
      </header>

      <style>{`
        @keyframes birdBob { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-3px);} }
      `}</style>

      {/* Page content */}
      <main className="flex-1 pb-20 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom Nav — white with purple-tinted border */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white/95 backdrop-blur-md border-t border-stone-100 z-40"
           style={{ boxShadow: '0 -2px 16px rgba(109,40,217,.06)' }}>
        <div className="flex justify-around items-center py-2">

          {/* Home — always public */}
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-150 ${
                isActive ? 'text-orange-500' : 'text-stone-400 hover:text-stone-600'
              }`
            }
          >
            <Home size={20} strokeWidth={1.8} />
            <span className="text-[10px] font-medium">Home</span>
          </NavLink>

          {/* Trips */}
          <NavLink
            to="/trips"
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-150 ${
                isActive ? 'text-orange-500' : 'text-stone-400 hover:text-stone-600'
              }`
            }
          >
            <Send size={20} strokeWidth={1.8} />
            <span className="text-[10px] font-medium">Travellers</span>
          </NavLink>

          {/* Parcels */}
          <NavLink
            to="/parcels"
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-150 ${
                isActive ? 'text-orange-500' : 'text-stone-400 hover:text-stone-600'
              }`
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

          {/* Me / Login */}
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
