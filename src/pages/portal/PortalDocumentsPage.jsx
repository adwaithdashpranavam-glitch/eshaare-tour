import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { FolderOpen, Plus, Download, Eye, Clock, CheckCircle, AlertTriangle, HelpCircle } from "lucide-react";
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

  const categories = [
    { name: "Passport", type: "Mandatory" },
    { name: "Photographs", type: "Mandatory" },
    { name: "Bank Statements", type: "Mandatory" }
  ];

  const getCategoryStatus = (categoryName) => {
    const matchedDocs = docs.filter(d => 
      (d.docType || d.type || "").toLowerCase().includes(categoryName.toLowerCase()) ||
      (d.fileName || d.name || "").toLowerCase().includes(categoryName.toLowerCase())
    );

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

  return (
    <div className="space-y-8 font-sans pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A]">Document Center</h1>
          <p className="text-xs text-[#6B7280]">Manage uploaded scans, passport bio pages, and embassy-compliant files.</p>
        </div>
        <button
          onClick={() => setIsUploadOpen(true)}
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
            const status = getCategoryStatus(cat.name);
            return (
              <div key={cat.name} className="p-3.5 bg-[#F8F6F2] rounded-xl border border-[#E5E7EB] flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-[#1A1A1A]">{cat.name}</h4>
                  <span className="text-[9px] text-[#6B7280] uppercase tracking-wider font-bold">{cat.type}</span>
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
                      <span>In Review</span>
                    </span>
                  )}
                  {status === "Rejected" && (
                    <span className="inline-flex items-center gap-1 text-red-600 font-bold bg-red-50 px-2 py-1 rounded-full text-[10px]">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Rejected</span>
                    </span>
                  )}
                  {status === "Pending" && (
                    <button
                      onClick={() => setIsUploadOpen(true)}
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
        onClose={() => setIsUploadOpen(false)}
      />

    </div>
  );
};

export default PortalDocumentsPage;
