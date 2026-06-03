import React, { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

export const SearchInput = ({ 
  value = "", 
  onChange, 
  placeholder = "Search...",
  debounceTime = 300
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const debounceRef = useRef(null);

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  const handleChange = (e) => {
    const val = e.target.value;
    setDisplayValue(val);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      onChange(val);
    }, debounceTime);
  };

  const handleClear = () => {
    setDisplayValue("");
    onChange("");
  };

  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-primary-container/40">
        <Search className="h-4 w-4" />
      </div>
      <input
        type="text"
        className="w-full pl-10 pr-10 py-2.5 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container placeholder-on-primary-container/40 rounded-button text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/20 transition-all font-sans"
        placeholder={placeholder}
        value={displayValue}
        onChange={handleChange}
      />
      {displayValue && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-on-primary-container/40 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
