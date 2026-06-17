import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import {
  FileText, UploadCloud, Calendar, MessageSquare, ChevronRight, Plus, Sparkles
} from "lucide-react";
import { auth } from "../../lib/firebase";
import { formatShortDate } from "../../utils/formatters";

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

export const PortalDashboard = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  const [activeCases, setActiveCases] = useState([]);
  const [pendingDocsCount, setPendingDocsCount] = useState(0);
  const [upcomingApptsCount, setUpcomingApptsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  const getCountryFlag = (destination) => {
    const dest = destination?.toLowerCase() || "";
    if (dest.includes("france")) return "🇫🇷";
    if (dest.includes("uk") || dest.includes("united kingdom") || dest.includes("london")) return "🇬🇧";
    if (dest.includes("usa") || dest.includes("united states") || dest.includes("america")) return "🇺🇸";
    if (dest.includes("canada")) return "🇨🇦";
    if (dest.includes("japan")) return "🇯🇵";
    if (dest.includes("australia")) return "🇦🇺";
    if (dest.includes("saudi") || dest.includes("ksa")) return "🇸🇦";
    if (dest.includes("uae") || dest.includes("dubai") || dest.includes("emirates")) return "🇦🇪";
    if (dest.includes("europe") || dest.includes("schengen")) return "🇪🇺";
    if (dest.includes("thailand")) return "🇹🇭";
    if (dest.includes("maldives")) return "🇲🇻";
    if (dest.includes("bali") || dest.includes("indonesia")) return "🇮🇩";
    if (dest.includes("turkey")) return "🇹🇷";
    if (dest.includes("georgia")) return "🇬🇪";
    return "🌐";
  };



  // Fetch cases details, appointments count & unread messages count
  useEffect(() => {
    if (!userProfile?.email && !auth.currentUser?.uid) return;

    let casesDocs = [];
    let bookingsDocs = [];
    let casesLoaded = false;
    let bookingsLoaded = false;

    const merge = () => {
      if (!casesLoaded || !bookingsLoaded) return;
      const caseIds = new Set(casesDocs.map(c => c.id));
      const uniqueBookings = bookingsDocs
        .filter(b => !caseIds.has(b.id))
        .map(b => ({
          id: b.id,
          caseNo: b.bookingId || b.id,
          visaType: b.serviceType || b.visaType || "Visa Booking",
          destination: b.destination || b.country || "",
          stage: b.bookingStatus || b.status || "Submitted",
          checklist: b.checklist || [],
          createdAt: b.createdAt
        }));
      const allCases = [...casesDocs, ...uniqueBookings];
      setActiveCases(allCases);

      const totalPending = allCases.reduce((acc, curr) => {
        const pending = curr.checklist?.filter(d => d.status === "Pending" || d.status === "Rejected").length || 0;
        return acc + pending;
      }, 0);
      setPendingDocsCount(totalPending);
    };

    // Query 1: visa_cases by travellerEmail
    let unsubCases = () => {};
    if (userProfile?.email) {
      const casesRef = collection(db, "visa_cases");
      const q = query(casesRef, where("travellerEmail", "==", userProfile.email.toLowerCase()));
      unsubCases = onSnapshot(q, (snapshot) => {
        casesDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        casesLoaded = true;
        merge();
      }, (error) => {
        console.warn("Error fetching traveller details:", error);
        casesLoaded = true;
        merge();
      });
    } else {
      casesLoaded = true;
    }

    // Query 2: bookings by clientUid (from Android app)
    let unsubBookings = () => {};
    if (auth.currentUser?.uid) {
      const bookingsRef = collection(db, "bookings");
      const qB = query(bookingsRef, where("clientUid", "==", auth.currentUser.uid));
      unsubBookings = onSnapshot(qB, (snapshot) => {
        bookingsDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        bookingsLoaded = true;
        merge();
      }, (error) => {
        console.warn("Error fetching bookings:", error);
        bookingsLoaded = true;
        merge();
      });
    } else {
      bookingsLoaded = true;
    }

    // Query 3: Confirmed Appointments count
    let unsubAppts = () => {};
    if (userProfile?.email) {
      const appRef = collection(db, "appointments");
      const q = query(appRef, where("email", "==", userProfile.email.toLowerCase()), where("status", "==", "Confirmed"));
      unsubAppts = onSnapshot(q, (snapshot) => {
        setUpcomingApptsCount(snapshot.size);
      }, (err) => {
        console.warn("Error loading appointments count:", err);
      });
    }

    // Query 4: Unread Messages count
    let unsubChats = () => {};
    if (auth.currentUser?.uid) {
      const chatRef = collection(db, "chats");
      const q = query(chatRef, where("participants", "array-contains", auth.currentUser.uid));
      unsubChats = onSnapshot(q, (snapshot) => {
        const unread = snapshot.docs.filter(doc => {
          const data = doc.data();
          return data.senderId !== auth.currentUser.uid && data.read === false;
        });
        setUnreadMessagesCount(unread.length);
      }, (err) => {
        console.warn("Error loading chats count:", err);
      });
    }

    return () => {
      unsubCases();
      unsubBookings();
      unsubAppts();
      unsubChats();
    };
  }, [userProfile]);

  // Determine the primary active case for the hero section
  const primaryCase = activeCases.length > 0 ? activeCases[0] : null;

  // Visual Tracker Step mapping (Submitted -> Review -> Documents -> Appointment -> Decision)
  const trackerSteps = ["Submitted", "Review", "Documents", "Appointment", "Decision"];
  
  const getActiveStepIndex = (stage) => {
    const s = stage?.toLowerCase() || "";
    if (s.includes("pending") || s.includes("doc")) return 2; // Documents
    if (s.includes("verification") || s.includes("review") || s.includes("under review")) return 1; // Review
    if (s.includes("appointment") || s.includes("confirmed") || s.includes("rescheduled") || s.includes("awaiting")) return 3; // Appointment
    if (s.includes("approved") || s.includes("rejected") || s.includes("decision") || s.includes("completed")) return 4; // Decision
    return 0; // Submitted (default)
  };

  const getNextActionMessage = (stage) => {
    const s = stage?.toLowerCase() || "";
    if (s.includes("pending") || s.includes("doc")) {
      return "Action Required: Please upload the required checklist documents to proceed.";
    }
    if (s.includes("verification") || s.includes("review")) {
      return "Our concierge team is verifying your application files. No action required.";
    }
    if (s.includes("appointment") || s.includes("confirmed") || s.includes("rescheduled")) {
      return "Action Required: Prepare for your scheduled biometric/interview session.";
    }
    if (s.includes("approved")) {
      return "Congratulations! Your visa is approved. We will coordinate passport return shortly.";
    }
    if (s.includes("rejected")) {
      return "Attention: Visa request rejected by consulate. Contact your advisor immediately.";
    }
    if (s.includes("withdrawn")) {
      return "This case file has been closed and withdrawn.";
    }
    return "Consular review is processing. We will notify you of any embassy requests.";
  };

  const activeStep = primaryCase ? getActiveStepIndex(primaryCase.stage) : -1;

  return (
    <div className="space-y-8 pb-12">

      {/* Hero Welcome Section */}
      <div className="bg-white border border-[#E7E1D6] rounded-[20px] p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#E7E1D6]/60 pb-6">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-semibold tracking-[0.2em] text-[#C8A45D] flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Premium Visa & Travel Concierge</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#1A1A1A]">
              Welcome back, {userProfile?.name || "Client"}
            </h1>
          </div>

          {primaryCase && (
            <div className="bg-[#F7F5F1] px-5 py-3.5 rounded-xl border border-[#E7E1D6] text-xs space-y-1 max-w-sm shrink-0">
              <p className="font-semibold text-[#1A1A1A]">{primaryCase.visaType} - {primaryCase.destination}</p>
              <div className="flex items-center space-x-2">
                <span className="text-gray-500 font-medium">Status:</span>
                <span className="font-medium text-[#C8A45D]">{primaryCase.stage}</span>
              </div>
              <p className="text-[11px] text-gray-600 font-medium pt-1 italic">{getNextActionMessage(primaryCase.stage)}</p>
            </div>
          )}
        </div>

        {/* Visual Application Progress Tracker */}
        <div className="space-y-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Application Progress Timeline</p>
          
          <div className="relative flex items-center justify-between w-full max-w-3xl mx-auto py-4">
            {/* Timeline Line */}
            <div className="absolute left-0 right-0 h-[2px] bg-gray-200 z-0 top-1/2 -translate-y-1/2" />
            
            {/* Highlighted Timeline Line */}
            {primaryCase && activeStep > 0 && (
              <div 
                className="absolute left-0 h-[2px] bg-[#C8A45D] z-0 top-1/2 -translate-y-1/2 transition-all duration-500" 
                style={{ width: `${(activeStep / (trackerSteps.length - 1)) * 100}%` }}
              />
            )}

            {trackerSteps.map((step, idx) => {
              const isCompleted = primaryCase && idx < activeStep;
              const isCurrent = primaryCase && idx === activeStep;

              return (
                <div key={step} className="flex flex-col items-center relative z-10 space-y-2.5">
                  {/* Step Dot */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 text-xs font-semibold ${
                    isCompleted 
                      ? "bg-[#C8A45D] border-[#C8A45D] text-white" 
                      : isCurrent 
                        ? "bg-white border-[#C8A45D] text-[#C8A45D] ring-4 ring-[#C8A45D]/10" 
                        : "bg-white border-gray-300 text-gray-400"
                  }`}>
                    {isCompleted ? "✓" : idx + 1}
                  </div>
                  {/* Step Title */}
                  <span className={`text-[10px] font-medium uppercase tracking-widest ${
                    isCurrent 
                      ? "text-[#C8A45D]" 
                      : isCompleted 
                        ? "text-[#1A1A1A]" 
                        : "text-gray-400"
                  }`}>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Redesigned Statistics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Active Cases */}
        <div className="portal-card p-5 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-medium uppercase tracking-widest text-[#666666]">Active Cases</span>
            <p className="text-3xl font-semibold text-[#1A1A1A]">{activeCases.length}</p>
          </div>
          <div className="p-3 rounded-xl bg-[#F7F5F1] text-[#C8A45D] border border-[#E7E1D6]">
            <FileText className="h-5.5 w-5.5" />
          </div>
        </div>

        {/* Card 2: Pending Documents */}
        <div className="portal-card p-5 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-medium uppercase tracking-widest text-[#666666]">Pending Documents</span>
            <p className="text-3xl font-semibold text-[#1A1A1A]">{pendingDocsCount}</p>
          </div>
          <div className="p-3 rounded-xl bg-[#F7F5F1] text-[#C8A45D] border border-[#E7E1D6]">
            <UploadCloud className="h-5.5 w-5.5" />
          </div>
        </div>

        {/* Card 3: Upcoming Appointments */}
        <div className="portal-card p-5 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-medium uppercase tracking-widest text-[#666666]">Appointments</span>
            <p className="text-3xl font-semibold text-[#1A1A1A]">{upcomingApptsCount}</p>
          </div>
          <div className="p-3 rounded-xl bg-[#F7F5F1] text-[#C8A45D] border border-[#E7E1D6]">
            <Calendar className="h-5.5 w-5.5" />
          </div>
        </div>

        {/* Card 4: Unread Messages */}
        <div className="portal-card p-5 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-medium uppercase tracking-widest text-[#666666]">Unread Messages</span>
            <p className="text-3xl font-semibold text-[#1A1A1A]">{unreadMessagesCount}</p>
          </div>
          <div className={`p-3 rounded-xl border transition-colors ${
            unreadMessagesCount > 0 
              ? "bg-[#C8A45D]/10 text-[#C8A45D] border-[#C8A45D]/30" 
              : "bg-[#F7F5F1] text-[#C8A45D] border-[#E7E1D6]"
          }`}>
            <MessageSquare className="h-5.5 w-5.5" />
          </div>
        </div>
      </div>

      {/* Main Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Applications List Rows Section (2/3 Width) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-[#E7E1D6] rounded-[20px] p-6 shadow-sm space-y-5">
            <div className="flex justify-between items-center border-b border-[#E7E1D6]/60 pb-3">
              <h3 className="text-base font-semibold text-[#1A1A1A]">Active Application Portfolios</h3>
              <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">{activeCases.length} Cases</span>
            </div>

            <div className="space-y-4">
              {activeCases.map((c) => {
                const updatedDate = c.createdAt?.toDate ? c.createdAt.toDate() : c.createdAt;
                return (
                  <div 
                    key={c.id} 
                    className="p-5 bg-white border border-[#E7E1D6] rounded-xl flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 hover:border-[#C8A45D] hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center space-x-4">
                      {/* Flag Avatar */}
                      <div className="h-12 w-12 rounded-xl bg-[#F7F5F1] flex items-center justify-center text-2xl border border-[#E7E1D6] shrink-0">
                        {getCountryFlag(c.destination || c.visaType)}
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono font-semibold text-[#C8A45D] uppercase tracking-wider">{c.caseNo}</span>
                        <h4 className="text-sm font-semibold text-[#1A1A1A]">{c.visaType}</h4>
                        <span className="text-[10px] text-gray-500 block">
                          Updated: {formatShortDate(updatedDate)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end space-x-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
                      <PortalStatusBadge status={c.stage} />
                      <Link
                        to={`/portal/applications/${c.id}`}
                        className="flex items-center space-x-1 px-4 py-2 rounded-lg bg-[#F7F5F1] border border-[#E7E1D6] hover:border-[#C8A45D] hover:text-[#C8A45D] text-xs font-semibold uppercase tracking-wider transition-all"
                      >
                        <span>Details</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}

              {activeCases.length === 0 && (
                <div className="text-center py-12 text-xs text-gray-400 italic">
                  No active visa files registered. Start a draft or request assistance from your consultant.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modern Quick Actions Column (1/3 Width) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-[#E7E1D6] rounded-[20px] p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-[#1A1A1A] border-b border-[#E7E1D6]/60 pb-2 uppercase tracking-wider">Concierge Services</h3>
            
            <div className="space-y-3">
              {/* Service 1: New Application */}
              <button 
                onClick={() => navigate("/portal/applications")} 
                className="w-full flex items-center justify-between px-5 py-4 bg-white border border-[#E7E1D6] hover:border-[#C8A45D] rounded-xl shadow-sm hover:shadow transition-all group"
              >
                <span className="flex items-center space-x-3.5 text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]">
                  <Plus className="h-4.5 w-4.5 text-[#C8A45D]" />
                  <span>New Application</span>
                </span>
                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-[#C8A45D] transition-colors" />
              </button>

              {/* Service 2: Upload Documents */}
              <button 
                onClick={() => navigate("/portal/documents")} 
                className="w-full flex items-center justify-between px-5 py-4 bg-white border border-[#E7E1D6] hover:border-[#C8A45D] rounded-xl shadow-sm hover:shadow transition-all group"
              >
                <span className="flex items-center space-x-3.5 text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]">
                  <UploadCloud className="h-4.5 w-4.5 text-[#C8A45D]" />
                  <span>Upload Documents</span>
                </span>
                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-[#C8A45D] transition-colors" />
              </button>

              {/* Service 3: Schedule Appointment */}
              <button 
                onClick={() => navigate("/portal/appointments")} 
                className="w-full flex items-center justify-between px-5 py-4 bg-white border border-[#E7E1D6] hover:border-[#C8A45D] rounded-xl shadow-sm hover:shadow transition-all group"
              >
                <span className="flex items-center space-x-3.5 text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]">
                  <Calendar className="h-4.5 w-4.5 text-[#C8A45D]" />
                  <span>Schedule Appointment</span>
                </span>
                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-[#C8A45D] transition-colors" />
              </button>

              {/* Service 4: Contact Consultant */}
              <button 
                onClick={() => navigate("/portal/messages")} 
                className="w-full flex items-center justify-between px-5 py-4 bg-white border border-[#E7E1D6] hover:border-[#C8A45D] rounded-xl shadow-sm hover:shadow transition-all group"
              >
                <span className="flex items-center space-x-3.5 text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]">
                  <MessageSquare className="h-4.5 w-4.5 text-[#C8A45D]" />
                  <span>Contact Consultant</span>
                </span>
                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-[#C8A45D] transition-colors" />
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default PortalDashboard;
