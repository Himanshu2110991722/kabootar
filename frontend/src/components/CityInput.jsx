import { useState, useRef, useEffect } from "react";
import { MapPin } from "lucide-react";
import { filterCities } from "../lib/cities";

export default function CityInput({ value, onChange, placeholder, className = "" }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleChange = (val) => {
    onChange(val);
    const results = filterCities(val);
    setSuggestions(results);
    setOpen(results.length > 0);
  };

  const pick = (city) => {
    onChange(city);
    setSuggestions([]);
    setOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={ref}>
      <div className="relative">
        <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
        <input
          className="input-field pl-8"
          placeholder={placeholder || "City"}
          value={value}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => { if (suggestions.length > 0) setOpen(true); }}
          autoComplete="off"
        />
      </div>
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden animate-slide-down">
          {suggestions.map(city => (
            <li key={city}>
              <button
                type="button"
                onMouseDown={() => pick(city)}
                className="w-full text-left px-4 py-2.5 text-sm text-stone-700 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 transition-colors"
              >
                <MapPin size={12} className="text-stone-400 shrink-0" />
                {city}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
