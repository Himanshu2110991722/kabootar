import { useState } from "react";
import api from "../lib/api";
import toast from "react-hot-toast";
import { X, Package } from "lucide-react";

const ITEM_TYPES = ["documents", "electronics", "clothes", "others"];
const ITEM_EMOJI = { documents: "📄", electronics: "📱", clothes: "👕", others: "📦" };

export default function PostParcelModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    fromCity: "",
    toCity: "",
    weight: "",
    itemType: "documents",
    description: "",
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
    if (!form.weight || +form.weight <= 0) e.weight = "Must be > 0";
    if (!form.description.trim()) e.description = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await api.post("/parcels", {
        ...form,
        weight: +form.weight,
      });
      toast.success("Parcel request posted!");
      onSuccess(data.parcel);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to post request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <Package size={18} className="text-blue-500" />
            <h2 className="font-bold text-stone-900">Send a Parcel</h2>
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

          <Field label="Item Type">
            <div className="flex gap-2 flex-wrap">
              {ITEM_TYPES.map(t => (
                <button key={t} onClick={() => set("itemType", t)}
                  className={`px-3.5 py-1.5 rounded-xl text-sm font-medium border transition-all capitalize flex items-center gap-1.5 ${
                    form.itemType === t
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-white text-stone-600 border-stone-200 hover:border-blue-300"
                  }`}>
                  <span>{ITEM_EMOJI[t]}</span> {t}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Weight (kg)" error={errors.weight}>
            <input className="input-field" placeholder="2.5" type="number" min="0.1" step="0.1"
              value={form.weight} onChange={e => set("weight", e.target.value)} />
          </Field>

          <Field label="Description" error={errors.description}>
            <textarea className="input-field resize-none" rows={3}
              placeholder="Describe your item (size, fragility, any special handling...)"
              value={form.description} onChange={e => set("description", e.target.value)} />
          </Field>
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={submit} disabled={loading} className="btn-primary flex-1" style={{background: "#3b82f6"}}>
            {loading ? "Posting..." : "Post Request"}
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
