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
  const [nextAppointment, setNextAppointment] = useState("No upcoming slots");
  const [outstandingBalance, setOutstandingBalance] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

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

  useEffect(() => {
    if (!userProfile?.email) return;

    const casesRef = collection(db, "visa_cases");
    const q = query(casesRef, where("travellerEmail", "==", userProfile.email.toLowerCase()));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setActiveCases(items);

        // Calculate pending docs count
        const totalPending = items.reduce((acc, curr) => {
          const pending = curr.checklist?.filter(d => d.status === "Pending" || d.status === "Rejected").length || 0;
          return acc + pending;
        }, 0);
        setPendingDocsCount(totalPending);
      } else {
        setActiveCases([]);
        setPendingDocsCount(0);
      }
      setLoading(false);
    }, (error) => {
      console.warn("Error fetching traveller details:", error);
      setActiveCases([]);
      setPendingDocsCount(0);
      setLoading(false);
    });

    return () => unsubscribe();
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Active Cases" value={activeCases.length} icon="FileText" color="green" />
        <KPICard title="Draft Applications" value={draftsCount} icon="Edit3" color="gold" />
        <KPICard title="Pending Uploads" value={pendingDocsCount} icon="UploadCloud" color={pendingDocsCount > 0 ? "orange" : "green"} />
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
              <button onClick={() => navigate("/portal/documents")} className="p-4 bg-primary-container hover:bg-primary-container/80 border border-outline-variant/10 rounded hover:border-secondary/25 transition-all text-on-primary-container font-semibold space-y-2 flex flex-col justify-center items-center">
                <UploadCloud className="h-5 w-5 text-secondary" />
                <span>Documents</span>
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
