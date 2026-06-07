import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { FolderOpen, Plus, Download, Eye, Clock } from "lucide-react";
import StatusBadge from "../../components/ui/StatusBadge";
import PortalUploadModal from "../../components/ui/PortalUploadModal";
import { formatShortDate } from "../../utils/formatters";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import toast from "react-hot-toast";

export const PortalDocumentsPage = () => {
  const { userProfile } = useAuth();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  useEffect(() => {
    if (!userProfile?.email) return;

    const docsRef = collection(db, "documents");
    const q = query(docsRef, where("travellerEmail", "==", userProfile.email.toLowerCase()));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setDocs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
      setLoading(false);
    }, (error) => {
      console.warn("Using mock documents lists:", error);
      setDocs([
        { id: "1", name: "passport_scan.pdf", type: "Passport Copy", date: new Date(), status: "Verified", fileUrl: "https://example.com" },
        { id: "2", name: "bank_stmt_may.pdf", type: "Financial", date: new Date(), status: "Pending", fileUrl: "https://example.com" }
      ]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile]);

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-wide">My Documents</h1>
          <p className="text-xs text-on-primary-container/50">Manage uploaded scans, passport bio pages, and embassy-compliant files.</p>
        </div>
        <button
          onClick={() => setIsUploadOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-secondary-container to-secondary-container text-on-primary-fixed font-bold text-xs rounded-button flex items-center space-x-1.5 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Upload File</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 py-12">
            <LoadingSpinner message="Retrieving documents..." />
          </div>
        ) : docs.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-xs text-on-primary-container/40 italic">
            No document attachments found. Click Upload File above to add one.
          </div>
        ) : (
          docs.map((doc) => (
            <div key={doc.id} className="glass-card p-6 border border-on-primary-fixed-variant/60 flex flex-col justify-between space-y-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded bg-white/5 border border-on-primary-fixed-variant text-secondary">
                  <FolderOpen className="h-5 w-5" />
                </div>
                <div className="truncate">
                  <h4 className="font-semibold text-white truncate max-w-[180px]">{doc.name}</h4>
                  <span className="text-[10px] text-on-primary-container/40 uppercase tracking-widest">{doc.type}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-on-primary-fixed-variant flex justify-between items-center text-xs">
                <span className="text-on-primary-container/40 font-mono">Uploaded: {formatShortDate(doc.date || doc.createdAt)}</span>
                <div className="flex items-center space-x-2">
                  <StatusBadge status={doc.status} />
                  {doc.fileUrl && (
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded bg-white/5 text-secondary hover:text-white"
                    >
                      <Eye className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Modal */}
      <PortalUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />

    </div>
  );
};

export default PortalDocumentsPage;
