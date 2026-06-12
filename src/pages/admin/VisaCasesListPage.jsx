import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../contexts/AuthContext";
import { Search, FileSpreadsheet, Plus, AlertCircle } from "lucide-react";
import StatusBadge from "../../components/ui/StatusBadge";
import FilterBar from "../../components/ui/FilterBar";
import SearchInput from "../../components/ui/SearchInput";
import { CASE_STAGES } from "../../utils/constants";
import { formatShortDate } from "../../utils/formatters";
import toast from "react-hot-toast";

export const VisaCasesListPage = () => {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const isVisaOps = userProfile?.role === "visa_ops";

  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({ stage: "All", assignedOfficer: "All" });

  useEffect(() => {
    if (!user) return;
    const casesRef = collection(db, "visa_cases");
    let q = query(casesRef, where("isDeleted", "==", false));
    if (isVisaOps) {
      q = query(casesRef, where("isDeleted", "==", false), where("assignedOfficerId", "==", user.uid));
    }
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCases(items);
      setLoading(false);
    }, (error) => {
      console.warn("Error loading visa cases:", error);
      setCases([]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredCases = cases.filter(c => {
    const matchesSearch = 
      c.travellerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.caseNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.destination?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStage = filters.stage === "All" || c.stage === filters.stage;
    return matchesSearch && matchesStage;
  });

  const getStageProgress = (stage) => {
    switch (stage) {
      case "Docs Pending": return 20;
      case "Verification": return 40;
      case "Submitted": return 60;
      case "Awaiting Decision": return 80;
      case "Approved": return 100;
      default: return 10;
    }
  };

  const overdueCount = cases.filter(c => {
    if (!c.expectedDecisionAt) return false;
    const date = c.expectedDecisionAt.seconds 
      ? new Date(c.expectedDecisionAt.seconds * 1000) 
      : new Date(c.expectedDecisionAt);
    return date < new Date() && !["Approved", "Rejected", "Withdrawn"].includes(c.stage);
  }).length;

  const filterConfigs = [
    {
      key: "stage",
      label: "Stage",
      value: filters.stage,
      options: Object.values(CASE_STAGES).map(s => ({ value: s, label: s }))
    }
  ];

  return (
    <div className="space-y-6 font-sans">
      
      {/* Overdue alert */}
      {overdueCount > 0 && (
        <div className="flex items-center space-x-2 p-4 bg-danger/10 border border-danger/20 rounded-card text-danger text-sm">
          <AlertCircle className="h-5 w-5 flex-shrink-0 animate-pulse" />
          <span>Warning: {overdueCount} case(s) are overdue for visa outcome decision!</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-wide">Visa Cases</h1>
          <p className="text-xs text-on-primary-container/50">Track documents collection, submissions, slot timings, and consulate outputs.</p>
        </div>
        <button
          onClick={() => navigate("/admin/leads")}
          className="px-4 py-2 bg-gradient-to-r from-secondary-container to-secondary-container text-on-primary-fixed font-bold text-xs rounded-button flex items-center space-x-1.5 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>New Case from Lead</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="w-full md:max-w-xs">
          <SearchInput
            placeholder="Search cases by name, case no..."
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </div>
        <div className="w-full md:w-auto">
          <FilterBar
            filters={filterConfigs}
            onChange={(newF) => setFilters(prev => ({ ...prev, ...newF }))}
            onClearAll={() => setFilters({ stage: "All", assignedOfficer: "All" })}
          />
        </div>
      </div>

      {/* Cases Table */}
      <div className="overflow-x-auto rounded-card border border-on-primary-fixed-variant bg-primary-container/40">
        <table className="min-w-full divide-y divide-outline-variant/15 text-left text-sm text-on-primary-container">
          <thead className="bg-primary-container/80 uppercase text-xs font-semibold text-on-primary-container/60 font-sans tracking-wider">
            <tr>
              <th className="px-6 py-4">Case #</th>
              <th className="px-6 py-4">Client Name</th>
              <th className="px-6 py-4">Visa Type</th>
              <th className="px-6 py-4">Destination</th>
              <th className="px-6 py-4">Officer</th>
              <th className="px-6 py-4">Stage</th>
              <th className="px-6 py-4">Progress %</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/15 bg-transparent">
            {filteredCases.map((c) => (
              <tr key={c.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-mono font-bold text-secondary text-xs">{c.caseNo}</td>
                <td className="px-6 py-4 font-semibold text-white">{c.travellerName}</td>
                <td className="px-6 py-4 text-xs">{c.visaType}</td>
                <td className="px-6 py-4 text-xs font-semibold">{c.destination}</td>
                <td className="px-6 py-4 text-xs">{c.assignedOfficer || "Unassigned"}</td>
                <td className="px-6 py-4"><StatusBadge status={c.stage} /></td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-primary-container h-2 rounded-full overflow-hidden border border-on-primary-fixed-variant">
                      <div className="bg-secondary-container h-2 rounded-full" style={{ width: `${getStageProgress(c.stage)}%` }}></div>
                    </div>
                    <span className="text-[10px] font-mono text-on-primary-container/50">{getStageProgress(c.stage)}%</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => navigate(`/admin/cases/${c.id}`)}
                    className="px-3 py-1 bg-white/5 border border-on-primary-fixed-variant hover:border-secondary hover:text-secondary text-on-primary-container text-[10px] font-bold uppercase rounded transition-colors"
                  >
                    Manage
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default VisaCasesListPage;
