import { useState, useEffect } from 'react';

// App splash screen — shown on first open with logo animation
// onDone() is called when animation finishes and app should render
export default function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState('hidden'); // hidden → rise → hold → exit

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('rise'),  80);   // start animating in
    const t2 = setTimeout(() => setPhase('hold'),  900);  // hold fully visible
    const t3 = setTimeout(() => setPhase('exit'),  2400); // start fade out
    const t4 = setTimeout(() => onDone(),          2900); // hand off to app
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{
        background: 'linear-gradient(160deg, #f97316 0%, #ea580c 60%, #c2410c 100%)',
        opacity:    phase === 'exit' ? 0 : 1,
        transform:  phase === 'exit' ? 'scale(1.04)' : 'scale(1)',
        transition: phase === 'exit' ? 'opacity 0.5s ease, transform 0.5s ease' : 'none',
        // Prevent interaction during exit
        pointerEvents: phase === 'exit' ? 'none' : 'auto',
      }}
    >
      {/* Decorative background circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-16 w-64 h-64 rounded-full bg-white/10" />
        <div className="absolute top-16 -left-12 w-40 h-40 rounded-full bg-white/8" />
        <div className="absolute -bottom-20 left-1/4 w-52 h-52 rounded-full bg-white/10" />
      </div>

      {/* Logo */}
      <div
        style={{
          transform:  phase === 'hidden' ? 'scale(0.4) translateY(40px)' : 'scale(1) translateY(0)',
          opacity:    phase === 'hidden' ? 0 : 1,
          transition: 'transform 0.65s cubic-bezier(0.34,1.56,0.64,1), opacity 0.5s ease',
        }}
      >
        <div className="w-28 h-28 rounded-3xl overflow-hidden shadow-2xl mb-6 mx-auto border-4 border-white/20">
          <img
            src="/logo.png"
            alt="Kabutar"
            className="w-full h-full object-cover"
            onError={e => {
              // Fallback if logo.png not found yet
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML =
                '<div class="w-full h-full flex items-center justify-center text-5xl bg-white/20">🕊️</div>';
            }}
          />
        </div>
      </div>

      {/* App name */}
      <div
        style={{
          transform:  phase === 'hidden' ? 'translateY(20px)' : 'translateY(0)',
          opacity:    phase === 'hidden' ? 0 : 1,
          transition: 'transform 0.6s ease 0.2s, opacity 0.5s ease 0.2s',
        }}
      >
        <h1 className="text-4xl font-black text-white tracking-tight text-center">
          kabutar
        </h1>
      </div>

      {/* Tagline */}
      <div
        style={{
          transform:  phase === 'hidden' ? 'translateY(16px)' : 'translateY(0)',
          opacity:    phase === 'hidden' ? 0 : 1,
          transition: 'transform 0.6s ease 0.35s, opacity 0.5s ease 0.35s',
        }}
      >
        <p className="text-orange-100 text-sm font-medium text-center mt-2 tracking-wide">
          Send parcels. Earn by traveling.
        </p>
      </div>

      {/* Loading dots at bottom */}
      <div
        className="absolute bottom-16 flex gap-2"
        style={{
          opacity:    phase === 'hidden' || phase === 'rise' ? 0 : 1,
          transition: 'opacity 0.4s ease 0.5s',
        }}
      >
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-white/70"
            style={{ animation: `bounce 1s ease-in-out ${i * 0.18}s infinite` }}
          />
        ))}
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50%       { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
