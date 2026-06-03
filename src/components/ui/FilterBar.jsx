import React, { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import Modal from "./Modal";

export const FilterBar = ({ 
  filters = [], // [{ key, label, options: [{ value, label }], value }]
  onChange,
  onClearAll
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleFilterChange = (key, val) => {
    onChange({ [key]: val });
  };

  const hasActiveFilters = Object.values(filters).some(
    f => f.value && f.value !== "All" && f.value !== ""
  );

  return (
    <div className="w-full">
      {/* Desktop Filter Bar */}
      <div className="hidden md:flex flex-wrap items-center gap-4 py-3 px-4 bg-primary-container border border-on-primary-fixed-variant/60 rounded-card">
        <div className="flex items-center text-xs font-semibold text-on-primary-container/50 uppercase tracking-wider mr-2">
          <SlidersHorizontal className="h-4 w-4 mr-2 text-secondary" />
          Filter By
        </div>
        
        {filters.map((filter) => (
          <div key={filter.key} className="flex flex-col space-y-1">
            <select
              value={filter.value || "All"}
              onChange={(e) => handleFilterChange(filter.key, e.target.value)}
              className="px-3 py-1.5 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container rounded-button text-xs focus:outline-none focus:border-secondary transition-colors"
            >
              <option value="All">{filter.label}</option>
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {hasActiveFilters && onClearAll && (
          <button
            onClick={onClearAll}
            className="text-xs text-secondary hover:text-secondary-fixed-dim font-semibold transition-colors ml-auto flex items-center"
          >
            <X className="h-3 w-3 mr-1" />
            Clear All
          </button>
        )}
      </div>

      {/* Mobile Filter Button */}
      <div className="md:hidden flex w-full">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="flex items-center justify-center space-x-2 w-full px-4 py-2.5 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container text-sm font-semibold rounded-button hover:bg-on-primary-fixed-variant transition-colors shadow-sm"
        >
          <SlidersHorizontal className="h-4 w-4 text-secondary" />
          <span>Filters</span>
          {hasActiveFilters && (
            <span className="flex h-2 w-2 rounded-full bg-secondary-container"></span>
          )}
        </button>
      </div>

      {/* Mobile Drawer Sheet */}
      <Modal 
        isOpen={isMobileOpen} 
        onClose={() => setIsMobileOpen(false)} 
        title="Filter Records"
        size="sm"
      >
        <div className="flex flex-col space-y-4">
          {filters.map((filter) => (
            <div key={filter.key} className="flex flex-col space-y-2">
              <label className="text-xs font-semibold text-on-primary-container/60 uppercase tracking-wide">
                {filter.label}
              </label>
              <select
                value={filter.value || "All"}
                onChange={(e) => {
                  handleFilterChange(filter.key, e.target.value);
                }}
                className="w-full px-4 py-3 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container rounded-button text-sm focus:outline-none focus:border-secondary"
              >
                <option value="All">All {filter.label}s</option>
                {filter.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ))}

          <div className="flex space-x-3 pt-6 border-t border-on-primary-fixed-variant">
            {onClearAll && (
              <button
                onClick={() => {
                  onClearAll();
                  setIsMobileOpen(false);
                }}
                className="flex-1 py-3 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container font-semibold text-sm rounded-button"
              >
                Reset
              </button>
            )}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="flex-1 py-3 bg-gradient-to-r from-secondary-container to-secondary-container text-on-primary-fixed font-semibold text-sm rounded-button shadow-sm"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FilterBar;
