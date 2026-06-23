// Shared appointment-date rules for all visa application flows.
//
// This is the single source of truth for "preferred appointment date" validation.
// It is intentionally visa-type agnostic: Schengen uses it today, and future flows
// (UK, US, NZ, Canada, Australia, etc.) can opt in simply by adding an entry to
// `visaAppointmentRules` below — no UI or save-logic changes required.
//
// Each rule defines:
//   - minStartOffsetDays:   how many days from *today* the earliest selectable start
//                           date is. 0 = today is allowed, 1 = earliest is tomorrow, etc.
//   - minEndGapDays:        minimum number of days the end date must be after the start
//                           date. 0 = end may equal/just-after start (subject to
//                           allowFlexibleDateRange).
//   - allowFlexibleDateRange: when true the flow asks for a start AND end date (a range);
//                           when false only a single preferred date is required.

export const visaAppointmentRules = {
  // Fallback rule applied to any visa flow that has not defined its own.
  default: {
    minStartOffsetDays: 0,
    minEndGapDays: 0,
    allowFlexibleDateRange: true,
  },

  // Schengen: keep the existing rule that the end date must be at least 10 days
  // after the start date, and never allow a start date in the past.
  schengen: {
    minStartOffsetDays: 0,
    minEndGapDays: 10,
    allowFlexibleDateRange: true,
  },
};

// Resolve the effective rule set for a visa flow, merged over the default rule.
export function getAppointmentRules(visaFlow = "default") {
  const key = typeof visaFlow === "string" ? visaFlow.toLowerCase() : "default";
  return { ...visaAppointmentRules.default, ...(visaAppointmentRules[key] || {}) };
}

// Local-time midnight for a given date (defaults to now). Using local midnight keeps
// the comparison aligned with what the user sees in the native date picker.
export function startOfDay(value = new Date()) {
  const d = value instanceof Date ? new Date(value) : new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Format a Date as a `YYYY-MM-DD` string suitable for <input type="date"> value/min.
// Uses local date parts (not toISOString) to avoid timezone off-by-one shifts.
export function toDateInputValue(date) {
  const d = startOfDay(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Add days to a date and return a new Date (local midnight).
function addDays(date, days) {
  const d = startOfDay(date);
  d.setDate(d.getDate() + days);
  return d;
}

// Earliest selectable preferred start date for a visa flow, as a `YYYY-MM-DD` string.
// This is what the date picker's `min` attribute should be set to.
export function getMinStartDate(visaFlow = "default", today = new Date()) {
  const { minStartOffsetDays } = getAppointmentRules(visaFlow);
  return toDateInputValue(addDays(today, minStartOffsetDays));
}

// Earliest selectable preferred end date for a visa flow given a chosen start date,
// as a `YYYY-MM-DD` string. Falls back to the min start date when no start is chosen.
export function getMinEndDate(startDate, visaFlow = "default", today = new Date()) {
  const { minEndGapDays } = getAppointmentRules(visaFlow);
  if (!startDate) return getMinStartDate(visaFlow, today);
  return toDateInputValue(addDays(startDate, minEndGapDays));
}

// Authoritative validation for a preferred appointment date selection. Used by both
// the UI (before advancing) and the save/submit path (in case the UI is bypassed).
// Returns { valid: boolean, error: string|null }.
export function validateAppointmentDates({ startDate, endDate } = {}, visaFlow = "default", today = new Date()) {
  const rules = getAppointmentRules(visaFlow);
  const minStart = startOfDay(getMinStartDate(visaFlow, today));

  if (!startDate) {
    return { valid: false, error: "Please select a preferred start date." };
  }

  const start = startOfDay(startDate);
  if (Number.isNaN(start.getTime())) {
    return { valid: false, error: "Please select a valid preferred start date." };
  }
  if (start < minStart) {
    return {
      valid: false,
      error:
        rules.minStartOffsetDays > 0
          ? `The preferred start date must be at least ${rules.minStartOffsetDays} day(s) from today.`
          : "The preferred start date cannot be in the past.",
    };
  }

  // Single-date flows don't require an end date.
  if (!rules.allowFlexibleDateRange) {
    return { valid: true, error: null };
  }

  if (!endDate) {
    return { valid: false, error: "Please select a preferred end date." };
  }

  const end = startOfDay(endDate);
  if (Number.isNaN(end.getTime())) {
    return { valid: false, error: "Please select a valid preferred end date." };
  }

  const minEnd = startOfDay(getMinEndDate(startDate, visaFlow, today));
  if (end < minEnd) {
    if (rules.minEndGapDays > 0) {
      return {
        valid: false,
        error: `Please choose at least a ${rules.minEndGapDays}-day appointment preference interval so our team has enough flexibility to secure a suitable slot.`,
      };
    }
    return { valid: false, error: "The preferred end date must be after the start date." };
  }

  return { valid: true, error: null };
}
