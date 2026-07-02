import React, { useCallback, useEffect, useRef, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../lib/firebase";
import {
  X, ZoomIn, ZoomOut, RotateCw, Download, AlertTriangle, RefreshCw, FileText,
} from "lucide-react";

const generateSecureDocumentAccess = httpsCallable(functions, "generateSecureDocumentAccess");

const isImageFile = (fileName, mimeType) => {
  if (mimeType && mimeType.startsWith("image/")) return true;
  return /\.(png|jpe?g|gif|webp|bmp|heic)$/i.test(fileName || "");
};
const isPdfFile = (fileName, mimeType) => {
  if (mimeType === "application/pdf") return true;
  return /\.pdf$/i.test(fileName || "");
};

/**
 * Enterprise document preview modal. Fetches a short-lived signed URL from
 * `generateSecureDocumentAccess` (never a permanent Storage URL), then
 * immediately downloads that URL as a Blob and renders a local
 * `URL.createObjectURL(blob)` object URL instead — the external Storage URL
 * itself is never assigned to an <img>/<iframe> `src`, never rendered in the
 * DOM, and is discarded as soon as the fetch completes. This also avoids this
 * site's `frame-src 'none'; object-src 'none';` CSP (see firebase.json)
 * rejecting a cross-origin iframe: the object URL's origin is this page's own
 * origin, so the browser treats it as a same-origin embed.
 *
 * Pass exactly one lookup shape via `access`:
 *   { documentId }
 *   { applicationId, storageKey }
 *   { storageKey }
 */
export const DocumentPreviewModal = ({
  isOpen,
  onClose,
  access,
  title,
  fileName,
  mimeType,
  allowDownload = true,
}) => {
  const [status, setStatus] = useState("idle"); // idle | loading | ready | error
  const [previewUrl, setPreviewUrl] = useState(null); // always a local blob: object URL, never the signed Storage URL
  const [errorMessage, setErrorMessage] = useState("");
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const requestIdRef = useRef(0);
  const objectUrlRef = useRef(null);

  const isImage = isImageFile(fileName, mimeType);
  const isPdf = isPdfFile(fileName, mimeType);

  const revokeObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const fetchAccess = useCallback(async (intent) => {
    if (!access) throw new Error("Missing document reference.");
    const res = await generateSecureDocumentAccess({ ...access, intent });
    return res.data;
  }, [access]);

  // Fetches the short-lived signed URL, downloads its bytes, and converts them
  // into a local object URL. The signed URL itself lives only inside this
  // function's local scope — it is never stored in component state and never
  // reaches the rendered DOM.
  const fetchAsObjectUrl = useCallback(async (intent) => {
    const { url } = await fetchAccess(intent);
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to retrieve the document (HTTP ${res.status}).`);
    }
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  }, [fetchAccess]);

  const load = useCallback(async () => {
    const myRequestId = ++requestIdRef.current;
    setStatus("loading");
    setErrorMessage("");
    try {
      const objectUrl = await fetchAsObjectUrl("preview");
      if (requestIdRef.current !== myRequestId) {
        // Stale response (modal was closed/reopened mid-fetch) — discard
        // immediately rather than leaking this blob URL.
        URL.revokeObjectURL(objectUrl);
        return;
      }
      revokeObjectUrl(); // release any previous object URL before adopting the new one
      objectUrlRef.current = objectUrl;
      setPreviewUrl(objectUrl);
      setStatus("ready");
    } catch (err) {
      if (requestIdRef.current !== myRequestId) return;
      console.error("DocumentPreviewModal: failed to load preview:", err);
      setErrorMessage(err.message || "Unable to load this document.");
      setStatus("error");
    }
  }, [fetchAsObjectUrl, revokeObjectUrl]);

  useEffect(() => {
    if (!isOpen) {
      // Modal closed — release the current preview's object URL immediately
      // rather than waiting for the next open or component unmount.
      revokeObjectUrl();
      setPreviewUrl(null);
      return;
    }
    setZoom(1);
    setRotation(0);
    setPreviewUrl(null);
    load();
  }, [isOpen, load, revokeObjectUrl]);

  // Unmount safety net, in case the modal is torn down while still open
  // (e.g. its parent unmounts) without isOpen ever transitioning to false.
  useEffect(() => () => revokeObjectUrl(), [revokeObjectUrl]);

  useEffect(() => {
    const handleEscape = (e) => { if (e.key === "Escape") onClose(); };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // A fresh signed URL is fetched for the download itself (the preview URL
      // may be near expiry by the time the user clicks Download) and logged as
      // a DOCUMENT_DOWNLOAD audit action distinct from the preview. As with
      // preview, the signed URL is fetched to a Blob and only the resulting
      // local object URL is ever assigned to a DOM element.
      const objectUrl = await fetchAsObjectUrl("download");
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = fileName || "document";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      a.remove();
      // Revoke shortly after triggering the save, rather than synchronously,
      // so the browser has time to start reading the blob for the download.
      setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
    } catch (err) {
      console.error("DocumentPreviewModal: download failed:", err);
      setErrorMessage(err.message || "Unable to download this document.");
      setStatus("error");
    } finally {
      setDownloading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-900/70 backdrop-blur-md font-sans animate-[scaleIn_0.15s_ease-out]">
      {/* Click backdrop to close (toolbar/content stop propagation) */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Toolbar */}
      <div className="relative z-10 flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5 bg-[#0F3D2E] text-white shadow-lg">
        <div className="min-w-0 flex items-center gap-2.5">
          <FileText className="h-4.5 w-4.5 text-[#C6A969] shrink-0" />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold truncate">{title || fileName || "Document"}</h3>
            {fileName && title && fileName !== title && (
              <p className="text-[10px] text-white/60 truncate">{fileName}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isImage && status === "ready" && (
            <>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                title="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                title="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                title="Rotate"
              >
                <RotateCw className="h-4 w-4" />
              </button>
              <div className="w-px h-5 bg-white/20 mx-1" />
            </>
          )}
          {allowDownload && (
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading || status !== "ready"}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#C6A969] text-[#0F3D2E] hover:bg-[#d4ba82] font-bold text-[11px] uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className={`h-3.5 w-3.5 ${downloading ? "animate-bounce" : ""}`} />
              {downloading ? "Preparing…" : "Download"}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            title="Close"
            aria-label="Close preview"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        className="relative z-10 flex-1 overflow-auto flex items-center justify-center p-4 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {status === "loading" && (
          <div className="w-full max-w-2xl space-y-4 animate-pulse">
            <div className="h-[60vh] bg-white/10 rounded-2xl" />
            <div className="flex items-center justify-center gap-2 text-white/70 text-xs">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              Verifying access and preparing a secure preview…
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="max-w-sm text-center space-y-4 bg-white rounded-2xl p-8 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1A1A1A]">Couldn't load this document</p>
              <p className="text-xs text-[#6B7280] mt-1">{errorMessage}</p>
            </div>
            <button
              type="button"
              onClick={load}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0F3D2E] text-white font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-[#0c3325] transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </button>
          </div>
        )}

        {status === "ready" && previewUrl && isImage && (
          <img
            src={previewUrl}
            alt={fileName || "Document preview"}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-transform duration-200 select-none"
            style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
            draggable={false}
          />
        )}

        {status === "ready" && previewUrl && isPdf && (
          // Native browser PDF viewer inside the iframe already provides page
          // navigation, its own zoom, and text search — reimplementing a custom
          // PDF renderer is intentionally out of scope for this pass.
          <iframe
            src={previewUrl}
            title={fileName || "Document preview"}
            className="w-full h-full bg-white rounded-lg shadow-2xl"
          />
        )}

        {status === "ready" && previewUrl && !isImage && !isPdf && (
          <div className="max-w-sm text-center space-y-4 bg-white rounded-2xl p-8 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-[#0F3D2E]/5 flex items-center justify-center mx-auto">
              <FileText className="h-6 w-6 text-[#0F3D2E]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1A1A1A]">No inline preview available</p>
              <p className="text-xs text-[#6B7280] mt-1">This file type can't be previewed here — use Download instead.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentPreviewModal;
