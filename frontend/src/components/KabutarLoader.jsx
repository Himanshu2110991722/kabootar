/**
 * KabutarLoader — animated flying pigeon used for all loading states.
 * Props:
 *   size    (number, default 56) — width/height in px of the SVG bird
 *   text    (string | null)      — caption below the bird; null = no text
 *   fullPage (bool, default false) — centres inside full viewport height
 */
export default function KabutarLoader({ size = 56, text = 'Loading…', fullPage = false }) {
  const wrapper = fullPage
    ? 'flex flex-col items-center justify-center min-h-[60vh] gap-4'
    : 'flex flex-col items-center justify-center py-10 gap-3';

  return (
    <div className={wrapper}>
      <div style={{ width: size, height: size * 0.75 }}>
        <svg
          viewBox="0 0 80 60"
          xmlns="http://www.w3.org/2000/svg"
          style={{ overflow: 'visible', animation: 'birdFloat 1.6s ease-in-out infinite' }}
        >
          {/* Wing top — flaps upward */}
          <path
            d="M40 32 L10 4 L38 30 Z"
            fill="#fb923c"
            style={{
              transformOrigin: '40px 32px',
              animation: 'wingUp 0.72s ease-in-out infinite',
            }}
          />

          {/* Wing bottom — flaps downward */}
          <path
            d="M40 44 L10 58 L38 44 Z"
            fill="#fed7aa"
            style={{
              transformOrigin: '40px 44px',
              animation: 'wingDown 0.72s ease-in-out infinite',
            }}
          />

          {/* Body */}
          <ellipse cx="40" cy="38" rx="20" ry="13" fill="#f97316" />

          {/* Head */}
          <circle cx="56" cy="30" r="9" fill="#f97316" />

          {/* Beak */}
          <path d="M63 27.5 L74 30 L63 32.5 Z" fill="#c2410c" />

          {/* Eye */}
          <circle cx="58" cy="28" r="2.5" fill="white" />
          <circle cx="58.8" cy="27.5" r="1.2" fill="#1c1917" />

          {/* Tail */}
          <path d="M20 38 L4 50 L14 38 L4 26 Z" fill="#ea580c" />

          {/* Belly highlight */}
          <ellipse cx="42" cy="42" rx="10" ry="5" fill="#fb923c" opacity="0.45" />
        </svg>
      </div>

      {text && (
        <p className="text-stone-400 text-sm font-medium" style={{ animation: 'fadeIn 0.4s ease' }}>
          {text}
        </p>
      )}
    </div>
  );
}
