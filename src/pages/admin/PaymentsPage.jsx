import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, addDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { CreditCard, Landmark, DollarSign, Plus, Search, FileText, Send } from "lucide-react";
import StatusBadge from "../../components/ui/StatusBadge";
import KPICard from "../../components/ui/KPICard";
import SearchInput from "../../components/ui/SearchInput";
import Modal from "../../components/ui/Modal";
import { formatCurrency, formatShortDate } from "../../utils/formatters";
import toast from "react-hot-toast";

export const PaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchVal, setSearchVal] = useState("");
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    invoiceNo: "",
    clientName: "",
    clientEmail: "",
    service: "Schengen Visa",
    amount: "",
    method: "Card",
    status: "Paid"
  });

  useEffect(() => {
    const pRef = collection(db, "payments");
    const unsubscribe = onSnapshot(pRef, (snapshot) => {
      if (!snapshot.empty) {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPayments(items);
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
  }, []);

  const handleRecordSubmit = async (e) => {
    e.preventDefault();
    if (!paymentForm.invoiceNo || !paymentForm.amount) return;

    try {
      const payRef = collection(db, "payments");
      await addDoc(payRef, {
        invoiceNo: paymentForm.invoiceNo,
        clientName: paymentForm.clientName,
        clientEmail: paymentForm.clientEmail.toLowerCase(),
        service: paymentForm.service,
        amount: Number(paymentForm.amount),
        method: paymentForm.method,
        status: paymentForm.status,
        date: new Date(),
        dueDate: new Date()
      });
      toast.success("Payment recorded successfully!");
      setIsRecordOpen(false);
      setPaymentForm({
        invoiceNo: "",
        clientName: "",
        clientEmail: "",
        service: "Schengen Visa",
        amount: "",
        method: "Card",
        status: "Paid"
      });
    } catch (err) {
      console.error(err);
      toast.error("Error logging payment receipt");
    }
  };

  const handleReminder = (clientName, phone) => {
    toast.success(`WhatsApp reminder template link prepared for ${clientName}`);
  };

  const filteredPayments = payments.filter(p => 
    p.clientName?.toLowerCase().includes(searchVal.toLowerCase()) ||
    p.invoiceNo?.toLowerCase().includes(searchVal.toLowerCase())
  );

  const today = new Date();
  
  const todayCollections = payments
    .filter(p => {
       const d = p.date?.toDate ? p.date.toDate() : new Date(p.date);
       return p.status === "Paid" && d.toDateString() === today.toDateString();
    })
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const monthCollections = payments
    .filter(p => {
       const d = p.date?.toDate ? p.date.toDate() : new Date(p.date);
       return p.status === "Paid" && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    })
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const outstandingOverdue = payments
    .filter(p => p.status === "Overdue")
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const pendingDrafts = payments.filter(p => p.status === "Draft").length;

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-wide">Payments Ledger</h1>
          <p className="text-xs text-on-primary-container/50">Log invoice drafts, confirm cards processing and record cashier transactions.</p>
        </div>
        <button
          onClick={() => setIsRecordOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-secondary-container to-secondary-container text-on-primary-fixed font-bold text-xs rounded-button flex items-center space-x-1.5 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Record Receipt</span>
        </button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        <KPICard title="Today's Collections" value={`${formatCurrency(todayCollections)}`} icon="CreditCard" color="green" />
        <KPICard title="Month Collections" value={`${formatCurrency(monthCollections)}`} icon="TrendingUp" color="gold" />
        <KPICard title="Outstanding Overdue" value={`${formatCurrency(outstandingOverdue)}`} icon="AlertTriangle" color="red" />
        <KPICard title="Pending Drafts" value={`${pendingDrafts} invoices`} icon="Landmark" color="orange" />
      </div>

      {/* Search Bar */}
      <div className="w-full max-w-xs">
        <SearchInput
          placeholder="Search by invoice # or client name..."
          value={searchVal}
          onChange={setSearchVal}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-card border border-on-primary-fixed-variant bg-primary-container/40">
        <table className="min-w-full divide-y divide-outline-variant/15 text-left text-sm text-on-primary-container">
          <thead className="bg-primary-container/80 uppercase text-xs font-semibold text-on-primary-container/60 tracking-wider">
            <tr>
              <th className="px-6 py-4">Invoice #</th>
              <th className="px-6 py-4">Client Name</th>
              <th className="px-6 py-4">Service</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Method</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/15 bg-transparent">
            {filteredPayments.map((p) => (
              <tr key={p.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-mono font-bold text-secondary text-xs">{p.invoiceNo}</td>
                <td className="px-6 py-4 font-semibold text-white">{p.clientName}</td>
                <td className="px-6 py-4 text-xs">{p.service}</td>
                <td className="px-6 py-4 font-mono font-semibold">{formatCurrency(p.amount)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                    p.method === "Online Link" ? "bg-secondary-container/10 text-secondary" : "bg-white/5 text-on-primary-container/60"
                  }`}>
                    {p.method}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs font-mono">{formatShortDate(p.date)}</td>
                <td className="px-6 py-4"><StatusBadge status={p.status} /></td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button
                    onClick={() => handleReminder(p.clientName)}
                    className="p-1 rounded bg-white/5 border border-on-primary-fixed-variant hover:border-secondary text-secondary"
                    title="Send WhatsApp Reminder"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Record payment modal */}
      <Modal
        isOpen={isRecordOpen}
        onClose={() => setIsRecordOpen(false)}
        title="Record Payment Receipt"
        size="sm"
      >
        <form onSubmit={handleRecordSubmit} className="space-y-4 font-sans text-xs">
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-on-primary-container/50 uppercase">Invoice Ref #</label>
            <input
              type="text"
              required
              placeholder="e.g. PAY-20260601-001"
              className="px-3 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container rounded focus:outline-none focus:border-secondary font-mono"
              value={paymentForm.invoiceNo}
              onChange={(e) => setPaymentForm({ ...paymentForm, invoiceNo: e.target.value })}
            />
          </div>
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-on-primary-container/50 uppercase">Client Name</label>
            <input
              type="text"
              required
              placeholder="Full name"
              className="px-3 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container rounded focus:outline-none focus:border-secondary"
              value={paymentForm.clientName}
              onChange={(e) => setPaymentForm({ ...paymentForm, clientName: e.target.value })}
            />
          </div>
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-on-primary-container/50 uppercase">Client Email</label>
            <input
              type="email"
              required
              placeholder="client@example.com"
              className="px-3 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container rounded focus:outline-none focus:border-secondary"
              value={paymentForm.clientEmail}
              onChange={(e) => setPaymentForm({ ...paymentForm, clientEmail: e.target.value })}
            />
          </div>
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-on-primary-container/50 uppercase">Amount Received (AED)</label>
            <input
              type="number"
              required
              placeholder="e.g. 450"
              className="px-3 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container rounded focus:outline-none focus:border-secondary"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
            />
          </div>
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-on-primary-container/50 uppercase">Payment Method</label>
            <select
              className="px-3 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container rounded focus:outline-none focus:border-secondary"
              value={paymentForm.method}
              onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
            >
              <option value="Card">Credit/Debit Card</option>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Online Link">Online Stripe Link</option>
            </select>
          </div>

          <div className="flex space-x-3 pt-4 border-t border-on-primary-fixed-variant">
            <button
              type="button"
              onClick={() => setIsRecordOpen(false)}
              className="flex-1 py-2.5 bg-on-primary-fixed-variant border border-on-primary-fixed-variant text-on-primary-container font-semibold rounded text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-gradient-to-r from-secondary-container to-secondary-container text-on-primary-fixed font-bold rounded text-xs shadow-sm"
            >
              Confirm Log
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default PaymentsPage;
