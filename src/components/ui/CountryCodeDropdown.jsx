import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Search } from "lucide-react";
import { COUNTRIES, DEFAULT_DIAL_CODE } from "../../utils/countries";

/**
 * Phone input with a searchable country-code (dial) dropdown.
 * Defaults to UAE (+971).
 *
 * Props:
 *  - dialCode: string (e.g. "+971")
 *  - number: string (the local number)
 *  - onChange: ({ dialCode, number }) => void
 *  - error: boolean
 *  - placeholder
 *  - disabled
 */
export const CountryCodeDropdown = ({
  dialCode = DEFAULT_DIAL_CODE,
  number = "",
  onChange,
  error = false,
  placeholder = "50 123 4567",
  disabled = false
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.dial.includes(q)
    );
  }, [query]);

  // Prefer UAE when several countries share a dial code (e.g. +1)
  const current =
    COUNTRIES.find((c) => c.dial === dialCode && c.code === "AE") ||
    COUNTRIES.find((c) => c.dial === dialCode) ||
    COUNTRIES.find((c) => c.dial === DEFAULT_DIAL_CODE);

  const baseBorder = error ? "border-red-400" : "border-[#E5E7EB]";

  return (
    <div ref={wrapRef} className="relative">
      <div className={`flex items-stretch bg-[#F8F6F2] border ${baseBorder} rounded-xl overflow-hidden focus-within:border-[#0F3D2E] transition-colors`}>
        {/* Dial code selector */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setOpen((o) => !o)}
          className="flex items-center gap-1 px-3 py-2.5 border-r border-[#E5E7EB] hover:bg-[#0F3D2E]/5 transition-colors shrink-0 text-xs font-semibold text-[#1A1A1A]"
        >
          <span className="text-base leading-none">{current?.flag}</span>
          <span>{dialCode}</span>
          <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {/* Local number */}
        <input
          type="tel"
          disabled={disabled}
          value={number}
          onChange={(e) => onChange({ dialCode, number: e.target.value.replace(/[^\d\s]/g, "") })}
          placeholder={placeholder}
          className="flex-1 min-w-0 px-3 py-2.5 bg-transparent text-xs text-[#1A1A1A] focus:outline-none placeholder:text-gray-400"
        />
      </div>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full min-w-[260px] bg-white border border-[#E5E7EB] rounded-xl shadow-xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-[#E5E7EB] bg-[#F8F6F2]/50">
            <Search className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search country or code..."
              className="w-full bg-transparent text-xs text-[#1A1A1A] focus:outline-none placeholder:text-gray-400"
            />
          </div>
          <div className="max-h-60 overflow-y-auto py-1">
            {filtered.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => {
                  onChange({ dialCode: c.dial, number });
                  setOpen(false);
                  setQuery("");
                }}
                className={`w-full flex items-center gap-2 px-3.5 py-2 text-xs text-left transition-colors ${
                  c.dial === dialCode ? "bg-[#0F3D2E]/5 text-[#0F3D2E] font-semibold" : "text-[#1A1A1A] hover:bg-[#F8F6F2]"
                }`}
              >
                <span className="text-base leading-none">{c.flag}</span>
                <span className="flex-1 truncate">{c.name}</span>
                <span className="text-gray-400">{c.dial}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CountryCodeDropdown;
