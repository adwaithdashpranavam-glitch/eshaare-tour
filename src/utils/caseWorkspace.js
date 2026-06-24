// Centralized configuration for the admin Case Workspace.
//
// This isolates two pieces of "case state" logic so they can later be driven
// automatically (e.g. derived from appointments / decisions) without touching
// the UI components:
//   1. PIPELINE_STATUSES — the manual case-status stepper shown to consultants.
//   2. CONSULTANT_DELIVERABLES — the canonical set of consultant-completed
//      documents stored on applications/{applicationId}.documents[].
//
// Keep these in sync with:
//   - SchengenWizard DEFAULT_CLIENT_SPECIFIC_DOCUMENTS (client read view)
//   - createApplicationDraft seed in src/lib/firestore.js
//   - validateApplicationSchema allowedFields in firestore.rules (pipelineStatus)

// ---------------------------------------------------------------------------
// Case status (manual for now; later automated)
// ---------------------------------------------------------------------------
export const PIPELINE_STATUSES = [
  { key: "appointment_awaiting", label: "Appointment Awaiting" },
  { key: "appointment_confirmed", label: "Appointment Confirmed" },
  { key: "decision_pending", label: "Decision Pending" },
  { key: "approved", label: "Approved" },
  { key: "closed", label: "Closed" },
];

export const DEFAULT_PIPELINE_STATUS = "appointment_awaiting";

export const getPipelineStatusIndex = (key) =>
  PIPELINE_STATUSES.findIndex((s) => s.key === key);

export const getPipelineStatusLabel = (key) =>
  PIPELINE_STATUSES.find((s) => s.key === key)?.label || "Not Set";

// ---------------------------------------------------------------------------
// Consultant deliverables
// ---------------------------------------------------------------------------
// NOTE: NOC is intentionally excluded here. The NOC is a single universal
// template managed globally on the Admin "Documents & Templates" page
// (systemDocuments/universal_noc_template) and read directly by the client
// confirmation view — it is not a per-application upload.
export const CONSULTANT_DELIVERABLES = [
  { key: "visa_application_form", name: "Visa Application Form" },
  { key: "appointment_letter", name: "Appointment Letter" },
  { key: "hotel_reservation", name: "Hotel Reservation" },
  { key: "flight_reservation", name: "Flight Reservation" },
  { key: "travel_insurance", name: "Travel Insurance" },
  { key: "cover_letter", name: "Cover Letter" },
  { key: "detailed_itinerary", name: "Detailed Itinerary" },
];

export const DELIVERABLE_READY_STATUS = "ready_to_download";
export const DELIVERABLE_PENDING_STATUS = "pending_consultant_upload";

// A deliverable is downloadable by the client only when it is both flagged ready
// AND has a real file URL. This is the single source of truth for "is ready",
// shared by the admin panel and the client confirmation view.
export const isDeliverableReady = (docItem) =>
  !!(docItem && docItem.fileUrl && docItem.status === DELIVERABLE_READY_STATUS);

// Merge whatever is stored on the application with the canonical list so the
// admin panel always renders every expected deliverable, even for older
// applications whose documents[] predates a given key.
export const mergeDeliverables = (storedDocs) => {
  const stored = Array.isArray(storedDocs) ? storedDocs : [];
  return CONSULTANT_DELIVERABLES.map((canonical) => {
    const match = stored.find(
      (d) => d.key === canonical.key || d.name === canonical.name
    );
    return {
      key: canonical.key,
      name: canonical.name,
      scope: "client_specific",
      status: match?.status || DELIVERABLE_PENDING_STATUS,
      fileUrl: match?.fileUrl || null,
      fileName: match?.fileName || null,
      storagePath: match?.storagePath || null,
      uploadedBy: match?.uploadedBy || null,
      uploadedByName: match?.uploadedByName || null,
      uploadedAt: match?.uploadedAt || null,
      updatedAt: match?.updatedAt || null,
    };
  });
};

