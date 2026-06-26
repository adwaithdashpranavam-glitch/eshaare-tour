import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db, auth, functions, httpsCallable } from "../../lib/firebase";
import { ShieldCheck, AlertTriangle, CheckCircle2, XCircle, FileText, Loader2, RefreshCw } from "lucide-react";
import { CLIENT_REJECTION_MESSAGES } from "../../utils/documentStatusMessages";
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
  matched: { label: "Profile matched", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  partial: { label: "Partial match", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  mismatch: { label: "Mismatch", cls: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
  needs_review: { label: "Needs review", cls: "bg-sky-500/10 text-sky-400 border-sky-500/20" },
};

const SEVERITY_CLS = {
  high: "bg-rose-500/15 text-rose-300 border border-rose-500/30",
  medium: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
  low: "bg-gray-500/15 text-gray-300 border border-gray-500/30",
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
            const badge = MATCH_BADGE[pm.status] || MATCH_BADGE.needs_review;
            const fields = d.aiCheck?.extractedFields || {};
            return (
              <div key={d.id} className="bg-white/5 border border-on-primary-fixed-variant/70 rounded-xl p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-4 w-4 text-secondary shrink-0" />
                    <div className="truncate">
                      <p className="text-xs font-semibold text-white truncate">{d.docType || d.type}</p>
                      <p className="text-[10px] text-on-primary-container/40 truncate font-mono">{d.fileName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {d.requiresManualReview && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                        <AlertTriangle className="h-3 w-3" /> Flagged
                      </span>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>
                </div>

                {/* AI document result */}
                {d.aiCheck?.reason && (
                  <p className="text-[11px] text-on-primary-container/60 leading-relaxed">
                    <span className="font-bold text-on-primary-container/80">AI:</span> {d.aiCheck.reason}
                  </p>
                )}

                {/* Mismatch detail table */}
                {Array.isArray(pm.mismatches) && pm.mismatches.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-on-primary-container/40">Mismatches</p>
                    {pm.mismatches.map((m) => (
                      <div key={m.field} className="bg-rose-500/5 border border-rose-500/20 rounded-lg p-2.5 text-[11px] space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-white">{prettyField(m.field)}</span>
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${SEVERITY_CLS[m.severity] || SEVERITY_CLS.low}`}>
                            {m.severity}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
                          <div>
                            <span className="text-on-primary-container/40">Profile: </span>
                            <span className="text-emerald-300">{m.profileValue || "—"}</span>
                          </div>
                          <div>
                            <span className="text-on-primary-container/40">Document: </span>
                            <span className="text-rose-300">{m.documentValue || "—"}</span>
                          </div>
                        </div>
                        <p className="text-on-primary-container/50">{m.reason}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Matched / missing summaries */}
                <div className="flex flex-wrap gap-1.5 text-[10px]">
                  {(pm.matchedFields || []).map((f) => (
                    <span key={f} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      <CheckCircle2 className="h-3 w-3" /> {prettyField(f)}
                    </span>
                  ))}
                  {(pm.missingFields || []).map((f) => (
                    <span key={f} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-500/10 text-gray-300 border border-gray-500/20">
                      {prettyField(f)}: not found
                    </span>
                  ))}
                </div>

                {/* Extracted fields (raw) */}
                {Object.keys(fields).length > 0 && (
                  <details className="text-[10px] text-on-primary-container/50">
                    <summary className="cursor-pointer hover:text-on-primary-container/80">Extracted fields</summary>
                    <div className="mt-1 grid grid-cols-2 gap-1 font-mono">
                      {Object.entries(fields).map(([k, v]) => (
                        <div key={k}><span className="text-on-primary-container/40">{prettyField(k)}: </span>{String(v)}</div>
                      ))}
                    </div>
                  </details>
                )}

                {/* Stuck-processing indicator */}
                {d.status === "ai_processing" && (
                  <p className="text-[11px] text-sky-300 flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> AI processing — if this persists, re-run below.
                  </p>
                )}

                {/* Manual consultant override + reprocess */}
                <div className="flex gap-2 pt-2 border-t border-on-primary-fixed-variant/50">
                  <button
                    type="button"
                    disabled={savingId === d.id}
                    onClick={() => verifyDoc(d.id)}
                    className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase rounded-lg text-[10px] tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Verify
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
                      Rejection reason (shown to client) <span className="text-rose-400">*</span>
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
