import React from "react";

export const DateRangePicker = ({ 
  value, 
  onChange 
}) => {
  const presets = [
    { label: "Today", value: "Today" },
    { label: "This Week", value: "This Week" },
    { label: "This Month", value: "This Month" },
    { label: "Custom", value: "Custom" }
  ];

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
      <div className="flex bg-primary-container border border-on-primary-fixed-variant p-0.5 rounded-button">
        {presets.map((preset) => (
          <button
            key={preset.value}
            onClick={() => onChange(preset.value)}
            className={`px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider transition-colors ${
              value === preset.value
                ? "bg-secondary-container text-on-primary-fixed"
                : "text-on-primary-container/60 hover:text-white"
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>
      
      {value === "Custom" && (
        <div className="flex gap-2">
          <input
            type="date"
            className="px-2.5 py-1 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container text-xs rounded focus:outline-none"
            placeholder="Start"
          />
          <input
            type="date"
            className="px-2.5 py-1 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container text-xs rounded focus:outline-none"
            placeholder="End"
          />
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