// Count how many of the canonical consultant deliverables are ready on an application.
export const countReadyDeliverables = (application) => {
  const docs = Array.isArray(application?.documents) ? application.documents : [];
  return CONSULTANT_DELIVERABLES.filter((c) =>
    docs.some((d) => (d.key === c.key || d.name === c.name) && isDeliverableReady(d))
  ).length;
};

export const TOTAL_DELIVERABLES = CONSULTANT_DELIVERABLES.length;

// Every required consultant deliverable is uploaded and ready for the client.
export const areRequiredDeliverablesReady = (application) =>
  countReadyDeliverables(application) === TOTAL_DELIVERABLES;

// ---------------------------------------------------------------------------
// Automatic case-status derivation
// ---------------------------------------------------------------------------
// Returns the EFFECTIVE pipeline status for an application, combining the
// stored manual status with the automatic business logic. This is the single
// source of truth used by the admin workspace, the client timeline and the
// client dashboard so they never disagree.
//
// Priority:
//   1. Stored "approved" / "closed" are manual terminal states — always kept.
//   2. visaSubmittedAt set (consultant marked the visa submitted, or a submission
//      date was entered)                          -> decision_pending
//   3. all consultant deliverables ready          -> appointment_confirmed
//   4. paid / submitted                           -> appointment_awaiting
//   5. otherwise (draft/incomplete)               -> null
//   A manually-set stored status that is FURTHER ALONG than the auto value is
//   respected (so staff can push a case ahead early), except it never moves
//   backwards past the auto value.
//
//   NOTE: a CLIENT downloading a deliverable does NOT advance status. It only
//   records applications.clientDeliverablesDownloadedAt (an access marker), which
//   is intentionally not consulted here.
export const isApplicationSubmitted = (application) =>
  !!application &&
  (application.status === "Submitted" ||
    application.paymentStatus === "paid" ||
    application.paymentStatus === "confirmed");

export const deriveApplicationPipelineStatus = (application) => {
  if (!application) return null;
  const stored = application.pipelineStatus || null;

  if (stored === "approved" || stored === "closed") return stored;

  let auto = null;
  if (application.visaSubmittedAt) {
    auto = "decision_pending";
  } else if (areRequiredDeliverablesReady(application)) {
    auto = "appointment_confirmed";
  } else if (isApplicationSubmitted(application)) {
    auto = "appointment_awaiting";
  }

  if (stored) {
    const si = getPipelineStatusIndex(stored);
    const ai = getPipelineStatusIndex(auto);
    if (si > ai) return stored;
  }
  return auto || stored || null;
};

// Maps a pipeline status key to the human label mirrored into visa_cases.stage,
// so the Visa Cases list and the Case Workspace always show the same status.
export const pipelineStageLabel = (statusKey) => getPipelineStatusLabel(statusKey);

export const getEffectiveStatusLabel = (application) => {
  const key = deriveApplicationPipelineStatus(application);
  return key ? getPipelineStatusLabel(key) : "In Progress";
};

