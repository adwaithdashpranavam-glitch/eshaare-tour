import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { doc, onSnapshot, updateDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { 
  ArrowLeft, Phone, Mail, MessageSquare, Calendar, 
  FileSpreadsheet, RefreshCw, CheckCircle, AlertTriangle 
} from "lucide-react";
import { LEAD_STAGES, VISA_REQUIREMENTS } from "../../utils/constants";
import { formatDate } from "../../utils/formatters";
import { generateCaseNo } from "../../utils/helpers";
import StatusBadge from "../../components/ui/StatusBadge";
import ActivityTimeline from "../../components/ui/ActivityTimeline";
import Modal from "../../components/ui/Modal";
import toast from "react-hot-toast";

export const LeadDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLostModalOpen, setIsLostModalOpen] = useState(false);
  const [lostReason, setLostReason] = useState("");

  useEffect(() => {
    // Lead Doc Listener
    const docRef = doc(db, "leads", id);
    const unsubscribeLead = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        setLead({ id: snapshot.id, ...snapshot.data() });
      } else {
        toast.error("Lead not found");
        navigate("/admin/leads");
      }
      setLoading(false);
    }, (error) => {
      console.warn("Error loading lead details:", error);
      toast.error("Error loading lead details: " + error.message);
      navigate("/admin/leads");
      setLoading(false);
    });

    // Activities Listener
    const actRef = collection(db, "leads", id, "activities");
    const unsubscribeActivities = onSnapshot(actRef, (snapshot) => {
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setActivities(items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    }, () => {});

    return () => {
      unsubscribeLead();
      unsubscribeActivities();
    };
  }, [id, navigate]);

  const handleStageChange = async (nextStage) => {
    if (nextStage === "Lost") {
      setIsLostModalOpen(true);
      return;
    }

    try {
      const docRef = doc(db, "leads", id);
      await updateDoc(docRef, { stage: nextStage });
      await logActivity("status", `Lead stage changed to ${nextStage}`);
      toast.success(`Stage updated to ${nextStage}`);
    } catch (err) {
      console.error(err);
      toast.error("Error updating stage");
    }
  };

  const handleLostSubmit = async () => {
    try {
      const docRef = doc(db, "leads", id);
      await updateDoc(docRef, { stage: "Lost", lostReason });
      await logActivity("status", `Lead marked as LOST. Reason: ${lostReason}`);
      toast.success("Lead marked as Lost");
      setIsLostModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Error updating lead status");
    }
  };

  const logActivity = async (type, content) => {
    try {
      const actRef = collection(db, "leads", id, "activities");
      await addDoc(actRef, {
        type,
        content,
        authorName: "Staff Agent",
        createdAt: new Date()
      });
    } catch (err) {
      console.error("Error logging activity:", err);
    }
  };

  const convertToCase = async () => {
    try {
      const caseNumber = await generateCaseNo();
      const casesRef = collection(db, "visa_cases");
      
      const newCase = {
        caseNo: caseNumber,
        travellerName: lead.contactName,
        travellerPhone: lead.contactPhone,
        travellerEmail: lead.contactEmail,
        nationality: lead.nationality,
        destination: lead.destination,
        visaType: lead.destination, // fallback
        stage: "Docs Pending",
        assignedOfficer: "Visa Ops Officer",
        isDeleted: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(casesRef, newCase);
      await updateDoc(doc(db, "leads", id), { stage: "Won" });
      await logActivity("status", `Converted to Visa Case: ${caseNumber}`);
      
      toast.success(`Converted to Visa Case: ${caseNumber}`);
      navigate(`/admin/cases/${docRef.id}`);
    } catch (err) {
      console.error(err);
      toast.error("Error converting lead to case");
    }
  };

  if (loading || !lead) {
    return <div className="h-screen flex items-center justify-center bg-primary-container text-secondary">Loading Lead details...</div>;
  }

  const requirements = VISA_REQUIREMENTS[lead.destination] || VISA_REQUIREMENTS.Schengen;

  return (
    <div className="space-y-6 font-sans">
      
      {/* Back Link */}
      <Link 
        to="/admin/leads" 
        className="inline-flex items-center text-xs font-bold text-secondary hover:text-secondary-fixed-dim uppercase tracking-wider space-x-1"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Leads</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Main Content (2/3) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Lead Header Card */}
          <div className="glass-card p-6 border border-on-primary-fixed-variant/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-full bg-secondary-container text-on-primary-fixed font-bold text-lg flex items-center justify-center">
                {lead.contactName?.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl font-display font-bold text-white leading-tight">{lead.contactName}</h2>
                  <span className="text-[10px] font-mono text-secondary">{lead.leadNo}</span>
                </div>
                <div className="text-xs text-on-primary-container/60 mt-1 space-x-3">
                  <span>{lead.nationality}</span>
                  <span>•</span>
                  <span>Enquired: {lead.destination}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-1.5 items-end">
              <StatusBadge status={lead.stage} />
              <span className="text-[10px] text-on-primary-container/40 font-mono">Created: {formatDate(lead.createdAt)}</span>
            </div>
          </div>

          {/* Stepper progress */}
          <div className="glass-card p-4 border border-on-primary-fixed-variant/60">
            <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-on-primary-container/50 pb-3 border-b border-on-primary-fixed-variant mb-4">
              <span>Change Pipeline Stage</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.values(LEAD_STAGES).map((stg) => {
                const isActive = lead.stage === stg;
                return (
                  <button
                    key={stg}
                    onClick={() => handleStageChange(stg)}
                    className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                      isActive 
                        ? "bg-secondary-container border-secondary text-on-primary-fixed" 
                        : "bg-primary-container border-on-primary-fixed-variant text-on-primary-container/60 hover:text-white hover:border-secondary/40"
                    }`}
                  >
                    {stg}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Actions Row */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3.5">
            <a
              href={`https://wa.me/${lead.contactPhone?.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 bg-primary-container border border-on-primary-fixed-variant hover:border-secondary text-on-primary-container hover:text-secondary text-center font-bold text-[10px] uppercase rounded flex flex-col items-center justify-center space-y-1.5 transition-colors"
            >
              <MessageSquare className="h-4.5 w-4.5 text-success" />
              <span>WhatsApp</span>
            </a>
            <a
              href={`tel:${lead.contactPhone}`}
              className="py-2.5 bg-primary-container border border-on-primary-fixed-variant hover:border-secondary text-on-primary-container hover:text-secondary text-center font-bold text-[10px] uppercase rounded flex flex-col items-center justify-center space-y-1.5 transition-colors"
            >
              <Phone className="h-4.5 w-4.5 text-secondary" />
              <span>Call client</span>
            </a>
            <a
              href={`mailto:${lead.contactEmail}`}
              className="py-2.5 bg-primary-container border border-on-primary-fixed-variant hover:border-secondary text-on-primary-container hover:text-secondary text-center font-bold text-[10px] uppercase rounded flex flex-col items-center justify-center space-y-1.5 transition-colors"
            >
              <Mail className="h-4.5 w-4.5 text-info" />
              <span>Send Email</span>
            </a>
            <button
              onClick={() => toast("Appointment Scheduling modal opened")}
              className="py-2.5 bg-primary-container border border-on-primary-fixed-variant hover:border-secondary text-on-primary-container hover:text-secondary text-center font-bold text-[10px] uppercase rounded flex flex-col items-center justify-center space-y-1.5 transition-colors"
            >
              <Calendar className="h-4.5 w-4.5 text-warning" />
              <span>Appt. slot</span>
            </button>
            <Link
              to={`/admin/quotations/new?leadId=${lead.id}`}
              className="py-2.5 bg-primary-container border border-on-primary-fixed-variant hover:border-secondary text-on-primary-container hover:text-secondary text-center font-bold text-[10px] uppercase rounded flex flex-col items-center justify-center space-y-1.5 transition-colors"
            >
              <FileSpreadsheet className="h-4.5 w-4.5 text-purple-400" />
              <span>Build Quote</span>
            </Link>
            {lead.stage !== "Won" && (
              <button
                onClick={convertToCase}
                className="col-span-2 sm:col-span-1 py-2.5 bg-gradient-to-r from-secondary-container to-secondary-container text-on-primary-fixed font-bold text-[10px] uppercase rounded flex flex-col items-center justify-center space-y-1.5 shadow-sm"
              >
                <CheckCircle className="h-4.5 w-4.5" />
                <span>Won case</span>
              </button>
            )}
          </div>

          {/* Activity Timeline */}
          <div className="glass-card p-6 border border-on-primary-fixed-variant/60 space-y-6">
            <h3 className="text-base font-semibold text-white border-b border-on-primary-fixed-variant pb-2">Activity Timeline</h3>
            <ActivityTimeline
              activities={activities}
              onAdd={(payload) => logActivity(payload.type, payload.content)}
            />
          </div>

        </div>

        {/* Sidebar (1/3) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Visa Requirements */}
          <div className="glass-card p-6 border border-on-primary-fixed-variant/60 space-y-4">
            <h3 className="text-sm font-semibold text-white border-b border-on-primary-fixed-variant pb-2">
              Visa Requirements ({lead.destination})
            </h3>
            <div className="space-y-3">
              {requirements.map((req, rIdx) => (
                <div key={rIdx} className="flex items-start space-x-2 text-xs text-on-primary-container/60 leading-relaxed font-sans">
                  <CheckCircle className="h-4 w-4 text-secondary flex-shrink-0 mt-0.5" />
                  <span>{req}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Lost Reason Modal */}
      <Modal
        isOpen={isLostModalOpen}
        onClose={() => setIsLostModalOpen(false)}
        title="Mark Lead as Lost"
        size="sm"
      >
        <div className="space-y-4 text-xs font-sans">
          <div className="flex flex-col space-y-2">
            <label className="text-[10px] font-bold text-on-primary-container/50 uppercase tracking-wider">Reason for Lost Status</label>
            <textarea
              className="w-full px-3 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container rounded focus:outline-none focus:border-secondary"
              rows={3}
              placeholder="e.g. Budget constraints, opted for another agency, plan cancelled..."
              value={lostReason}
              onChange={(e) => setLostReason(e.target.value)}
            />
          </div>
          <div className="flex space-x-3 pt-2">
            <button
              onClick={() => setIsLostModalOpen(false)}
              className="flex-1 py-2.5 bg-on-primary-fixed-variant border border-on-primary-fixed-variant text-on-primary-container font-semibold rounded-button text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleLostSubmit}
              disabled={!lostReason.trim()}
              className="flex-1 py-2.5 bg-danger text-white font-semibold rounded-button text-xs disabled:opacity-40"
            >
              Mark Lost
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default LeadDetailPage;
