import React, { useState, useEffect, useRef } from "react";
import { doc, getDoc, collection, query, where, onSnapshot, addDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../lib/firebase";
import { useAuth } from "../../contexts/AuthContext";
import { UploadCloud, CheckCircle, AlertCircle, FileText, X, RefreshCw, Check } from "lucide-react";
import Modal from "./Modal";
import toast from "react-hot-toast";

const DOCUMENT_TYPES = [
  "Passport",
  "Emirates ID",
  "Bank Statement",
  "Salary Certificate",
  "Employment Letter",
  "NOC",
  "Photo",
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
            verificationStatus: "Pending",
            status: "Pending",
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialDocType ? `Upload ${initialDocType}` : "Upload Travel Document"}
      size="md"
    >
      <div className="space-y-5 text-xs text-on-primary-container font-sans">
        
        {/* Success Screen */}
        {uploadSuccess && (
          <div className="flex flex-col items-center justify-center text-center p-8 space-y-4">
            <div className="h-16 w-16 bg-success/15 border border-success/30 rounded-full flex items-center justify-center text-success animate-bounce">
              <Check className="h-8 w-8 stroke-[3]" />
            </div>
            <h4 className="text-sm font-semibold text-white">Document Uploaded!</h4>
            <p className="text-xs text-on-primary-container/60 leading-relaxed font-sans max-w-xs">
              Your consultant will review it shortly.
            </p>
          </div>
        )}

        {/* Form & Upload Area */}
        {!uploadSuccess && (
          <div className="space-y-4">
            
            {/* Document Type Selector (only if not preset) */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] font-bold text-on-primary-container/50 uppercase tracking-wider">Document Type</label>
              <select
                className="bg-primary-container border border-on-primary-fixed-variant text-on-primary-container p-2.5 rounded-button text-xs focus:outline-none focus:border-secondary disabled:opacity-50"
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
            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] font-bold text-on-primary-container/50 uppercase tracking-wider">Linked Application</label>
              {loadingCases ? (
                <div className="flex items-center text-on-primary-container/40 p-2.5 bg-primary-container/60 border border-on-primary-fixed-variant rounded-button">
                  <RefreshCw className="h-3 w-3 animate-spin mr-2" />
                  <span>Loading applications...</span>
                </div>
              ) : (
                <select
                  className="bg-primary-container border border-on-primary-fixed-variant text-on-primary-container p-2.5 rounded-button text-xs focus:outline-none focus:border-secondary disabled:opacity-50"
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
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={triggerFileInput}
                className={`w-full py-8 px-4 border-2 border-dashed rounded-card flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
                  dragActive
                    ? "border-secondary bg-secondary-container/5 shadow-sm"
                    : "border-secondary/20 bg-primary-container/40 hover:border-secondary/40 hover:bg-primary-container/10"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileInput}
                  accept=".pdf,.jpg,.jpeg,.png"
                />

                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="p-2.5 rounded-full bg-white/5 border border-on-primary-fixed-variant text-secondary">
                    <UploadCloud className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-semibold text-white">
                    Drag & Drop file or <span className="text-secondary hover:underline">click to browse</span>
                  </p>
                  <p className="text-[10px] text-on-primary-container/40 max-w-xs">
                    Accepts PDF, JPG, JPEG, and PNG formats up to 10MB
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 bg-danger/10 border border-danger/20 text-danger rounded-button flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span className="font-semibold">{errorMsg}</span>
              </div>
            )}

            {/* File Selected / Upload Progress Details */}
            {file && !uploadSuccess && (
              <div className="p-3.5 bg-primary-container/80 border border-outline-variant/10 rounded-button flex items-center justify-between gap-3">
                <div className="flex items-center space-x-3 truncate">
                  {isImageFile(file.type) ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt="Thumbnail"
                      className="h-10 w-10 object-cover rounded border border-on-primary-fixed-variant shrink-0"
                    />
                  ) : (
                    <div className="h-10 w-10 bg-danger/10 text-danger rounded border border-danger/20 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                  )}
                  <div className="truncate">
                    <p className="font-semibold text-white truncate max-w-[180px]">{file.name}</p>
                    <p className="text-[10px] text-on-primary-container/45 font-mono">{formatFileSize(file.size)}</p>
                  </div>
                </div>

                {!uploading && (
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="p-1 hover:bg-white/5 rounded text-on-primary-container/40 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}

            {/* Uploading Progress State */}
            {uploading && (
              <div className="space-y-2 p-1.5">
                <div className="flex justify-between items-center text-[10px] font-mono text-on-primary-container/50">
                  <span>Uploading file...</span>
                  <span className="font-bold text-secondary">{progress}%</span>
                </div>
                <div className="w-full bg-primary-container rounded-full h-2 overflow-hidden border border-on-primary-fixed-variant">
                  <div 
                    className="bg-secondary-container h-2 rounded-full transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Upload Failed State */}
            {uploadError && (
              <div className="p-3.5 bg-danger/10 border border-danger/25 text-danger rounded-button flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span className="font-bold">Upload failed. Please try again.</span>
                </div>
                <button
                  type="button"
                  onClick={handleUploadSubmit}
                  className="px-3 py-1 bg-danger text-white rounded text-[10px] font-bold uppercase tracking-wider w-fit self-end"
                >
                  Retry Upload
                </button>
              </div>
            )}

            {/* Modal Actions */}
            {!uploading && (
              <div className="flex space-x-3 pt-4 border-t border-on-primary-fixed-variant">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2 bg-primary-container hover:bg-on-primary-fixed-variant border border-outline text-on-primary-container font-bold uppercase rounded-button text-[10px]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!file}
                  onClick={handleUploadSubmit}
                  className="flex-1 py-2 bg-gradient-to-r from-secondary-container to-secondary-container text-on-primary-fixed font-bold uppercase rounded-button text-[10px] disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                >
                  Upload Document
                </button>
              </div>
            )}

          </div>
        )}

      </div>
    </Modal>
  );
};

export default PortalUploadModal;
