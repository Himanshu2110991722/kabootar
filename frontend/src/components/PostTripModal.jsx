import { useState } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { X, Send } from 'lucide-react';
import CityInput from './CityInput';
import StationSelect from './StationSelect';

const TRANSPORT_MODES = ['train', 'flight', 'bus', 'car'];
const MODE_EMOJI = { train: '🚂', flight: '✈️', bus: '🚌', car: '🚗' };
const today = new Date().toISOString().split('T')[0];

export default function PostTripModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    fromCity: '', fromStation: '', toCity: '',
    date: '', transportMode: 'train',
    availableWeight: '', pricePerKg: '', notes: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: undefined })); };

  const validate = () => {
    const e = {};
    if (!form.fromCity.trim()) e.fromCity = 'Required';
    if (!form.toCity.trim()) e.toCity = 'Required';
    if (!form.date) e.date = 'Required';
    if (!form.availableWeight || +form.availableWeight <= 0) e.availableWeight = 'Must be > 0';
    if (form.pricePerKg === '' || +form.pricePerKg < 0) e.pricePerKg = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await api.post('/trips', {
        fromCity: form.fromCity,
        toCity: form.toCity,
        date: form.date,
        transportMode: form.transportMode,
        availableWeight: +form.availableWeight,
        pricePerKg: +form.pricePerKg,
        notes: form.notes,
        pickupStation: form.fromStation,
      });
      toast.success('Trip posted!');
      onSuccess(data.trip);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post trip');
    } finally { setLoading(false); }
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
          <Field label="Pickup City & Station" error={errors.fromCity}>
            <StationSelect
              cityValue={form.fromCity}
              stationValue={form.fromStation}
              onCityChange={v => set('fromCity', v)}
              onStationChange={v => set('fromStation', v)}
              cityPlaceholder="Delhi"
              stationPlaceholder="Which station?"
            />
          </Field>

          <Field label="Destination City" error={errors.toCity}>
            <CityInput value={form.toCity} onChange={v => set('toCity', v)} placeholder="Mumbai" />
          </Field>

          <Field label="Travel Date" error={errors.date}>
            <input type="date" className="input-field" min={today} value={form.date}
              onChange={e => set('date', e.target.value)} />
          </Field>

          <Field label="Transport Mode">
            <div className="flex gap-2 flex-wrap">
              {TRANSPORT_MODES.map(m => (
                <button key={m} onClick={() => set('transportMode', m)} type="button"
                  className={`px-3.5 py-1.5 rounded-xl text-sm font-medium border transition-all capitalize flex items-center gap-1.5 ${
                    form.transportMode === m
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white text-stone-600 border-stone-200 hover:border-orange-300'
                  }`}>
                  <span>{MODE_EMOJI[m]}</span> {m}
                </button>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Weight (kg)" error={errors.availableWeight}>
              <input className="input-field" placeholder="10" type="number" min="0.1" step="0.1"
                value={form.availableWeight} onChange={e => set('availableWeight', e.target.value)} />
            </Field>
            <Field label="Price/kg (₹)" error={errors.pricePerKg}>
              <input className="input-field" placeholder="50" type="number" min="0"
                value={form.pricePerKg} onChange={e => set('pricePerKg', e.target.value)} />
            </Field>
          </div>

          <Field label="Notes (optional)">
            <textarea className="input-field resize-none" rows={2} placeholder="Any extra info…"
              value={form.notes} onChange={e => set('notes', e.target.value)} />
          </Field>
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={submit} disabled={loading} className="btn-primary flex-1">
            {loading ? 'Posting…' : 'Post Trip'}
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
