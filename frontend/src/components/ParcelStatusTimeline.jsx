import { format } from 'date-fns';

const STEPS = [
  { key: 'requested', label: 'Requested', emoji: '📬' },
  { key: 'accepted', label: 'Accepted', emoji: '🤝' },
  { key: 'picked', label: 'Picked Up', emoji: '📦' },
  { key: 'in_transit', label: 'In Transit', emoji: '🚀' },
  { key: 'delivered', label: 'Delivered', emoji: '✅' },
];

const STATUS_ORDER = ['open', 'requested', 'accepted', 'picked', 'in_transit', 'delivered'];

const TIMESTAMPS = {
  accepted: 'acceptedAt',
  picked: 'pickedAt',
  in_transit: 'pickedAt',
  delivered: 'deliveredAt',
};

export default function ParcelStatusTimeline({ status, acceptedAt, pickedAt, deliveredAt }) {
  const currentIdx = Math.max(
    STATUS_ORDER.indexOf(status === 'open' ? 'requested' : status),
    0
  );

  const getTs = (step) => {
    const field = TIMESTAMPS[step];
    if (!field) return null;
    const val = { acceptedAt, pickedAt, deliveredAt }[field];
    return val ? format(new Date(val), 'dd MMM, hh:mm a') : null;
  };

  return (
    <div className="pt-3 pb-1 space-y-0">
      {STEPS.map((step, idx) => {
        const reached = idx <= currentIdx;
        const active = idx === currentIdx;
        const ts = getTs(step.key);

        return (
          <div key={step.key} className="flex gap-3">
            {/* Left: circle + connector */}
            <div className="flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 border-2 transition-all ${
                  reached
                    ? active
                      ? 'bg-orange-500 border-orange-500 text-white'
                      : 'bg-emerald-500 border-emerald-500 text-white'
                    : 'bg-white border-stone-200 text-stone-300'
                }`}
              >
                {reached ? step.emoji : '○'}
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`w-0.5 h-6 mt-0.5 ${reached && idx < currentIdx ? 'bg-emerald-300' : 'bg-stone-100'}`} />
              )}
            </div>

            {/* Right: label + timestamp */}
            <div className="pb-2 pt-0.5">
              <div className={`text-sm font-semibold ${active ? 'text-orange-600' : reached ? 'text-emerald-700' : 'text-stone-300'}`}>
                {step.label}
              </div>
              {ts && <div className="text-[11px] text-stone-400 mt-0.5">{ts}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
