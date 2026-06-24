import React, { useState, useEffect, useRef } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { Check, RefreshCw, AlertCircle, Send } from "lucide-react";
import {
  PIPELINE_STATUSES,
  DEFAULT_PIPELINE_STATUS,
  getPipelineStatusIndex,
  deriveApplicationPipelineStatus,
  isApplicationSubmitted,
  pipelineStageLabel,
} from "../../utils/caseWorkspace";
import { setApplicationPipelineStatus } from "../../lib/firestore";
import toast from "react-hot-toast";

// Compact horizontal stepper for the case status.
//
// Stores the selected status in applications/{applicationId}.pipelineStatus and
// mirrors the label into visa_cases/{caseId}.stage so the Visa Cases list and the
// Case Workspace always agree. "Decision Pending" is reached via the dedicated
// "Mark Visa Submitted" action or by entering a submission date (both set
// visaSubmittedAt); Approved / Closed remain manual.
export default function CaseStatusControl({ applicationId, caseId }) {
  const [appData, setAppData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submissionDate, setSubmissionDate] = useState("");
  const backfilledRef = useRef(false);

  useEffect(() => {
    if (!applicationId) {
      setLoading(false);
      return;
    }
    const appRef = doc(db, "applications", applicationId);
    const unsubscribe = onSnapshot(
      appRef,
      (snap) => {
        setAppData(snap.exists() ? snap.data() : null);
        setLoading(false);
      },
      (error) => {
        console.error("Error loading application for case status:", error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [applicationId]);

  // Prefer the explicitly stored status; otherwise fall back to the automatically
  // derived status so the stepper highlights the correct stage even before any
  // manual override has been saved.
  const currentStatus =
    appData?.pipelineStatus ||
    deriveApplicationPipelineStatus(appData) ||
    DEFAULT_PIPELINE_STATUS;
  const currentIndex = getPipelineStatusIndex(currentStatus);
  const alreadySubmitted = !!appData?.visaSubmittedAt || currentStatus === "decision_pending";

  // One-time backfill: when staff opens a submitted case that has no stored
  // pipelineStatus yet, persist the derived status and mirror it into
  // visa_cases.stage so the Visa Cases list and the Case Workspace converge.
  useEffect(() => {
    if (backfilledRef.current || saving) return;
    if (!applicationId || !appData) return;
    if (appData.pipelineStatus) return;
    if (!isApplicationSubmitted(appData)) return;
    const derived = deriveApplicationPipelineStatus(appData);
    if (!derived) return;
    backfilledRef.current = true;
    setApplicationPipelineStatus(applicationId, derived, {
      caseId,
      stageLabel: pipelineStageLabel(derived),
    }).catch((e) => console.warn("Status backfill skipped:", e?.message));
  }, [applicationId, appData, caseId, saving]);

  const persist = async (statusKey, extra = {}) => {
    if (!applicationId || saving) return;
    setSaving(true);
    try {
      await setApplicationPipelineStatus(applicationId, statusKey, {
        caseId,
        stageLabel: pipelineStageLabel(statusKey),
        extra,
      });
      toast.success("Case status updated.");
    } catch (err) {
      console.error("Failed to update case status:", err);
      if (err.code === "permission-denied") {
        toast.error("You don't have permission to change the case status.");
      } else {
        toast.error("Failed to update case status.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSelect = (statusKey) => {
    if (statusKey === appData?.pipelineStatus) return;
    persist(statusKey);
  };

  const handleMarkSubmitted = () => {
    persist("decision_pending", { visaSubmittedAt: new Date().toISOString() });
  };

  const handleSubmissionDate = (value) => {
    setSubmissionDate(value);
    if (!value) return;
    // Entering a submission date moves the case to Decision Pending.
    persist("decision_pending", { visaSubmittedAt: new Date(value).toISOString() });
  };

  return (
    <div className="glass-card p-4 border border-on-primary-fixed-variant/60 space-y-4">
      <div className="flex items-center justify-between border-b border-on-primary-fixed-variant pb-2">
        <h3 className="text-xs font-semibold text-on-primary-container/50 uppercase tracking-wider">
          Case Status
        </h3>
        {saving && <RefreshCw className="h-3.5 w-3.5 animate-spin text-secondary" />}
      </div>

      {!applicationId ? (
        <div className="flex items-start gap-2 text-[11px] text-on-primary-container/50">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-warning" />
          <span>Case status is available only for portal-linked applications.</span>
        </div>
      ) : loading ? (
        <div className="text-[11px] text-on-primary-container/40 font-mono flex items-center gap-1.5">
          <RefreshCw className="h-3 w-3 animate-spin" /> Loading status...
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {PIPELINE_STATUSES.map((status, idx) => {
              const isActive = status.key === currentStatus;
              const isPast = currentIndex > -1 && idx < currentIndex;
              return (
                <button
                  key={status.key}
                  type="button"
                  onClick={() => handleSelect(status.key)}
                  disabled={saving}
                  className={`px-3 py-1.5 rounded-button text-[10px] font-bold uppercase tracking-wider border transition-colors flex items-center gap-1.5 disabled:opacity-60 ${
                    isActive
                      ? "bg-secondary-container border-secondary text-on-primary-fixed"
                      : isPast
                      ? "bg-primary-container border-success/40 text-success"
                      : "bg-primary-container border-on-primary-fixed-variant text-on-primary-container/60 hover:text-white"
                  }`}
                >
                  {(isActive || isPast) && <Check className="h-3 w-3" />}
                  {status.label}
                </button>
              );
            })}
          </div>

          {/* Visa submission — the trigger for Decision Pending */}
          <div className="pt-3 border-t border-on-primary-fixed-variant/40 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <button
                type="button"
                onClick={handleMarkSubmitted}
                disabled={saving || alreadySubmitted}
                className="px-3 py-2 rounded-button text-[10px] font-bold uppercase tracking-wider bg-secondary-container text-on-primary-fixed flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-3 w-3" />
                {alreadySubmitted ? "Visa Submitted" : "Mark Visa Submitted"}
              </button>
              <label className="flex items-center gap-2 text-[10px] text-on-primary-container/50 uppercase">
                <span className="whitespace-nowrap">Submission Date</span>
                <input
                  type="date"
                  value={submissionDate}
                  disabled={saving}
                  onChange={(e) => handleSubmissionDate(e.target.value)}
                  className="bg-primary-container border border-on-primary-fixed-variant text-on-primary-container p-1.5 rounded text-xs focus:outline-none focus:border-secondary"
                />
              </label>
            </div>
            <p className="text-[10px] text-on-primary-container/40 leading-relaxed">
              Marking the visa submitted (or entering a submission date) moves the case to
              <span className="text-secondary font-semibold"> Decision Pending</span>. Approved and
              Closed are set manually.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
