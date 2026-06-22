import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "../lib/firebase";

/**
 * Generates unique sequence reference numbers like PREFIX-YYYYMMDD-001.
 * Fetches the highest counter for today's date from Firestore and increments it.
 */
export const generateRefNo = async (prefix, collectionName, fieldName) => {
  try {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const todayStr = `${yyyy}${mm}${dd}`; // YYYYMMDD

    const collRef = collection(db, collectionName);
    
    // Query for today's documents to find the highest sequence
    const startStr = `${prefix}-${todayStr}-000`;
    const endStr = `${prefix}-${todayStr}-999`;
    
    const q = query(
      collRef,
      where(fieldName, ">=", startStr),
      where(fieldName, "<=", endStr),
      orderBy(fieldName, "desc"),
      limit(1)
    );

    const snapshot = await getDocs(q);
    let nextCounter = 1;

    if (!snapshot.empty) {
      const latestNo = snapshot.docs[0].data()[fieldName];
      const parts = latestNo.split("-");
      const lastSeq = parseInt(parts[2], 10);
      if (!isNaN(lastSeq)) {
        nextCounter = lastSeq + 1;
      }
    }

    const counterStr = String(nextCounter).padStart(3, "0");
    return `${prefix}-${todayStr}-${counterStr}`;
  } catch (error) {
    console.error(`Error generating reference number for ${prefix}:`, error);
    // Fallback in case of query fails (e.g. index not built yet)
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10).replace(/-/g, "");
    return `${prefix}-${todayStr}-${randomSuffix}`;
  }
};

export const generateLeadNo = () => generateRefNo("LD", "leads", "leadNo");
export const generateCaseNo = () => generateRefNo("VC", "visa_cases", "caseNo");
export const generateQuoteNo = () => generateRefNo("QT", "quotations", "quoteNo");
export const generateOrderNo = () => generateRefNo("ORD", "orders", "orderNo");
export const generatePaymentNo = () => generateRefNo("PAY", "payments", "paymentNo");
export const generateDocNo = () => generateRefNo("DOC", "documents", "docNo");

/**
 * Builds a dynamic application/case display name from the selected destination
 * country and visa type, e.g. "France Sports Visa" or "Germany Business Visa".
 *
 * Both `destinationCountry` and `visaType` must be present to compose the dynamic
 * name (visaType already carries the word "Visa", e.g. "Sports Visa"). When they
 * are not both available (e.g. legacy records or a fresh draft before the visa
 * step is filled), it falls back to the stored `visaName`/`destination` so older
 * documents keep rendering correctly.
 *
 * The calling UI appends the trailing noun ("Application" / "Case") itself.
 */
export const getApplicationDisplayName = (data = {}) => {
  const country = (data.destinationCountry || "").trim();
  const type = (data.visaType || "").trim();
  if (country && type) {
    return `${country} ${type}`.replace(/\s+/g, " ").trim();
  }
  return (data.visaName || data.destination || type || country || "Visa Application").trim();
};

/**
 * Formats a phone number for WhatsApp, stripping leading zeros and spaces,
 * and prepending the UAE country code +971 if no country code is present.
 */
export const formatWhatsAppPhone = (phone) => {
  if (!phone) return "";
  let clean = phone.trim().replace(/[\s\-\(\)]/g, "");
  if (clean.startsWith("+")) {
    return clean;
  }
  // Strip leading double zeros or single zero
  if (clean.startsWith("00")) {
    clean = clean.substring(2);
  } else if (clean.startsWith("0")) {
    clean = clean.substring(1);
  }
  
  // If it already starts with 971, prepend '+'
  if (clean.startsWith("971")) {
    return `+${clean}`;
  }
  
  return `+971${clean}`;
};
