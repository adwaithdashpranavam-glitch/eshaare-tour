import React, { useState } from "react";
import DocumentPreviewModal from "./DocumentPreviewModal";

/**
 * Drop-in replacement for `<a href={fileUrl} target="_blank">` — never
 * renders or stores a Storage URL. Opens the fullscreen DocumentPreviewModal,
 * which fetches a short-lived signed URL on demand via
 * generateSecureDocumentAccess.
 *
 * Renders its `children` as the trigger (so callers can keep their existing
 * button/link styling) — pass exactly one lookup shape via `access`.
 */
export const SecurePreviewButton = ({
  access, // { documentId } | { applicationId, storageKey } | { storageKey }
  title,
  fileName,
  mimeType,
  allowDownload = true,
  className,
  children,
  disabled = false,
  onTriggerClick, // optional side-effect fired alongside opening the modal (e.g. analytics)
}) => {
  const [open, setOpen] = useState(false);

  if (!access) return null;

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (onTriggerClick) onTriggerClick();
          setOpen(true);
        }}
        className={className}
      >
        {children}
      </button>
      <DocumentPreviewModal
        isOpen={open}
        onClose={() => setOpen(false)}
        access={access}
        title={title}
        fileName={fileName}
        mimeType={mimeType}
        allowDownload={allowDownload}
      />
    </>
  );
};

export default SecurePreviewButton;
