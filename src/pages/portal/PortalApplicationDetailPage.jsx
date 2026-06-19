import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { ArrowLeft, Clock, CheckCircle2, Shield } from "lucide-react";
import StatusBadge from "../../components/ui/StatusBadge";
import LoadingSpinner from "../../components/ui/LoadingSpinner";

export const PortalApplicationDetailPage = () => {
  const { id } = useParams();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribe = () => {};

    const tryLoad = async () => {
      try {
        // Try visa_cases first
        const caseRef = doc(db, "visa_cases", id);
        const caseSnap = await getDoc(caseRef);

        if (caseSnap.exists()) {
          setCaseData({ id: caseSnap.id, source: "visa_cases", ...caseSnap.data() });
          setLoading(false);
          // Subscribe for live updates
          unsubscribe = onSnapshot(caseRef, (snap) => {
            if (snap.exists()) setCaseData({ id: snap.id, source: "visa_cases", ...snap.data() });
          });
        } else {
          // Fallback to bookings collection (Android-originated)
          const bookingRef = doc(db, "bookings", id);
          unsubscribe = onSnapshot(bookingRef, (snap) => {
            if (snap.exists()) {
              const b = snap.data();
              setCaseData({
                id: snap.id,
                source: "booking",
                caseNo: b.bookingId || snap.id,
                travellerName: b.travellerName || b.clientName || "",
                travellerEmail: b.clientEmail || "",
                visaType: b.serviceType || b.visaType || "Visa Booking",
                destination: b.destination || b.country || "",
                stage: b.bookingStatus || b.status || "Submitted",
                assignedOfficerName: b.assignedOfficerName || null,
                createdAt: b.createdAt
              });
            } else {
              setError("Application not found");
            }
            setLoading(false);
          }, (err) => {
            setError(err.message || "Failed to load");
            setLoading(false);
          });
        }
      } catch (err) {
        setError(err.message || "Failed to load application details.");
        setLoading(false);
      }
    };

    tryLoad();
    return () => unsubscribe();
  }, [id]);

  if (loading) {
    return <LoadingSpinner message="Loading case details..." fullScreen={true} />;
  }

  if (error || !caseData) {
    return (
      <div className="text-center py-12 space-y-4 font-sans text-xs">
        <p className="text-sm text-red-600">{error || "Failed to load application details."}</p>
        <Link to="/portal/applications" className="text-xs text-[#0F3D2E] underline">Back to Applications</Link>
      </div>
    );
  }

  const STAGE_STEPS = [
    "Verification",
    "Payment Confirmed",
    "Processing",
    "Appointment Booked",
    "Submitted",
    "Approved"
  ];

  const currentStageIdx = STAGE_STEPS.findIndex(s =>
    (caseData.stage || "").toLowerCase().includes(s.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      {/* Back Link */}
      <Link
        to="/portal/applications"
        className="inline-flex items-center text-xs font-bold text-[#0F3D2E] hover:text-[#C6A969] uppercase tracking-wider space-x-1 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Applications</span>
      </Link>

      {/* Case Header */}
      <div className="bg-white border border-[#E5E7EB] rounded-[24px] p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] font-mono text-[#C6A969] font-bold">{caseData.caseNo}</span>
          <h2 className="text-xl font-semibold text-[#1A1A1A] leading-tight mt-1">
            {caseData.travellerName}
          </h2>
          <p className="text-xs text-[#6B7280] font-medium">
            {caseData.visaType} — {caseData.destination}
          </p>
        </div>
        <StatusBadge status={caseData.stage} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Case Progress Timeline */}
        <div className={`${caseData.assignedOfficer || caseData.assignedOfficerName ? "lg:col-span-8" : "lg:col-span-12"} space-y-6`}>
          <div className="bg-white border border-[#E5E7EB] rounded-[24px] p-6 shadow-sm space-y-4">
            <h3 className="text-base font-semibold text-[#1A1A1A] border-b border-[#E5E7EB] pb-2">
              Application Progress
            </h3>
            <div className="space-y-4 pt-2">
              {STAGE_STEPS.map((stage, idx) => {
                const isCompleted = idx < currentStageIdx;
                const isActive = idx === currentStageIdx;
                return (
                  <div key={stage} className="flex items-center space-x-3">
                    <div
                      className={`flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center border-2 ${
                        isCompleted
                          ? "bg-[#0F3D2E] border-[#0F3D2E]"
                          : isActive
                          ? "bg-white border-[#C6A969] shadow-sm"
                          : "bg-[#F8F6F2] border-gray-200"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      ) : isActive ? (
                        <Clock className="h-4 w-4 text-[#C6A969]" />
                      ) : (
                        <span className="text-[10px] text-gray-400 font-bold">{idx + 1}</span>
                      )}
                    </div>
                    <span
                      className={`text-xs font-semibold ${
                        isCompleted
                          ? "text-gray-400 line-through"
                          : isActive
                          ? "text-[#0F3D2E] font-bold text-sm"
                          : "text-gray-400"
                      }`}
                    >
                      {stage}
                    </span>
                    {isActive && (
                      <span className="text-[9px] bg-[#C6A969]/10 text-[#C6A969] border border-[#C6A969]/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                        Current
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Document management notice */}
          <div className="bg-white border border-[#E5E7EB] rounded-[24px] p-6 shadow-sm space-y-3">
            <div className="flex items-center space-x-2">
              <Shield className="h-4.5 w-4.5 text-[#0F3D2E]" />
              <h3 className="text-sm font-semibold text-[#1A1A1A]">Document Management</h3>
            </div>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              Our team is currently preparing your visa application documents.
              Once your booking payment is confirmed by our team, your official consular dossier
              documents will be available for download in the Eshaare mobile app.
            </p>
          </div>
        </div>

        {/* Advisor contact sidebar */}
        {(caseData.assignedOfficer || caseData.assignedOfficerName) && (
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-[#E5E7EB] rounded-[24px] p-6 shadow-sm space-y-4 text-xs">
              <h3 className="text-sm font-semibold text-[#1A1A1A] border-b border-[#E5E7EB] pb-2">
                Your Consultant
              </h3>
              <div className="flex items-center space-x-3 py-2">
                <div className="h-10 w-10 rounded-full bg-[#0F3D2E]/10 border border-[#0F3D2E]/25 text-[#0F3D2E] font-bold flex items-center justify-center shadow-inner">
                  {(caseData.assignedOfficer || caseData.assignedOfficerName).slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-[#1A1A1A]">
                    {caseData.assignedOfficer || caseData.assignedOfficerName}
                  </h4>
                  <span className="text-[10px] text-gray-500 font-medium">Immigration Consultant</span>
                </div>
              </div>
              <Link
                to="/portal/messages"
                className="w-full block text-center py-2.5 bg-[#0F3D2E] hover:bg-[#0F3D2E]/95 text-white font-bold rounded-xl uppercase tracking-wider shadow-sm transition-colors"
              >
                Message Advisor
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default PortalApplicationDetailPage;
