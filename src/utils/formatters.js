import { format } from "date-fns";

export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return "0.00 AED";
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED"
  }).format(amount);
};

export const formatDate = (timestamp, formatPattern = "dd MMM yyyy, hh:mm a") => {
  if (!timestamp) return "-";
  
  // Handle Firestore Timestamp objects
  let dateObj = timestamp;
  if (timestamp.toDate && typeof timestamp.toDate === "function") {
    dateObj = timestamp.toDate();
  } else if (timestamp.seconds) {
    dateObj = new Date(timestamp.seconds * 1000);
  } else if (typeof timestamp === "string" || typeof timestamp === "number") {
    dateObj = new Date(timestamp);
  }

  try {
    return format(dateObj, formatPattern);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "-";
  }
};

export const formatShortDate = (timestamp) => {
  return formatDate(timestamp, "dd MMM yyyy");
};
