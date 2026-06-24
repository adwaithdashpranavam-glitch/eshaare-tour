import React, { useState, useEffect } from "react";
import { doc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../contexts/AuthContext";
import {
  FileText,
  Upload,
  RefreshCw,
  Eye,
  Download,
  CheckCircle2,
  Clock,
  User,
  Calendar,
  AlertCircle,
} from "lucide-react";
import FileUpload from "../ui/FileUpload";
import Modal from "../ui/Modal";
import {
  mergeDeliverables,
  isDeliverableReady,
  formatDeliverableDate,
  DELIVERABLE_READY_STATUS,
  areRequiredDeliverablesReady,
  pipelineStageLabel,
} from "../../utils/caseWorkspace";
import { setApplicationPipelineStatus } from "../../lib/firestore";
import toast from "react-hot-toast";

// Consultant Deliverables panel for the admin Case Workspace.
//
// Operates ONLY on consultant-completed documents stored in
// applications/{applicationId}.documents[]. This is distinct from the client
// "source document" verification flow (passport/statements) which lives in the
// `documents` collection — do not mix the two.
//
// Files upload to Firebase Storage at:
//   applications/{applicationId}/documents/{documentKey}/{timestamp}_{filename}
// On success the matching documents[] element is updated with status,
// fileUrl, fileName, storagePath, uploadedBy, uploadedByName, uploadedAt.
export default function ConsultantDeliverables({ applicationId, caseId }) {
  const { user, userProfile } = useAuth();

  const [appData, setAppData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeUploadDoc, setActiveUploadDoc] = useState(null);
  const [saving, setSaving] = useState(false);

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
        console.error("Error loading application for deliverables:", error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [applicationId]);

  const items = mergeDeliverables(appData?.documents);
  const readyCount = items.filter(isDeliverableReady).length;

  const handleUploadSuccess = async (fileInfo) => {
    if (!activeUploadDoc || !applicationId) return;
    setSaving(true);
    try {
      const nowIso = new Date().toISOString();
      // Start from the merged list so every canonical deliverable persists even
      // if the stored array was previously incomplete.
      const current = mergeDeliverables(appData?.documents);
      const updatedDocs = current.map((d) =>
        d.key === activeUploadDoc.key
          ? {
              ...d,
              status: DELIVERABLE_READY_STATUS,
              fileUrl: fileInfo.url,
              fileName: fileInfo.name,
              storagePath: fileInfo.path,
              uploadedBy: user?.uid || null,
              uploadedByName: userProfile?.name || user?.displayName || user?.email || null,
              uploadedAt: nowIso,
              updatedAt: nowIso,
            }
          : d
      );

      const appRef = doc(db, "applications", applicationId);
      await updateDoc(appRef, {
        documents: updatedDocs,
        updatedAt: serverTimestamp(),
      });

      // Auto-advance to "Appointment Confirmed" once every deliverable is ready,
      // but only from an earlier stage (never override a case already submitted/
      // approved/closed). This persists the status + mirrors visa_cases.stage so
      // the list and workspace stay in sync. Best-effort; non-fatal.
      const stored = appData?.pipelineStatus || null;
      const advanceable = !["appointment_confirmed", "decision_pending", "approved", "closed"].includes(stored);
      if (areRequiredDeliverablesReady({ documents: updatedDocs }) && advanceable) {
        try {
          await setApplicationPipelineStatus(applicationId, "appointment_confirmed", {
            caseId,
            stageLabel: pipelineStageLabel("appointment_confirmed"),
          });
        } catch (statusErr) {
          console.warn("Auto status advance skipped:", statusErr?.message);
        }
      }

      toast.success(`${activeUploadDoc.name} is now ready for the client.`);
      setActiveUploadDoc(null);
    } catch (err) {
      console.error("Failed to save deliverable:", err);
      if (err.code === "permission-denied") {
        toast.error("You don't have permission to upload consultant deliverables.");
      } else {
        toast.error("Failed to save the uploaded document.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (!applicationId) {
    return (
      <div className="glass-card p-6 border border-on-primary-fixed-variant/60 space-y-3">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <FileText className="h-4 w-4 text-secondary" /> Consultant Deliverables
        </h3>
        <div className="flex items-start gap-3 p-4 rounded-xl bg-warning/10 border border-warning/20 text-warning text-xs">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            This case is not linked to a portal application, so consultant
            deliverables cannot be managed here. Deliverables are only available
            for cases created from a client portal (Schengen) application.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="glass-card p-8 border border-on-primary-fixed-variant/60 flex items-center justify-center gap-2 text-secondary text-xs font-mono">
        <RefreshCw className="h-4 w-4 animate-spin" /> Loading consultant deliverables...
      </div>
    );
  }

  if (!appData) {
    return (
      <div className="glass-card p-6 border border-on-primary-fixed-variant/60 space-y-3">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <FileText className="h-4 w-4 text-secondary" /> Consultant Deliverables
        </h3>
        <p className="text-xs text-on-primary-container/50 italic">
          Linked application ({applicationId}) could not be found.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 border border-on-primary-fixed-variant/60 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-on-primary-fixed-variant pb-3">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <FileText className="h-4 w-4 text-secondary" /> Consultant Deliverables
        </h3>
        <span className="text-[10px] font-mono font-bold text-secondary bg-primary-container px-3 py-1 rounded-full border border-on-primary-fixed-variant">
          {readyCount} of {items.length} Ready
        </span>
      </div>

      <p className="text-[11px] text-on-primary-container/50 leading-relaxed">
        Upload completed application documents here. Files become downloadable in
        the client portal immediately after upload.
      </p>

      {/* Deliverable cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item) => {
          const ready = isDeliverableReady(item);
          const uploadedAtLabel = formatDeliverableDate(item.uploadedAt);
          return (
            <div
              key={item.key}
              className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 transition-colors ${
                ready
                  ? "border-success/30 bg-success/5"
                  : "border-on-primary-fixed-variant/60 bg-primary-container/30"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-bold text-white">{item.name}</h4>
                  {ready ? (
                    <span className="px-2 py-0.5 rounded-badge bg-success/10 text-success border border-success/20 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="h-3 w-3" /> Ready for Client
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-badge bg-warning/10 text-warning border border-warning/20 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 shrink-0">
                      <Clock className="h-3 w-3" /> Pending Specialist
                    </span>
                  )}
                </div>

                {ready && (
                  <div className="space-y-1 text-[10px] text-on-primary-container/60 font-sans">
                    {item.fileName && (
                      <div className="flex items-center gap-1.5 truncate" title={item.fileName}>
                        <FileText className="h-3 w-3 text-secondary shrink-0" />
                        <span className="truncate">{item.fileName}</span>
                      </div>
                    )}
                    {item.uploadedByName && (
                      <div className="flex items-center gap-1.5 truncate">
                        <User className="h-3 w-3 text-on-primary-container/40 shrink-0" />
                        <span className="truncate">{item.uploadedByName}</span>
                      </div>
                    )}
                    {uploadedAtLabel && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 text-on-primary-container/40 shrink-0" />
                        <span>{uploadedAtLabel}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-on-primary-fixed-variant/40">
                {item.fileUrl && (
                  <>
                    <a
                      href={item.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-primary-container border border-on-primary-fixed-variant hover:border-secondary text-on-primary-container hover:text-secondary font-bold uppercase rounded-button text-[10px] flex items-center gap-1"
                    >
                      <Eye className="h-3 w-3" /> Open
                    </a>
                    <a
                      href={item.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="px-2.5 py-1 bg-primary-container border border-on-primary-fixed-variant hover:border-secondary text-on-primary-container hover:text-secondary font-bold uppercase rounded-button text-[10px] flex items-center gap-1"
                    >
                      <Download className="h-3 w-3" /> Download
                    </a>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setActiveUploadDoc(item)}
                  className="px-2.5 py-1 bg-secondary-container text-on-primary-fixed font-bold uppercase rounded-button text-[10px] flex items-center gap-1"
                >
                  {item.fileUrl ? (
                    <>
                      <RefreshCw className="h-3 w-3" /> Replace
                    </>
                  ) : (
                    <>
                      <Upload className="h-3 w-3" /> Upload
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Upload / Replace Modal */}
      <Modal
        isOpen={activeUploadDoc !== null}
        onClose={() => !saving && setActiveUploadDoc(null)}
        title={
          activeUploadDoc?.fileUrl
            ? `Replace ${activeUploadDoc?.name}`
            : `Upload ${activeUploadDoc?.name}`
        }
        size="md"
      >
        {activeUploadDoc && (
          <div className="space-y-4">
            <p className="text-xs text-on-primary-container/60 leading-relaxed font-sans">
              Upload the completed <strong>{activeUploadDoc.name}</strong> (PDF or
              image). Once uploaded it is immediately downloadable by the client in
              their application portal.
            </p>
            <FileUpload
              collectionName="applications"
              documentId={applicationId}
              docType="documents"
              customPath={`applications/${applicationId}/documents/${activeUploadDoc.key}/{timestamp}_{filename}`}
              maxSizeMB={15}
              onUploadSuccess={handleUploadSuccess}
            />
            {saving && (
              <p className="text-[10px] text-secondary font-mono flex items-center gap-1.5">
                <RefreshCw className="h-3 w-3 animate-spin" /> Saving document record...
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
