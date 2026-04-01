import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import toast from "react-hot-toast";
import { Star, Phone, LogOut, ChevronRight, Package, Send } from "lucide-react";

export default function ProfilePage() {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);

  const saveName = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const { data } = await api.patch(`/auth/me`, { name: name.trim() });
      // optimistic update
      const updated = { ...user, name: name.trim() };
      localStorage.setItem("kabootar_user", JSON.stringify(updated));
      setUser(updated);
      setEditing(false);
      toast.success("Name updated!");
    } catch {
      toast.error("Failed to update name");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (!confirm("Log out of Kabootar?")) return;
    await logout();
    navigate("/login");
  };

  const initials = user?.name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";

  return (
    <div className="px-4 py-5">
      {/* Avatar & name */}
      <div className="card p-5 text-center mb-4">
        <div className="w-20 h-20 rounded-full bg-orange-50 flex items-center justify-center font-bold text-2xl text-orange-500 mx-auto mb-3">
          {initials}
        </div>

        {editing ? (
          <div className="flex gap-2 justify-center">
            <input
              className="input-field max-w-[180px] text-center"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
            <button onClick={saveName} disabled={saving} className="btn-primary">
              {saving ? "..." : "Save"}
            </button>
            <button onClick={() => setEditing(false)} className="btn-secondary">Cancel</button>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-bold text-stone-900">{user?.name}</h2>
            <button onClick={() => setEditing(true)} className="text-orange-500 text-xs font-semibold mt-1">
              Edit name
            </button>
          </div>
        )}

        <div className="flex items-center justify-center gap-1.5 mt-3">
          <Phone size={14} className="text-stone-400" />
          <span className="text-stone-500 text-sm">{user?.phone}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <StatBox
          label="Rating"
          value={user?.rating?.toFixed(1) || "5.0"}
          icon={<Star size={14} className="text-amber-400 fill-amber-400" />}
        />
        <StatBox label="Reviews" value={user?.totalRatings || 0} />
        <StatBox label="Member" value={
          user?.createdAt
            ? new Date(user.createdAt).toLocaleDateString("en-IN", { month: "short", year: "2-digit" })
            : "–"
        } />
      </div>

      {/* Menu items */}
      <div className="card divide-y divide-stone-50 mb-4">
        <MenuItem icon={<Send size={16} className="text-orange-400" />} label="My Trips" onClick={() => { navigate("/trips"); }} />
        <MenuItem icon={<Package size={16} className="text-blue-400" />} label="My Parcels" onClick={() => navigate("/parcels")} />
      </div>

      <button
        onClick={handleLogout}
        className="w-full card p-4 flex items-center justify-center gap-2 text-red-500 font-semibold text-sm hover:bg-red-50 transition-colors"
      >
        <LogOut size={16} /> Log out
      </button>

      <p className="text-center text-xs text-stone-400 mt-6">
        🕊️ Kabootar v1.0.0 · Made with ♥
      </p>
    </div>
  );
}

function StatBox({ label, value, icon }) {
  return (
    <div className="card p-3 text-center">
      <div className="flex items-center justify-center gap-1">
        {icon}
        <span className="font-bold text-stone-900 text-base">{value}</span>
      </div>
      <div className="text-[11px] text-stone-400 mt-0.5">{label}</div>
    </div>
  );
}

function MenuItem({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-stone-50 transition-colors"
    >
      {icon}
      <span className="flex-1 text-left text-sm font-medium text-stone-700">{label}</span>
      <ChevronRight size={16} className="text-stone-300" />
    </button>
  );
}
