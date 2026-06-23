import React, { useState, useEffect } from "react";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, auth } from "../../lib/firebase";
import { FileText, Upload, Download, ExternalLink, Calendar, User, FileCheck, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const formatFileSize = (bytes) => {
  if (typeof bytes !== "number" || isNaN(bytes) || bytes <= 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const getFileExtension = (template) => {
  if (template?.fileType) return String(template.fileType).toUpperCase();
  const name = template?.fileName || "";
  const parts = name.split(".");
  return parts.length > 1 ? parts.pop().toUpperCase() : "—";
};

export default function AdminDocumentsPage() {
  const [nocTemplate, setNocTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // Listen for universal NOC template changes
    const docRef = doc(db, "systemDocuments", "universal_noc_template");
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        setNocTemplate(snapshot.data());
      } else {
        setNocTemplate(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error loading universal NOC template:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const allowedMimeTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      const allowedExtensions = [".pdf", ".doc", ".docx"];
      const fileName = (file.name || "").toLowerCase();
      const hasValidExtension = allowedExtensions.some((ext) => fileName.endsWith(ext));
      if (!allowedMimeTypes.includes(file.type) && !hasValidExtension) {
        toast.error("Please upload a PDF, DOC, or DOCX document only.");
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        toast.error("File is too large. Max size is 15MB.");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Please select a file first.");
      return;
    }

    setUploading(true);
    try {
      // 1. Upload file to Firebase Storage (preserve original extension)
      const nameParts = (selectedFile.name || "").split(".");
      const fileExtension = nameParts.length > 1 ? nameParts.pop().toLowerCase() : "pdf";
      const storageRef = ref(
        storage,
        `system-documents/noc/Eshaare_NOC_Template.${fileExtension}`
      );
      const uploadResult = await uploadBytes(storageRef, selectedFile);
      
      // 2. Retrieve Download URL
      const downloadUrl = await getDownloadURL(uploadResult.ref);

      // 3. Write metadata to Firestore collection: systemDocuments, docId: universal_noc_template
      const docRef = doc(db, "systemDocuments", "universal_noc_template");
      await setDoc(docRef, {
        documentType: "NOC",
        title: "NOC Template",
        fileUrl: downloadUrl,
        fileName: selectedFile.name,
        fileType: fileExtension,
        fileSize: selectedFile.size,
        uploadedBy: auth.currentUser?.uid || "admin",
        uploadedByName: auth.currentUser?.displayName || auth.currentUser?.email || null,
        uploadedAt: serverTimestamp(),
        active: true
      });

      setSelectedFile(null);
      toast.success("Universal NOC Template uploaded successfully!");
    } catch (error) {
      console.error("Failed to upload universal NOC template:", error);
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-xs bg-[#071120] text-gray-300 p-4 md:p-6 rounded-3xl min-h-[85vh]">
      {/* Header */}
      <div className="border-b border-gray-800 pb-5">
        <h1 className="text-xl md:text-2xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <FileText className="h-6 w-6 text-[#D4AF37]" />
          Documents & Templates Manager
        </h1>
        <p className="text-gray-400 mt-1">Upload and manage universal document templates distributed to all visa applicants.</p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* Upload Form */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-gray-800">
            <Upload className="w-4 h-4 text-[#D4AF37]" /> Upload Universal NOC Template
          </h3>

          <form onSubmit={handleUpload} className="space-y-4">
            <div className="p-6 border-2 border-dashed border-gray-800 rounded-xl flex flex-col items-center justify-center text-center space-y-2 bg-[#0b1624]">
              <FileText className="w-8 h-8 text-gray-500" />
              <div className="text-xs">
                <label className="cursor-pointer font-bold text-[#D4AF37] hover:underline">
                  <span>Select NOC Template</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
              <p className="text-[10px] text-gray-400">PDF, DOC, or DOCX only. Max size 15MB.</p>
            </div>

            {selectedFile && (
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <span className="text-xs text-white truncate font-medium">{selectedFile.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="text-[10px] uppercase font-bold text-rose-400 hover:text-rose-300"
                >
                  Clear
                </button>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={uploading || !selectedFile}
                className="px-4 py-2.5 bg-[#D4AF37] hover:opacity-95 text-black font-bold uppercase rounded-xl flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload & Deploy Template
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Current Template Status */}
        <div className="bg-white/5 border border-[#E5E7EB]/10 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-gray-800">
            <FileCheck className="w-4 h-4 text-[#D4AF37]" /> Active NOC Document Status
          </h3>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#D4AF37]" />
              <p>Checking template registries...</p>
            </div>
          ) : nocTemplate ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-start gap-3">
                <FileCheck className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-xs uppercase tracking-wide">Template is Active & Deployed</p>
                  <p className="mt-1 text-[10px] text-gray-400">All Schengen visa applicants can now view and download this NOC template from their confirmation portals.</p>
                </div>
              </div>

              <div className="space-y-3 bg-white/2 border border-gray-800 rounded-xl p-4 text-[11px] font-sans">
                <div className="flex justify-between items-center pb-2 border-b border-gray-800/50">
                  <span className="text-gray-400">Document Type:</span>
                  <span className="font-bold text-white">{nocTemplate.documentType}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-800/50">
                  <span className="text-gray-400">Document Title:</span>
                  <span className="font-bold text-white">{nocTemplate.title}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-800/50">
                  <span className="text-gray-400">File Name:</span>
                  <span className="font-bold text-white truncate max-w-[200px]" title={nocTemplate.fileName}>{nocTemplate.fileName}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-800/50">
                  <span className="text-gray-400">File Type:</span>
                  <span className="font-bold text-white inline-flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#D4AF37]" />
                    {getFileExtension(nocTemplate)}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-800/50">
                  <span className="text-gray-400">File Size:</span>
                  <span className="font-bold text-white">{formatFileSize(nocTemplate.fileSize) || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-800/50">
                  <span className="text-gray-400 font-sans">Uploaded At:</span>
                  <span className="font-semibold text-gray-300 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    {nocTemplate.uploadedAt ? (
                      new Date(nocTemplate.uploadedAt.seconds ? nocTemplate.uploadedAt.seconds * 1000 : nocTemplate.uploadedAt).toLocaleString()
                    ) : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-sans">Uploaded By:</span>
                  <span className="font-semibold text-gray-300 flex items-center gap-1 truncate max-w-[200px]" title={nocTemplate.uploadedByName || nocTemplate.uploadedBy}>
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    {nocTemplate.uploadedByName || nocTemplate.uploadedBy || "N/A"}
                  </span>
                </div>
              </div>

              <p className="text-[10px] text-gray-400 italic">
                This is the active NOC template currently visible in the client portal.
              </p>

              <div className="flex gap-2">
                <a
                  href={nocTemplate.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-4 py-2.5 bg-[#D4AF37] hover:opacity-95 text-black rounded-xl font-bold uppercase flex items-center justify-center gap-1.5 text-[10px] tracking-wider"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download / View Template
                </a>
                <a
                  href={nocTemplate.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 border border-gray-700 hover:border-gray-500 rounded-xl font-bold uppercase flex items-center gap-1.5 text-[10px]"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Open Uploaded Template
                </a>
              </div>
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center text-gray-500 space-y-2">
              <FileText className="w-8 h-8 opacity-40" />
              <p className="font-semibold text-xs uppercase tracking-wider">No NOC Template Uploaded</p>
              <p className="text-[10px] max-w-xs">Upload a universal PDF document on the left to make it downloadable in client visa workflows.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
