// ===========================================================================
// CLIENT-FACING DOCUMENT STATUS & REJECTION MESSAGES (central mapping)
// ---------------------------------------------------------------------------
// Single source of truth for how a document's status is presented to CLIENTS.
// No verification internals (AI, OCR, Vision, confidence, blur, profile match,
// technical/permission errors, raw reasoning) are ever exposed here — those stay
// in the admin/consultant workspace. To add a new rejection reason, add one
// entry to CLIENT_REJECTION_MESSAGES; no UI component needs to change.
// ===========================================================================

// Internal reason code (written by aiVerifyDocument as aiCheck.reasonCode /
// rejectionReasonCode, or by a future manual flow) → friendly client message.
export const CLIENT_REJECTION_MESSAGES = {
  expired_passport:
    "Your passport has expired. Please upload a valid passport.",
  passport_expiring_soon:
    "Your passport expires in less than 6 months. Please upload a passport with sufficient validity or contact your consultant.",
  expired_emirates_id:
    "Your Emirates ID has expired. Please upload a valid Emirates ID.",
  expired_residence_visa:
    "Your UAE Residence Visa has expired. Please upload a valid residence visa.",
  expired_document:
    "This document has expired. Please upload a valid document.",
  blurry_document:
    "The uploaded document could not be read clearly. Please upload a clearer copy.",
  unreadable_document:
    "We could not read the uploaded document. Please upload a higher-quality copy.",
  wrong_document_type:
    "The uploaded file does not match the selected document type. Please upload the correct document.",
  incomplete_document:
    "The uploaded document appears to be incomplete. Please upload the complete document.",
  manual_review_required:
    "We could not complete verification automatically. Our consultant will review your document.",
};

// Generic fallback when a document is rejected and no reason can be inferred.
// Never exposes internal detail.
export const DEFAULT_REJECTION_MESSAGE =
  "This document could not be verified. Please upload a clear, valid copy.";

// Infer a client-friendly reason code from a rejected document when no explicit
// reasonCode was stored. Reads only human/plain fields (never confidence, blur
// scores, raw errors, or internal codes) and the document type/category, then
// keyword-matches to a known code. Returns null if nothing reliable is found.
export const inferRejectionCode = (doc) => {
  const text = [
    doc?.aiCheck?.reason,
    doc?.verificationNotes,
    doc?.rejectionReason,
    doc?.adminNotes,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const category = String(
    doc?.aiCheck?.category || doc?.docType || doc?.type || ""
  ).toLowerCase();

  if (!text && !category) return null;

  const has = (kw) => text.includes(kw);
  const catHas = (kw) => category.includes(kw);

  const isExpired = has("expired") || has("expiry") || has("has expired");
  if (isExpired) {
    if (has("emirates") || catHas("emirates")) return "expired_emirates_id";
    if (has("passport") || catHas("passport")) return "expired_passport";
    if (has("residence") || has("visa") || catHas("residence") || catHas("visa")) {
      return "expired_residence_visa";
    }
    return "expired_document";
  }

  if (has("blur") || has("unclear") || has("unreadable") || has("could not be read") || has("not be read") || has("not readable")) {
    return "blurry_document";
  }

  if (has("wrong") || has("does not match") || has("doesn't match") || has("not match") || has("mismatch") || has("wrong_document")) {
    return "wrong_document_type";
  }

  if (has("incomplete")) return "incomplete_document";

  return null;
};

const UNDER_VERIFICATION = {
  tone: "pending",
  statusLabel: "Under Verification",
  message: "Your document has been received and is currently under verification.",
  canReupload: false,
};

const VERIFIED = {
  tone: "verified",
  statusLabel: "Verified",
  message: "Document verified successfully.",
  canReupload: false,
};

// Resolve the internal reason code from a document record, preferring the
// explicit rejection code, then the aiCheck reason code.
export const getRejectionReasonCode = (doc) =>
  doc?.rejectionReasonCode || doc?.aiCheck?.reasonCode || null;

// Returns the client-facing view for a document:
//   { tone, statusLabel, message, canReupload }
// tone ∈ "verified" | "reupload" | "pending". canReupload drives the
// "Upload New Document" action button.
export const getClientDocumentView = (doc) => {
  const status = String(doc?.status || "").toLowerCase();

  if (status === "verified" || status === "approved" || status === "completed") {
    return VERIFIED;
  }

  if (status === "rejected") {
    // Priority: an explicit admin-authored client message, then a stored reason
    // code, then an inferred code from plain fields, then the generic fallback.
    let message;
    if (doc?.clientRejectionMessage) {
      message = doc.clientRejectionMessage;
    } else {
      const code = getRejectionReasonCode(doc) || inferRejectionCode(doc);
      message = (code && CLIENT_REJECTION_MESSAGES[code]) || DEFAULT_REJECTION_MESSAGE;
    }
    return {
      tone: "reupload",
      statusLabel: "Re-upload Required",
      message,
      canReupload: true,
    };
  }

  if (
    status === "ai_processing" ||
    status === "needs_review" ||
    status === "review" ||
    status === "pending"
  ) {
    return UNDER_VERIFICATION;
  }

  return null;
};
