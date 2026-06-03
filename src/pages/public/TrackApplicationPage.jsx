import React, { useState } from "react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { formatDate } from "../../utils/formatters";
import toast from "react-hot-toast";

export const TrackApplicationPage = () => {
  const [refNo, setRefNo] = useState("");
  const [contactInput, setContactInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [caseData, setCaseData] = useState(null);
  const [errorType, setErrorType] = useState(null); // 'not_found' | 'mismatch'
  const [searched, setSearched] = useState(false);

  const isEmailMatch = (dbEmail, inputEmail) => {
    if (!dbEmail || !inputEmail) return false;
    return dbEmail.trim().toLowerCase() === inputEmail.trim().toLowerCase();
  };

  const isPhoneMatch = (dbPhone, inputPhone) => {
    if (!dbPhone || !inputPhone) return false;
    const cleanDb = dbPhone.replace(/[^0-9]/g, "");
    const cleanInput = inputPhone.replace(/[^0-9]/g, "");
    if (cleanDb.length < 5 || cleanInput.length < 5) return false;
    return cleanDb.includes(cleanInput) || cleanInput.includes(cleanDb);
  };

  const handleTrackSubmit = async (e) => {
    e.preventDefault();
    if (!refNo.trim() || !contactInput.trim()) {
      toast.error("Please enter both the application reference and email/phone.");
      return;
    }

    setLoading(true);
    setSearched(true);
    setErrorType(null);
    setCaseData(null);

    try {
      const casesRef = collection(db, "visa_cases");
      const q = query(casesRef, where("caseNo", "==", refNo.trim()));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setErrorType("not_found");
        toast.error("Application not found.");
        setLoading(false);
        return;
      }

      const caseDoc = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
      let verified = false;

      const travellerId = caseDoc.travellerId;
      if (travellerId) {
        const travellerDocRef = doc(db, "travellers", travellerId);
        const travellerDoc = await getDoc(travellerDocRef);
        if (travellerDoc.exists()) {
          const tData = travellerDoc.data();
          if (isEmailMatch(tData.email, contactInput) || isPhoneMatch(tData.phone, contactInput)) {
            verified = true;
          }
        }
      }

      if (!verified) {
        if (
          isEmailMatch(caseDoc.travellerEmail, contactInput) ||
          isPhoneMatch(caseDoc.travellerPhone, contactInput)
        ) {
          verified = true;
        }
      }

      if (verified) {
        setCaseData(caseDoc);
        toast.success("Application details retrieved!");
      } else {
        setErrorType("mismatch");
        toast.error("Application details do not match.");
      }
    } catch (err) {
      console.error("Error looking up case details:", err);
      toast.error("An error occurred during lookup.");
      setErrorType("not_found");
    } finally {
      setLoading(false);
    }
  };

  const getStageIndex = (stage) => {
    switch (stage) {
      case "Docs Pending":
        return 0;
      case "Verification":
        return 1;
      case "Submitted":
        return 2;
      case "Awaiting Decision":
        return 3;
      case "Approved":
      case "Rejected":
      case "Withdrawn":
        return 4;
      default:
        return 0;
    }
  };

  const getStageDescription = (stage) => {
    switch (stage) {
      case "Docs Pending":
        return "We are currently compiling your required visa documents. Please log into the client portal to check outstanding items.";
      case "Verification":
        return "Our immigration compliance experts are auditing your visa dossier for document format and slot validations.";
      case "Submitted":
        return "Your visa dossier has been successfully submitted to VFS Global or the embassy. Slots locked.";
      case "Awaiting Decision":
        return "Your passport is currently with the consulate for visa decision reviews. We track updates daily.";
      case "Approved":
        return "Congratulations! Your visa application has been approved. Passport collection details sent.";
      case "Rejected":
        return "Your application has been returned by the consulate. Please review detail notes in your portal.";
      case "Withdrawn":
        return "Your visa application has been withdrawn as per your request.";
      default:
        return "Your visa files are received and in progress.";
    }
  };

  const getFlag = (dest) => {
    if (!dest) return "✈️";
    const d = dest.toLowerCase();
    if (d.includes("france")) return "🇫🇷";
    if (d.includes("germany")) return "🇩🇪";
    if (d.includes("switzerland")) return "🇨🇭";
    if (d.includes("united kingdom") || d.includes("uk")) return "🇬🇧";
    if (d.includes("united states") || d.includes("usa")) return "🇺🇸";
    if (d.includes("uae") || d.includes("emirates")) return "🇦🇪";
    if (d.includes("saudi")) return "🇸🇦";
    if (d.includes("japan")) return "🇯🇵";
    return "✈️";
  };

  const stagesList = ["Docs Collection", "Verification", "Embassy Submitted", "Decision", "Complete"];
  const currentIndex = caseData ? getStageIndex(caseData.stage) : 0;
  const estimatedCompletion = caseData ? (caseData.decisionExpected || caseData.expectedDecisionAt) : null;

  return (
    <div className="bg-surface text-on-surface min-h-screen py-16 px-margin-mobile md:px-margin-desktop flex flex-col justify-center items-center">
      
      <div className="max-w-xl w-full space-y-10">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <span className="material-symbols-outlined text-secondary text-5xl animate-[spin_30s_linear_infinite] block">
            explore
          </span>
          <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-primary tracking-wide">Track Application</h1>
          <p className="text-body-sm text-on-surface-variant max-w-md mx-auto leading-relaxed">
            Enter your application reference number and registered contact details to view the real-time status of your visa case.
          </p>
        </div>

        {/* Tracking Lookup Form */}
        <div className="bg-surface-container-lowest p-8 border border-outline-variant/10 rounded-2xl premium-shadow space-y-5">
          <form onSubmit={handleTrackSubmit} className="space-y-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-body-sm font-semibold text-secondary">Application Reference *</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 text-on-surface placeholder:text-on-surface-variant/40 text-body-sm rounded-lg focus:outline-none font-mono tracking-wider"
                placeholder="e.g. VC-20260601-002"
                value={refNo}
                onChange={(e) => setRefNo(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-body-sm font-semibold text-secondary">Email or Phone Number *</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 text-on-surface placeholder:text-on-surface-variant/40 text-body-sm rounded-lg focus:outline-none"
                placeholder="e.g. email@example.com or +971501234567"
                value={contactInput}
                onChange={(e) => setContactInput(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-primary text-on-primary font-bold text-body-sm rounded-xl uppercase tracking-wider transition-opacity hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
                  <span>Checking Status...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">search</span>
                  <span>Track Status</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results Panel */}
        {searched && !loading && (
          <div className="animate-[fadeIn_0.2s_ease-out]">
            {caseData ? (
              <div className="bg-surface-container-lowest p-8 border border-outline-variant/10 rounded-2xl premium-shadow space-y-6">
                
                {/* Header */}
                <div className="flex justify-between items-start border-b border-outline-variant/15 pb-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Application Reference</span>
                    <h3 className="text-xl font-mono font-bold text-primary tracking-wide">{caseData.caseNo}</h3>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-surface-container border border-outline-variant/10 flex items-center justify-center text-2xl">
                    {getFlag(caseData.destination)}
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-4 py-2 text-body-sm text-on-surface-variant border-b border-outline-variant/15 pb-6">
                  <div>
                    <span className="text-on-surface-variant/70 block mb-0.5">Applicant Name</span>
                    <span className="text-primary font-bold">{caseData.travellerName}</span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant/70 block mb-0.5">Visa Type</span>
                    <span className="text-primary font-bold">{caseData.visaType || caseData.destination}</span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant/70 block mb-0.5">Estimated Completion</span>
                    <span className="text-secondary font-bold">
                      {estimatedCompletion ? formatDate(estimatedCompletion, "dd MMM yyyy") : "7-10 working days"}
                    </span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant/70 block mb-0.5">Last Updated</span>
                    <span className="text-primary font-mono">
                      {formatDate(caseData.updatedAt || caseData.createdAt, "dd MMM yyyy, hh:mm a")}
                    </span>
                  </div>
                </div>

                {/* Stepper Progress Bar */}
                <div className="space-y-4 pt-2">
                  <div className="flex justify-between items-center text-body-sm">
                    <span className="text-on-surface-variant/70 font-semibold uppercase tracking-wider text-[10px]">Processing Stage</span>
                    <span className="text-secondary font-bold font-mono">{Math.round((currentIndex / 4) * 100)}%</span>
                  </div>
                  
                  <div className="flex justify-between items-center relative py-2">
                    <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-0.5 bg-surface-container-high -z-10"></div>
                    <div 
                      className="absolute left-4 top-1/2 -translate-y-1/2 h-0.5 bg-secondary transition-all duration-500 -z-10" 
                      style={{ width: `calc(${(currentIndex / 4) * 100}% - 8px)` }}
                    ></div>
                    
                    {stagesList.map((stg, sIdx) => {
                      const isCompleted = sIdx < currentIndex;
                      const isActive = sIdx === currentIndex;
                      return (
                        <div key={stg} className="flex flex-col items-center relative group">
                          <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                            isCompleted ? "bg-secondary border-secondary text-white" : 
                            isActive ? "bg-surface border-secondary text-secondary" : 
                            "bg-surface border-outline-variant text-on-surface-variant/30"
                          }`}>
                            {isCompleted ? (
                              <span className="material-symbols-outlined text-sm">check</span>
                            ) : sIdx + 1}
                          </div>
                          <span className={`text-[9px] uppercase tracking-wider font-semibold text-center mt-2 max-w-[80px] hidden sm:block ${
                            isActive ? "text-secondary font-bold" : "text-on-surface-variant/50"
                          }`}>
                            {stg}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Stage description & Estimated completion in highlighted box */}
                <div className="p-4 bg-surface-container-low border border-outline-variant/15 rounded-lg flex items-start gap-3 text-body-sm">
                  <span className="material-symbols-outlined text-secondary text-xl flex-shrink-0 mt-0.5">check_circle</span>
                  <div className="space-y-1">
                    <h5 className="font-bold text-primary uppercase tracking-wider text-[10px]">
                      Current Stage: {stagesList[currentIndex]}
                    </h5>
                    <p className="text-on-surface-variant leading-relaxed">
                      {getStageDescription(caseData.stage)}
                    </p>
                  </div>
                </div>

                {/* WhatsApp Help CTA Button */}
                <a
                  href={`https://wa.me/971501234567?text=Hi%2C%20I'm%20inquiring%20about%20my%20visa%20case%20status%20ref%20${caseData.caseNo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 bg-whatsapp-green hover:bg-whatsapp-green/90 text-white font-bold text-body-sm rounded-xl uppercase tracking-wider transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">chat</span>
                  <span>Need help? Chat on WhatsApp</span>
                </a>

              </div>
            ) : errorType === "mismatch" ? (
              <div className="bg-surface-container-lowest p-8 border border-error/20 rounded-2xl premium-shadow space-y-5 text-center">
                <div className="h-12 w-12 rounded-full bg-error-container text-error flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-2xl">error</span>
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-body-lg font-bold text-primary">Details don't match</h4>
                  <p className="text-body-sm text-on-surface-variant max-w-sm mx-auto leading-relaxed">
                    The reference number or contact information provided does not match our records. Please verify the information and try again.
                  </p>
                </div>
                <a
                  href="https://wa.me/971501234567?text=Hi%2C%20I%20need%20help%20tracking%20my%20visa%20application."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 bg-whatsapp-green text-white font-bold text-body-sm rounded-xl uppercase tracking-wider"
                >
                  <span className="material-symbols-outlined text-lg">chat</span>
                  <span>Support on WhatsApp</span>
                </a>
              </div>
            ) : (
              <div className="bg-surface-container-lowest p-8 border border-outline-variant/10 rounded-2xl premium-shadow space-y-5 text-center">
                <div className="h-12 w-12 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-2xl">error</span>
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-body-lg font-bold text-primary">No application found</h4>
                  <p className="text-body-sm text-on-surface-variant max-w-sm mx-auto leading-relaxed">
                    We could not find any visa application matching that reference number. Please check the number or start a new inquiry.
                  </p>
                </div>
                <a
                  href="https://wa.me/971501234567?text=Hi%2C%20I%20need%20help%20tracking%20my%20visa%20application."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 bg-whatsapp-green text-white font-bold text-body-sm rounded-xl uppercase tracking-wider"
                >
                  <span className="material-symbols-outlined text-lg">chat</span>
                  <span>Support on WhatsApp</span>
                </a>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default TrackApplicationPage;
