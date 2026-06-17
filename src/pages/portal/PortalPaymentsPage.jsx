import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { CreditCard, Download } from "lucide-react";
import { formatCurrency, formatShortDate } from "../../utils/formatters";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import toast from "react-hot-toast";

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
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${currentStyle}`}>
      {s}
    </span>
  );
};

export const PortalPaymentsPage = () => {
  const { userProfile } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.email) return;

    const pRef = collection(db, "payments");
    const q = query(pRef, where("clientEmail", "==", userProfile.email.toLowerCase()));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } else {
        setPayments([]);
      }
      setLoading(false);
    }, (error) => {
      console.warn("Error fetching payments lists:", error);
      setPayments([]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile]);

  const handleStripePay = (url) => {
    toast.success("Redirecting to secure Stripe payment gateway...");
    window.open(url || "https://stripe.com", "_blank");
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-[#1A1A1A] tracking-wide">Payments & Invoices</h1>
        <p className="text-xs text-gray-500">Manage transaction ledgers, settle outstanding billing balances and download receipt PDFs.</p>
      </div>

      {/* Invoices List */}
      <div className="overflow-x-auto rounded-[20px] border border-[#E7E1D6] bg-white shadow-sm">
        <table className="min-w-full divide-y divide-[#E7E1D6] text-left text-sm text-[#1A1A1A]">
          <thead className="bg-[#F7F5F1] uppercase text-[10px] font-bold text-[#666666] tracking-wider">
            <tr>
              <th className="px-6 py-4">Receipt #</th>
              <th className="px-6 py-4">Service</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Method</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-transparent">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-8">
                  <LoadingSpinner message="Retrieving billing invoices..." />
                </td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-xs text-gray-400 italic">
                  No invoices or payments recorded.
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id} className="hover:bg-[#F7F5F1]/30 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-[#C8A45D] text-xs">{p.invoiceNo}</td>
                  <td className="px-6 py-4 font-semibold text-[#1A1A1A]">{p.service}</td>
                  <td className="px-6 py-4 font-mono font-semibold">{formatCurrency(p.amount)}</td>
                  <td className="px-6 py-4 text-xs text-gray-600 font-medium">{p.method}</td>
                  <td className="px-6 py-4 text-xs text-gray-600 font-medium">{formatShortDate(p.date || p.createdAt)}</td>
                  <td className="px-6 py-4"><PortalStatusBadge status={p.status} /></td>
                  <td className="px-6 py-4 text-right">
                    {p.status !== "Paid" ? (
                      <button
                        onClick={() => handleStripePay(p.paymentLinkUrl)}
                        className="px-3.5 py-1.5 bg-[#C8A45D] hover:bg-[#b08e4f] text-white font-bold text-[10px] uppercase rounded-lg flex items-center space-x-1 ml-auto shadow-sm transition-all"
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        <span>Pay Now</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => toast.success("Invoice PDF download started")}
                        className="p-2 rounded-lg bg-[#F7F5F1] border border-[#E7E1D6] text-[#C8A45D] hover:border-[#C8A45D] hover:bg-white transition-all inline-flex items-center justify-center"
                        title="Download PDF"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default PortalPaymentsPage;
