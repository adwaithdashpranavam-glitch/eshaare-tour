// ===========================================================================
// MANDATORY DOCUMENT POLICY (shared)
// ---------------------------------------------------------------------------
// A client cannot start ANY visa application (any visa type, not only Schengen)
// until every mandatory document below has been uploaded AND verified. This
// module is the single source of truth for:
//   - the list of mandatory documents (key + display label + match keywords)
//   - matching an uploaded `documents/{id}` record to a mandatory category
//   - which document statuses count as accepted (verified/approved/completed)
//   - computing which mandatory documents are still unsatisfied
//   - the warning copy shown on the Documents page / toasts
//
// It is consumed by the public Apply-Now handlers, the wizard route guard, the
// Documents page checklist, and the firestore one-shot precheck helper so the
// rule is enforced consistently everywhere.
// ===========================================================================

// A mandatory document only satisfies the Apply-Now gate once it reaches one of
// these statuses. Anything else (missing / pending / in_review / ai_processing /
// needs_review / rejected) does NOT count.
export const ACCEPTED_DOC_STATUSES = ["verified", "approved", "completed"];

const normStatus = (doc) =>
  String(doc?.status || doc?.verificationStatus || "").toLowerCase().trim();

// True when a single document record is in an accepted (verified) state.
export const isDocAccepted = (doc) => ACCEPTED_DOC_STATUSES.includes(normStatus(doc));

// Canonical document-type keys are kept stable for data consistency. `match`
// keywords are matched (case-insensitive substring) against an uploaded
// document's type / name / key fields so both legacy and new labels resolve to
// the same category (e.g. "Photo" and "Photographs" → photographs).
// Bank Statements are intentionally NOT mandatory — they remain uploadable as an
// optional supporting document only. The four entries below are the complete
// mandatory set.
export const MANDATORY_DOCUMENTS = [
  { key: "passport", label: "Passport", match: ["passport"] },
  { key: "photographs", label: "Photographs", match: ["photograph", "photo"] },
  {
    key: "uae_residence_visa",
    label: "UAE Residence Visa",
    match: ["uae residence", "residence visa", "residence permit"],
  },
  { key: "emirates_id", label: "Emirates ID", match: ["emirates"] },
];

export const MANDATORY_DOCS_WARNING =
  "Please upload and verify all mandatory documents before applying for a visa.";

// Build a normalized, lowercased haystack from any of the fields a document
// record might carry its type information in.
const docHaystack = (doc) =>
  [doc?.docType, doc?.type, doc?.key, doc?.fileName, doc?.name]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

// True if the uploaded `doc` belongs to the given mandatory category.
export const docMatchesCategory = (doc, category) => {
  const haystack = docHaystack(doc);
  return category.match.some((kw) => haystack.includes(kw));
};

// Per-category status used by both the gate and the Document Center checklist:
//   "verified"            → an accepted (verified/approved/completed) doc exists → complete
//   "rejected"            → a matching doc exists but is rejected → "Re-upload Required"
//   "under_verification"  → a matching doc exists but isn't accepted yet → "Under Verification"
//   "missing"             → no matching doc at all → "Upload"
// A category is "complete" only when status === "verified".
export const getCategoryState = (docs = [], category) => {
  const matched = docs.filter((doc) => docMatchesCategory(doc, category));
  if (matched.length === 0) return "missing";
  if (matched.some((d) => isDocAccepted(d))) return "verified";
  if (matched.some((d) => normStatus(d) === "rejected")) return "rejected";
  return "under_verification";
};

// Full checklist: [{ ...category, state, complete }] for all mandatory docs.
export const getMandatoryChecklist = (docs = []) =>
  MANDATORY_DOCUMENTS.map((category) => {
    const state = getCategoryState(docs, category);
    return { ...category, state, complete: state === "verified" };
  });

// Returns the mandatory-category definitions that are NOT yet satisfied (i.e. not
// verified/approved/completed). An empty array means the client is cleared to
// apply. This is the authoritative Apply-Now gate.
export const getMissingMandatoryDocuments = (docs = []) =>
  MANDATORY_DOCUMENTS.filter(
    (category) => !docs.some((doc) => docMatchesCategory(doc, category) && isDocAccepted(doc))
  );

// Convenience: just the human-readable labels of the unsatisfied documents.
export const getMissingMandatoryLabels = (docs = []) =>
  getMissingMandatoryDocuments(docs).map((c) => c.label);

// Builds the full warning message including the unsatisfied-document list.
export const buildMandatoryDocsMessage = (docs = []) => {
  const missing = getMissingMandatoryLabels(docs);
  if (missing.length === 0) return MANDATORY_DOCS_WARNING;
  return `${MANDATORY_DOCS_WARNING} Pending: ${missing.join(", ")}.`;
};

export const hasAllMandatoryDocuments = (docs = []) =>
  getMissingMandatoryDocuments(docs).length === 0;
