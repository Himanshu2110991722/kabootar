// Shimmer skeleton screens that match TripCard and ParcelCard shapes exactly.
// Use these during loading instead of a full-page spinner.

function Bone({ className }) {
  return <div className={`skeleton-shimmer rounded ${className}`} />;
}

export function TripCardSkeleton({ delay = 0 }) {
  return (
    <div className="card p-3" style={{ animationDelay: `${delay}ms`, animation: 'fadeIn .3s ease both' }}>
      {/* Route row */}
      <div className="flex items-center gap-2 mb-2">
        <Bone className="h-2.5 w-16" />
        <div className="flex-1 h-px bg-stone-100" />
        <div className="w-3 h-3 rounded-full bg-stone-100 skeleton-shimmer" />
        <div className="flex-1 h-px bg-stone-100" />
        <Bone className="h-2.5 w-14" />
      </div>
      {/* Badges */}
      <div className="flex gap-1.5 mb-2 flex-wrap">
        <Bone className="h-5 w-16 rounded-full" />
        <Bone className="h-5 w-12 rounded-full" />
        <Bone className="h-5 w-14 rounded-full" />
        <Bone className="h-5 w-12 rounded-full" />
      </div>
      {/* Traveler row */}
      <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
        <div className="w-8 h-8 rounded-full skeleton-shimmer shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Bone className="h-2.5 w-20" />
          <Bone className="h-2 w-32" />
        </div>
        <Bone className="h-7 w-14 rounded-xl" />
      </div>
    </div>
  );
}

export function ParcelCardSkeleton({ delay = 0 }) {
  return (
    <div className="card p-3" style={{ animationDelay: `${delay}ms`, animation: 'fadeIn .3s ease both' }}>
      {/* Route + status badge */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded skeleton-shimmer shrink-0" />
          <div className="space-y-1.5">
            <Bone className="h-2.5 w-28" />
            <Bone className="h-2 w-16" />
          </div>
        </div>
        <Bone className="h-5 w-14 rounded-full" />
      </div>
      {/* Description lines */}
      <Bone className="h-2 w-full mb-1" />
      <Bone className="h-2 w-3/4 mb-2" />
      {/* Badges */}
      <div className="flex gap-1.5 mb-2">
        <Bone className="h-5 w-12 rounded-full" />
        <Bone className="h-5 w-24 rounded-full" />
      </div>
      {/* Sender row */}
      <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
        <div className="w-8 h-8 rounded-full skeleton-shimmer shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Bone className="h-2.5 w-16" />
          <Bone className="h-2 w-28" />
        </div>
        <Bone className="h-7 w-14 rounded-xl" />
      </div>
    </div>
  );
}

// A stack of N skeleton cards with staggered fade-in
export function TripSkeletons({ count = 3 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }, (_, i) => (
        <TripCardSkeleton key={i} delay={i * 80} />
      ))}
    </div>
  );
}

export function ParcelSkeletons({ count = 3 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }, (_, i) => (
        <ParcelCardSkeleton key={i} delay={i * 80} />
      ))}
    </div>
  );
}
