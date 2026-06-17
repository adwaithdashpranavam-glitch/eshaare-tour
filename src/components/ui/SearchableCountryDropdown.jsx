import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Search, Check } from "lucide-react";
import { COUNTRIES } from "../../utils/countries";

/**
 * Premium searchable single-select country dropdown.
 * Stores the country NAME as the value (so it's reusable across visa forms).
 *
 * Props:
 *  - value: string (country name)
 *  - onChange: (countryName) => void
 *  - placeholder
 *  - error: boolean (shows red border)
 *  - disabled
 */
export const SearchableCountryDropdown = ({
  value,
  onChange,
  placeholder = "Select country",
  error = false,
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
    return COUNTRIES.filter((c) => c.name.toLowerCase().includes(q));
  }, [query]);

  const selected = COUNTRIES.find((c) => c.name === value);

  const baseBorder = error ? "border-red-400" : "border-[#E5E7EB]";

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 bg-[#F8F6F2] border ${baseBorder} rounded-xl text-left transition-colors focus:outline-none focus:border-[#0F3D2E] ${
          disabled ? "opacity-60 cursor-not-allowed" : "hover:border-[#0F3D2E]/40"
        }`}
      >
        <span className={`flex items-center gap-2 truncate ${selected ? "text-[#1A1A1A]" : "text-gray-400"}`}>
          {selected && <span className="text-base leading-none">{selected.flag}</span>}
          <span className="truncate">{selected ? selected.name : placeholder}</span>
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full bg-white border border-[#E5E7EB] rounded-xl shadow-xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-[#E5E7EB] bg-[#F8F6F2]/50">
            <Search className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search country..."
              className="w-full bg-transparent text-xs text-[#1A1A1A] focus:outline-none placeholder:text-gray-400"
            />
          </div>
          <div className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-3.5 py-3 text-xs text-gray-400 text-center">No countries found</div>
            ) : (
              filtered.map((c) => {
                const isSel = c.name === value;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      onChange(c.name);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-3.5 py-2 text-xs text-left transition-colors ${
                      isSel ? "bg-[#0F3D2E]/5 text-[#0F3D2E] font-semibold" : "text-[#1A1A1A] hover:bg-[#F8F6F2]"
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span className="text-base leading-none">{c.flag}</span>
                      <span className="truncate">{c.name}</span>
                    </span>
                    {isSel && <Check className="h-3.5 w-3.5 text-[#0F3D2E] shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Multi-select country dropdown (e.g. "Other Nationalities").
 * Stores an ARRAY of country names.
 *
 * Props:
 *  - value: string[] (country names)
 *  - onChange: (string[]) => void
 *  - placeholder
 */
export const MultiCountryDropdown = ({
  value = [],
  onChange,
  placeholder = "Select countries",
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
    return COUNTRIES.filter((c) => c.name.toLowerCase().includes(q));
  }, [query]);

  const toggle = (name) => {
    if (value.includes(name)) {
      onChange(value.filter((n) => n !== name));
    } else {
      onChange([...value, name]);
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 bg-[#F8F6F2] border border-[#E5E7EB] rounded-xl text-left transition-colors focus:outline-none focus:border-[#0F3D2E] hover:border-[#0F3D2E]/40 ${
          disabled ? "opacity-60 cursor-not-allowed" : ""
        }`}
      >
        <span className="flex flex-wrap items-center gap-1.5 min-w-0">
          {value.length === 0 ? (
            <span className="text-gray-400">{placeholder}</span>
          ) : (
            value.map((name) => {
              const c = COUNTRIES.find((x) => x.name === name);
              return (
                <span
                  key={name}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#0F3D2E]/10 text-[#0F3D2E] rounded-md text-[11px] font-medium"
                >
                  {c?.flag} {name}
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggle(name);
                    }}
                    className="ml-0.5 text-[#0F3D2E]/60 hover:text-red-500 cursor-pointer"
                  >
                    ✕
                  </span>
                </span>
              );
            })
          )}
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full bg-white border border-[#E5E7EB] rounded-xl shadow-xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-[#E5E7EB] bg-[#F8F6F2]/50">
            <Search className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search country..."
              className="w-full bg-transparent text-xs text-[#1A1A1A] focus:outline-none placeholder:text-gray-400"
            />
          </div>
          <div className="max-h-60 overflow-y-auto py-1">
            {filtered.map((c) => {
              const isSel = value.includes(c.name);
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => toggle(c.name)}
                  className={`w-full flex items-center justify-between gap-2 px-3.5 py-2 text-xs text-left transition-colors ${
                    isSel ? "bg-[#0F3D2E]/5 text-[#0F3D2E] font-semibold" : "text-[#1A1A1A] hover:bg-[#F8F6F2]"
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <span className="text-base leading-none">{c.flag}</span>
                    <span className="truncate">{c.name}</span>
                  </span>
                  <span
                    className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                      isSel ? "bg-[#0F3D2E] border-[#0F3D2E]" : "border-gray-300"
                    }`}
                  >
                    {isSel && <Check className="h-3 w-3 text-white" />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableCountryDropdown;
