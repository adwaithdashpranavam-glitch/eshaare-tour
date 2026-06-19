import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import {
  FileText, UploadCloud, Calendar, DollarSign,
  MessageSquare, ChevronRight, CheckCircle2,
  Bell, CreditCard, Settings, Compass, Briefcase, Phone, Mail
} from "lucide-react";
import StatusBadge from "../../components/ui/StatusBadge";
import { formatCurrency, formatShortDate } from "../../utils/formatters";
import toast from "react-hot-toast";
import { auth } from "../../lib/firebase";
import { getApplicationsForCustomer } from "../../lib/firestore";

const PUBLIC_CONSULTANTS = {
  "Sarah Johnson": {
    name: "Sarah Johnson",
    designation: "Senior Visa Specialist",
    phone: "+971501234567",
    email: "support@esharetour.com",
    initials: "SJ"
  },
  "Suresh Kumar": {
    name: "Suresh Kumar",
    designation: "Senior Visa Specialist",
    phone: "+971501234567",
    email: "suresh@eshaareuae.com",
    initials: "SK"
  },
  "Rakhi G Hari": {
    name: "Rakhi G Hari",
    designation: "Managing Director",
    phone: "+971501234567",
    email: "rakhi@eshaareuae.com",
    initials: "RH"
  },
  "Aisha Al-Mansoori": {
    name: "Aisha Al-Mansoori",
    designation: "Luxury Tour Consultant",
    phone: "+971501234567",
    email: "aisha@eshaareuae.com",
    initials: "AA"
  },
  "Hassan Ali": {
    name: "Hassan Ali",
    designation: "VFS Operations Lead",
    phone: "+971501234567",
    email: "hassan@eshaareuae.com",
    initials: "HA"
  }
};

