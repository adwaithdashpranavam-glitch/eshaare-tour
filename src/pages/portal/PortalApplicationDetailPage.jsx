import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { ArrowLeft, Clock, FileText, CheckCircle2 } from "lucide-react";
import { VISA_REQUIREMENTS } from "../../utils/constants";
import StatusBadge from "../../components/ui/StatusBadge";
import DocumentChecklist from "../../components/ui/DocumentChecklist";
import toast from "react-hot-toast";

export const PortalApplicationDetailPage = () => {
  const { id } = useParams();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [docItems, setDocItems] = useState([]);

  useEffect(() => {
    const docRef = doc(db, "visa_cases", id);
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setCaseData({ id: snapshot.id, ...data });

        // Map checklist documents
        const reqDocs = VISA_REQUIREMENTS[data.destination] || VISA_REQUIREMENTS.Schengen;
        const mappedDocs = reqDocs.map((docName, idx) => {
          const existingDoc = data.checklist?.find(d => d.name === docName);
          return {
            id: idx,
            name: docName,
            status: existingDoc?.status || "Pending",
            fileUrl: existingDoc?.fileUrl || "",
            rejectionReason: existingDoc?.rejectionReason || ""
          };
        });
        setDocItems(mappedDocs);
      }
      setLoading(false);
    }, (error) => {
      console.warn("Using mock traveler case details:", error);
      setCaseData({
        id: id,
        caseNo: "VC-20260601-002",
        travellerName: "Sarah Connor",
        visaType: "UK Visa",
        destination: "United Kingdom",
        stage: "Docs Pending",
        assignedOfficerName: "Ahmed K."
      });
      setDocItems([
        { id: 0, name: "Original Passport", status: "Verified", fileUrl: "https://example.com/passport.pdf" },
        { id: 1, name: "Emirates ID Copy", status: "Verified", fileUrl: "https://example.com/eid.pdf" },
        { id: 2, name: "6 Months Bank Statement", status: "Pending", fileUrl: "" }
      ]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  const handleClientUpload = async (docNameOrId, fileData) => {
    try {
      const updatedChecklist = docItems.map(item => {
        if (item.id === docNameOrId || item.name === docNameOrId) {
          return { ...item, status: "Uploaded", fileUrl: fileData.url };
        }
        return item;
      });
      
      const docRef = doc(db, "visa_cases", id);
      await updateDoc(docRef, { checklist: updatedChecklist });
      setDocItems(updatedChecklist);
      toast.success("Document uploaded for review!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to register document upload in database");
    }
  };

  if (loading || !caseData) {
    return <div className="h-screen flex items-center justify-center bg-primary-container text-secondary">Loading case details...</div>;
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Back Link */}
      <Link 
        to="/portal/applications" 
        className="inline-flex items-center text-xs font-bold text-secondary hover:text-secondary-fixed-dim uppercase tracking-wider space-x-1"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Applications</span>
      </Link>

      <div className="glass-card p-6 border border-on-primary-fixed-variant/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] font-mono text-secondary">{caseData.caseNo}</span>
          <h2 className="text-xl font-display font-bold text-white leading-tight mt-1">{caseData.travellerName}</h2>
          <p className="text-xs text-on-primary-container/60 font-medium">{caseData.visaType} to {caseData.destination}</p>
        </div>
        <StatusBadge status={caseData.stage} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Document uploads checklist (2/3) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass-card p-6 border border-on-primary-fixed-variant/60 space-y-4">
            <h3 className="text-base font-semibold text-white border-b border-on-primary-fixed-variant pb-2">Document Checklist</h3>
            <DocumentChecklist
              caseId={caseData.id}
              visaType={caseData.visaType}
              travellerId={caseData.travellerId}
              isAdmin={false}
            />
          </div>
        </div>

        {/* Advisor contact and info sidebar (1/3) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card p-6 border border-on-primary-fixed-variant/60 space-y-4 text-xs">
            <h3 className="text-sm font-semibold text-white border-b border-on-primary-fixed-variant pb-2">Your Consultant</h3>
            <div className="flex items-center space-x-3 py-2">
              <div className="h-10 w-10 rounded-full bg-secondary-container/10 border border-secondary/20 text-secondary font-bold flex items-center justify-center">
                {caseData.assignedOfficerName?.slice(0, 2).toUpperCase() || "VO"}
              </div>
              <div>
                <h4 className="font-bold text-white">{caseData.assignedOfficerName || "Visa Operations Team"}</h4>
                <span className="text-[10px] text-on-primary-container/40">Immigration Consultant</span>
              </div>
            </div>
            <Link
              to="/portal/messages"
              className="w-full block text-center py-2 bg-secondary-container hover:bg-secondary-container text-on-primary-fixed font-bold rounded uppercase tracking-wider shadow-sm"
            >
              Message Advisor
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
};

export default PortalApplicationDetailPage;
