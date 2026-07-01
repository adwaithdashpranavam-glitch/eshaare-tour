import React from "react";

export const StatusBadge = ({ status, variant }) => {
  const getBadgeStyles = () => {
    const base = "inline-flex items-center px-2.5 py-1 rounded-badge text-[11px] font-semibold uppercase tracking-wider leading-none";

    // Accessible tone presets: light tinted background + strong (WCAG AA) text.
    // Avoids the previous light-on-light pills (text-*-400 on /10 tints).
    const tones = {
      emerald: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      amber:   "bg-amber-50 text-amber-700 border border-amber-200",
      red:     "bg-red-50 text-red-700 border border-red-200",
      blue:    "bg-blue-50 text-blue-700 border border-blue-200",
      violet:  "bg-violet-50 text-violet-700 border border-violet-200",
      slate:   "bg-slate-100 text-slate-600 border border-slate-200",
    };

    // Custom mapping of status keys to accessible tones
    const statusMap = {
      // Leads
      "New": tones.blue,
      "Contacted": tones.violet,
      "Follow-up": tones.amber,
      "Qualified": tones.emerald,
      "Won": tones.emerald,
      "Lost": tones.red,

      // Cases
      "Docs Pending": tones.amber,
      "Documents Pending": tones.amber,
      "Verification": tones.blue,
      "Submitted": tones.emerald,
      "Awaiting Decision": tones.violet,
      "Approved": tones.emerald,
      "Rejected": tones.red,
      "Withdrawn": tones.slate,

      // Payments
      "Paid": tones.emerald,
      "Pending": tones.amber,
      "Overdue": `${tones.red} animate-pulse`,
      "Partial": tones.amber,

      // Appointments
      "Confirmed": tones.emerald,
      "Cancelled": tones.red,
      "Rescheduled": tones.violet,

      // AI document verification
      "ai_processing": `${tones.blue} animate-pulse`,
      "AI Processing": `${tones.blue} animate-pulse`,
      "verified": tones.emerald,
      "Verified": tones.emerald,
      "rejected": tones.red,
      "needs_review": tones.amber,
      "Needs Review": tones.amber,
    };

    const config = statusMap[status] || tones.slate;
    return `${base} ${config}`;
  };

  // Client-facing display labels. The internal status value (e.g. "ai_processing")
  // is never changed — only how it is rendered. AI processing is shown as a neutral
  // "Under Verification" so clients don't see internal AI wording.
  const DISPLAY_LABELS = {
    ai_processing: "Under Verification",
    "AI Processing": "Under Verification",
    "Under Verification": "Under Verification",
    needs_review: "Under Verification",
    "Needs Review": "Under Verification",
    rejected: "Re-upload Required",
  };

  const label = (typeof status === "string" && DISPLAY_LABELS[status])
    ? DISPLAY_LABELS[status]
    : (typeof status === "string"
        ? status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
        : status);

  return <span className={getBadgeStyles()}>{label}</span>;
};

export default StatusBadge;
