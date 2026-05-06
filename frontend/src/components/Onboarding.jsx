import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SLIDES = [
  {
    emoji: '🕊️',
    title: 'Same route.\nShared journey.',
    body: 'Kabutar connects travelers and senders on the same route — so parcels reach their destination with people already going there.',
    color: 'from-orange-500 to-orange-600',
  },
  {
    emoji: '💬',
    title: 'Post. Match.\nChat. Deliver.',
    body: 'Post your trip or parcel in 60 seconds. Get matched instantly. Negotiate price in chat. Confirm with OTP — no middlemen.',
    color: 'from-violet-600 to-blue-600',
  },
  {
    emoji: '🔐',
    title: 'Built on trust,\nnot promises.',
    body: 'KYC verification, two-way ratings, photo proof at pickup and delivery. Every delivery is secure and traceable.',
    color: 'from-emerald-500 to-teal-600',
  },
];

export default function Onboarding({ onDone }) {
  const [idx, setIdx] = useState(0);
  const navigate = useNavigate();
  const slide = SLIDES[idx];
  const last  = idx === SLIDES.length - 1;

  const next = () => {
    if (last) {
      localStorage.setItem('kabutar_onboarded', '1');
      onDone?.();
    } else {
      setIdx(i => i + 1);
    }
  };

  const skip = () => {
    localStorage.setItem('kabutar_onboarded', '1');
    onDone?.();
  };

  return (
    <div
      className={`fixed inset-0 z-[9998] flex flex-col items-center justify-between bg-gradient-to-br ${slide.color} transition-all duration-500`}
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* Skip */}
      <div className="w-full flex justify-end px-6 pt-4">
        {!last && (
          <button onClick={skip} className="text-white/70 text-sm font-semibold">
            Skip
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div
          key={idx}
          style={{ animation: 'slideUp 0.4s ease' }}
        >
          <div className="text-7xl mb-8">{slide.emoji}</div>
          <h1 className="text-3xl font-black text-white leading-tight mb-5 whitespace-pre-line">
            {slide.title}
          </h1>
          <p className="text-white/80 text-base leading-relaxed max-w-xs">
            {slide.body}
          </p>
        </div>
      </div>

      {/* Dots + button */}
      <div className="w-full px-8 pb-8 space-y-6">
        {/* Progress dots */}
        <div className="flex justify-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`rounded-full transition-all ${
                i === idx ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/40'
              }`}
            />
          ))}
        </div>

        {/* Action button */}
        <button
          onClick={next}
          className="w-full py-4 rounded-2xl bg-white font-bold text-base active:scale-95 transition-all"
          style={{ color: 'var(--color)' }}
        >
          {last ? 'Get Started 🚀' : 'Next →'}
        </button>
      </div>
    </div>
  );
}