export const PortalDashboard = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [activeCases, setActiveCases] = useState([]);
  const [draftsCount, setDraftsCount] = useState(0);
  const [pendingDocsCount, setPendingDocsCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [appointmentsCount, setAppointmentsCount] = useState(0);
  const [paymentsCount, setPaymentsCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [consultant, setConsultant] = useState(null);

  // Fetch drafts, notifications, appointments, and payments
  useEffect(() => {
    if (!auth.currentUser?.uid) return;

    const unsubscribeApps = getApplicationsForCustomer(auth.currentUser.uid, (data) => {
      const activeDrafts = data.filter(app => app.status === "Draft");
      setDraftsCount(activeDrafts.length);
    });

    const notifRef = collection(db, "notifications");
    const qNotif = query(notifRef, where("userId", "==", auth.currentUser.uid));
    const unsubscribeNotif = onSnapshot(qNotif, (snapshot) => {
      const unread = snapshot.docs.filter(doc => !doc.data().read).length;
      setUnreadNotificationsCount(unread);
      
      const list = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
        .slice(0, 3);
      setRecentNotifications(list);
    });

    // Fetch Appointments
    const appRef = collection(db, "appointments");
    const qApp = query(appRef, where("email", "==", userProfile?.email?.toLowerCase() || ""));
    const unsubscribeApp = onSnapshot(qApp, (snapshot) => {
      setAppointmentsCount(snapshot.size);
    });

    // Fetch Payments
    const pRef = collection(db, "payments");
    const qPay = query(pRef, where("clientEmail", "==", userProfile?.email?.toLowerCase() || ""));
    const unsubscribePay = onSnapshot(qPay, (snapshot) => {
      setPaymentsCount(snapshot.size);
    });

    return () => {
      unsubscribeApps();
      unsubscribeNotif();
      unsubscribeApp();
      unsubscribePay();
    };
  }, [userProfile]);

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
      setLoading(false);
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

    return () => {
      unsubCases();
      unsubBookings();
    };
  }, [userProfile]);

  useEffect(() => {
    if (activeCases.length === 0) {
      setConsultant(null);
      return;
    }
    const firstCase = activeCases[0];
    const officerName = firstCase?.assignedOfficer || firstCase?.assignedOfficerName;
    if (officerName && PUBLIC_CONSULTANTS[officerName]) {
      setConsultant(PUBLIC_CONSULTANTS[officerName]);
    } else {
      setConsultant(null);
    }
  }, [activeCases]);

  // Visa tracker configuration
  const TRACKER_STAGES = [
    "Profile Completed",
    "Documents Uploaded",
    "Application Submitted",
    "Appointment Confirmed",
    "Under Review",
    "Decision Pending",
    "Passport Collection"
  ];

  const sampleCase = activeCases[0];

  const getStageIndex = (stageName) => {
    if (!stageName) return 0;
    const idx = TRACKER_STAGES.findIndex(s => stageName.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(stageName.toLowerCase()));
    return idx !== -1 ? idx : 4; // Under Review is default
  };

  const currentStageIdx = sampleCase ? getStageIndex(sampleCase.stage) : 0;
  const completionPercentage = sampleCase
    ? Math.round(((currentStageIdx + 1) / TRACKER_STAGES.length) * 100)
    : 100;

  return (
    <div className="space-y-8 font-sans">
      
      {/* Welcome Hero Card */}
      <div className="bg-white border border-[#E5E7EB] rounded-[24px] p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
        <div className="space-y-3 max-w-xl text-center md:text-left">
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#C6A969]">Premium Visa Concierge</span>
          <h1 className="text-2xl md:text-3xl font-semibold text-[#1A1A1A]">
            Good Morning, {userProfile?.name || "Client"}
          </h1>
          <p className="text-sm text-[#6B7280] leading-relaxed">
            Track your visa applications, appointments, documents and consultant communications from one secure portal.
          </p>
          {activeCases.length > 0 ? (
            <div className="pt-2 text-xs font-semibold text-[#0F3D2E] flex items-center justify-center md:justify-start gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#C6A969]"></span>
              <span>Current Case Progress: {completionPercentage}%</span>
            </div>
          ) : (
            <div className="pt-2 text-xs font-semibold text-[#0F3D2E] flex items-center justify-center md:justify-start gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
              <span>Profile Completion: 100% (Verified)</span>
            </div>
          )}
        </div>

        {/* Right side: Progress Ring */}
        <div className="flex-shrink-0 bg-[#F8F6F2] p-4 rounded-full">
          <div className="relative w-28 h-28 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="56"
                cy="56"
                r="46"
                className="stroke-gray-200"
                strokeWidth="5"
                fill="transparent"
              />
              <circle
                cx="56"
                cy="56"
                r="46"
                className={activeCases.length > 0 ? "stroke-[#0F3D2E]" : "stroke-green-600"}
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 46}
                strokeDashoffset={2 * Math.PI * 46 * (1 - (activeCases.length > 0 ? completionPercentage : 100) / 100)}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.8s ease-in-out" }}
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-xl font-bold text-[#0F3D2E]">
                {activeCases.length > 0 ? `${completionPercentage}%` : "100%"}
              </span>
              <span className="text-[9px] text-[#6B7280] uppercase tracking-widest font-bold">
                {activeCases.length > 0 ? "Complete" : "Profile"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Section (4 modern KPI cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Card 1 */}
        <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-5 flex flex-col justify-between hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B7280]">Active Applications</span>
            <div className="p-2 bg-[#F8F6F2] rounded-lg text-[#0F3D2E]">
              <FileText className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-semibold text-[#1A1A1A]">{activeCases.length.toString().padStart(2, '0')}</h3>
            <p className="text-[10px] text-gray-500 font-semibold mt-1">Submitted cases</p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-5 flex flex-col justify-between hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B7280]">Appointments</span>
            <div className="p-2 bg-[#F8F6F2] rounded-lg text-[#0F3D2E]">
              <Calendar className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-semibold text-[#1A1A1A]">{appointmentsCount.toString().padStart(2, '0')}</h3>
            <p className="text-[10px] text-gray-500 font-semibold mt-1">Scheduled sessions</p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-5 flex flex-col justify-between hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B7280]">Pending Documents</span>
            <div className="p-2 bg-[#F8F6F2] rounded-lg text-[#C6A969]">
              <UploadCloud className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-semibold text-[#1A1A1A]">{pendingDocsCount.toString().padStart(2, '0')}</h3>
            <p className="text-[10px] text-[#C6A969] font-semibold mt-1">Required uploads</p>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-5 flex flex-col justify-between hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B7280]">Payments</span>
            <div className="p-2 bg-[#F8F6F2] rounded-lg text-[#0F3D2E]">
              <CreditCard className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-semibold text-[#1A1A1A]">{paymentsCount.toString().padStart(2, '0')}</h3>
            <p className="text-[10px] text-green-600 font-semibold mt-1">Invoiced charges</p>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (70%) */}
        <div className="lg:col-span-8 space-y-8">
          {activeCases.length > 0 ? (
            <>
              {/* Visa Progress Card */}
              <div className="bg-white border border-[#E5E7EB] rounded-[24px] p-6 shadow-sm space-y-6">
                <div className="flex justify-between items-start border-b border-[#E5E7EB] pb-4">
                  <div>
                    <span className="text-[10px] font-bold text-[#C6A969] uppercase tracking-wider">Active File Status</span>
                    <h3 className="text-lg font-semibold text-[#1A1A1A] mt-0.5">
                      {sampleCase.visaType} — {sampleCase.destination}
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-[#0F3D2E] px-3 py-1 bg-[#0F3D2E]/10 rounded-full">
                    {sampleCase.stage}
                  </span>
                </div>

                {/* Stage Timeline representation */}
                <div className="relative pl-6 border-l-2 border-[#E5E7EB]/80 space-y-6">
                  {TRACKER_STAGES.map((stage, idx) => {
                    const isCompleted = idx < currentStageIdx;
                    const isActive = idx === currentStageIdx;
                    return (
                      <div key={stage} className="relative flex items-center justify-between">
                        {/* Circle bullet */}
                        <div
                          className={`absolute -left-[31px] w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center bg-white transition-colors duration-300 ${
                            isCompleted
                              ? "border-[#0F3D2E] bg-[#0F3D2E]"
                              : isActive
                              ? "border-[#C6A969] bg-white shadow-sm"
                              : "border-gray-300"
                          }`}
                        >
                          {isCompleted && (
                            <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                          )}
                        </div>

                        <span
                          className={`text-xs font-semibold transition-all ${
                            isCompleted
                              ? "text-gray-400"
                              : isActive
                              ? "text-[#0F3D2E] font-bold text-sm"
                              : "text-[#6B7280]"
                          }`}
                        >
                          {stage}
                        </span>

                        {isActive && (
                          <span className="text-[9px] bg-[#C6A969]/10 text-[#C6A969] border border-[#C6A969]/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                            Current Stage
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Applications Table */}
              <div className="bg-white border border-[#E5E7EB] rounded-[24px] p-6 shadow-sm space-y-4 overflow-hidden">
                <div className="flex justify-between items-center border-b border-[#E5E7EB] pb-3">
                  <h3 className="text-base font-semibold text-[#1A1A1A]">Recent Applications</h3>
                  <Link to="/portal/applications" className="text-xs font-bold text-[#0F3D2E] hover:text-[#C6A969] transition-all">
                    View All
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-xs text-[#1A1A1A]">
                    <thead>
                      <tr className="border-b border-[#E5E7EB] text-[#6B7280] font-semibold uppercase tracking-wider">
                        <th className="py-3 pr-4">Application</th>
                        <th className="py-3 px-4">Country</th>
                        <th className="py-3 px-4">Submitted Date</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 pl-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]/50">
                      {activeCases.slice(0, 4).map((c) => (
                        <tr key={c.id} className="hover:bg-[#F8F6F2]/30 transition-colors">
                          <td className="py-3.5 pr-4 font-semibold text-[#1A1A1A]">
                            {c.visaType}
                          </td>
                          <td className="py-3.5 px-4 text-[#6B7280]">
                            {c.destination || "Worldwide"}
                          </td>
                          <td className="py-3.5 px-4 text-gray-500 font-mono">
                            {formatShortDate(c.createdAt)}
                          </td>
                          <td className="py-3.5 px-4">
                            <StatusBadge status={c.stage} />
                          </td>
                          <td className="py-3.5 pl-4 text-right">
                            <Link
                              to={`/portal/applications/${c.id}`}
                              className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-[#0F3D2E] hover:text-[#C6A969] transition-colors"
                            >
                              <span>Track</span>
                              <ChevronRight className="h-3 w-3 ml-0.5" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            /* Empty State */
            <div className="bg-white border border-[#E5E7EB] rounded-[24px] p-8 text-center shadow-sm space-y-6 flex flex-col items-center justify-center min-h-[300px]">
              <div className="h-16 w-16 rounded-2xl bg-[#F8F6F2] flex items-center justify-center text-[#C6A969]">
                <FileText className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-[#1A1A1A]">No Active Visa Applications</h3>
                <p className="text-sm text-[#6B7280] max-w-sm">You have not submitted any visa applications yet.</p>
              </div>
              <button
                onClick={() => navigate("/visa-services")}
                className="px-6 py-3 bg-[#0F3D2E] text-white hover:bg-[#0F3D2E]/90 font-bold uppercase tracking-wider text-xs rounded-xl shadow-sm transition-colors"
              >
                Start New Application
              </button>
            </div>
          )}
        </div>

        {/* Right Column (30%) */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Quick Actions Card */}
          <div className="bg-white border border-[#E5E7EB] rounded-[24px] p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-[#1A1A1A] border-b border-[#E5E7EB] pb-2">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <button 
                onClick={() => navigate("/visa-services")} 
                className="p-4 bg-[#F8F6F2] hover:bg-[#0F3D2E]/5 rounded-xl border border-transparent hover:border-[#0F3D2E]/10 transition-all font-semibold space-y-2 flex flex-col justify-center items-center text-center"
              >
                <Compass className="h-5 w-5 text-[#0F3D2E]" />
                <span>New Application</span>
              </button>
              
              <button 
                onClick={() => navigate("/portal/documents")} 
                className="p-4 bg-[#F8F6F2] hover:bg-[#0F3D2E]/5 rounded-xl border border-transparent hover:border-[#0F3D2E]/10 transition-all font-semibold space-y-2 flex flex-col justify-center items-center text-center"
              >
                <UploadCloud className="h-5 w-5 text-[#C6A969]" />
                <span>Upload Documents</span>
              </button>
              
              <button 
                onClick={() => navigate("/portal/appointments")} 
                className="p-4 bg-[#F8F6F2] hover:bg-[#0F3D2E]/5 rounded-xl border border-transparent hover:border-[#0F3D2E]/10 transition-all font-semibold space-y-2 flex flex-col justify-center items-center text-center"
              >
                <Calendar className="h-5 w-5 text-[#0F3D2E]" />
                <span>Book Session</span>
              </button>
              
              <button 
                onClick={() => navigate("/portal/messages")} 
                className="p-4 bg-[#F8F6F2] hover:bg-[#0F3D2E]/5 rounded-xl border border-transparent hover:border-[#0F3D2E]/10 transition-all font-semibold space-y-2 flex flex-col justify-center items-center text-center"
              >
                <MessageSquare className="h-5 w-5 text-[#0F3D2E]" />
                <span>Contact advisor</span>
              </button>
            </div>
          </div>

          {/* Consultant Card */}
          {consultant && (
            <div className="bg-white border border-[#E5E7EB] rounded-[24px] p-6 shadow-sm space-y-5">
              <h3 className="text-sm font-semibold text-[#1A1A1A] border-b border-[#E5E7EB] pb-2">Your Consultant</h3>
              <div className="flex items-center space-x-3.5">
                {/* Luxury gold avatar styling */}
                <div className="h-12 w-12 rounded-full bg-[#0F3D2E] text-[#C6A969] border border-[#C6A969]/30 font-bold flex items-center justify-center shadow-inner text-sm">
                  {consultant.initials}
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-[#1A1A1A]">{consultant.name}</h4>
                  <p className="text-[10px] text-[#6B7280] font-medium mt-0.5">{consultant.designation}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 pt-1">
                {consultant.phone && (
                  <a 
                    href={`tel:${consultant.phone}`} 
                    className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-[#E5E7EB] hover:border-[#0F3D2E] text-xs font-semibold text-[#1A1A1A] hover:bg-[#F8F6F2]/30 transition-all"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#0F3D2E]" />
                    <span>Call Concierge</span>
                  </a>
                )}
                
                {consultant.phone && (
                  <a 
                    href={`https://wa.me/${consultant.phone.replace(/[^\d]/g, "")}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-transparent bg-[#0F3D2E] hover:bg-[#0F3D2E]/95 text-xs font-semibold text-white transition-all shadow-sm"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#C6A969]" />
                    <span>WhatsApp Advisor</span>
                  </a>
                )}

                {consultant.email && (
                  <a 
                    href={`mailto:${consultant.email}`} 
                    className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-[#E5E7EB] hover:border-[#0F3D2E] text-xs font-semibold text-[#1A1A1A] hover:bg-[#F8F6F2]/30 transition-all"
                  >
                    <Mail className="w-3.5 h-3.5 text-[#6B7280]" />
                    <span>Send Email</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Notifications Card */}
          <div className="bg-white border border-[#E5E7EB] rounded-[24px] p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-[#E5E7EB] pb-2">
              <h3 className="text-sm font-semibold text-[#1A1A1A]">Latest Updates</h3>
              <Link to="/portal/notifications" className="text-[10px] font-bold text-[#0F3D2E] hover:underline">
                View All
              </Link>
            </div>
            
            <div className="relative pl-4 border-l border-[#E5E7EB] space-y-5 py-2">
              {recentNotifications.map((n) => (
                <div key={n.id} className="relative space-y-0.5">
                  <div className="absolute -left-[20.5px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#C6A969]"></div>
                  <h4 className="text-xs font-semibold text-[#1A1A1A] leading-none">{n.title}</h4>
                  <p className="text-[10px] text-[#6B7280] leading-snug">{n.message}</p>
                </div>
              ))}
              {recentNotifications.length === 0 && (
                <p className="text-xs text-gray-500 italic">No updates available.</p>
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default PortalDashboard;
