import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { doc, onSnapshot, updateDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { 
  ArrowLeft, Calendar, FileText, CheckCircle2, 
  AlertTriangle, MessageCircle, DollarSign, RefreshCw 
} from "lucide-react";
import { CASE_STAGES, VISA_REQUIREMENTS } from "../../utils/constants";
import { formatCurrency, formatDate } from "../../utils/formatters";
import StatusBadge from "../../components/ui/StatusBadge";
import DocumentChecklist from "../../components/ui/DocumentChecklist";
import Modal from "../../components/ui/Modal";
import toast from "react-hot-toast";

export const CaseDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Date Fields
  const [dates, setDates] = useState({
    submissionDate: "",
    vfsAppointment: "",
    decisionExpected: "",
    actualDecision: ""
  });

  // Notes and checklist items
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [docItems, setDocItems] = useState([]);
  
  // Payment info
  const [paymentTotal, setPaymentTotal] = useState({ paid: 450, total: 450 });
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [paymentData, setPaymentData] = useState({ amount: "", method: "Card", ref: "" });

  useEffect(() => {
    // Case listener
    const docRef = doc(db, "visa_cases", id);
    const unsubscribeCase = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setCaseData({ id: snapshot.id, ...data });
        setDates({
          submissionDate: data.submissionDate || "",
          vfsAppointment: data.vfsAppointment || "",
          decisionExpected: data.decisionExpected || "",
          actualDecision: data.actualDecision || ""
        });

        // Initialize document checklist items
        const reqDocs = VISA_REQUIREMENTS[data.destination] || VISA_REQUIREMENTS.Schengen;
        const mappedDocs = reqDocs.map((docName, idx) => {
          const existingDoc = data.checklist?.find(d => d.name === docName);
          return {
            id: idx,
            name: docName,
            status: existingDoc?.status || "Pending",
            fileUrl: existingDoc?.fileUrl || "",
            rejectionReason: existingDoc?.rejectionReason || ""
          };
        });
        setDocItems(mappedDocs);
      } else {
        toast.error("Visa case not found");
        navigate("/admin/cases");
      }
      setLoading(false);
    }, (error) => {
      console.warn("Error loading visa case details:", error);
      toast.error("Error loading case details: " + error.message);
      navigate("/admin/cases");
      setLoading(false);
    });

    // Notes listener
    const notesRef = collection(db, "visa_cases", id, "notes");
    const unsubscribeNotes = onSnapshot(notesRef, (snapshot) => {
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setNotes(items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    }, () => {});

    return () => {
      unsubscribeCase();
      unsubscribeNotes();
    };
  }, [id, navigate]);

  const handleStageAdvance = async (nextStage) => {
    try {
      const docRef = doc(db, "visa_cases", id);
      await updateDoc(docRef, { stage: nextStage });
      await logInternalNote(`Visa stage advanced to ${nextStage}`);
      toast.success(`Advanced to stage: ${nextStage}`);
    } catch (err) {
      console.error(err);
      toast.error("Error advancing stage");
    }
  };

  const handleDateChange = async (fieldName, val) => {
    try {
      const docRef = doc(db, "visa_cases", id);
      await updateDoc(docRef, { [fieldName]: val });
      setDates(prev => ({ ...prev, [fieldName]: val }));
      toast.success("Timeline date updated");
    } catch (err) {
      console.error(err);
      toast.error("Error updating date");
    }
  };

  const logInternalNote = async (contentString) => {
    try {
      const notesRef = collection(db, "visa_cases", id, "notes");
      await addDoc(notesRef, {
        content: contentString,
        authorName: "Visa Officer",
        createdAt: new Date()
      });
    } catch (err) {
      console.error("Error creating internal note:", err);
    }
  };

  const handleNoteSubmit = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    await logInternalNote(newNote.trim());
    setNewNote("");
    toast.success("Note added successfully");
  };

  const handleDocVerify = async (docId) => {
    try {
      const updatedChecklist = docItems.map(item => {
        if (item.id === docId || item.name === docId) {
          return { ...item, status: "Verified", rejectionReason: "" };
        }
        return item;
      });
      await updateDoc(doc(db, "visa_cases", id), { checklist: updatedChecklist });
      setDocItems(updatedChecklist);
      await logInternalNote(`Document Verified: ${docId}`);
      toast.success("Document Verified");
    } catch (err) {
      console.error(err);
      toast.error("Error verifying document");
    }
  };

  const handleDocReject = async (docId, reason) => {
    try {
      const updatedChecklist = docItems.map(item => {
        if (item.id === docId || item.name === docId) {
          return { ...item, status: "Rejected", rejectionReason: reason };
        }
        return item;
      });
      await updateDoc(doc(db, "visa_cases", id), { checklist: updatedChecklist });
      setDocItems(updatedChecklist);
      await logInternalNote(`Document Rejected: ${docId}. Reason: ${reason}`);
      toast.success("Document Rejected");
    } catch (err) {
      console.error(err);
      toast.error("Error rejecting document");
    }
  };

  const handleDocUpload = async (docId, fileData) => {
    try {
      const updatedChecklist = docItems.map(item => {
        if (item.id === docId || item.name === docId) {
          return { ...item, status: "Uploaded", fileUrl: fileData.url };
        }
        return item;
      });
      await updateDoc(doc(db, "visa_cases", id), { checklist: updatedChecklist });
      setDocItems(updatedChecklist);
      await logInternalNote(`Document manually uploaded: ${docId}`);
      toast.success("Document Uploaded");
    } catch (err) {
      console.error(err);
      toast.error("Error uploading document");
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!paymentData.amount) return;

    try {
      const payRef = collection(db, "payments");
      await addDoc(payRef, {
        orderId: caseData.caseNo,
        invoiceNo: caseData.caseNo?.replace("VC-", "PAY-") || `PAY-${Date.now()}`,
        clientName: caseData.travellerName || "",
        clientEmail: caseData.travellerEmail?.toLowerCase() || "",
        clientUid: caseData.travellerId || "",
        service: `${caseData.visaType || caseData.destination || "Visa"} Booking`,
        amount: Number(paymentData.amount),
        method: paymentData.method,
        ref: paymentData.ref,
        status: "Paid",
        date: new Date(),
        createdAt: new Date()
      });

      setPaymentTotal(prev => ({
        ...prev,
        paid: prev.paid + Number(paymentData.amount)
      }));

      await logInternalNote(`Payment logged: ${paymentData.amount} AED via ${paymentData.method}`);
      toast.success("Payment recorded!");
      setIsRecordPaymentOpen(false);
      setPaymentData({ amount: "", method: "Card", ref: "" });
    } catch (err) {
      console.error(err);
      toast.error("Error recording payment");
    }
  };

  if (loading || !caseData) {
    return <div className="h-screen flex items-center justify-center bg-primary-container text-secondary">Retrieving case files...</div>;
  }

  // Check if expected decision date is overdue
  const isOverdue = dates.decisionExpected && new Date(dates.decisionExpected) < new Date() && !["Approved", "Rejected", "Withdrawn"].includes(caseData.stage);

  return (
    <div className="space-y-6 font-sans">
      {/* Back Link */}
      <Link 
        to="/admin/cases" 
        className="inline-flex items-center text-xs font-bold text-secondary hover:text-secondary-fixed-dim uppercase tracking-wider space-x-1"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Cases</span>
      </Link>

      {/* Case Header */}
      <div className="glass-card p-6 border border-on-primary-fixed-variant/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-display font-bold text-white leading-tight">{caseData.travellerName}</h2>
            <span className="text-[10px] font-mono text-secondary">{caseData.caseNo}</span>
          </div>
          <p className="text-xs text-on-primary-container/60 font-medium">{caseData.visaType} to {caseData.destination}</p>
        </div>
        <div className="flex flex-col space-y-1 items-end">
          <StatusBadge status={caseData.stage} />
          {caseData.priority === "Urgent" && (
            <span className="px-2 py-0.5 rounded-badge bg-danger/10 text-danger text-[9px] font-bold uppercase animate-pulse border border-danger/20 mt-1">
              Urgent Priority
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Main Side (2/3) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Stepper Progress */}
          <div className="glass-card p-4 border border-on-primary-fixed-variant/60 space-y-4">
            <h3 className="text-xs font-semibold text-on-primary-container/50 uppercase tracking-wider border-b border-on-primary-fixed-variant pb-2">
              Advance Pipeline
            </h3>
            <div className="flex flex-wrap gap-2">
              {Object.values(CASE_STAGES).map((stg) => {
                const isActive = caseData.stage === stg;
                return (
                  <button
                    key={stg}
                    onClick={() => handleStageAdvance(stg)}
                    className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                      isActive 
                        ? "bg-secondary-container border-secondary text-on-primary-fixed" 
                        : "bg-primary-container border-on-primary-fixed-variant text-on-primary-container/60 hover:text-white"
                    }`}
                  >
                    {stg}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Document Checklist */}
          <div className="glass-card p-6 border border-on-primary-fixed-variant/60 space-y-4">
            <h3 className="text-base font-semibold text-white border-b border-on-primary-fixed-variant pb-2">Required Dossier Documents</h3>
            <DocumentChecklist
              caseId={caseData.id}
              visaType={caseData.visaType}
              travellerId={caseData.travellerId}
              isAdmin={true}
            />
          </div>

          {/* Internal Notes thread */}
          <div className="glass-card p-6 border border-on-primary-fixed-variant/60 space-y-4">
            <h3 className="text-base font-semibold text-white border-b border-on-primary-fixed-variant pb-2">Internal Staff Notes</h3>
            
            <form onSubmit={handleNoteSubmit} className="flex gap-2">
              <input
                type="text"
                className="flex-grow px-3 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container placeholder-on-primary-container/30 text-xs rounded focus:outline-none focus:border-secondary font-sans"
                placeholder="Type internal staff-only follow-up note..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
              />
              <button
                type="submit"
                className="px-4 py-2 bg-secondary-container hover:bg-secondary-container text-on-primary-fixed font-bold text-xs rounded uppercase tracking-wider"
              >
                Log Note
              </button>
            </form>

            <div className="space-y-3 max-h-60 overflow-y-auto pt-2">
              {notes.map((n, idx) => (
                <div key={n.id || idx} className="p-3 bg-white/5 rounded border border-on-primary-fixed-variant/80 space-y-1">
                  <div className="flex justify-between text-[10px] text-on-primary-container/40 font-mono">
                    <span className="font-bold text-secondary">{n.authorName}</span>
                    <span>{formatDate(n.createdAt)}</span>
                  </div>
                  <p className="text-xs text-on-primary-container/85 font-sans leading-relaxed">{n.content}</p>
                </div>
              ))}
              {notes.length === 0 && (
                <div className="text-center py-4 text-xs text-on-primary-container/40 italic">No notes logged yet.</div>
              )}
            </div>
          </div>

        </div>

        {/* Sidebar Panel (1/3) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Key Dates Panel */}
          <div className="glass-card p-6 border border-on-primary-fixed-variant/60 space-y-4 font-sans text-xs">
            <h3 className="text-sm font-semibold text-white border-b border-on-primary-fixed-variant pb-2">Timeline Benchmarks</h3>
            
            <div className="space-y-3">
              <div className="flex flex-col space-y-1">
                <span className="text-[10px] text-on-primary-container/50 uppercase">Submission Date</span>
                <input
                  type="date"
                  className="bg-primary-container border border-on-primary-fixed-variant text-on-primary-container p-2 rounded text-xs focus:outline-none"
                  value={dates.submissionDate}
                  onChange={(e) => handleDateChange("submissionDate", e.target.value)}
                />
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-[10px] text-on-primary-container/50 uppercase">VFS / Embassy Appointment</span>
                <input
                  type="date"
                  className="bg-primary-container border border-on-primary-fixed-variant text-on-primary-container p-2 rounded text-xs focus:outline-none"
                  value={dates.vfsAppointment}
                  onChange={(e) => handleDateChange("vfsAppointment", e.target.value)}
                />
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-[10px] text-on-primary-container/50 uppercase">Decision Expected</span>
                <input
                  type="date"
                  className={`bg-primary-container border text-on-primary-container p-2 rounded text-xs focus:outline-none ${
                    isOverdue ? "border-danger text-danger" : "border-on-primary-fixed-variant"
                  }`}
                  value={dates.decisionExpected}
                  onChange={(e) => handleDateChange("decisionExpected", e.target.value)}
                />
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-[10px] text-on-primary-container/50 uppercase">Actual Decision</span>
                <input
                  type="date"
                  className="bg-primary-container border border-on-primary-fixed-variant text-on-primary-container p-2 rounded text-xs focus:outline-none"
                  value={dates.actualDecision}
                  onChange={(e) => handleDateChange("actualDecision", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Payment Status Panel */}
          <div className="glass-card p-6 border border-on-primary-fixed-variant/60 space-y-4">
            <h3 className="text-sm font-semibold text-white border-b border-on-primary-fixed-variant pb-2 flex justify-between items-center">
              <span>Financial Ledger</span>
              <span className="text-xs text-secondary font-mono font-bold">{paymentTotal.paid} / {paymentTotal.total} AED</span>
            </h3>
            <div className="flex space-x-3 text-xs font-sans justify-between items-center py-2">
              <span className="text-on-primary-container/60">Outstanding Balance:</span>
              <span className="text-white font-bold font-mono">{paymentTotal.total - paymentTotal.paid} AED</span>
            </div>
            <button
              onClick={() => setIsRecordPaymentOpen(true)}
              className="w-full py-2 bg-secondary-container hover:bg-secondary-container text-on-primary-fixed font-bold text-xs rounded uppercase tracking-wider shadow-sm"
            >
              Record Payment
            </button>
          </div>

        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isRecordPaymentOpen}
        onClose={() => setIsRecordPaymentOpen(false)}
        title="Record Payment"
        size="sm"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4 font-sans text-xs">
          <div className="flex flex-col space-y-1.5">
            <label className="text-[10px] font-bold text-on-primary-container/50 uppercase">Amount Received (AED)</label>
            <input
              type="number"
              required
              placeholder="e.g. 200"
              className="px-3 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container rounded focus:outline-none"
              value={paymentData.amount}
              onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
            />
          </div>
          <div className="flex flex-col space-y-1.5">
            <label className="text-[10px] font-bold text-on-primary-container/50 uppercase">Payment Method</label>
            <select
              className="px-3 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container rounded focus:outline-none"
              value={paymentData.method}
              onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })}
            >
              <option value="Card">Card</option>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Online Link">Online Link</option>
            </select>
          </div>
          <div className="flex flex-col space-y-1.5">
            <label className="text-[10px] font-bold text-on-primary-container/50 uppercase">Transaction / Receipt Reference</label>
            <input
              type="text"
              placeholder="e.g. TXN-100239123"
              className="px-3 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container rounded focus:outline-none"
              value={paymentData.ref}
              onChange={(e) => setPaymentData({ ...paymentData, ref: e.target.value })}
            />
          </div>

          <div className="flex space-x-3 pt-4 border-t border-on-primary-fixed-variant">
            <button
              type="button"
              onClick={() => setIsRecordPaymentOpen(false)}
              className="flex-1 py-2.5 bg-on-primary-fixed-variant border border-on-primary-fixed-variant text-on-primary-container font-semibold rounded text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-gradient-to-r from-secondary-container to-secondary-container text-on-primary-fixed font-bold rounded text-xs shadow-sm"
            >
              Log Payment
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default CaseDetailPage;
