import React, { useState } from "react";
import { CheckCircle, Clock, AlertTriangle, Eye, Download, RefreshCw, FileText } from "lucide-react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../lib/firebase";
import { formatShortDate } from "../../utils/formatters";
import DocumentPreviewModal from "./DocumentPreviewModal";

const generateSecureDocumentAccess = httpsCallable(functions, "generateSecureDocumentAccess");

const STATUS_STYLES = {
  verified: { label: "Verified", icon: CheckCircle, cls: "bg-green-50 text-green-700 border-green-100" },
  review: { label: "Under Review", icon: Clock, cls: "bg-blue-50 text-blue-700 border-blue-100" },
  rejected: { label: "Rejected", icon: AlertTriangle, cls: "bg-red-50 text-red-700 border-red-100" },
  pending: { label: "Pending", icon: Clock, cls: "bg-amber-50 text-amber-700 border-amber-100" },
};

const fmtSize = (bytes) => {
  if (!bytes || Number.isNaN(Number(bytes))) return null;
  const n = Number(bytes);
  if (n > 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  if (n > 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${n} B`;
};

const fmtType = (fileName, mimeType) => {
  if (fileName && fileName.includes(".")) return fileName.split(".").pop().toUpperCase();
  if (mimeType) return mimeType.split("/").pop().toUpperCase();
  return null;
};

/**
 * Enterprise document card — replaces raw `<a href={fileUrl}>` links. Preview
 * and Download never touch a stored Storage URL; both go through
 * DocumentPreviewModal, which fetches a fresh short-lived signed URL from the
 * generateSecureDocumentAccess Cloud Function on demand.
 */
export const DocumentCard = ({
  name,
  statusKey = "pending", // "verified" | "review" | "rejected" | "pending"
  uploadedAt,
  fileName,
  mimeType,
  fileSizeBytes,
  access, // { documentId } | { applicationId, storageKey } | { storageKey }
  onReplace,
  allowDownload = true,
  headerAction, // optional extra icon-button rendered next to the file icon (e.g. delete)
  children, // optional extra content rendered between the meta row and the action bar
}) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const status = STATUS_STYLES[statusKey] || STATUS_STYLES.pending;
  const StatusIcon = status.icon;
  const fileType = fmtType(fileName, mimeType);
  const fileSize = fmtSize(fileSizeBytes);
  const hasAccess = !!access;

  const handleDownload = async () => {
    if (!access || downloading) return;
    setDownloading(true);
    try {
      const res = await generateSecureDocumentAccess({ ...access, intent: "download" });
      const a = document.createElement("a");
      a.href = res.data.url;
      a.download = fileName || name || "document";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("DocumentCard: download failed:", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[24px] p-6 flex flex-col justify-between space-y-4 hover:shadow-md transition-all duration-200 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="font-semibold text-[#1A1A1A] text-sm truncate">{name}</h4>
          <span className={`mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${status.cls}`}>
            <StatusIcon className="w-3 h-3" />
            {status.label}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="p-2.5 rounded-xl bg-[#0F3D2E]/5 border border-[#0F3D2E]/10 text-[#0F3D2E]">
            <FileText className="h-4 w-4" />
          </div>
          {headerAction}
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-[#6B7280] font-mono">
        <span>Uploaded {uploadedAt ? formatShortDate(uploadedAt) : "—"}</span>
        {(fileType || fileSize) && (
          <span className="uppercase font-bold tracking-wider text-[#C6A969]">
            {[fileType, fileSize].filter(Boolean).join(" · ")}
          </span>
        )}
      </div>

      {children}

      <div className="pt-3 border-t border-[#E5E7EB] flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          disabled={!hasAccess}
          className="flex-1 min-w-[92px] inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#0F3D2E] text-white hover:bg-[#0c3325] font-bold rounded-xl text-[10px] uppercase tracking-wider transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Eye className="h-3.5 w-3.5" /> Preview
        </button>
        {allowDownload && (
          <button
            type="button"
            onClick={handleDownload}
            disabled={!hasAccess || downloading}
            className="flex-1 min-w-[92px] inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#F8F6F2] border border-[#E5E7EB] text-[#0F3D2E] hover:bg-[#0F3D2E]/5 font-bold rounded-xl text-[10px] uppercase tracking-wider transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className={`h-3.5 w-3.5 ${downloading ? "animate-bounce" : ""}`} />
            {downloading ? "Preparing…" : "Download"}
          </button>
        )}
        {onReplace && (
          <button
            type="button"
            onClick={onReplace}
            className="flex-1 min-w-[92px] inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#F8F6F2] border border-[#E5E7EB] text-[#6B7280] hover:text-[#0F3D2E] hover:bg-[#0F3D2E]/5 font-bold rounded-xl text-[10px] uppercase tracking-wider transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Replace
          </button>
        )}
      </div>

      <DocumentPreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        access={access}
        title={name}
        fileName={fileName}
        mimeType={mimeType}
        allowDownload={allowDownload}
      />
    </div>
  );
};

export default DocumentCard;
