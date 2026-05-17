import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Home, Compass, MessageCircle, Bell, User, LogIn, Plus, Send, Package, X, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAuthGate } from '../hooks/useAuthGate';
import api from '../lib/api';
import { getSocket } from '../lib/socket';
import PostTripModal from '../pages/../components/PostTripModal';
import PostParcelModal from '../pages/../components/PostParcelModal';

export default function Layout() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const authGate  = useAuthGate();
  const fabRef    = useRef(null);

  const [chatUnread,   setChatUnread]   = useState(0);
  const [notifUnread,  setNotifUnread]  = useState(0);
  const [fabOpen,      setFabOpen]      = useState(false);
  const [showTripModal,  setShowTripModal]  = useState(false);
  const [showParcelModal,setShowParcelModal] = useState(false);

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

  useEffect(() => {
    const lastSeen = parseInt(localStorage.getItem('kabutar_alerts_seen') || '0', 10);
    const loadCounts = async () => {
      let total = 0;
      if (user) {
        const nr = await api.get('/notifications/me').catch(() => ({ data: { unread: 0 } }));
        total += nr.data.unread || 0;
      }
      const ar = await api.get('/announcements').catch(() => ({ data: { announcements: [] } }));
      total += (ar.data.announcements || []).filter(a => new Date(a.createdAt).getTime() > lastSeen).length;
      setNotifUnread(total);
    };
    loadCounts();
  }, [user]);

  // Close FAB when clicking outside
  useEffect(() => {
    const handler = (e) => { if (fabRef.current && !fabRef.current.contains(e.target)) setFabOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isChat  = location.pathname === '/messages' || location.pathname.startsWith('/chat');
  const isNotif = location.pathname === '/notifications';
  const isMe    = location.pathname === '/profile';

  const handleFab = (type) => {
    setFabOpen(false);
    authGate(() => {
      if (type === 'trip') {
        if (user?.kycStatus !== 'verified') {
          import('react-hot-toast').then(({ default: toast }) => toast.error('KYC verification required'));
          setTimeout(() => navigate('/kyc'), 600);
          return;
        }
        setShowTripModal(true);
      } else {
        setShowParcelModal(true);
      }
    });
  };

  const Badge = ({ count }) => count > 0 ? (
    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 leading-none">
      {count > 9 ? '9+' : count}
    </span>
  ) : null;

  return (
    <div className="min-h-screen bg-stone-50 relative">

      {/* ── DESKTOP TOP HEADER (hidden on mobile) ──────────────── */}
      <header className="hidden lg:flex sticky top-0 z-50 bg-white border-b border-stone-100 px-6 items-center gap-4 h-16"
        style={{ boxShadow: '0 1px 12px rgba(0,0,0,.06)' }}>

        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2 shrink-0">
          <span className="text-2xl" style={{ display:'inline-block', animation:'birdBob 3s ease-in-out infinite' }}>🕊️</span>
          <span className="font-black text-xl tracking-tight"
            style={{ background:'linear-gradient(135deg,#f97316,#ea580c)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
            kabutar
          </span>
        </NavLink>

        {/* Search bar */}
        <div className="flex-1 max-w-md mx-4">
          <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 hover:border-orange-300 transition-colors">
            <Search size={15} className="text-stone-400 shrink-0" />
            <input
              className="flex-1 bg-transparent outline-none text-sm text-stone-600 placeholder:text-stone-400"
              placeholder="Search routes, cities…"
              onFocus={() => navigate('/')}
              readOnly
            />
            <kbd className="hidden xl:block text-[10px] text-stone-300 border border-stone-200 rounded px-1.5 py-0.5 font-mono shrink-0">Ctrl+K</kbd>
          </div>
        </div>

        {/* Desktop nav links */}
        <nav className="hidden xl:flex items-center gap-1">
          <NavLink to="/" end className={({ isActive }) => `flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${isActive ? 'text-orange-500 bg-orange-50' : 'text-stone-500 hover:text-stone-700 hover:bg-stone-50'}`}>
            <Home size={16} strokeWidth={2} /> Home
          </NavLink>
          <NavLink to="/explore" className={({ isActive }) => `flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${isActive ? 'text-orange-500 bg-orange-50' : 'text-stone-500 hover:text-stone-700 hover:bg-stone-50'}`}>
            <Compass size={16} strokeWidth={2} /> Explore
          </NavLink>
        </nav>

        <div className="flex-1" />

        {/* Post button (desktop FAB replacement) */}
        <div className="relative" ref={fabRef}>
          <button onClick={() => authGate(() => setFabOpen(v => !v))}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm text-white transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)', boxShadow: '0 3px 12px rgba(249,115,22,0.35)' }}>
            <Plus size={16} /> Post
          </button>
          {fabOpen && (
            <div className="absolute right-0 top-full mt-2 bg-white border border-stone-200 rounded-2xl shadow-xl overflow-hidden z-50 w-52 animate-fade-in">
              <button onClick={() => handleFab('trip')}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-orange-50 transition-colors">
                <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center"><Send size={15} className="text-orange-600" /></div>
                <div className="text-left"><p className="text-sm font-bold text-stone-900">Post a Trip</p><p className="text-[11px] text-stone-400">Earn by carrying</p></div>
              </button>
              <button onClick={() => handleFab('parcel')}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-blue-50 transition-colors border-t border-stone-50">
                <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center"><Package size={15} className="text-blue-600" /></div>
                <div className="text-left"><p className="text-sm font-bold text-stone-900">Send a Parcel</p><p className="text-[11px] text-stone-400">Find a traveller</p></div>
              </button>
            </div>
          )}
        </div>

        {/* Icon actions */}
        <div className="flex items-center gap-1">
          <button onClick={() => { localStorage.setItem('kabutar_alerts_seen', Date.now().toString()); setNotifUnread(0); navigate('/notifications'); }}
            className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isNotif ? 'bg-orange-50 text-orange-500' : 'text-stone-500 hover:bg-stone-100'}`}>
            <Bell size={19} strokeWidth={1.8} />
            <Badge count={notifUnread} />
          </button>
          <button onClick={() => authGate(() => { setChatUnread(0); navigate('/messages'); })}
            className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isChat ? 'bg-orange-50 text-orange-500' : 'text-stone-500 hover:bg-stone-100'}`}>
            <MessageCircle size={19} strokeWidth={1.8} />
            <Badge count={chatUnread} />
          </button>
        </div>

        {/* Avatar */}
        {user ? (
          <button onClick={() => navigate('/profile')}
            className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all ${isMe ? 'border-orange-400' : 'border-stone-200 hover:border-orange-300'} flex items-center justify-center bg-orange-100`}>
            {user.profileImage
              ? <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
              : <span className="text-orange-600 font-black text-sm">{user.name?.[0]?.toUpperCase()}</span>}
          </button>
        ) : (
          <button onClick={() => navigate('/login')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-orange-500 hover:bg-orange-50 transition-all">
            <LogIn size={16} /> Login
          </button>
        )}
      </header>

      {/* ── MOBILE HEADER (hidden on desktop) ──────────────────── */}
      <header className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-100 px-4 flex items-center justify-between"
        style={{ paddingTop:'calc(env(safe-area-inset-top,0px) + 12px)', paddingBottom:'12px', boxShadow:'0 1px 12px rgba(0,0,0,.06)' }}>
        <div className="flex items-center gap-2">
          <span className="text-xl" style={{ animation:'birdBob 3s ease-in-out infinite', display:'inline-block' }}>🕊️</span>
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

      {/* ── MAIN CONTENT ────────────────────────────────────────── */}
      {/* Mobile: padded for bottom nav · Desktop: padded only for top header */}
      <main
        className="flex-1 overflow-y-auto lg:max-w-7xl lg:mx-auto lg:w-full lg:px-6 lg:py-6"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom,0px) + 80px)' }}>
        <div className="lg:pb-0">
          <Outlet />
        </div>
      </main>

      {/* ── BOTTOM NAV (both mobile + desktop) ─────────────────── */}
      <nav
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg lg:max-w-none bg-white/97 backdrop-blur-md border-t border-stone-100 z-40"
        style={{ paddingBottom:'env(safe-area-inset-bottom,0px)', boxShadow:'0 -1px 12px rgba(0,0,0,.07)' }}>
        <div className="flex justify-around items-center py-2 lg:max-w-7xl lg:mx-auto lg:px-6">

          {/* Home */}
          <NavLink to="/" end className={({ isActive }) => `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${isActive ? 'text-orange-500' : 'text-stone-400'}`}>
            <Home size={20} strokeWidth={1.8} />
            <span className="text-[10px] font-semibold">Home</span>
          </NavLink>

          {/* Explore */}
          <NavLink to="/explore" className={({ isActive }) => `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${isActive ? 'text-orange-500' : 'text-stone-400'}`}>
            <Compass size={20} strokeWidth={1.8} />
            <span className="text-[10px] font-semibold">Explore</span>
          </NavLink>

          {/* ── FAB — centre button ── */}
          <div className="relative flex flex-col items-center" ref={fabRef}>
            {/* FAB popup */}
            {fabOpen && (
              <div className="absolute bottom-full mb-3 bg-white border border-stone-200 rounded-2xl shadow-2xl overflow-hidden w-48 animate-slide-up z-50">
                <button onClick={() => handleFab('trip')}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-50 transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center shrink-0"><Send size={14} className="text-orange-600" /></div>
                  <div className="text-left"><p className="text-xs font-bold text-stone-900">Post a Trip</p><p className="text-[10px] text-stone-400">Earn by carrying</p></div>
                </button>
                <button onClick={() => handleFab('parcel')}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors border-t border-stone-50">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center shrink-0"><Package size={14} className="text-blue-600" /></div>
                  <div className="text-left"><p className="text-xs font-bold text-stone-900">Send a Parcel</p><p className="text-[10px] text-stone-400">Find a traveller</p></div>
                </button>
              </div>
            )}
            <button
              onClick={() => authGate(() => setFabOpen(v => !v))}
              className="w-14 h-14 -mt-5 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90"
              style={{ background: fabOpen ? 'linear-gradient(135deg,#ea580c,#c2410c)' : 'linear-gradient(135deg,#f97316,#ea580c)', boxShadow:'0 4px 16px rgba(249,115,22,0.5)' }}>
              {fabOpen ? <X size={22} className="text-white" /> : <Plus size={22} className="text-white" strokeWidth={2.5} />}
            </button>
            <span className="text-[10px] font-semibold text-stone-400 mt-0.5">Post</span>
          </div>

          {/* Chat */}
          <button onClick={() => authGate(() => { setChatUnread(0); navigate('/messages'); })}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${isChat ? 'text-orange-500' : 'text-stone-400'}`}>
            <div className="relative">
              <MessageCircle size={20} strokeWidth={1.8} />
              <Badge count={chatUnread} />
            </div>
            <span className="text-[10px] font-semibold">Chat</span>
          </button>

          {/* Alerts */}
          <button onClick={() => { localStorage.setItem('kabutar_alerts_seen', Date.now().toString()); setNotifUnread(0); navigate('/notifications'); }}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${isNotif ? 'text-orange-500' : 'text-stone-400'}`}>
            <div className="relative">
              <Bell size={20} strokeWidth={1.8} />
              <Badge count={notifUnread} />
            </div>
            <span className="text-[10px] font-semibold">Alerts</span>
          </button>
        </div>
      </nav>

      {/* ── Modals (global, from FAB) ───────────────────────────── */}
      {showTripModal && (
        <PostTripModal onClose={() => setShowTripModal(false)}
          onSuccess={() => setShowTripModal(false)} />
      )}
      {showParcelModal && (
        <PostParcelModal onClose={() => setShowParcelModal(false)}
          onSuccess={() => setShowParcelModal(false)} />
      )}
    </div>
  );
}
