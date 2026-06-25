import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { FolderOpen, Plus, Download, Eye, Clock, CheckCircle, AlertTriangle, HelpCircle, Trash2 } from "lucide-react";
import StatusBadge from "../../components/ui/StatusBadge";
import PortalUploadModal from "../../components/ui/PortalUploadModal";
import Modal from "../../components/ui/Modal";
import { formatShortDate } from "../../utils/formatters";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { MANDATORY_DOCUMENTS, docMatchesCategory, getMissingMandatoryLabels } from "../../utils/mandatoryDocuments";
import { deleteClientDocument } from "../../lib/firestore";
import { getClientDocumentView } from "../../utils/documentStatusMessages";
import toast from "react-hot-toast";

export const PortalDocumentsPage = () => {
  const { userProfile } = useAuth();
  const location = useLocation();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  // The current document type to preselect in the upload modal when a checklist
  // card's Upload button is clicked.
  const [uploadDocType, setUploadDocType] = useState("");
  // Document pending deletion (drives the confirmation modal) + in-flight flag.
  const [docToDelete, setDocToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  // True when the client arrived here because a visa application was blocked for
  // missing mandatory documents (set via navigation state by the Apply-Now gate).
  const redirectedForDocs = !!location.state?.mandatoryDocsMissing;

  useEffect(() => {
    if (!userProfile?.email) return;

    const docsRef = collection(db, "documents");
    const q = query(docsRef, where("travellerEmail", "==", userProfile.email.toLowerCase()));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDocs(list);
      setLoading(false);
    }, (error) => {
      console.warn("Error fetching documents lists:", error);
      setDocs([]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile]);

  // Client-facing status/message comes from the central mapping in
  // utils/documentStatusMessages — verification internals are never surfaced here.

  // The four mandatory document categories come from the shared policy module so
  // the checklist, the Apply-Now gate, and the wizard guard never drift apart.
  const categories = MANDATORY_DOCUMENTS;

  const missingMandatory = getMissingMandatoryLabels(docs);

  const getCategoryStatus = (category) => {
    const matchedDocs = docs.filter((d) => docMatchesCategory(d, category));

    if (matchedDocs.length === 0) return "Pending";
    
    // Check if any is approved / verified
    const isApproved = matchedDocs.some(d => 
      (d.status || "").toLowerCase() === "approved" || 
      (d.status || "").toLowerCase() === "verified" || 
      (d.status || "").toLowerCase() === "completed"
    );
    if (isApproved) return "Verified";

    // Check if any is rejected
    const isRejected = matchedDocs.some(d => (d.status || "").toLowerCase() === "rejected");
    if (isRejected) return "Rejected";

    // Default to under review
    return "Review";
  };

  const openUpload = (docType = "") => {
    setUploadDocType(docType);
    setIsUploadOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!docToDelete) return;
    setDeleting(true);
    try {
      await deleteClientDocument(docToDelete.id, docToDelete.storageKey);
      // The documents onSnapshot listener removes the row and recomputes the
      // mandatory checklist automatically — no manual refresh needed.
      toast.success("Document deleted.");
      setDocToDelete(null);
    } catch (error) {
      console.error("Failed to delete document:", error);
      toast.error("Failed to delete document. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8 font-sans pb-16">

      {/* Mandatory documents warning banner (shown when redirected from an
          Apply-Now / wizard attempt, or whenever any mandatory doc is missing). */}
      {(redirectedForDocs || missingMandatory.length > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-[20px] p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800">
            <p className="font-bold">Please upload and verify all mandatory documents before applying for a visa.</p>
            {missingMandatory.length > 0 && (
              <p className="mt-1">
                Pending: <span className="font-semibold">{missingMandatory.join(", ")}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A]">Document Center</h1>
          <p className="text-xs text-[#6B7280]">Manage uploaded scans, passport bio pages, and embassy-compliant files.</p>
        </div>
        <button
          onClick={() => openUpload("")}
          className="px-4 py-2.5 bg-[#0F3D2E] text-white hover:bg-[#0F3D2E]/90 font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4 text-[#C6A969]" />
          <span>Upload File</span>
        </button>
      </div>

      {/* Document Checklist & Requirements Grid */}
      <div className="bg-white border border-[#E5E7EB] rounded-[24px] p-6 shadow-sm space-y-4">
        <div className="border-b border-[#E5E7EB] pb-3">
          <h3 className="text-sm font-semibold text-[#1A1A1A]">Document Verification Checklist</h3>
          <p className="text-[11px] text-[#6B7280] mt-0.5">Ensure all mandatory items are verified to avoid consular file delays.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-xs">
          {categories.map((cat) => {
            const status = getCategoryStatus(cat);
            return (
              <div key={cat.key} className="p-3.5 bg-[#F8F6F2] rounded-xl border border-[#E5E7EB] flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-[#1A1A1A]">{cat.label}</h4>
                  <span className="text-[9px] text-[#6B7280] uppercase tracking-wider font-bold">Mandatory</span>
                </div>

                {/* Status indicator */}
                <div>
                  {status === "Verified" && (
                    <span className="inline-flex items-center gap-1 text-green-600 font-bold bg-green-50 px-2 py-1 rounded-full text-[10px]">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Verified</span>
                    </span>
                  )}
                  {status === "Review" && (
                    <span className="inline-flex items-center gap-1 text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded-full text-[10px]">
                      <Clock className="w-3.5 h-3.5 animate-pulse" />
                      <span>Under Verification</span>
                    </span>
                  )}
                  {status === "Rejected" && (
                    <button
                      onClick={() => openUpload(cat.label)}
                      className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 font-bold bg-red-50 hover:bg-red-100 px-2 py-1 rounded-full text-[10px] transition-colors"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Re-upload Required</span>
                    </button>
                  )}
                  {status === "Pending" && (
                    <button
                      onClick={() => openUpload(cat.label)}
                      className="inline-flex items-center gap-1 text-amber-600 hover:text-amber-700 font-bold bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-full text-[10px] transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Upload</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Uploaded Files Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-[#1A1A1A] border-b border-[#E5E7EB] pb-2">Uploaded Document Archives</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {loading ? (
            <div className="col-span-2 py-12">
              <LoadingSpinner message="Retrieving documents..." />
            </div>
          ) : docs.length === 0 ? (
            <div className="col-span-2 text-center py-12 text-xs text-[#6B7280] italic bg-white border border-[#E5E7EB] rounded-[24px]">
              No documents found. Click Upload File above to start.
            </div>
          ) : (
            docs.map((doc) => (
              <div key={doc.id} className="bg-white border border-[#E5E7EB] rounded-[24px] p-6 flex flex-col justify-between space-y-4 hover:shadow-md transition-all duration-200 shadow-sm">
                <div className="flex items-center space-x-3.5">
                  <div className="p-3 rounded-xl bg-[#0F3D2E]/5 border border-[#0F3D2E]/10 text-[#0F3D2E]">
                    <FolderOpen className="h-5 w-5" />
                  </div>
                  <div className="truncate min-w-0 flex-1">
                    <h4 className="font-semibold text-[#1A1A1A] truncate text-sm">{doc.fileName || doc.name}</h4>
                    <span className="text-[10px] text-[#C6A969] font-bold uppercase tracking-wider">{doc.docType || doc.type}</span>
                  </div>
                </div>

                {/* Plain, business-friendly status + reason. Verification internals
                    (method, OCR, profile matching, reasons, errors) are never shown
                    to clients — those remain visible only in the admin workspace. */}
                {(() => {
                  const view = getClientDocumentView(doc);
                  if (!view) return null;
                  const toneCls = view.tone === "verified"
                    ? "bg-green-50 text-green-700 border border-green-100"
                    : view.tone === "reupload"
                      ? "bg-red-50 text-red-700 border border-red-100"
                      : "bg-blue-50 text-blue-700 border border-blue-100";
                  const Icon = view.tone === "verified"
                    ? CheckCircle
                    : view.tone === "reupload"
                      ? AlertTriangle
                      : Clock;
                  return (
                    <div className={`rounded-lg px-3 py-2.5 space-y-1.5 ${toneCls}`}>
                      <div className="flex items-center gap-1.5">
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-[11px] font-bold uppercase tracking-wider">{view.statusLabel}</span>
                      </div>
                      <p className="text-[11px] leading-relaxed">{view.message}</p>
                      {view.canReupload && (
                        <button
                          type="button"
                          onClick={() => openUpload(doc.docType || doc.type || "")}
                          className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0F3D2E] hover:bg-[#0c3325] text-white font-bold rounded-lg text-[10px] uppercase tracking-wider transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Upload New Document
                        </button>
                      )}
                    </div>
                  );
                })()}

                <div className="pt-4 border-t border-[#E5E7EB] flex justify-between items-center text-xs text-[#6B7280]">
                  <span className="font-mono">Uploaded: {formatShortDate(doc.date || doc.createdAt)}</span>
                  <div className="flex items-center space-x-2">
                    <StatusBadge status={doc.status} />
                    {doc.fileUrl && (
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-[#F8F6F2] hover:bg-[#0F3D2E]/5 text-[#0F3D2E] hover:text-[#C6A969] transition-all border border-[#E5E7EB]"
                        title="View File"
                      >
                        <Eye className="h-4 w-4" />
                      </a>
                    )}
                    {/* Clients can delete any of their own documents, including
                        verified ones. Deleting a verified mandatory document
                        re-opens the Apply-Now gate until it is re-verified. */}
                    <button
                      type="button"
                      onClick={() => setDocToDelete(doc)}
                      className="p-2 rounded-xl bg-[#F8F6F2] hover:bg-red-50 text-gray-400 hover:text-red-600 hover:border-red-200 transition-all border border-[#E5E7EB] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                      title="Delete document"
                      aria-label={`Delete ${doc.fileName || doc.name || "document"}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <PortalUploadModal
        isOpen={isUploadOpen}
        onClose={() => { setIsUploadOpen(false); setUploadDocType(""); }}
        initialDocType={uploadDocType}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!docToDelete}
        onClose={() => !deleting && setDocToDelete(null)}
        title="Delete Document"
        size="sm"
      >
        <div className="space-y-5 font-sans text-xs">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Are you sure you want to permanently delete
              {docToDelete ? ` "${docToDelete.fileName || docToDelete.name || docToDelete.docType || "this document"}"` : " this document"}?
              The file will be removed from storage and this action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-[#E5E7EB]">
            <button
              type="button"
              onClick={() => setDocToDelete(null)}
              disabled={deleting}
              className="px-5 py-2.5 border border-[#E5E7EB] text-[#1A1A1A] bg-white font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="px-5 py-2.5 bg-red-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? "Deleting..." : "Delete Document"}
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default PortalDocumentsPage;
