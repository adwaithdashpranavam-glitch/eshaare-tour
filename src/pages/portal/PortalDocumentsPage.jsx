import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { FolderOpen, Plus, Eye } from "lucide-react";
import PortalUploadModal from "../../components/ui/PortalUploadModal";
import { formatShortDate } from "../../utils/formatters";
import LoadingSpinner from "../../components/ui/LoadingSpinner";

// Premium Luxury Status Badge
const PortalStatusBadge = ({ status }) => {
  const s = status || "Submitted";
  
  const stylesMap = {
    "Docs Pending": "bg-amber-50 text-amber-700 border border-amber-200",
    "Pending Documents": "bg-amber-50 text-amber-700 border border-amber-200",
    
    "Verification": "bg-blue-50 text-blue-700 border border-blue-200",
    "Under Review": "bg-blue-50 text-blue-700 border border-blue-200",
    "Submitted": "bg-blue-50 text-blue-700 border border-blue-200",
    "Awaiting Decision": "bg-blue-50 text-blue-700 border border-blue-200",
    
    "Approved": "bg-emerald-50 text-emerald-700 border border-emerald-200",
    "Paid": "bg-emerald-50 text-emerald-700 border border-emerald-200",
    "Confirmed": "bg-emerald-50 text-emerald-700 border border-emerald-200",
    
    "Rejected": "bg-rose-50 text-rose-700 border border-rose-200",
    "Overdue": "bg-rose-50 text-rose-700 border border-rose-200",
    
    "Withdrawn": "bg-gray-100 text-gray-600 border border-gray-200",
    "Cancelled": "bg-gray-100 text-gray-600 border border-gray-200",
  };

  const currentStyle = stylesMap[s] || "bg-gray-50 text-gray-600 border border-gray-200";
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider ${currentStyle}`}>
      {s}
    </span>
  );
};

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

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A] tracking-wide">My Documents</h1>
          <p className="text-xs text-gray-500">Manage uploaded scans, passport bio pages, and embassy-compliant files.</p>
        </div>
        <button
          onClick={() => setIsUploadOpen(true)}
          className="px-4 py-2.5 bg-[#C8A45D] hover:bg-[#b08e4f] text-white font-semibold text-xs rounded-lg flex items-center space-x-1.5 shadow-sm transition-all"
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
          <div className="col-span-2 bg-white border border-[#E7E1D6] rounded-[20px] p-12 text-center text-xs text-gray-400 italic">
            No document attachments found. Click Upload File above to add one.
          </div>
        ) : (
          docs.map((doc) => (
            <div key={doc.id} className="bg-white border border-[#E7E1D6] rounded-[20px] p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-[#C8A45D] transition-all">
              <div className="flex items-center space-x-3.5">
                <div className="p-3 rounded-xl bg-[#F7F5F1] border border-[#E7E1D6] text-[#C8A45D] shrink-0">
                  <FolderOpen className="h-5 w-5" />
                </div>
                <div className="truncate">
                  <h4 className="font-semibold text-[#1A1A1A] truncate max-w-[200px]">{doc.fileName || doc.name}</h4>
                  <span className="text-[9px] text-[#C8A45D] font-semibold uppercase tracking-wider">{doc.docType || doc.type}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-xs">
                <span className="text-gray-500 font-mono">Uploaded: {formatShortDate(doc.date || doc.createdAt)}</span>
                <div className="flex items-center space-x-2.5">
                  <PortalStatusBadge status={doc.status} />
                  {doc.fileUrl && (
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-[#F7F5F1] border border-[#E7E1D6] hover:border-[#C8A45D] text-[#C8A45D] transition-all"
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

      {/* Upload Modal */}
      <PortalUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />

    </div>
  );
};

export default PortalDocumentsPage;
