import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db, auth, functions, httpsCallable } from "../../lib/firebase";
import { ShieldCheck, AlertTriangle, CheckCircle2, XCircle, FileText, Loader2, RefreshCw } from "lucide-react";
import { CLIENT_REJECTION_MESSAGES } from "../../utils/documentStatusMessages";
import SecurePreviewButton from "../ui/SecurePreviewButton";
import toast from "react-hot-toast";

// Selectable client-safe rejection reasons for the manual reject flow. The label
// is admin-facing; the stored reasonCode maps to the friendly client message.
const REJECTION_REASON_OPTIONS = [
  { code: "expired_passport", label: "Passport expired" },
  { code: "expired_emirates_id", label: "Emirates ID expired" },
  { code: "expired_residence_visa", label: "Residence visa expired" },
  { code: "passport_expiring_soon", label: "Passport expiring soon (<6 months)" },
  { code: "blurry_document", label: "Document blurry / unclear" },
  { code: "unreadable_document", label: "Document unreadable / low quality" },
  { code: "wrong_document_type", label: "Wrong document type" },
  { code: "incomplete_document", label: "Document incomplete" },
  { code: "manual_review_required", label: "Other — needs valid copy" },
];

// Admin/consultant review of a client's AI-verified identity documents.
// Surfaces the structured profile-match flagging written by the aiVerifyDocument
// Cloud Function (aiCheck + profileMatch). This is a FLAGGING aid only — it never
// blocks anything; consultants retain full manual Verify / Reject override.
//
// Reuses the dark admin card pattern used elsewhere in the case workspace.

const IDENTITY_CATEGORIES = ["passport", "uae_residence_visa", "emirates_id"];

// Match an identity document even before aiCheck has run (stuck/unprocessed docs),
// by looking at its docType/type text.
const IDENTITY_KEYWORDS = ["passport", "emirates", "residence visa", "uae residence", "residence permit"];
const isIdentityDoc = (d) => {
  if (IDENTITY_CATEGORIES.includes(d.aiCheck?.category)) return true;
  const hay = `${d.docType || ""} ${d.type || ""}`.toLowerCase();
  return IDENTITY_KEYWORDS.some((k) => hay.includes(k));
};

const MATCH_BADGE = {
  matched: { label: "Profile matched", cls: "bg-emerald-50 text-emerald-700 border-emerald-300" },
  partial: { label: "Partial match", cls: "bg-amber-50 text-amber-800 border-amber-300" },
  mismatch: { label: "Mismatch", cls: "bg-rose-50 text-rose-700 border-rose-300" },
  needs_review: { label: "Needs review", cls: "bg-blue-50 text-blue-700 border-blue-300" },
};

const SEVERITY_CLS = {
  high: "bg-rose-50 text-rose-700 border border-rose-300",
  medium: "bg-amber-50 text-amber-800 border border-amber-300",
  low: "bg-slate-100 text-slate-700 border border-slate-300",
};

const prettyField = (f) =>
  ({
    fullName: "Full name", dateOfBirth: "Date of birth", nationality: "Nationality",
    passportNumber: "Passport number", passportExpiryDate: "Passport expiry",
    emiratesIdNumber: "Emirates ID number", residenceVisaNumber: "Residence visa number",
    residenceVisaExpiryDate: "Residence visa expiry", gender: "Gender",
  }[f] || f);

