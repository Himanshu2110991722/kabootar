import { useState } from 'react';

const SLIDES = [
  {
    emoji: '🕊️',
    title: 'Same route.\nShared journey.',
    body: 'Kabutar connects travelers and senders on the same route — so parcels reach their destination with people already going there.',
    from: '#f97316',
    to: '#ea580c',
  },
  {
    emoji: '💬',
    title: 'Post. Match.\nChat. Deliver.',
    body: 'Post your trip or parcel in 60 seconds. Get matched instantly. Negotiate price in chat. Confirm with OTP — no middlemen.',
    from: '#6d28d9',
    to: '#2563eb',
  },
  {
    emoji: '🔐',
    title: 'Built on trust,\nnot promises.',
    body: 'KYC verification, two-way ratings, and photo proof at pickup and delivery. Every delivery is secure and traceable.',
    from: '#059669',
    to: '#0d9488',
  },
];

// No useNavigate — this renders outside BrowserRouter; use onDone() callback only
export default function Onboarding({ onDone }) {
  const [idx, setIdx] = useState(0);
  const slide = SLIDES[idx];
  const last  = idx === SLIDES.length - 1;

  const done = () => {
    localStorage.setItem('kabutar_onboarded', '1');
    onDone?.();
  };

  const next = () => last ? done() : setIdx(i => i + 1);

  return (
    <div
      className="fixed inset-0 z-[9998] flex flex-col"
      style={{
        background: `linear-gradient(160deg, ${slide.from} 0%, ${slide.to} 100%)`,
        transition: 'background 0.5s ease',
        paddingTop:    'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {/* Skip */}
      <div className="flex justify-end px-6 pt-4">
        {!last && (
          <button onClick={done} className="text-white/70 text-sm font-semibold px-2 py-1">
            Skip
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div key={idx} style={{ animation: 'slideUp 0.4s ease' }}>
          <div className="text-7xl mb-8">{slide.emoji}</div>
          <h1 className="text-3xl font-black text-white leading-tight mb-5 whitespace-pre-line">
            {slide.title}
          </h1>
          <p className="text-white/80 text-base leading-relaxed max-w-xs mx-auto">
            {slide.body}
          </p>
        </div>
      </div>

      {/* Dots + CTA */}
      <div className="px-6 pb-8 space-y-5">
        <div className="flex justify-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`rounded-full transition-all duration-300 ${
                i === idx ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/40'
              }`}
            />
          ))}
        </div>

        <button
          onClick={next}
          className="w-full py-4 rounded-2xl bg-white font-bold text-base active:scale-95 transition-all"
          style={{ color: slide.from }}
        >
          {last ? 'Get Started 🚀' : 'Next →'}
        </button>
      </div>
    </div>
  );
}
