import React from "react";
import { Calendar } from "lucide-react";

/**
 * Styled date picker. Uses the native date input (best cross-platform & mobile UX)
 * wrapped in the portal's premium styling. Value is an ISO string "YYYY-MM-DD".
 *
 * Props:
 *  - value: "YYYY-MM-DD"
 *  - onChange: (isoString) => void
 *  - error: boolean
 *  - min, max: "YYYY-MM-DD" (optional bounds)
 *  - disabled
 */
export const DatePickerField = ({
  value = "",
  onChange,
  error = false,
  min,
  max,
  disabled = false
}) => {
  const baseBorder = error ? "border-red-400" : "border-[#E5E7EB]";
  return (
    <div className={`relative flex items-center bg-[#F8F6F2] border ${baseBorder} rounded-xl focus-within:border-[#0F3D2E] transition-colors ${disabled ? "opacity-60" : ""}`}>
      <Calendar className="h-4 w-4 text-[#0F3D2E] ml-3.5 shrink-0 pointer-events-none" />
      <input
        type="date"
        value={value || ""}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 bg-transparent text-xs text-[#1A1A1A] focus:outline-none [color-scheme:light]"
      />
    </div>
  );
};

export default DatePickerField;
