import React, { useState, useRef } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../../lib/firebase";
import { UploadCloud, CheckCircle, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

export const FileUpload = ({ 
  collectionName = "documents", 
  documentId = "general", 
  docType = "supporting", 
  onUploadSuccess,
  maxSizeMB = 10,
  customPath
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const uploadFile = (file) => {
    if (!file) return;

    // Check size limit
    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > maxSizeMB) {
      toast.error(`File size exceeds the ${maxSizeMB}MB limit.`);
      return;
    }

    setUploading(true);
    setProgress(0);
    setFileName(file.name);

    // Format Storage path: {collection}/{documentId}/{docType}/{timestamp}_{filename}
    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
    let storagePath = `${collectionName}/${documentId}/${docType}/${timestamp}_${cleanFileName}`;
    if (customPath) {
      storagePath = customPath
        .replace("{timestamp}", timestamp)
        .replace("{filename}", cleanFileName);
    }
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
        toast.error("File upload failed. Please try again.");
        setUploading(false);
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          toast.success("File uploaded successfully!");
          if (onUploadSuccess) {
            onUploadSuccess({
              url: downloadUrl,
              name: file.name,
              size: file.size,
              path: storagePath
            });
          }
        } catch (err) {
          console.error("Error getting download URL:", err);
          toast.error("Failed to get file URL.");
        } finally {
          setUploading(false);
        }
      }
    );
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        className={`w-full py-8 px-4 border-2 border-dashed rounded-card flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
          dragActive
            ? "border-secondary bg-secondary-container/5 shadow-sm"
            : "border-on-primary-fixed-variant bg-primary-container/20 hover:border-secondary/40 hover:bg-primary-container/30"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileInput}
          accept=".pdf,.jpg,.jpeg,.png"
          disabled={uploading}
        />

        {!uploading && progress === 0 && (
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="p-3 rounded-full bg-white/5 border border-on-primary-fixed-variant text-on-primary-container/40">
              <UploadCloud className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-white">
              Drag & Drop file or click to browse
            </p>
            <p className="text-xs text-on-primary-container/40 max-w-xs font-sans">
              Supports PDF, JPG, JPEG, and PNG formats up to {maxSizeMB}MB
            </p>
          </div>
        )}

        {uploading && (
          <div className="flex flex-col items-center w-full max-w-xs text-center space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="text-xs font-semibold text-white/80 font-mono truncate max-w-full">
              Uploading: {fileName}
            </div>
            {/* Progress bar container */}
            <div className="w-full bg-primary-container rounded-full h-2.5 overflow-hidden border border-on-primary-fixed-variant">
              <div 
                className="bg-gradient-to-r from-secondary-container to-secondary-fixed h-2.5 rounded-full transition-all duration-200"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="text-xs font-mono text-secondary font-bold">
              {progress}%
            </div>
          </div>
        )}

        {!uploading && progress === 100 && (
          <div className="flex flex-col items-center text-center space-y-2" onClick={(e) => e.stopPropagation()}>
            <div className="p-3 rounded-full bg-success/10 border border-success/20 text-success">
              <CheckCircle className="h-6 w-6 animate-bounce" />
            </div>
            <p className="text-sm font-semibold text-white">Upload Complete!</p>
            <p className="text-xs text-on-primary-container/60 font-mono truncate max-w-xs">{fileName}</p>
            <button
              onClick={() => setProgress(0)}
              className="text-xs text-secondary hover:text-secondary-fixed-dim font-semibold underline mt-2"
            >
              Upload another file
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
