import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Shield, CheckCircle, XCircle, Users, ChevronLeft, Search, ExternalLink, Clock, Megaphone, Plus, Trash2, Pin } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

// ── Admin guard ───────────────────────────────────────────────────────────────
export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) { navigate('/login'); return null; }
  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
        <div className="card p-8 text-center max-w-sm w-full">
          <Shield size={40} className="text-stone-300 mx-auto mb-3" />
          <h2 className="font-bold text-stone-900 mb-1">Admin access required</h2>
          <p className="text-stone-500 text-sm mb-4">You don't have admin privileges.</p>
          <PromoteForm onPromoted={() => window.location.reload()} />
          <button onClick={() => navigate('/')} className="btn-secondary w-full mt-3">← Back to app</button>
        </div>
      </div>
    );
  }

  return <AdminDashboard />;
}

// ── Promote self to admin ─────────────────────────────────────────────────────
function PromoteForm({ onPromoted }) {
  const [secret, setSecret] = useState('');
  const [loading, setLoading] = useState(false);

  const promote = async () => {
    if (!secret.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.post('/admin/promote', { secret });
      // Write updated user (role:'admin') to localStorage before reloading
      // so the page guard reads the correct role on refresh
      localStorage.setItem('kabootar_user', JSON.stringify(data.user));
      toast.success('You are now an admin!');
      onPromoted();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid secret');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-stone-400">Enter ADMIN_SECRET to promote yourself:</p>
      <input
        type="password"
        className="input-field text-sm"
        placeholder="Admin secret"
        value={secret}
        onChange={e => setSecret(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && promote()}
      />
      <button onClick={promote} disabled={loading || !secret.trim()} className="btn-primary w-full text-sm">
        {loading ? 'Verifying…' : 'Become Admin'}
      </button>
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────
function AdminDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('kyc');

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-stone-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="btn-ghost p-1.5 -ml-1.5">
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-orange-500" />
          <span className="font-bold text-stone-900">Admin Panel</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-stone-100 rounded-xl p-1 mx-4 mt-4">
        <button onClick={() => setTab('kyc')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 ${tab === 'kyc' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'}`}>
          <Clock size={13} /> KYC
        </button>
        <button onClick={() => setTab('announcements')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 ${tab === 'announcements' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'}`}>
          <Megaphone size={13} /> Posts
        </button>
        <button onClick={() => setTab('users')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 ${tab === 'users' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'}`}>
          <Users size={13} /> Users
        </button>
      </div>

      <div className="px-4 py-4">
        {tab === 'kyc'           && <KycQueue />}
        {tab === 'announcements' && <AnnouncementsManager />}
        {tab === 'users'         && <UserList />}
      </div>
    </div>
  );
}

// ── KYC review queue ──────────────────────────────────────────────────────────
function KycQueue() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [acting, setActing] = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/admin/kyc')
      .then(r => setUsers(r.data.users))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const approve = async (userId) => {
    setActing(userId);
    try {
      await api.post(`/admin/kyc/${userId}/approve`);
      toast.success('KYC approved ✓');
      setUsers(prev => prev.filter(u => u._id !== userId));
    } catch {
      toast.error('Failed to approve');
    } finally {
      setActing(null);
    }
  };

  const reject = async () => {
    if (!rejectTarget) return;
    setActing(rejectTarget);
    try {
      await api.post(`/admin/kyc/${rejectTarget}/reject`, { reason: rejectReason || 'Documents unclear or invalid' });
      toast.success('KYC rejected');
      setUsers(prev => prev.filter(u => u._id !== rejectTarget));
      setRejectTarget(null);
      setRejectReason('');
    } catch {
      toast.error('Failed to reject');
    } finally {
      setActing(null);
    }
  };

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="card p-4 animate-pulse h-40" />)}</div>;

  if (!users.length) return (
    <div className="card p-10 text-center">
      <CheckCircle size={36} className="text-emerald-400 mx-auto mb-3" />
      <p className="font-semibold text-stone-700">All clear!</p>
      <p className="text-stone-400 text-sm mt-1">No pending KYC submissions.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <p className="text-xs text-stone-500 font-semibold">{users.length} pending submission{users.length !== 1 ? 's' : ''}</p>

      {users.map(u => (
        <div key={u._id} className="card p-4 space-y-4">
          {/* User identity */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-orange-50 border-2 border-orange-100 flex items-center justify-center font-bold text-orange-500 shrink-0">
              {u.profileImage
                ? <img src={u.profileImage} alt={u.name} className="w-full h-full object-cover" />
                : u.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-stone-900">{u.name}</p>
              <p className="text-xs text-stone-500">{u.phone}</p>
              {u.kycSubmittedAt && (
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Submitted {formatDistanceToNow(new Date(u.kycSubmittedAt), { addSuffix: true })}
                </p>
              )}
            </div>
          </div>

          {/* Documents */}
          <div className="grid grid-cols-2 gap-3">
            <DocThumb label="ID Document" url={u.kycDocumentUrl} />
            <DocThumb label="Selfie" url={u.selfieUrl} />
          </div>

          {/* Actions */}
          {rejectTarget === u._id ? (
            <div className="space-y-2">
              <textarea
                className="input-field resize-none text-sm"
                rows={2}
                placeholder="Rejection reason (shown to user)"
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  onClick={reject}
                  disabled={acting === u._id}
                  className="flex-1 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {acting === u._id ? 'Rejecting…' : 'Confirm Reject'}
                </button>
                <button onClick={() => { setRejectTarget(null); setRejectReason(''); }} className="btn-secondary px-4">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => approve(u._id)}
                disabled={!!acting}
                className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <CheckCircle size={14} />
                {acting === u._id ? 'Approving…' : 'Approve'}
              </button>
              <button
                onClick={() => setRejectTarget(u._id)}
                disabled={!!acting}
                className="flex-1 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <XCircle size={14} /> Reject
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function DocThumb({ label, url }) {
  if (!url) return (
    <div className="rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center h-28 text-stone-300 text-xs text-center p-2">
      No {label}
    </div>
  );

  const isImage = !url.includes('.pdf');

  return (
    <div className="space-y-1">
      <p className="text-[11px] text-stone-400 font-semibold">{label}</p>
      {isImage ? (
        <a href={url} target="_blank" rel="noreferrer" className="block">
          <img
            src={url}
            alt={label}
            className="w-full h-28 object-cover rounded-xl border border-stone-100 hover:opacity-90 transition-opacity"
          />
        </a>
      ) : (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 h-28 rounded-xl border border-stone-100 bg-stone-50 text-orange-500 text-xs font-semibold hover:bg-orange-50 transition-colors"
        >
          <ExternalLink size={14} /> View PDF
        </a>
      )}
    </div>
  );
}

// ── Announcements Manager ─────────────────────────────────────────────────────
const ANNOUNCE_TYPES = ['info', 'warning', 'alert', 'feature'];
const TYPE_COLOR = { info: 'bg-blue-50 border-blue-200', warning: 'bg-amber-50 border-amber-200', alert: 'bg-red-50 border-red-200', feature: 'bg-orange-50 border-orange-200' };

function AnnouncementsManager() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [form,    setForm]    = useState({ title: '', body: '', icon: '📢', type: 'info', pinned: false, expiresAt: '' });
  const [saving,  setSaving]  = useState(false);

  const load = async () => {
    setLoading(true);
    const r = await api.get('/announcements/all').catch(() => ({ data: { announcements: [] } }));
    setItems(r.data.announcements || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.title.trim() || !form.body.trim()) { toast.error('Title and body required'); return; }
    setSaving(true);
    try {
      await api.post('/announcements', { ...form, expiresAt: form.expiresAt || null });
      toast.success('Announcement published');
      setForm({ title: '', body: '', icon: '📢', type: 'info', pinned: false, expiresAt: '' });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const toggle = async (id, active) => {
    await api.patch(`/announcements/${id}`, { active }).catch(() => {});
    setItems(prev => prev.map(a => a._id === id ? { ...a, active } : a));
  };

  const remove = async (id) => {
    if (!confirm('Delete this announcement?')) return;
    await api.delete(`/announcements/${id}`).catch(() => {});
    setItems(prev => prev.filter(a => a._id !== id));
    toast.success('Deleted');
  };

  return (
    <div className="space-y-5">
      {/* Create form */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-3">
        <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2"><Plus size={14} /> New Announcement</h3>
        <div className="flex gap-2">
          <input className="input-field w-14 text-center text-lg" placeholder="📢" value={form.icon}
            onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} />
          <select className="input-field flex-1 text-sm" value={form.type}
            onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
            {ANNOUNCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <input className="input-field w-full text-sm" placeholder="Title" value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        <textarea className="input-field w-full text-sm resize-none" rows={3} placeholder="Body text…"
          value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} />
        <div className="flex gap-3 items-center">
          <label className="flex items-center gap-2 text-xs font-semibold text-stone-600 cursor-pointer">
            <input type="checkbox" checked={form.pinned} onChange={e => setForm(f => ({ ...f, pinned: e.target.checked }))} />
            <Pin size={12} /> Pinned
          </label>
          <input type="date" className="input-field flex-1 text-xs" placeholder="Expires (optional)"
            value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} />
        </div>
        <button onClick={create} disabled={saving} className="btn-primary w-full text-sm">
          {saving ? 'Publishing…' : 'Publish Announcement'}
        </button>
      </div>

      {/* Existing announcements */}
      {loading ? (
        <div className="text-center text-stone-400 text-sm py-8">Loading…</div>
      ) : items.length === 0 ? (
        <div className="text-center text-stone-400 text-sm py-8 bg-white rounded-2xl border border-stone-100">No announcements yet</div>
      ) : (
        <div className="space-y-2">
          {items.map(a => (
            <div key={a._id} className={`border rounded-2xl px-4 py-3 flex gap-3 items-start ${TYPE_COLOR[a.type] || 'bg-stone-50 border-stone-100'} ${!a.active ? 'opacity-50' : ''}`}>
              <span className="text-xl shrink-0">{a.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-stone-900">{a.title}</p>
                  {a.pinned && <span className="text-[9px] bg-orange-500 text-white px-1.5 py-0.5 rounded-full font-bold uppercase">Pinned</span>}
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${a.active ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}>
                    {a.active ? 'Live' : 'Off'}
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5 line-clamp-2">{a.body}</p>
                <p className="text-[10px] text-stone-400 mt-1">{format(new Date(a.createdAt), 'dd MMM yyyy')}</p>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <button onClick={() => toggle(a._id, !a.active)}
                  className={`text-[10px] font-bold px-2 py-1 rounded-lg ${a.active ? 'bg-stone-200 text-stone-600' : 'bg-emerald-500 text-white'}`}>
                  {a.active ? 'Hide' : 'Show'}
                </button>
                <button onClick={() => remove(a._id)} className="text-[10px] font-bold px-2 py-1 rounded-lg bg-red-100 text-red-500">
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── All users list ────────────────────────────────────────────────────────────
function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });

  const load = (pg = 1, q = search) => {
    setLoading(true);
    api.get('/admin/users', { params: { page: pg, search: q } })
      .then(r => { setUsers(r.data.users); setMeta({ total: r.data.total, pages: r.data.pages }); setPage(pg); })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(1); }, []);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    if (!e.target.value.trim()) load(1, '');
  };
  const submitSearch = (e) => { e.preventDefault(); load(1, search); };

  const KYC_COLOR = { none: 'text-stone-400', pending: 'text-amber-500', verified: 'text-emerald-500', rejected: 'text-red-400' };

  return (
    <div className="space-y-3">
      <form onSubmit={submitSearch} className="flex gap-2">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            className="input-field pl-8 text-sm"
            placeholder="Search name or phone…"
            value={search}
            onChange={handleSearch}
          />
        </div>
        <button type="submit" className="btn-primary px-4 text-sm">Search</button>
      </form>

      <p className="text-xs text-stone-400">{meta.total} total users</p>

      {loading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="card p-3 animate-pulse h-14" />)}</div>
      ) : (
        <div className="space-y-2">
          {users.map(u => (
            <div key={u._id} className="card px-3 py-2.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full overflow-hidden bg-orange-50 flex items-center justify-center font-bold text-orange-500 text-sm shrink-0">
                {u.profileImage
                  ? <img src={u.profileImage} alt={u.name} className="w-full h-full object-cover" />
                  : u.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-stone-800 truncate">{u.name}</span>
                  {u.role === 'admin' && <span className="badge bg-purple-50 text-purple-600 text-[10px]">admin</span>}
                </div>
                <div className="text-[11px] text-stone-400 flex items-center gap-2">
                  <span>{u.phone}</span>
                  <span className={`font-semibold capitalize ${KYC_COLOR[u.kycStatus] || 'text-stone-400'}`}>
                    {u.kycStatus === 'verified' ? '✓ verified' : u.kycStatus}
                  </span>
                </div>
              </div>
              <div className="text-[11px] text-stone-400 shrink-0">
                {u.createdAt ? format(new Date(u.createdAt), 'dd MMM yy') : ''}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta.pages > 1 && (
        <div className="flex gap-2 justify-center pt-2">
          <button onClick={() => load(page - 1)} disabled={page <= 1 || loading} className="btn-secondary px-4 text-sm disabled:opacity-40">← Prev</button>
          <span className="flex items-center text-xs text-stone-500">Page {page} of {meta.pages}</span>
          <button onClick={() => load(page + 1)} disabled={page >= meta.pages || loading} className="btn-secondary px-4 text-sm disabled:opacity-40">Next →</button>
        </div>
      )}
    </div>
  );
}
