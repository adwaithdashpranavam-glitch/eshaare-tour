import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { Plus, Search, Eye } from "lucide-react";
import SearchInput from "../../components/ui/SearchInput";
import StatusBadge from "../../components/ui/StatusBadge";
import { formatCurrency, formatShortDate } from "../../utils/formatters";

export const QuotationsListPage = () => {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchVal, setSearchVal] = useState("");

  useEffect(() => {
    const qRef = collection(db, "quotations");
    const unsubscribe = onSnapshot(qRef, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setQuotes(items);
      setLoading(false);
    }, (error) => {
      console.warn("Using mock quotations fallback list:", error);
      setQuotes([
        { id: "1", quoteNo: "QT-20260601-001", clientName: "Amit Sharma", amount: 1500, approvalStatus: "Draft", createdAt: new Date() },
        { id: "2", quoteNo: "QT-20260528-002", clientName: "Sarah Connor", amount: 1850, approvalStatus: "Sent", createdAt: new Date() }
      ]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredQuotes = quotes.filter(q => 
    q.clientName?.toLowerCase().includes(searchVal.toLowerCase()) ||
    q.quoteNo?.toLowerCase().includes(searchVal.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-wide">Quotations</h1>
          <p className="text-xs text-on-primary-container/50">Create and dispatch service pricing quotes to leads.</p>
        </div>
        <Link
          to="/admin/quotations/new"
          className="px-4 py-2 bg-gradient-to-r from-secondary-container to-secondary-container text-on-primary-fixed font-bold text-xs rounded-button flex items-center space-x-1.5 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Create Quote</span>
        </Link>
      </div>

      <div className="w-full max-w-xs">
        <SearchInput
          placeholder="Search quotes by client name..."
          value={searchVal}
          onChange={setSearchVal}
        />
      </div>

      <div className="overflow-x-auto rounded-card border border-on-primary-fixed-variant bg-primary-container/40">
        <table className="min-w-full divide-y divide-outline-variant/15 text-left text-sm text-on-primary-container">
          <thead className="bg-primary-container/80 uppercase text-xs font-semibold text-on-primary-container/60 tracking-wider">
            <tr>
              <th className="px-6 py-4">Quote #</th>
              <th className="px-6 py-4">Client Name</th>
              <th className="px-6 py-4">Total Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Created Date</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/15 bg-transparent">
            {filteredQuotes.map((q) => (
              <tr key={q.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-mono font-bold text-secondary text-xs">{q.quoteNo}</td>
                <td className="px-6 py-4 font-semibold text-white">{q.clientName}</td>
                <td className="px-6 py-4 font-mono">{formatCurrency(q.amount)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    q.approvalStatus === "Draft" ? "bg-primary-container text-on-primary-container/50" : "bg-success/10 text-success"
                  }`}>
                    {q.approvalStatus}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs font-mono">{formatShortDate(q.createdAt)}</td>
                <td className="px-6 py-4 text-right">
                  <Link
                    to={`/admin/quotations/new?leadId=${q.id}`}
                    className="px-3 py-1 bg-white/5 border border-on-primary-fixed-variant hover:border-secondary hover:text-secondary text-[10px] font-bold uppercase rounded transition-colors"
                  >
                    Edit / Send
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default QuotationsListPage;
