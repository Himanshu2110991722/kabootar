import { useState } from "react";
import api from "../lib/api";
import toast from "react-hot-toast";
import { X, Send } from "lucide-react";

const TRANSPORT_MODES = ["train", "flight", "bus", "car"];

const today = new Date().toISOString().split("T")[0];

export default function PostTripModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    fromCity: "",
    toCity: "",
    date: "",
    transportMode: "train",
    availableWeight: "",
    pricePerKg: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.fromCity.trim()) e.fromCity = "Required";
    if (!form.toCity.trim()) e.toCity = "Required";
    if (!form.date) e.date = "Required";
    if (!form.availableWeight || +form.availableWeight <= 0) e.availableWeight = "Must be > 0";
    if (form.pricePerKg === "" || +form.pricePerKg < 0) e.pricePerKg = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await api.post("/trips", {
        ...form,
        availableWeight: +form.availableWeight,
        pricePerKg: +form.pricePerKg,
      });
      toast.success("Trip posted!");
      onSuccess(data.trip);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to post trip");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <Send size={18} className="text-orange-500" />
            <h2 className="font-bold text-stone-900">Post a Trip</h2>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5 -mr-1.5"><X size={18} /></button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="From City" error={errors.fromCity}>
              <input className="input-field" placeholder="Delhi" value={form.fromCity}
                onChange={e => set("fromCity", e.target.value)} />
            </Field>
            <Field label="To City" error={errors.toCity}>
              <input className="input-field" placeholder="Mumbai" value={form.toCity}
                onChange={e => set("toCity", e.target.value)} />
            </Field>
          </div>

          <Field label="Travel Date" error={errors.date}>
            <input type="date" className="input-field" min={today} value={form.date}
              onChange={e => set("date", e.target.value)} />
          </Field>

          <Field label="Transport Mode">
            <div className="flex gap-2 flex-wrap">
              {TRANSPORT_MODES.map(m => (
                <button key={m} onClick={() => set("transportMode", m)}
                  className={`px-3.5 py-1.5 rounded-xl text-sm font-medium border transition-all capitalize ${
                    form.transportMode === m
                      ? "bg-orange-500 text-white border-orange-500"
                      : "bg-white text-stone-600 border-stone-200 hover:border-orange-300"
                  }`}>
                  {m}
                </button>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Available Weight (kg)" error={errors.availableWeight}>
              <input className="input-field" placeholder="10" type="number" min="0.1" step="0.1"
                value={form.availableWeight} onChange={e => set("availableWeight", e.target.value)} />
            </Field>
            <Field label="Price per kg (₹)" error={errors.pricePerKg}>
              <input className="input-field" placeholder="50" type="number" min="0"
                value={form.pricePerKg} onChange={e => set("pricePerKg", e.target.value)} />
            </Field>
          </div>

          <Field label="Notes (optional)">
            <textarea className="input-field resize-none" rows={2} placeholder="Any extra info..."
              value={form.notes} onChange={e => set("notes", e.target.value)} />
          </Field>
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={submit} disabled={loading} className="btn-primary flex-1">
            {loading ? "Posting..." : "Post Trip"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-stone-600 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
