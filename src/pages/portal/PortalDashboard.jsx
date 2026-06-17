import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import {
  FileText, UploadCloud, Calendar, DollarSign,
  MessageSquare, HelpCircle, ChevronRight, CheckCircle2,
  Bell, CreditCard, Settings, Compass, Briefcase
} from "lucide-react";
import KPICard from "../../components/ui/KPICard";
import StatusBadge from "../../components/ui/StatusBadge";
import { formatCurrency } from "../../utils/formatters";
import toast from "react-hot-toast";
import { auth } from "../../lib/firebase";
import { getApplicationsForCustomer } from "../../lib/firestore";

export const PortalDashboard = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [activeCases, setActiveCases] = useState([]);
  const [draftsCount, setDraftsCount] = useState(0);
  const [pendingDocsCount, setPendingDocsCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [appointments, setAppointments] = useState([]);

  // Fetch drafts & unread notifications
  useEffect(() => {
    if (!auth.currentUser?.uid) return;

    const unsubscribeApps = getApplicationsForCustomer(auth.currentUser.uid, (data) => {
      const activeDrafts = data.filter(app => app.status === "Draft");
      setDraftsCount(activeDrafts.length);
    });

    const notifRef = collection(db, "notifications");
    const qNotif = query(notifRef, where("userId", "==", auth.currentUser.uid), where("read", "==", false));
    const unsubscribeNotif = onSnapshot(qNotif, (snapshot) => {
      setUnreadNotificationsCount(snapshot.size);
    });

    return () => {
      unsubscribeApps();
      unsubscribeNotif();
    };
  }, []);

  // Fetch appointments for the customer
  useEffect(() => {
    if (!userProfile?.email) return;

    const appRef = collection(db, "appointments");
    const q = query(appRef, where("email", "==", userProfile.email.toLowerCase()));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAppointments(list);
      } else {
        setAppointments([]);
      }
    }, (error) => {
      console.warn("Error fetching appointments:", error);
      setAppointments([]);
    });

    return () => unsubscribe();
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
          checklist: b.checklist || []
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

  return (
    <div className="space-y-6 font-sans">

      {/* Welcome Banner */}
      <div className="glass-card p-6 border border-secondary/15 relative overflow-hidden bg-gradient-to-r from-primary-container to-primary-container">
        <div className="relative z-10 space-y-2">
          <h1 className="text-xl sm:text-2xl font-display font-bold text-white">
            Good morning, {userProfile?.name || "Client"}
          </h1>
          <p className="text-xs text-on-primary-container/60 max-w-lg leading-relaxed">
            Track your passport status, upload VFS documents or message your dedicated visa consultant from your secure portal dashboard.
          </p>
        </div>
        <div className="absolute -bottom-16 -right-16 h-40 w-40 bg-secondary-container/5 blur-3xl rounded-full"></div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <KPICard title="Active Cases" value={activeCases.length} icon="FileText" color="green" />
        <KPICard title="Draft Applications" value={draftsCount} icon="Edit3" color="gold" />
        <KPICard title="New Notifications" value={unreadNotificationsCount} icon="Bell" color={unreadNotificationsCount > 0 ? "red" : "gold"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Active Cases Details (2/3) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass-card p-6 border border-on-primary-fixed-variant/60 space-y-4">
            <h3 className="text-base font-semibold text-white border-b border-on-primary-fixed-variant pb-2">Active Applications</h3>

            <div className="space-y-4">
              {activeCases.map((c) => (
                <div key={c.id} className="p-4 bg-white/5 border border-outline-variant/10 rounded-card flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 hover:border-secondary/20 transition-all">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-secondary">{c.caseNo}</span>
                    <h4 className="text-sm font-semibold text-white">{c.visaType} - {c.destination}</h4>
                    <span className="text-[10px] text-on-primary-container/50 block">Current Stage: {c.stage}</span>
                  </div>
                  <div className="flex items-center space-x-3 self-end sm:self-center">
                    <StatusBadge status={c.stage} />
                    <Link
                      to={`/portal/applications/${c.id}`}
                      className="p-1.5 rounded-lg bg-primary-container border border-on-primary-fixed-variant hover:border-secondary/40 text-secondary transition-all"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
              {activeCases.length === 0 && (
                <div className="text-center py-6 text-xs text-on-primary-container/40 italic">No applications active currently.</div>
              )}
            </div>
          </div>

          {/* Appointments Details */}
          <div className="glass-card p-6 border border-on-primary-fixed-variant/60 space-y-4">
            <div className="flex justify-between items-center border-b border-on-primary-fixed-variant pb-2">
              <h3 className="text-base font-semibold text-white">Upcoming Consultations</h3>
              <Link to="/portal/appointments" className="text-xs text-secondary hover:underline flex items-center gap-1">
                <span>View All</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="space-y-4">
              {appointments.slice(0, 3).map((app) => (
                <div key={app.id} className="p-4 bg-white/5 border border-outline-variant/10 rounded-card flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 hover:border-secondary/20 transition-all">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded bg-secondary-container/10 border border-secondary/20 text-secondary">
                      <Calendar className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white font-mono">{app.time}</h4>
                      <span className="text-[10px] text-on-primary-container/40 uppercase tracking-widest">{app.type} ({app.consultant || "Staff Advisor"})</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 self-end sm:self-center">
                    <span className="text-xs text-on-primary-container/60 font-mono">{app.date}</span>
                    <StatusBadge status={app.status} />
                  </div>
                </div>
              ))}
              {appointments.length === 0 && (
                <div className="text-center py-6 text-xs text-on-primary-container/40 italic">
                  No upcoming sessions booked. <Link to="/portal/appointments" className="text-secondary hover:underline">Book a session</Link> to get started.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick actions (1/3) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card p-6 border border-on-primary-fixed-variant/60 space-y-4">
            <h3 className="text-sm font-semibold text-white border-b border-on-primary-fixed-variant pb-2">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3.5 text-xs text-center">
              <button onClick={() => navigate("/portal/applications")} className="p-4 bg-primary-container hover:bg-primary-container/80 border border-outline-variant/10 rounded hover:border-secondary/25 transition-all text-on-primary-container font-semibold space-y-2 flex flex-col justify-center items-center">
                <FileText className="h-5 w-5 text-secondary" />
                <span>Applications</span>
              </button>
              <button onClick={() => navigate("/portal/settings")} className="p-4 bg-primary-container hover:bg-primary-container/80 border border-outline-variant/10 rounded hover:border-secondary/25 transition-all text-on-primary-container font-semibold space-y-2 flex flex-col justify-center items-center">
                <Settings className="h-5 w-5 text-secondary" />
                <span>Settings</span>
              </button>
              <button onClick={() => navigate("/portal/appointments")} className="p-4 bg-primary-container hover:bg-primary-container/80 border border-outline-variant/10 rounded hover:border-secondary/25 transition-all text-on-primary-container font-semibold space-y-2 flex flex-col justify-center items-center">
                <Calendar className="h-5 w-5 text-secondary" />
                <span>Appointments</span>
              </button>
              <button onClick={() => navigate("/portal/payments")} className="p-4 bg-primary-container hover:bg-primary-container/80 border border-outline-variant/10 rounded hover:border-secondary/25 transition-all text-on-primary-container font-semibold space-y-2 flex flex-col justify-center items-center">
                <CreditCard className="h-5 w-5 text-secondary" />
                <span>Payments</span>
              </button>
              <button onClick={() => navigate("/portal/messages")} className="p-4 bg-primary-container hover:bg-primary-container/80 border border-outline-variant/10 rounded hover:border-secondary/25 transition-all text-on-primary-container font-semibold space-y-2 flex flex-col justify-center items-center">
                <MessageSquare className="h-5 w-5 text-secondary" />
                <span>Message Advisor</span>
              </button>
              <button onClick={() => navigate("/portal/notifications")} className="p-4 bg-primary-container hover:bg-primary-container/80 border border-outline-variant/10 rounded hover:border-secondary/25 transition-all text-[#F5F1E8] hover:text-white font-semibold space-y-2 flex flex-col justify-center items-center">
                <div className="relative">
                  <Bell className="h-5 w-5 text-secondary" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-2 w-2 items-center justify-center rounded-full bg-red-500"></span>
                  )}
                </div>
                <span>Notifications</span>
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default PortalDashboard;