// ---------------------------------------------------------------------------
// Client-facing application tracker (5 steps, no "Profile Verification")
// ---------------------------------------------------------------------------
export const buildClientTimeline = (application) => {
  const eff = deriveApplicationPipelineStatus(application);
  // Treat a submitted-but-unstatused application as "appointment_awaiting" for
  // display; an unsubmitted draft falls back to index -1 (only step 1 active).
  const idx = eff
    ? getPipelineStatusIndex(eff)
    : isApplicationSubmitted(application)
    ? 0
    : -1;

  // idx mapping: 0 awaiting, 1 confirmed, 2 decision_pending, 3 approved, 4 closed
  const stepState = (completedFrom, inProgressAt) => {
    if (idx >= completedFrom) return "completed";
    if (inProgressAt != null && idx === inProgressAt) return "in_progress";
    return "pending";
  };

  const steps = [
    {
      step: 1,
      title: "Application Received",
      status: "completed",
      desc: "Application forms and profile securely logged.",
      est: "Completed",
    },
    {
      step: 2,
      title: "Document Preparation",
      // completed once appointment_confirmed (idx 1); in progress while awaiting (idx 0)
      status: stepState(1, 0),
      desc: "Your visa documents are being prepared by your consultant.",
      est: "Within 3-5 Days",
    },
    {
      step: 3,
      title: "Appointment Booked",
      status: stepState(1, null),
      desc: "Your appointment details and supporting files are ready.",
      est: "Subject to Slot Release",
    },
    {
      step: 4,
      title: "Visa Submission",
      // completed at approved+ (idx 3); in progress at decision_pending (idx 2)
      status: stepState(3, 2),
      desc: "Your file is moving through submission and embassy review.",
      est: "Requires Attendance",
    },
    {
      step: 5,
      title: "Decision Received",
      status: stepState(3, null),
      desc: "Final decision and passport return updates will appear here.",
      est: "Est: 15 Calendar Days",
    },
  ];

  const completedCount = steps.filter((s) => s.status === "completed").length;
  return {
    steps,
    completedCount,
    statusKey: eff,
    statusLabel: eff ? getPipelineStatusLabel(eff) : "Appointment Awaiting",
  };
};

// ---------------------------------------------------------------------------
// Client dashboard "Active File Status" (7 vertical stages)
// ---------------------------------------------------------------------------
export const DASHBOARD_STAGE_DEFS = [
  { key: "profile_completed", label: "Profile Completed", helper: "Your traveller profile is complete." },
  { key: "documents_uploaded", label: "Documents Uploaded", helper: "Required client documents have been received." },
  { key: "payment_completed", label: "Payment Completed", helper: "Payment is confirmed and application submitted." },
  { key: "appointment_waiting", label: "Appointment Waiting", helper: "Your consultant is preparing your appointment documents." },
  { key: "appointment_confirmed", label: "Appointment Confirmed", helper: "Appointment documents are ready for download." },
  { key: "decision_pending", label: "Decision Pending", helper: "Your file is under embassy/consulate review." },
  { key: "passport_collection", label: "Passport Collection", helper: "Final decision/passport return will be updated here." },
];

export const buildDashboardStages = (application) => {
  const eff = deriveApplicationPipelineStatus(application);
  const idx = getPipelineStatusIndex(eff); // -1 if null
  const submitted = isApplicationSubmitted(application);

  const phase = (key) => {
    switch (key) {
      case "profile_completed":
        return submitted ? "completed" : "current";
      case "documents_uploaded":
        return submitted ? "completed" : "pending";
      case "payment_completed":
        return submitted ? "completed" : "pending";
      case "appointment_waiting":
        if (idx >= 1) return "completed";
        if (idx === 0 || (submitted && idx < 0)) return "current";
        return "pending";
      case "appointment_confirmed":
        if (idx >= 2) return "completed";
        if (idx === 1) return "current";
        return "pending";
      case "decision_pending":
        if (idx >= 3) return "completed";
        if (idx === 2) return "current";
        return "pending";
      case "passport_collection":
        if (eff === "closed") return "completed";
        if (eff === "approved") return "current";
        return "pending";
      default:
        return "pending";
    }
  };

  const stages = DASHBOARD_STAGE_DEFS.map((d) => ({ ...d, state: phase(d.key) }));
  return {
    stages,
    statusKey: eff,
    statusLabel: eff ? getPipelineStatusLabel(eff) : submitted ? "Appointment Awaiting" : "In Progress",
  };
};

// Format an ISO string or Firestore Timestamp-ish value for display.
export const formatDeliverableDate = (value) => {
  if (!value) return null;
  try {
    const d = value.seconds ? new Date(value.seconds * 1000) : new Date(value);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return null;
  }
};
