import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Home, Compass, MessageCircle, Bell, User, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAuthGate } from '../hooks/useAuthGate';
import api from '../lib/api';
import { getSocket } from '../lib/socket';

export default function Layout() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const authGate  = useAuthGate();

  const [chatUnread,  setChatUnread]  = useState(0);
  const [notifUnread, setNotifUnread] = useState(0);

  // Unread chat count — updated live via socket
  useEffect(() => {
    if (!user) { setChatUnread(0); return; }
    const load = () => api.get('/chat/conversations')
      .then(r => setChatUnread(r.data.conversations.reduce((s, c) => s + (c.unreadCount || 0), 0)))
      .catch(() => {});
    load();
    const socket = getSocket();
    socket.on('receive_message', load);
    return () => socket.off('receive_message', load);
  }, [user]);

  // Unread notification count
  useEffect(() => {
    if (!user) { setNotifUnread(0); return; }
    api.get('/notifications/me')
      .then(r => setNotifUnread(r.data.unread || 0))
      .catch(() => {});
  }, [user]);

  const isChat  = location.pathname === '/messages' || location.pathname.startsWith('/chat');
  const isNotif = location.pathname === '/notifications';
  const isMe    = location.pathname === '/profile';

  const tab = (path, icon, label, badge) => (
    <NavLink to={path}
      className={({ isActive }) =>
        `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-150 ${
          isActive ? 'text-orange-500' : 'text-stone-400'}`}>
      <div className="relative">
        {icon}
        {badge > 0 && (
          <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 leading-none">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </div>
      <span className="text-[10px] font-semibold">{label}</span>
    </NavLink>
  );

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto bg-stone-50 relative">

      {/* Header */}
      <header
        className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-100 px-4 flex items-center justify-between"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
          paddingBottom: '12px',
          boxShadow: '0 1px 12px rgba(0,0,0,.06)',
        }}>
        <div className="flex items-center gap-2">
          <span className="text-xl" style={{ animation: 'birdBob 3s ease-in-out infinite', display:'inline-block' }}>🕊️</span>
          <span className="font-black text-lg tracking-tight"
            style={{ background:'linear-gradient(135deg,#f97316,#ea580c)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
            kabutar
          </span>
        </div>
        {user && (
          <button onClick={() => navigate('/profile')}
            className="w-8 h-8 rounded-full overflow-hidden bg-orange-100 flex items-center justify-center border-2 border-orange-200">
            {user.profileImage
              ? <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
              : <span className="text-orange-600 font-black text-xs">{user.name?.[0]?.toUpperCase()}</span>}
          </button>
        )}
      </header>

      <style>{`
        @keyframes birdBob { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-3px);} }
      `}</style>

      <main className="flex-1 overflow-y-auto" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)' }}>
        <Outlet />
      </main>

      {/* Bottom Nav */}
      <nav
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white/97 backdrop-blur-md border-t border-stone-100 z-40"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)', boxShadow: '0 -1px 12px rgba(0,0,0,.07)' }}>
        <div className="flex justify-around items-center py-2">

          {/* Home */}
          {tab('/', <Home size={20} strokeWidth={1.8} />, 'Home')}

          {/* Explore */}
          {tab('/explore', <Compass size={20} strokeWidth={1.8} />, 'Explore')}

          {/* Chat */}
          <button
            onClick={() => authGate(() => { setChatUnread(0); navigate('/messages'); })}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${isChat ? 'text-orange-500' : 'text-stone-400'}`}>
            <div className="relative">
              <MessageCircle size={20} strokeWidth={1.8} />
              {chatUnread > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 leading-none">
                  {chatUnread > 9 ? '9+' : chatUnread}
                </span>
              )}
            </div>
            <span className="text-[10px] font-semibold">Chat</span>
          </button>

          {/* Notifications */}
          <button
            onClick={() => authGate(() => { setNotifUnread(0); navigate('/notifications'); })}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${isNotif ? 'text-orange-500' : 'text-stone-400'}`}>
            <div className="relative">
              <Bell size={20} strokeWidth={1.8} />
              {notifUnread > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 leading-none">
                  {notifUnread > 9 ? '9+' : notifUnread}
                </span>
              )}
            </div>
            <span className="text-[10px] font-semibold">Alerts</span>
          </button>

          {/* Profile / Login */}
          {user ? (
            <button
              onClick={() => navigate('/profile')}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${isMe ? 'text-orange-500' : 'text-stone-400'}`}>
              <User size={20} strokeWidth={1.8} />
              <span className="text-[10px] font-semibold">Me</span>
            </button>
          ) : (
            <button
              onClick={() => navigate('/login', { state: { from: location.pathname } })}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-orange-500">
              <LogIn size={20} strokeWidth={1.8} />
              <span className="text-[10px] font-semibold">Login</span>
            </button>
          )}
        </div>
      </nav>
    </div>
  );
}
