import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../lib/firebase";
import { collection, onSnapshot, query, where, orderBy, limit, getCountFromServer } from "firebase/firestore";
import { 
  Users, FileText, CalendarCheck, AlertTriangle, 
  TrendingUp, BarChart3, AlertCircle, ArrowUpRight,
  Package, Building, Tag, ShieldAlert
} from "lucide-react";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { 
  LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from "recharts";

export const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  
  // Real-time snapshot KPIs
  const [kpis, setKpis] = useState({
    newLeads: 0,
    activeCases: 0,
    appointmentsToday: 0,
    pendingDocs: 0,
    revenue: 45000,
    successRate: 98,
    overdueCases: 1,
    staffOnline: 6
  });

  // Firestore counter stats (from user template)
  const [stats, setStats] = useState({
    totalPackages: 0,
    activePackages: 0,
    featuredPackages: 0,
    totalLeads: 0,
    newLeads: 0,
    totalAppointments: 0,
    totalVisas: 0,
    totalClients: 0,
    totalBookings: 0,
    activeOffers: 0,
    totalHotels: 0,
  });

  // Funnel & Chart Data
  const funnelData = [
    { name: "New", count: 32, fill: "#378ADD" },
    { name: "Contacted", count: 24, fill: "#EDB868" },
    { name: "Qualified", count: 18, fill: "#EAC784" },
    { name: "Won", count: 12, fill: "#1D9E75" }
  ];

  const revenueData = [
    { date: "May 10", amt: 12000 },
    { date: "May 15", amt: 18000 },
    { date: "May 20", amt: 24000 },
    { date: "May 25", amt: 35000 },
    { date: "May 30", amt: 45000 }
  ];

  const casesPieData = [
    { name: "Docs Pending", value: 5, color: "#EDB868" },
    { name: "Verification", value: 4, color: "#378ADD" },
    { name: "Submitted", value: 12, color: "#EAC784" },
    { name: "Awaiting Decision", value: 3, color: "#EDB868" }
  ];

  const [recentLeads, setRecentLeads] = useState([
    { id: "1", contactName: "Amit Sharma", source: "WhatsApp", stage: "New", createdAt: new Date() },
    { id: "2", contactName: "Sarah Connor", source: "Website", stage: "Contacted", createdAt: new Date() },
    { id: "3", contactName: "Habib Al-Fardan", source: "Referral", stage: "Qualified", createdAt: new Date() }
  ]);

  const [upcomingAppointments, setUpcomingAppointments] = useState([
    { id: "1", clientName: "Amit Sharma", time: "10:30 AM", type: "Video Call" },
    { id: "2", clientName: "Zayn Malik", time: "02:00 PM", type: "In-Person" }
  ]);

  useEffect(() => {
    // 1. Fetch analytic counts (Safe from non-existent collections)
    const fetchAnalytics = async () => {
      let totalPkgs = 0;
      let activePkgs = 0;
      let featuredPkgs = 0;
      let totalLeadsCount = 0;
      let newLeadsCount = 0;
      let totalAppts = 0;
      let totalVisasCount = 0;
      let totalClientsCount = 0;
      let totalBookingsCount = 0;
      let activeOffersCount = 0;
      let totalHotelsCount = 0;

      try {
        const [
          totalPkgsSnap,
          activePkgsSnap,
          featuredPkgsSnap,
          totalLeadsSnap,
          newLeadsSnap,
          totalApptsSnap,
          totalVisasSnap,
          totalClientsSnap,
          totalBookingsSnap,
          activeOffersSnap,
          totalHotelsSnap
        ] = await Promise.all([
          getCountFromServer(collection(db, "packages")).catch(() => ({ data: () => ({ count: 0 }) })),
          getCountFromServer(query(collection(db, "packages"), where("active", "==", true))).catch(() => ({ data: () => ({ count: 0 }) })),
          getCountFromServer(query(collection(db, "packages"), where("featured", "==", true))).catch(() => ({ data: () => ({ count: 0 }) })),
          getCountFromServer(collection(db, "leads")).catch(() => ({ data: () => ({ count: 0 }) })),
          getCountFromServer(query(collection(db, "leads"), where("stage", "==", "New"))).catch(() => ({ data: () => ({ count: 0 }) })),
          getCountFromServer(collection(db, "appointments")).catch(() => ({ data: () => ({ count: 0 }) })),
          getCountFromServer(collection(db, "visa_cases")).catch(() => ({ data: () => ({ count: 0 }) })),
          getCountFromServer(query(collection(db, "users"), where("role", "==", "client"))).catch(() => ({ data: () => ({ count: 0 }) })),
          getCountFromServer(collection(db, "bookings")).catch(() => ({ data: () => ({ count: 0 }) })),
          getCountFromServer(query(collection(db, "offers"), where("active", "==", true))).catch(() => ({ data: () => ({ count: 0 }) })),
          getCountFromServer(collection(db, "hotels")).catch(() => ({ data: () => ({ count: 0 }) }))
        ]);

        totalPkgs = totalPkgsSnap.data().count;
        activePkgs = activePkgsSnap.data().count;
        featuredPkgs = featuredPkgsSnap.data().count;
        totalLeadsCount = totalLeadsSnap.data().count;
        newLeadsCount = newLeadsSnap.data().count;
        totalAppts = totalApptsSnap.data().count;
        totalVisasCount = totalVisasSnap.data().count;
        totalClientsCount = totalClientsSnap.data().count;
        totalBookingsCount = totalBookingsSnap.data().count;
        activeOffersCount = activeOffersSnap.data().count;
        totalHotelsCount = totalHotelsSnap.data().count;

      } catch (error) {
        console.error("Error fetching dashboard counts:", error);
      }

      setStats({
        totalPackages: totalPkgs,
        activePackages: activePkgs,
        featuredPackages: featuredPkgs,
        totalLeads: totalLeadsCount,
        newLeads: newLeadsCount,
        totalAppointments: totalAppts,
        totalVisas: totalVisasCount,
        totalClients: totalClientsCount,
        totalBookings: totalBookingsCount,
        activeOffers: activeOffersCount,
        totalHotels: totalHotelsCount
      });
    };

    fetchAnalytics();

    // 2. Real-time snapshot listener for Leads
    const leadsRef = collection(db, "leads");
    const qLeads = query(leadsRef, where("isDeleted", "==", false), limit(20));
    const unsubscribeLeads = onSnapshot(qLeads, (snapshot) => {
      if (!snapshot.empty) {
        const leads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const newToday = leads.filter(l => l.stage === "New").length;
        setKpis(prev => ({
          ...prev,
          newLeads: newToday
        }));
        
        const sortedLeads = leads
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
          .slice(0, 5);
        if (sortedLeads.length > 0) {
          setRecentLeads(sortedLeads);
        }
      }
      setLoading(false);
    }, (error) => {
      console.warn("Real-time snapshot error (using mock config):", error);
      setLoading(false);
    });

    // 3. Real-time listener for Cases
    const casesRef = collection(db, "visa_cases");
    const qCases = query(casesRef, where("isDeleted", "==", false));
    const unsubscribeCases = onSnapshot(qCases, (snapshot) => {
      if (!snapshot.empty) {
        const cases = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const active = cases.filter(c => !["Approved", "Rejected", "Withdrawn"].includes(c.stage)).length;
        const pending = cases.filter(c => c.stage === "Docs Pending").length;
        setKpis(prev => ({
          ...prev,
          activeCases: active,
          pendingDocs: pending
        }));
      }
    }, () => {});

    return () => {
      unsubscribeLeads();
      unsubscribeCases();
    };
  }, []);

  if (loading) {
    return <LoadingSpinner message="Entering CRM Dashboard..." />;
  }

  return (
    <div className="space-y-8 font-sans">
      
      {/* Header Info */}
      <div>
        <h1 className="text-3xl font-bold text-white">
          Admin Dashboard
        </h1>
        <p className="mt-2 text-gray-400">
          Overview of packages, leads, bookings, and business activity.
        </p>
      </div>

      {/* Overdue Alert Banner */}
      {kpis.overdueCases > 0 && (
        <div className="flex items-center justify-between p-4 bg-danger/10 border border-danger/20 rounded-2xl text-danger text-sm">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0 animate-bounce" />
            <span className="font-semibold">Attention: 1 Visa Case has passed its decision expected date with no outcome updated.</span>
          </div>
          <Link 
            to="/admin/cases"
            className="text-xs font-bold underline uppercase tracking-wider hover:text-danger/80 transition-colors"
          >
            Review Case
          </Link>
        </div>
      )}

      {/* STATS ANALYTICS GRID */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <div className="rounded-3xl bg-white/5 p-6 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Packages</p>
              <Package className="h-5 w-5 text-gray-400" />
            </div>
            <h2 className="mt-3 text-4xl font-bold text-white">{stats.totalPackages}</h2>
          </div>
          <p className="mt-4 text-xs text-green-400 font-medium">{stats.activePackages} Active • {stats.featuredPackages} Featured</p>
        </div>

        <div className="rounded-3xl bg-white/5 p-6 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Leads</p>
              <Users className="h-5 w-5 text-orange-400" />
            </div>
            <h2 className="mt-3 text-4xl font-bold text-orange-400">{stats.totalLeads}</h2>
          </div>
          <p className="mt-4 text-xs text-red-400 font-medium">{stats.newLeads} New Inbox</p>
        </div>

        <div className="rounded-3xl bg-white/5 p-6 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Visas & Appts</p>
              <FileText className="h-5 w-5 text-[#e68932]" />
            </div>
            <h2 className="mt-3 text-4xl font-bold text-[#e68932]">{stats.totalVisas}</h2>
          </div>
          <p className="mt-4 text-xs text-blue-400 font-medium">{stats.totalAppointments} Consultation Bookings</p>
        </div>

        <div className="rounded-3xl bg-white/5 p-6 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Registered Clients</p>
              <Users className="h-5 w-5 text-purple-400" />
            </div>
            <h2 className="mt-3 text-4xl font-bold text-purple-400">{stats.totalClients}</h2>
          </div>
          <p className="mt-4 text-xs text-purple-300 font-medium">Active client accounts</p>
        </div>

        <div className="rounded-3xl bg-white/5 p-6 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Client Bookings</p>
              <TrendingUp className="h-5 w-5 text-green-400" />
            </div>
            <h2 className="mt-3 text-4xl font-bold text-green-400">{stats.totalBookings}</h2>
          </div>
          <p className="mt-4 text-xs text-gray-400 font-medium">Packages purchased</p>
        </div>

        <div className="rounded-3xl bg-white/5 p-6 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Hotels</p>
              <Building className="h-5 w-5 text-blue-400" />
            </div>
            <h2 className="mt-3 text-4xl font-bold text-blue-400">{stats.totalHotels}</h2>
          </div>
          <p className="mt-4 text-xs text-blue-300 font-medium">Stays registered</p>
        </div>

        <div className="rounded-3xl bg-white/5 p-6 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Active Promo Offers</p>
              <Tag className="h-5 w-5 text-yellow-400" />
            </div>
            <h2 className="mt-3 text-4xl font-bold text-yellow-400">{stats.activeOffers}</h2>
          </div>
          <p className="mt-4 text-xs text-yellow-300 font-medium">Showcased on homepage</p>
        </div>
      </div>

      {/* QUICK OPERATIONS MANAGEMENT */}
      <div className="rounded-3xl bg-white/5 p-6 border border-white/10 space-y-4">
        <h3 className="text-lg font-bold text-white">Quick Operations Management</h3>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Link
            to="/admin/packages"
            className="rounded-2xl bg-[#e68932] p-5 text-white font-semibold transition hover:opacity-90 flex items-center justify-between shadow-lg"
          >
            <span>Packages Manager</span>
            <span className="text-xs bg-black/20 px-2 py-0.5 rounded">{stats.totalPackages}</span>
          </Link>
          <Link
            to="/admin/hotels"
            className="rounded-2xl bg-blue-600 p-5 text-white font-semibold transition hover:opacity-90 flex items-center justify-between shadow-lg"
          >
            <span>Hotels Manager</span>
            <span className="text-xs bg-black/20 px-2 py-0.5 rounded">{stats.totalHotels}</span>
          </Link>
          <Link
            to="/admin/offers"
            className="rounded-2xl bg-yellow-600 p-5 text-black font-bold transition hover:opacity-90 flex items-center justify-between shadow-lg"
          >
            <span>Offers Manager</span>
            <span className="text-xs bg-black/20 px-2 py-0.5 rounded">{stats.activeOffers}</span>
          </Link>
          <Link
            to="/admin/leads"
            className="rounded-2xl bg-white/10 border border-white/5 p-5 text-white font-semibold transition hover:bg-white/15 flex items-center justify-between"
          >
            <span>Leads Inbox</span>
            <span className="text-xs bg-white/10 px-2 py-0.5 rounded">{stats.totalLeads}</span>
          </Link>
        </div>
      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Revenue Trend Area */}
        <div className="lg:col-span-8 bg-white/5 rounded-3xl p-6 border border-white/10 flex flex-col justify-between">
          <h3 className="text-base font-semibold text-white mb-4">Revenue Trend (30 Days)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#453E1D" />
                <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: 10 }} />
                <YAxis stroke="#9ca3af" style={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: "#2C2712", borderColor: "#453E1D", borderRadius: "12px", color: "#fff" }} labelStyle={{ color: "#fff" }} />
                <Line type="monotone" dataKey="amt" stroke="#EAC784" strokeWidth={3} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Visa Breakdown Donut */}
        <div className="lg:col-span-4 bg-white/5 rounded-3xl p-6 border border-white/10 flex flex-col justify-between">
          <h3 className="text-base font-semibold text-white mb-4">Visa Cases Breakdown</h3>
          <div className="h-60 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={casesPieData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {casesPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#2C2712", borderColor: "#453E1D", borderRadius: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px] uppercase font-bold text-gray-400 pt-4 border-t border-white/10">
            {casesPieData.map((e, idx) => (
              <div key={idx} className="flex items-center space-x-1">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: e.color }}></span>
                <span>{e.name}: {e.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* WIDGETS DETAILS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Appointments list */}
        <div className="lg:col-span-4 bg-white/5 rounded-3xl p-6 border border-white/10 space-y-4">
          <div className="flex justify-between items-center border-b border-white/10 pb-2">
            <h3 className="text-sm font-semibold text-white">Today's Appointments</h3>
            <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-[10px] font-bold uppercase">
              {upcomingAppointments.length} Today
            </span>
          </div>
          <div className="divide-y divide-white/5">
            {upcomingAppointments.map((app) => (
              <div key={app.id} className="py-3 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">{app.clientName}</h4>
                  <span className="text-[10px] text-gray-400 uppercase font-medium">{app.type}</span>
                </div>
                <span className="text-xs font-mono font-bold text-[#e68932]">{app.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Lead funnel status */}
        <div className="lg:col-span-4 bg-white/5 rounded-3xl p-6 border border-white/10 space-y-4">
          <h3 className="text-sm font-semibold text-white border-b border-white/10 pb-2">Lead Sales Funnel</h3>
          <div className="space-y-3 pt-2">
            {funnelData.map((stage) => (
              <div key={stage.name} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-gray-400">{stage.name}</span>
                  <span className="text-white">{stage.count} leads</span>
                </div>
                <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden border border-white/10">
                  <div className="h-2 rounded-full" style={{ width: `${(stage.count / 32) * 100}%`, backgroundColor: stage.fill }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Leads */}
        <div className="lg:col-span-4 bg-white/5 rounded-3xl p-6 border border-white/10 space-y-4">
          <h3 className="text-sm font-semibold text-white border-b border-white/10 pb-2">Recent Leads</h3>
          <div className="divide-y divide-white/5">
            {recentLeads.slice(0, 3).map((lead) => (
              <div key={lead.id} className="py-3 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">{lead.contactName}</h4>
                  <span className="text-[10px] text-gray-400 uppercase font-medium">Source: {lead.source}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#e68932]/10 border border-[#e68932]/25 text-[9px] font-bold text-[#e68932] uppercase">
                  {lead.stage}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
