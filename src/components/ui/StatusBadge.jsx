import React from "react";

export const StatusBadge = ({ status, variant }) => {
  const getBadgeStyles = () => {
    const base = "inline-flex items-center px-2.5 py-0.5 rounded-badge text-xs font-medium uppercase tracking-wider";
    
    // Custom mapping of status keys to tailwind color classes
    const statusMap = {
      // Leads
      "New": "bg-info/10 text-info border border-info/20",
      "Contacted": "bg-purple-500/10 text-purple-400 border border-purple-500/20",
      "Follow-up": "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
      "Qualified": "bg-secondary-container/10 text-secondary-fixed-dim border border-secondary/20",
      "Won": "bg-success/10 text-success border border-success/20",
      "Lost": "bg-danger/10 text-danger border border-danger/20",
      
      // Cases
      "Docs Pending": "bg-warning/10 text-warning border border-warning/20",
      "Documents Pending": "bg-warning/10 text-warning border border-warning/20",
      "Verification": "bg-info/10 text-info border border-info/20",
      "Submitted": "bg-secondary-container/10 text-secondary-fixed-dim border border-secondary/20",
      "Awaiting Decision": "bg-purple-500/10 text-purple-400 border border-purple-500/20",
      "Approved": "bg-success/10 text-success border border-success/20",
      "Rejected": "bg-danger/10 text-danger border border-danger/20",
      "Withdrawn": "bg-gray-500/10 text-gray-400 border border-gray-500/20",

      // Payments
      "Paid": "bg-success/10 text-success border border-success/20",
      "Pending": "bg-warning/10 text-warning border border-warning/20",
      "Overdue": "bg-danger/10 text-danger border border-danger/20 animate-pulse",
      "Partial": "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",

      // Appointments
      "Confirmed": "bg-success/10 text-success border border-success/20",
      "Cancelled": "bg-danger/10 text-danger border border-danger/20",
      "Rescheduled": "bg-purple-500/10 text-purple-400 border border-purple-500/20",
    };

    const config = statusMap[status] || "bg-gray-500/10 text-gray-400 border border-gray-500/20";
    return `${base} ${config}`;
  };

  return <span className={getBadgeStyles()}>{status}</span>;
};

export default StatusBadge;
