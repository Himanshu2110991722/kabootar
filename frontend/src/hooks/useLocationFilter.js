import { useState, useCallback } from 'react';
import { getNearbyCities } from '../lib/cityCoords';

const STORAGE_KEY = 'kabutar_loc_v2';
const DEFAULT_RANGE = 100; // km

function load() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? JSON.parse(s) : { city: '', enabled: false, lat: null, lng: null, rangeKm: DEFAULT_RANGE };
  } catch { return { city: '', enabled: false, lat: null, lng: null, rangeKm: DEFAULT_RANGE }; }
}

function save(obj) {
  if (obj.enabled && obj.city) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

async function reverseGeocode(lat, lng) {
  const r = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`,
    { headers: { 'User-Agent': 'KabutarApp/1.0' } }
  );
  const d = await r.json();
  return (
    d.address?.city     ||
    d.address?.town     ||
    d.address?.county   ||
    d.address?.state_district ||
    d.address?.state    ||
    ''
  );
}

// Fuzzy name match as fallback (for manually typed cities)
export function cityMatch(tripCity, userCity) {
  if (!tripCity || !userCity) return false;
  const t = tripCity.toLowerCase().trim();
  const u = userCity.toLowerCase().trim();
  return t.includes(u) || u.includes(t);
}

export function useLocationFilter() {
  const [loc,     setLoc]     = useState(load);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const persist = (next) => { setLoc(next); save(next); };

  const detect = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const pos = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, {
          timeout: 12000, enableHighAccuracy: false,
        })
      );
      const { latitude: lat, longitude: lng } = pos.coords;
      const city = await reverseGeocode(lat, lng);
      const next = { ...load(), city, enabled: true, lat, lng };
      persist(next);
      setLoading(false);
      return city;
    } catch (e) {
      const msg = e.code === 1
        ? 'Location access denied — allow it in browser settings.'
        : 'Could not detect location. Check your connection.';
      setError(msg);
      setLoading(false);
      return null;
    }
  }, []); // eslint-disable-line

  const setCity = useCallback((city) => {
    // When user manually picks a city, we lose exact coordinates
    // Keep any existing coords so nearby still works if available
    const cur = load();
    persist({ ...cur, city, enabled: true });
    setError(null);
  }, []); // eslint-disable-line

  const setRange = useCallback((km) => {
    const cur = load();
    persist({ ...cur, rangeKm: km });
  }, []); // eslint-disable-line

  const clear = useCallback(() => {
    persist({ city: '', enabled: false, lat: null, lng: null, rangeKm: DEFAULT_RANGE });
    setError(null);
  }, []); // eslint-disable-line

  // Compute nearby cities from stored coords + current range
  const nearbyCities = (loc.lat && loc.lng && loc.enabled)
    ? getNearbyCities(loc.lat, loc.lng, loc.rangeKm || DEFAULT_RANGE)
    : [];

  // Build a Set of lowercase city names for O(1) lookup in filter
  const nearbyCitySet = new Set(nearbyCities.map(n => n.city.toLowerCase()));

  // Master filter function: returns true if a trip/parcel city is "near" the user
  const matchesNearby = (tripFromCity, tripToCity) => {
    // 1. Coordinate-based match (most accurate)
    if (nearbyCitySet.size > 0) {
      return (
        nearbyCitySet.has(tripFromCity?.toLowerCase()?.trim()) ||
        nearbyCitySet.has(tripToCity?.toLowerCase()?.trim())
      );
    }
    // 2. Fallback: fuzzy name match (when user manually typed a city)
    return (
      cityMatch(tripFromCity, loc.city) ||
      cityMatch(tripToCity, loc.city)
    );
  };

  return {
    ...loc,
    loading,
    error,
    detect,
    setCity,
    setRange,
    clear,
    nearbyCities,    // [{ city, dist }] sorted by distance
    matchesNearby,   // (fromCity, toCity) => boolean
  };
}
