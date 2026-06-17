import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { CreditCard, Download } from "lucide-react";
import StatusBadge from "../../components/ui/StatusBadge";
import { formatCurrency, formatShortDate } from "../../utils/formatters";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import toast from "react-hot-toast";

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
    <div className="space-y-8 font-sans">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#1A1A1A]">Payments & Invoices</h1>
        <p className="text-xs text-[#6B7280]">Manage transaction ledgers, settle outstanding billing balances and download receipt PDFs.</p>
      </div>

      {/* Invoices List */}
      <div className="overflow-x-auto rounded-[24px] border border-[#E5E7EB] bg-white shadow-sm">
        <table className="min-w-full divide-y divide-[#E5E7EB] text-left text-sm text-[#1A1A1A]">
          <thead className="bg-[#F8F6F2] uppercase text-[10px] font-bold text-[#6B7280] tracking-wider">
            <tr>
              <th className="px-6 py-4.5">Receipt #</th>
              <th className="px-6 py-4.5">Service</th>
              <th className="px-6 py-4.5">Amount</th>
              <th className="px-6 py-4.5">Method</th>
              <th className="px-6 py-4.5">Date</th>
              <th className="px-6 py-4.5">Status</th>
              <th className="px-6 py-4.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]/50 bg-transparent text-xs">
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
                <tr key={p.id} className="hover:bg-[#F8F6F2]/30 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-[#C6A969] text-xs">{p.invoiceNo}</td>
                  <td className="px-6 py-4 font-semibold text-[#1A1A1A]">{p.service}</td>
                  <td className="px-6 py-4 font-mono font-bold text-[#0F3D2E]">{formatCurrency(p.amount)}</td>
                  <td className="px-6 py-4 text-xs font-mono text-[#6B7280]">{p.method}</td>
                  <td className="px-6 py-4 text-xs font-mono text-gray-500">{formatShortDate(p.date || p.createdAt)}</td>
                  <td className="px-6 py-4"><StatusBadge status={p.status} /></td>
                  <td className="px-6 py-4 text-right">
                    {p.status !== "Paid" ? (
                      <button
                        onClick={() => handleStripePay(p.paymentLinkUrl)}
                        className="px-4 py-2 bg-[#0F3D2E] text-white hover:bg-[#0F3D2E]/90 font-bold text-[10px] uppercase rounded-xl flex items-center space-x-1.5 ml-auto shadow-sm transition-colors"
                      >
                        <CreditCard className="h-3 w-3 text-[#C6A969]" />
                        <span>Pay Now</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => toast.success("Invoice PDF download started")}
                        className="p-2 rounded-xl bg-[#F8F6F2] hover:bg-[#0F3D2E]/5 border border-[#E5E7EB] text-[#0F3D2E] hover:text-[#C6A969] transition-all ml-auto block"
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
