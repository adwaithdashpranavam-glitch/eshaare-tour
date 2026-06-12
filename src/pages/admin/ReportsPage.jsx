import React, { useState } from "react";
import { BarChart3, TrendingUp, Download, ArrowUpRight, Shield } from "lucide-react";
import DateRangePicker from "../../components/ui/DateRangePicker";
import { useAuth } from "../../contexts/AuthContext";
import { 
  ResponsiveContainer, AreaChart, Area, CartesianGrid, 
  XAxis, YAxis, Tooltip, BarChart, Bar, Legend, Cell 
} from "recharts";
import toast from "react-hot-toast";

export const ReportsPage = () => {
  const { userProfile } = useAuth();
  const [dateRange, setDateRange] = useState("This Month");
  const [activeTab, setActiveTab] = useState("overview");

  const isAuthorized = ["super_admin", "admin", "manager"].includes(userProfile?.role);

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4 font-sans">
        <Shield className="h-16 w-16 text-danger animate-pulse" />
        <h1 className="text-xl font-bold text-white uppercase tracking-wide">Access Denied</h1>
        <p className="text-xs text-on-primary-container/60 max-w-md leading-relaxed">
          You do not have the required permissions to access CRM Reports & Analytics. Only Super Admins, Admins, and Managers can view analytics dashboards.
        </p>
      </div>
    );
  }

  const revenueTrend = [
    { name: "Week 1", revenue: 15000, profit: 8000 },
    { name: "Week 2", revenue: 22000, profit: 12000 },
    { name: "Week 3", revenue: 18000, profit: 9500 },
    { name: "Week 4", revenue: 35000, profit: 18000 }
  ];

  const sourceData = [
    { name: "WhatsApp", count: 48, fill: "#1D9E75" },
    { name: "Website", count: 32, fill: "#378ADD" },
    { name: "Instagram", count: 24, fill: "#E24B4A" },
    { name: "Referrals", count: 18, fill: "#7A8F6B" }
  ];

  const handleExportCSV = () => {
    toast.success("CSV Export started for reports data!");
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-wide">CRM Reports & Analytics</h1>
          <p className="text-xs text-on-primary-container/50">Perform auditing analyses on sales, team throughput and approval rates.</p>
        </div>

        <div className="flex items-center space-x-3 self-end sm:self-center">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 border border-on-primary-fixed-variant hover:border-secondary text-secondary text-xs font-bold rounded-button flex items-center space-x-1.5 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-outline-variant/10 pb-2">
        {["overview", "revenue", "leads", "performance"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === tab 
                ? "border-secondary text-secondary" 
                : "border-transparent text-on-primary-container/40 hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Revenue Chart */}
          <div className="lg:col-span-8 glass-card p-6 border border-on-primary-fixed-variant/60">
            <h3 className="text-base font-semibold text-white mb-4">Revenue & Profit Margins</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrend}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7A8F6B" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#7A8F6B" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4D4740" />
                  <XAxis dataKey="name" stroke="#F5F1E8" style={{ fontSize: 10 }} />
                  <YAxis stroke="#F5F1E8" style={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: "#2B2723", borderColor: "#4D4740" }} />
                  <Area type="monotone" dataKey="revenue" stroke="#7A8F6B" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2.5} />
                  <Area type="monotone" dataKey="profit" stroke="#1D9E75" fillOpacity={0} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Lead Sources breakdown */}
          <div className="lg:col-span-4 glass-card p-6 border border-on-primary-fixed-variant/60 flex flex-col justify-between">
            <h3 className="text-base font-semibold text-white mb-4">Lead Source Channels</h3>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sourceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4D4740" />
                  <XAxis dataKey="name" stroke="#F5F1E8" style={{ fontSize: 10 }} />
                  <YAxis stroke="#F5F1E8" style={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: "#2B2723", borderColor: "#4D4740" }} />
                  <Bar dataKey="count" fill="#7A8F6B" radius={[4, 4, 0, 0]}>
                    {sourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default ReportsPage;
