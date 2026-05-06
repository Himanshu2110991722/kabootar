import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Home, Send, Package, MessageCircle, User, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAuthGate } from '../hooks/useAuthGate';
import api from '../lib/api';
import { getSocket } from '../lib/socket';

export default function Layout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const authGate = useAuthGate();
  const [unread, setUnread] = useState(0);

  // Load unread count when user is logged in
  useEffect(() => {
    if (!user) { setUnread(0); return; }
    const load = () => api.get('/chat/conversations').then(r => {
      const total = r.data.conversations.reduce((s, c) => s + (c.unreadCount || 0), 0);
      setUnread(total);
    }).catch(() => {});
    load();
    // Also update via socket when new message arrives
    const socket = getSocket();
    const onMsg = () => load();
    socket.on('receive_message', onMsg);
    return () => socket.off('receive_message', onMsg);
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto bg-stone-50 relative">

      {/* Header — extends under transparent status bar using safe-area-inset-top */}
      <header
        className="sticky top-0 z-40 bg-white/92 backdrop-blur-md border-b border-stone-100 px-4 flex items-center justify-between"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
          paddingBottom: '12px',
          boxShadow: '0 2px 16px rgba(109,40,217,.06)',
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl" style={{ animation: 'birdBob 3s ease-in-out infinite', display:'inline-block' }}>🕊️</span>
          <span className="font-bold text-lg tracking-tight"
            style={{ background:'linear-gradient(135deg,#16142e,#6d28d9)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
            kabutar
          </span>
        </div>
      </header>

      <style>{`
        @keyframes birdBob { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-3px);} }
      `}</style>

      {/* Page content — bottom padding accounts for nav + gesture area */}
      <main className="flex-1 overflow-y-auto" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)' }}>
        <Outlet />
      </main>

      {/* Bottom Nav — extends into gesture bar using safe-area-inset-bottom */}
      <nav
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white/95 backdrop-blur-md border-t border-stone-100 z-40"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          boxShadow: '0 -2px 16px rgba(109,40,217,.06)',
        }}
      >
        <div className="flex justify-around items-center py-2">

          <NavLink to="/" end
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-150 ${
                isActive ? 'text-orange-500' : 'text-stone-400 hover:text-stone-600'}`
            }
          >
            <Home size={20} strokeWidth={1.8} />
            <span className="text-[10px] font-medium">Home</span>
          </NavLink>

          <NavLink to="/trips"
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-150 ${
                isActive ? 'text-orange-500' : 'text-stone-400 hover:text-stone-600'}`
            }
          >
            <Send size={20} strokeWidth={1.8} />
            <span className="text-[10px] font-medium">Travellers</span>
          </NavLink>

          <NavLink to="/parcels"
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-150 ${
                isActive ? 'text-orange-500' : 'text-stone-400 hover:text-stone-600'}`
            }
          >
            <Package size={20} strokeWidth={1.8} />
            <span className="text-[10px] font-medium">Parcels</span>
          </NavLink>

          <button
            onClick={() => authGate(() => { setUnread(0); navigate('/messages'); })}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-150 ${
              location.pathname === '/messages' || location.pathname.startsWith('/chat')
                ? 'text-orange-500' : 'text-stone-400 hover:text-stone-600'}`}
          >
            <div className="relative">
              <MessageCircle size={20} strokeWidth={1.8} />
              {unread > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 leading-none animate-pulse">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">Chat</span>
          </button>

          {user ? (
            <button
              onClick={() => navigate('/profile')}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-150 ${
                location.pathname === '/profile' ? 'text-orange-500' : 'text-stone-400 hover:text-stone-600'}`}
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
