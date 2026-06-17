import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { ArrowLeft, Clock, CheckCircle2, Shield } from "lucide-react";
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
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${currentStyle}`}>
      {s}
    </span>
  );
};

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
        <Link to="/portal/applications" className="text-xs text-[#C8A45D] underline">Back to Applications</Link>
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
        className="inline-flex items-center text-xs font-bold text-[#C8A45D] hover:text-[#b08e4f] uppercase tracking-wider space-x-1.5 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 text-[#C8A45D]" />
        <span>Back to Applications</span>
      </Link>

      {/* Case Header */}
      <div className="bg-white p-6 border border-[#E7E1D6] rounded-[20px] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[9px] font-mono font-bold text-[#C8A45D] uppercase tracking-wider">{caseData.caseNo}</span>
          <h2 className="text-xl font-display font-semibold text-[#1A1A1A] leading-tight mt-1">
            {caseData.travellerName}
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            {caseData.visaType} — {caseData.destination}
          </p>
        </div>
        <PortalStatusBadge status={caseData.stage} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Case Progress Timeline */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-6 border border-[#E7E1D6] rounded-[20px] shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-[#1A1A1A] border-b border-[#E7E1D6]/60 pb-2 uppercase tracking-wider font-display">
              Concierge Application Stage
            </h3>
            <div className="space-y-4 pt-2">
              {STAGE_STEPS.map((stage, idx) => {
                const isCompleted = idx < currentStageIdx;
                const isActive = idx === currentStageIdx;
                return (
                  <div key={stage} className="flex items-center space-x-4">
                    <div
                      className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center border transition-all duration-300 ${
                        isCompleted
                          ? "bg-[#C8A45D] border-[#C8A45D]"
                          : isActive
                          ? "bg-white border-[#C8A45D] ring-4 ring-[#C8A45D]/10"
                          : "bg-white border-gray-300"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      ) : isActive ? (
                        <Clock className="h-4 w-4 text-[#C8A45D]" />
                      ) : (
                        <span className="text-[10px] font-bold text-gray-400">{idx + 1}</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2.5">
                      <span
                        className={`text-xs font-semibold uppercase tracking-wider ${
                          isCompleted
                            ? "text-gray-800"
                            : isActive
                            ? "text-[#C8A45D] font-bold"
                            : "text-gray-400"
                        }`}
                      >
                        {stage}
                      </span>
                      {isActive && (
                        <span className="text-[9px] bg-[#C8A45D]/10 text-[#C8A45D] border border-[#C8A45D]/30 px-1.5 py-0.5 rounded font-extrabold uppercase tracking-widest">
                          Current
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Document management notice */}
          <div className="bg-white p-6 border border-[#E7E1D6] rounded-[20px] shadow-sm space-y-3">
            <div className="flex items-center space-x-2 border-b border-[#E7E1D6]/60 pb-2">
              <Shield className="h-4.5 w-4.5 text-[#C8A45D]" />
              <h3 className="text-sm font-semibold text-[#1A1A1A] font-display uppercase tracking-wider">Document Management</h3>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              Our travel specialists are currently assembling your visa application dossier and verifying travel certificates.
              Once your booking payment is reviewed and marked completed by our accounts desk, your final consular submission
              checklist and travel itinerary documents will be unlocked for direct download here and in the Eshaare mobile app.
            </p>
          </div>
        </div>

        {/* Advisor contact sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 border border-[#E7E1D6] rounded-[20px] shadow-sm space-y-4 text-xs">
            <h3 className="text-sm font-semibold text-[#1A1A1A] border-b border-[#E7E1D6]/60 pb-2 uppercase tracking-wider font-display">
              Assigned Specialist
            </h3>
            <div className="flex items-center space-x-3 py-2">
              <div className="h-10 w-10 rounded-full bg-[#F7F5F1] border border-[#E7E1D6] text-[#C8A45D] font-bold flex items-center justify-center uppercase">
                {caseData.assignedOfficerName?.slice(0, 2).toUpperCase() || "VO"}
              </div>
              <div>
                <h4 className="font-bold text-[#1A1A1A]">
                  {caseData.assignedOfficerName || "Visa Operations Team"}
                </h4>
                <span className="text-[10px] text-gray-500 font-medium">Immigration Specialist</span>
              </div>
            </div>
            <Link
              to="/portal/messages"
              className="w-full block text-center py-2.5 bg-[#C8A45D] text-white hover:bg-[#b08e4f] font-bold rounded-lg uppercase tracking-wider shadow-sm transition-all"
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