export default function ClientDocumentReview({ travellerEmail }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [reprocessingId, setReprocessingId] = useState(null);
  // Inline manual-reject state: which document is being rejected, the chosen
  // client-safe reason code, and an optional internal-only note.
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectCode, setRejectCode] = useState("");
  const [rejectNote, setRejectNote] = useState("");

  useEffect(() => {
    if (!travellerEmail) {
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, "documents"),
      where("travellerEmail", "==", travellerEmail.toLowerCase())
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter(isIdentityDoc);
        setDocs(list);
        setLoading(false);
      },
      (err) => {
        console.warn("ClientDocumentReview listener error:", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [travellerEmail]);

  const reviewerName = () =>
    auth.currentUser?.displayName || auth.currentUser?.email || auth.currentUser?.uid || "staff";

  // Manual verify override — keeps the human in control of the final call.
  const verifyDoc = async (docId) => {
    setSavingId(docId);
    try {
      await updateDoc(doc(db, "documents", docId), {
        status: "verified",
        verificationStatus: "Verified",
        requiresManualReview: false,
        verifiedBy: reviewerName(),
        verifiedAt: serverTimestamp(),
      });
      toast.success("Document verified");
    } catch (err) {
      console.error("Verify failed:", err);
      toast.error("Could not update document status");
    } finally {
      setSavingId(null);
    }
  };

  // Manual reject — requires a client-safe reason. Stores the reasonCode and the
  // resolved client message (so the client always sees a clear reason), plus any
  // internal-only note kept separately in adminNotes.
  const submitReject = async (docId) => {
    if (!rejectCode) {
      toast.error("Please select a rejection reason");
      return;
    }
    setSavingId(docId);
    try {
      await updateDoc(doc(db, "documents", docId), {
        status: "rejected",
        verificationStatus: "Rejected",
        rejectionReasonCode: rejectCode,
        clientRejectionMessage: CLIENT_REJECTION_MESSAGES[rejectCode] || "",
        adminNotes: rejectNote || "",
        verifiedBy: reviewerName(),
        verifiedAt: serverTimestamp(),
      });
      toast.success("Document rejected");
      setRejectingId(null);
      setRejectCode("");
      setRejectNote("");
    } catch (err) {
      console.error("Reject failed:", err);
      toast.error("Could not update document status");
    } finally {
      setSavingId(null);
    }
  };

  const openReject = (docId) => {
    setRejectingId(docId);
    setRejectCode("");
    setRejectNote("");
  };

  // Re-run AI verification (calls the reprocessDocument callable). Used for
  // documents stuck in ai_processing or that failed verification.
  const reprocess = async (docId) => {
    setReprocessingId(docId);
    try {
      const call = httpsCallable(functions, "reprocessDocument");
      const res = await call({ docId });
      if (res?.data?.success) {
        toast.success(`Re-ran AI verification → ${res.data.status || "done"}`);
      } else {
        toast(`Marked for manual review${res?.data?.status ? ` (${res.data.status})` : ""}`);
      }
    } catch (err) {
      console.error("reprocess failed:", err);
      toast.error("Could not re-run AI verification");
    } finally {
      setReprocessingId(null);
    }
  };

  return (
    <div className="glass-card p-6 border border-on-primary-fixed-variant/60 space-y-4">
      <h3 className="text-base font-semibold text-white border-b border-on-primary-fixed-variant pb-2 flex items-center gap-2">
        <ShieldCheck className="h-4.5 w-4.5 text-secondary" />
        Identity Document Review (AI)
      </h3>

      {loading ? (
        <div className="py-8 flex items-center justify-center text-on-primary-container/50 gap-2 text-xs">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading documents…
        </div>
      ) : docs.length === 0 ? (
        <div className="text-center py-6 text-xs text-on-primary-container/40 italic">
          No AI-verified identity documents uploaded yet.
        </div>
      ) : (
        <div className="space-y-4">
          {docs.map((d) => {
            const pm = d.profileMatch || {};
            // Source of truth for the human decision is the SAME field the client
            // portal reads: `status` / `verificationStatus` on the document.
            // profileMatch.status is only the AI match hint and must NOT drive the
            // badge once a consultant has verified/rejected the document.
            const decision =
              d.status === "verified" || d.verificationStatus === "Verified"
                ? "verified"
                : d.status === "rejected" || d.verificationStatus === "Rejected"
                ? "rejected"
                : null;
            const badge =
              decision === "verified"
                ? { label: "Verified", cls: "bg-emerald-50 text-emerald-700 border-emerald-300" }
                : decision === "rejected"
                ? { label: "Rejected", cls: "bg-rose-50 text-rose-700 border-rose-300" }
                : (MATCH_BADGE[pm.status] || MATCH_BADGE.needs_review);
            const fields = d.aiCheck?.extractedFields || {};
            return (
              <div key={d.id} className={`bg-white border rounded-xl p-5 space-y-4 shadow-sm ${
                decision === "rejected" ? "border-rose-200" : decision === "verified" ? "border-emerald-200" : "border-gray-200"
              }`}>
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="h-4 w-4 text-secondary shrink-0" />
                    <div className="truncate">
                      <p className="text-sm font-semibold text-slate-800 truncate">{d.docType || d.type}</p>
                      <p className="text-xs text-slate-500 truncate font-mono mt-0.5">{d.fileName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Flagged only matters while still pending a decision */}
                    {!decision && d.requiresManualReview && (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-300 px-2.5 py-1 rounded-full">
                        <AlertTriangle className="h-3.5 w-3.5" /> Flagged
                      </span>
                    )}
                    <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full border ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>
                </div>

                {/* Reviewed banner — makes decided docs clearly non-pending */}
                {decision === "verified" && (
                  <div className="flex items-center gap-2 text-[13px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>Verified{d.verifiedBy ? ` by ${d.verifiedBy}` : ""}. Consultant review complete.</span>
                  </div>
                )}
                {decision === "rejected" && (
                  <div className="flex items-start gap-2 text-[13px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                    <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      Rejected{d.verifiedBy ? ` by ${d.verifiedBy}` : ""}.
                      {(d.clientRejectionMessage || d.adminNotes) ? ` Client sees: “${d.clientRejectionMessage || d.adminNotes}”` : ""}
                    </span>
                  </div>
                )}

                {/* AI document result */}
                {d.aiCheck?.reason && (
                  <p className="text-[13px] text-slate-600 leading-relaxed">
                    <span className="font-semibold text-slate-800">AI:</span> {d.aiCheck.reason}
                  </p>
                )}

                {/* Mismatch detail table */}
                {Array.isArray(pm.mismatches) && pm.mismatches.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] uppercase tracking-wider font-bold text-slate-500">Mismatches</p>
                    {pm.mismatches.map((m) => (
                      <div key={m.field} className="bg-rose-50/60 border border-rose-200 rounded-lg p-3 text-[13px] space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-800">{prettyField(m.field)}</span>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${SEVERITY_CLS[m.severity] || SEVERITY_CLS.low}`}>
                            {m.severity}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                          <div>
                            <span className="text-slate-500">Profile: </span>
                            <span className="text-emerald-700">{m.profileValue || "—"}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Document: </span>
                            <span className="text-rose-700">{m.documentValue || "—"}</span>
                          </div>
                        </div>
                        <p className="text-slate-600">{m.reason}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Matched / missing summaries */}
                <div className="flex flex-wrap gap-2 text-sm">
                  {(pm.matchedFields || []).map((f) => (
                    <span key={f} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-300 font-medium">
                      <CheckCircle2 className="h-4 w-4" /> {prettyField(f)}
                    </span>
                  ))}
                  {(pm.missingFields || []).map((f) => (
                    <span key={f} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-700 border border-slate-300 font-medium">
                      {prettyField(f)}: <span className="text-slate-500">not found</span>
                    </span>
                  ))}
                </div>

                {/* Extracted fields (raw) */}
                {Object.keys(fields).length > 0 && (
                  <details className="text-xs text-slate-600">
                    <summary className="cursor-pointer font-medium text-slate-600 hover:text-slate-800">Extracted fields</summary>
                    <div className="mt-2 grid grid-cols-2 gap-1.5 font-mono">
                      {Object.entries(fields).map(([k, v]) => (
                        <div key={k}><span className="text-slate-500">{prettyField(k)}: </span>{String(v)}</div>
                      ))}
                    </div>
                  </details>
                )}

                {/* Stuck-processing indicator */}
                {d.status === "ai_processing" && (
                  <p className="text-[11px] text-sky-700 flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> AI processing — if this persists, re-run below.
                  </p>
                )}

                {/* View uploaded file — always available before deciding */}
                <div className="flex pt-2">
                  {d.fileUrl ? (
                    <SecurePreviewButton
                      access={{ documentId: d.id }}
                      title={d.docType || d.type}
                      fileName={d.fileName}
                      mimeType={d.mimeType}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-slate-700 hover:bg-slate-50 font-bold uppercase rounded-lg text-[10px] tracking-wider transition-colors"
                    >
                      <FileText className="h-3.5 w-3.5" /> View document
                    </SecurePreviewButton>
                  ) : (
                    <span
                      title="No uploaded file URL on this document"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-gray-200 text-slate-400 font-bold uppercase rounded-lg text-[10px] tracking-wider cursor-not-allowed"
                    >
                      <FileText className="h-3.5 w-3.5" /> File unavailable
                    </span>
                  )}
                </div>

                {/* Manual consultant override + reprocess */}
                <div className="flex gap-2 pt-2 border-t border-on-primary-fixed-variant/50">
                  <button
                    type="button"
                    disabled={savingId === d.id}
                    onClick={() => verifyDoc(d.id)}
                    className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase rounded-lg text-[10px] tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> {decision === "verified" ? "Re-verify" : "Verify"}
                  </button>
                  <button
                    type="button"
                    disabled={savingId === d.id}
                    onClick={() => (rejectingId === d.id ? setRejectingId(null) : openReject(d.id))}
                    className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold uppercase rounded-lg text-[10px] tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Reject
                  </button>
                  <button
                    type="button"
                    disabled={reprocessingId === d.id}
                    onClick={() => reprocess(d.id)}
                    title="Re-run AI verification"
                    className="px-3 py-1.5 border border-on-primary-fixed-variant/70 hover:border-secondary text-on-primary-container font-bold uppercase rounded-lg text-[10px] tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${reprocessingId === d.id ? "animate-spin" : ""}`} /> Re-run AI
                  </button>
                </div>

                {/* Inline reject reason picker — a client-safe reason is required. */}
                {rejectingId === d.id && (
                  <div className="mt-2 p-3 bg-rose-500/5 border border-rose-500/20 rounded-lg space-y-2">
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-on-primary-container/60">
                      Rejection reason (shown to client) <span className="text-rose-600">*</span>
                    </label>
                    <select
                      value={rejectCode}
                      onChange={(e) => setRejectCode(e.target.value)}
                      className="w-full bg-primary-container border border-on-primary-fixed-variant text-on-primary-container text-[11px] rounded-lg px-2.5 py-2 focus:outline-none focus:border-secondary"
                    >
                      <option value="">Select a reason…</option>
                      {REJECTION_REASON_OPTIONS.map((o) => (
                        <option key={o.code} value={o.code}>{o.label}</option>
                      ))}
                    </select>
                    {rejectCode && (
                      <p className="text-[10px] text-on-primary-container/50 italic">
                        Client will see: “{CLIENT_REJECTION_MESSAGES[rejectCode]}”
                      </p>
                    )}
                    <textarea
                      value={rejectNote}
                      onChange={(e) => setRejectNote(e.target.value)}
                      rows={2}
                      placeholder="Internal note (optional, not shown to client)"
                      className="w-full bg-primary-container border border-on-primary-fixed-variant text-on-primary-container text-[11px] rounded-lg px-2.5 py-2 focus:outline-none focus:border-secondary placeholder:text-on-primary-container/30"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setRejectingId(null)}
                        className="px-3 py-1.5 border border-on-primary-fixed-variant/70 text-on-primary-container font-bold uppercase rounded-lg text-[10px] tracking-wider"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={savingId === d.id || !rejectCode}
                        onClick={() => submitReject(d.id)}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold uppercase rounded-lg text-[10px] tracking-wider flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Confirm Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
