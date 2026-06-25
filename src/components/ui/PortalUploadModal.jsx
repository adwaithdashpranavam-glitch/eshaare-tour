import React, { useState, useEffect, useRef } from "react";
import { doc, getDoc, collection, query, where, onSnapshot, addDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../lib/firebase";
import { useAuth } from "../../contexts/AuthContext";
import { UploadCloud, CheckCircle, AlertCircle, FileText, X, RefreshCw, Check } from "lucide-react";
import { MANDATORY_DOCUMENTS, docMatchesCategory } from "../../utils/mandatoryDocuments";
import toast from "react-hot-toast";

// The four mandatory categories are listed first so clients can always upload
// them; labels match the mandatory-document policy (see utils/mandatoryDocuments)
// so the checklist resolves uploads correctly. Bank Statements and the rest are
// optional supporting documents.
const DOCUMENT_TYPES = [
  "Passport",
  "Photographs",
  "UAE Residence Visa",
  "Emirates ID",
  "Bank Statements",
  "Salary Certificate",
  "Employment Letter",
  "NOC",
  "Travel Insurance",
  "Other"
];

export const PortalUploadModal = ({
  isOpen,
  onClose,
  initialDocType = "",
  initialCaseId = "",
  onUploadSuccess
}) => {
  const { user, userProfile } = useAuth();
  
  // Form states
  const [docType, setDocType] = useState(initialDocType || "Passport");
  const [selectedCaseId, setSelectedCaseId] = useState(initialCaseId || "");
  const [cases, setCases] = useState([]);
  const [loadingCases, setLoadingCases] = useState(true);

  // File drop states
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef(null);

  // Upload progress states
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState(false);

  // Lock body scroll and close on Escape while open (parity with the shared Modal,
  // which this component no longer uses so it can render a light high-contrast shell).
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  // Reset states when closed/opened
  useEffect(() => {
    if (isOpen) {
      setDocType(initialDocType || "Passport");
      setSelectedCaseId(initialCaseId || "");
      setFile(null);
      setErrorMsg("");
      setProgress(0);
      setUploading(false);
      setUploadSuccess(false);
      setUploadError(false);
    }
  }, [isOpen, initialDocType, initialCaseId]);

  // Load client's active visa cases
  useEffect(() => {
    if (!userProfile?.email || !isOpen) return;

    setLoadingCases(true);
    const casesRef = collection(db, "visa_cases");
    const q = query(casesRef, where("travellerEmail", "==", userProfile.email.toLowerCase()));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCases(list);
      setLoadingCases(false);
      
      // Auto select first application if not preselected
      if (!initialCaseId && list.length > 0) {
        setSelectedCaseId(list[0].id);
      }
    }, (error) => {
      console.error("Error loading client cases:", error);
      setLoadingCases(false);
    });

    return unsubscribe;
  }, [userProfile, isOpen, initialCaseId]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    setErrorMsg("");
    setUploadError(false);

    // 1. Validate file type
    const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(selectedFile.type)) {
      setErrorMsg("Please upload a PDF, JPG, or PNG file");
      return;
    }

    // 2. Validate file size (max 10MB)
    const maxSizeMB = 10;
    const sizeInMB = selectedFile.size / (1024 * 1024);
    if (sizeInMB > maxSizeMB) {
      setErrorMsg("File size must be under 10MB");
      return;
    }

    setFile(selectedFile);
  };

  const handleUploadSubmit = () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setUploadError(false);

    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
    const docTypeClean = docType.replace(/[^a-zA-Z0-9]/g, "_");
    const travellerId = userProfile?.uid || user?.uid || "traveller";
    
    // Format Storage path: travellers/{travellerId}/{docType}/{timestamp}_{sanitized_filename}
    const storagePath = `travellers/${travellerId}/${docTypeClean}/${timestamp}_${sanitizedFileName}`;
    const storageRef = ref(storage, storagePath);

    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const percent = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        setProgress(percent);
      },
      (error) => {
        console.error("Storage upload error:", error);
        setUploading(false);
        setUploadError(true);
        toast.error("Upload failed. Please try again.");
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);

          // Mandatory documents (Passport, Photographs, UAE Residence Visa,
          // Emirates ID) are run through AI verification by the aiVerifyDocument
          // Cloud Function. They start in "ai_processing" so the UI can show a
          // processing state until the function writes back a verified / rejected
          // / needs_review result. Non-mandatory documents (e.g. Bank Statements)
          // keep the existing manual "Pending" review flow.
          const isMandatory = MANDATORY_DOCUMENTS.some((cat) =>
            docMatchesCategory({ docType, type: docType, fileName: file.name }, cat)
          );
          const initialStatus = isMandatory ? "ai_processing" : "Pending";

          // Create document in Firestore documents collection
          const docsRef = collection(db, "documents");
          await addDoc(docsRef, {
            travellerId: travellerId,
            travellerEmail: userProfile?.email || user?.email || "",
            visaCaseId: selectedCaseId || "general",
            docType: docType,
            type: docType, // For legacy checklist matcher mapping compatibility
            fileName: file.name,
            mimeType: file.type,
            storageKey: storagePath,
            fileSizeBytes: file.size,
            fileUrl: downloadUrl,
            verificationStatus: isMandatory ? "Under Verification" : "Pending",
            status: initialStatus,
            uploadedBy: user.uid,
            createdAt: new Date()
          });

          // If linked to a case checklist item, update status in case document checklist field
          if (selectedCaseId) {
            const caseRef = doc(db, "visa_cases", selectedCaseId);
            const caseSnap = await getDoc(caseRef);
            if (caseSnap.exists()) {
              const caseData = caseSnap.data();
              const currentChecklist = caseData.checklist || [];
              const exists = currentChecklist.some(item => item.name?.toLowerCase() === docType.toLowerCase());
              
              let updatedChecklist;
              if (exists) {
                updatedChecklist = currentChecklist.map(item => {
                  if (item.name?.toLowerCase() === docType.toLowerCase()) {
                    return { ...item, status: "Uploaded", fileUrl: downloadUrl, rejectionReason: "" };
                  }
                  return item;
                });
              } else {
                updatedChecklist = [
                  ...currentChecklist,
                  { name: docType, status: "Uploaded", fileUrl: downloadUrl, rejectionReason: "" }
                ];
              }
              await updateDoc(caseRef, { checklist: updatedChecklist });
            }
          }

          setUploading(false);
          setUploadSuccess(true);
          
          if (onUploadSuccess) {
            onUploadSuccess({
              url: downloadUrl,
              name: file.name,
              docType: docType,
              caseId: selectedCaseId
            });
          }

          // Close modal after 2.5 seconds success screen
          setTimeout(() => {
            onClose();
          }, 2500);

        } catch (err) {
          console.error("Error finalizing document upload:", err);
          setUploading(false);
          setUploadError(true);
        }
      }
    );
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const isImageFile = (fileType) => {
    return fileType?.startsWith("image/");
  };

  if (!isOpen) return null;

  const modalTitle = initialDocType ? `Upload ${initialDocType}` : "Upload Travel Document";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm transition-opacity duration-300 font-sans">
      {/* Click backdrop to close */}
      <div className="absolute inset-0 cursor-default" onClick={onClose} aria-hidden="true"></div>

      {/* Modal Card — light, high-contrast surface (max-width ~680px on desktop) */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-modal-title"
        className="w-full max-w-[680px] relative z-10 bg-white shadow-2xl flex flex-col
          rounded-t-3xl rounded-b-none sm:rounded-3xl max-h-[92vh] sm:max-h-[90vh]
          animate-[slideUp_0.2s_ease-out] sm:animate-[scaleIn_0.15s_ease-out]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-gray-200">
          <h3 id="upload-modal-title" className="text-xl sm:text-2xl font-semibold text-[#1A1A1A] tracking-tight">
            {modalTitle}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close upload dialog"
            className="p-2 -mr-2 rounded-lg text-gray-500 hover:text-[#1A1A1A] hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F3D2E]/40"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 sm:py-7">

          {/* Success Screen */}
          {uploadSuccess && (
            <div className="flex flex-col items-center justify-center text-center py-10 space-y-4" role="status" aria-live="polite">
              <div className="h-16 w-16 bg-green-100 border border-green-300 rounded-full flex items-center justify-center text-green-700 animate-bounce">
                <Check className="h-8 w-8 stroke-[3]" />
              </div>
              <h4 className="text-lg font-semibold text-[#1A1A1A]">Document Uploaded!</h4>
              <p className="text-sm text-gray-600 leading-relaxed max-w-xs">
                Your consultant will review it shortly.
              </p>
            </div>
          )}

          {/* Form & Upload Area */}
          {!uploadSuccess && (
            <div className="space-y-6">

              {/* Document Type Selector */}
              <div className="flex flex-col space-y-2">
                <label htmlFor="upload-doc-type" className="text-sm font-semibold text-[#1A1A1A]">
                  Document Type
                </label>
                <select
                  id="upload-doc-type"
                  className="w-full px-4 py-3 text-[15px] text-[#1A1A1A] bg-white border border-gray-300 rounded-xl shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F3D2E]/30 focus:border-[#0F3D2E] disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  disabled={initialDocType !== "" || uploading}
                >
                  {DOCUMENT_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Linked Application Selector */}
              <div className="flex flex-col space-y-2">
                <label htmlFor="upload-linked-app" className="text-sm font-semibold text-[#1A1A1A]">
                  Linked Application
                </label>
                {loadingCases ? (
                  <div className="flex items-center text-sm text-gray-600 px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl">
                    <RefreshCw className="h-4 w-4 animate-spin mr-2 text-gray-500" />
                    <span>Loading applications...</span>
                  </div>
                ) : (
                  <select
                    id="upload-linked-app"
                    className="w-full px-4 py-3 text-[15px] text-[#1A1A1A] bg-white border border-gray-300 rounded-xl shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F3D2E]/30 focus:border-[#0F3D2E] disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                    value={selectedCaseId}
                    onChange={(e) => setSelectedCaseId(e.target.value)}
                    disabled={initialCaseId !== "" || uploading}
                  >
                    <option value="">General Upload (Unlinked)</option>
                    {cases.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.visaType} to {c.destination} ({c.caseNo || "Active"})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Drag & Drop Zone */}
              {!uploading && (
                <div className="space-y-2">
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label="Upload a document file. Drag and drop, or press Enter to browse."
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={triggerFileInput}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        triggerFileInput();
                      }
                    }}
                    className={`w-full py-12 px-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F3D2E]/40 ${
                      dragActive
                        ? "border-[#0F3D2E] bg-[#0F3D2E]/5 shadow-sm"
                        : "border-gray-300 bg-gray-50 hover:border-[#0F3D2E] hover:bg-[#0F3D2E]/[0.03]"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileInput}
                      accept=".pdf,.jpg,.jpeg,.png"
                    />

                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="h-14 w-14 rounded-full bg-[#0F3D2E]/10 border border-[#0F3D2E]/20 flex items-center justify-center text-[#0F3D2E]">
                        <UploadCloud className="h-7 w-7" />
                      </div>
                      <p className="text-[15px] font-semibold text-[#1A1A1A]">
                        Drag &amp; drop your file, or{" "}
                        <span className="text-[#0F3D2E] underline underline-offset-2">click to browse</span>
                      </p>
                    </div>
                  </div>
                  {/* Format & size information below the upload zone */}
                  <p className="text-xs text-gray-500 text-center">
                    Supported formats: PDF, JPG, JPEG, PNG · Maximum size: 10&nbsp;MB
                  </p>
                </div>
              )}

              {/* Error Message */}
              {errorMsg && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2.5 text-sm" role="alert">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <span className="font-medium">{errorMsg}</span>
                </div>
              )}

              {/* File Selected / Upload Progress Details */}
              {file && !uploadSuccess && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center space-x-3 truncate">
                    {isImageFile(file.type) ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt="Selected file preview"
                        className="h-11 w-11 object-cover rounded-lg border border-gray-300 shrink-0"
                      />
                    ) : (
                      <div className="h-11 w-11 bg-red-50 text-red-600 rounded-lg border border-red-200 flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5" />
                      </div>
                    )}
                    <div className="truncate">
                      <p className="font-semibold text-[#1A1A1A] truncate max-w-[200px] text-sm">{file.name}</p>
                      <p className="text-xs text-gray-500 font-mono">{formatFileSize(file.size)}</p>
                    </div>
                  </div>

                  {!uploading && (
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      aria-label="Remove selected file"
                      className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-500 hover:text-[#1A1A1A] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F3D2E]/40"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}

              {/* Uploading Progress State */}
              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-medium text-gray-600">
                    <span>Uploading file...</span>
                    <span className="font-bold text-[#0F3D2E]">{progress}%</span>
                  </div>
                  <div
                    className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden"
                    role="progressbar"
                    aria-valuenow={progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Upload progress"
                  >
                    <div
                      className="bg-[#0F3D2E] h-2.5 rounded-full transition-all duration-200"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Upload Failed State */}
              {uploadError && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex flex-col space-y-3" role="alert">
                  <div className="flex items-center gap-2.5 text-sm">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <span className="font-semibold">Upload failed. Please try again.</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleUploadSubmit}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider w-fit self-end transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                  >
                    Retry Upload
                  </button>
                </div>
              )}

              {/* Modal Actions */}
              {!uploading && (
                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-5 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 px-4 bg-white hover:bg-gray-50 border border-gray-300 text-[#1A1A1A] font-semibold rounded-xl text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F3D2E]/40"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!file}
                    onClick={handleUploadSubmit}
                    className="flex-1 py-3 px-4 bg-[#0F3D2E] hover:bg-[#0c3325] text-white font-semibold rounded-xl text-sm shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F3D2E]/50 focus-visible:ring-offset-2 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    Upload Document
                  </button>
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default PortalUploadModal;
