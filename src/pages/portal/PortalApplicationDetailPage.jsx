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
        <p className="text-sm text-red-400">{error || "Failed to load application details."}</p>
        <Link to="/portal/applications" className="text-xs text-secondary underline">Back to Applications</Link>
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
        className="inline-flex items-center text-xs font-bold text-secondary hover:text-secondary-fixed-dim uppercase tracking-wider space-x-1"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Applications</span>
      </Link>

      {/* Case Header */}
      <div className="glass-card p-6 border border-on-primary-fixed-variant/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] font-mono text-secondary">{caseData.caseNo}</span>
          <h2 className="text-xl font-display font-bold text-white leading-tight mt-1">
            {caseData.travellerName}
          </h2>
          <p className="text-xs text-on-primary-container/60 font-medium">
            {caseData.visaType} — {caseData.destination}
          </p>
        </div>
        <StatusBadge status={caseData.stage} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Case Progress Timeline */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass-card p-6 border border-on-primary-fixed-variant/60 space-y-4">
            <h3 className="text-base font-semibold text-white border-b border-on-primary-fixed-variant pb-2">
              Application Progress
            </h3>
            <div className="space-y-3">
              {STAGE_STEPS.map((stage, idx) => {
                const isCompleted = idx < currentStageIdx;
                const isActive = idx === currentStageIdx;
                return (
                  <div key={stage} className="flex items-center space-x-3">
                    <div
                      className={`flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center border ${
                        isCompleted
                          ? "bg-secondary/20 border-secondary"
                          : isActive
                          ? "bg-amber-500/20 border-amber-400"
                          : "bg-white/5 border-on-primary-fixed-variant"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-secondary" />
                      ) : isActive ? (
                        <Clock className="h-3.5 w-3.5 text-amber-400" />
                      ) : (
                        <span className="text-[9px] text-on-primary-container/30">{idx + 1}</span>
                      )}
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        isCompleted
                          ? "text-secondary"
                          : isActive
                          ? "text-amber-300 font-bold"
                          : "text-on-primary-container/30"
                      }`}
                    >
                      {stage}
                    </span>
                    {isActive && (
                      <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                        Current
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Document management notice */}
          <div className="glass-card p-6 border border-on-primary-fixed-variant/60 space-y-3">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-secondary" />
              <h3 className="text-sm font-semibold text-white">Document Management</h3>
            </div>
            <p className="text-xs text-on-primary-container/60 leading-relaxed">
              Our team is currently preparing your visa application documents.
              Once your booking payment is confirmed by our team, your official consular dossier
              documents will be available for download in the Eshaare mobile app.
            </p>
          </div>
        </div>

        {/* Advisor contact sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card p-6 border border-on-primary-fixed-variant/60 space-y-4 text-xs">
            <h3 className="text-sm font-semibold text-white border-b border-on-primary-fixed-variant pb-2">
              Your Consultant
            </h3>
            <div className="flex items-center space-x-3 py-2">
              <div className="h-10 w-10 rounded-full bg-secondary-container/10 border border-secondary/20 text-secondary font-bold flex items-center justify-center">
                {caseData.assignedOfficerName?.slice(0, 2).toUpperCase() || "VO"}
              </div>
              <div>
                <h4 className="font-bold text-white">
                  {caseData.assignedOfficerName || "Visa Operations Team"}
                </h4>
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
