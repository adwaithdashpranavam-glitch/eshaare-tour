import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { Link } from "react-router-dom";
import { FileText, Compass, ChevronRight, Edit3, Send, Save, AlertCircle, FilePlus } from "lucide-react";
import StatusBadge from "../../components/ui/StatusBadge";
import { formatShortDate } from "../../utils/formatters";
import Modal from "../../components/ui/Modal";
import { getApplicationsForCustomer, updateApplication, submitApplication } from "../../lib/firestore";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import toast from "react-hot-toast";

export const PortalApplicationsPage = () => {
  const { user, userProfile } = useAuth();
  const [drafts, setDrafts] = useState([]);
  const [cases, setCases] = useState([]);
  const [loadingDrafts, setLoadingDrafts] = useState(true);
  const [loadingCases, setLoadingCases] = useState(true);

  // Form / Modal state for draft editing
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    nationality: "",
    travelDate: "",
    message: ""
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch drafts from 'applications'
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = getApplicationsForCustomer(user.uid, (data) => {
      // Show only drafts in the draft section
      const activeDrafts = data.filter(app => app.status === "Draft");
      setDrafts(activeDrafts);
      setLoadingDrafts(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Fetch CRM cases from 'visa_cases'
  useEffect(() => {
    if (!userProfile?.email) {
      setLoadingCases(false);
      return;
    }

    const casesRef = collection(db, "visa_cases");
    const q = query(casesRef, where("travellerEmail", "==", userProfile.email.toLowerCase()));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort cases by createdAt desc
      setCases(items.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB - dateA;
      }));
      setLoadingCases(false);
    }, (error) => {
      console.error("Error fetching cases:", error);
      setLoadingCases(false);
    });

    return () => unsubscribe();
  }, [userProfile]);

  const handleOpenEdit = (draft) => {
    setSelectedDraft(draft);
    setFormData({
      name: draft.formData?.name || userProfile?.name || "",
      phone: draft.formData?.phone || userProfile?.phone || "",
      email: draft.formData?.email || userProfile?.email || "",
      nationality: draft.formData?.nationality || userProfile?.nationality || "",
      travelDate: draft.formData?.travelDate || "",
      message: draft.formData?.message || ""
    });
    setIsEditModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveDraft = async () => {
    if (!selectedDraft) return;
    setSubmitting(true);
    try {
      await updateApplication(selectedDraft.id, {
        formData
      });
      toast.success("Draft saved successfully");
      setIsEditModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save draft");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    if (!selectedDraft) return;
    
    if (!formData.name || !formData.phone || !formData.email) {
      toast.error("Please fill in name, phone, and email.");
      return;
    }

    setSubmitting(true);
    const loadingToast = toast.loading("Submitting application...");
    try {
      await submitApplication(selectedDraft.id, formData, selectedDraft.visaName);
      toast.success("Application submitted successfully!", { id: loadingToast });
      setIsEditModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit application", { id: loadingToast });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-10 font-sans pb-16">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-white tracking-wide">My Applications</h1>
        <p className="text-xs text-on-primary-container/50">Manage draft forms and track active visa files submitted to the ops desk.</p>
      </div>

      {/* DRAFTS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 border-b border-on-primary-fixed-variant/40 pb-2">
          <FilePlus className="h-4.5 w-4.5 text-secondary" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">Draft Applications</h2>
        </div>

        {loadingDrafts ? (
          <LoadingSpinner message="Loading draft files..." />
        ) : drafts.length === 0 ? (
          <div className="glass-card p-6 border border-on-primary-fixed-variant/40 text-center text-xs text-on-primary-container/40 italic">
            No active drafts. Start an application on any visa type page.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {drafts.map((d) => (
              <div key={d.id} className="glass-card p-6 border border-on-primary-fixed-variant/60 flex flex-col justify-between space-y-4 hover:border-secondary/20 transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/10">Draft</span>
                    <h3 className="text-base font-semibold text-white mt-2">{d.visaName} Application</h3>
                  </div>
                  <button
                    onClick={() => handleOpenEdit(d)}
                    className="p-2 bg-[#231F0D] border border-[#453E1D] text-secondary hover:text-white rounded-lg flex items-center justify-center transition-colors"
                    title="Continue Application"
                  >
                    <Edit3 className="h-4.5 w-4.5" />
                  </button>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-on-primary-fixed-variant text-xs text-on-primary-container/40">
                  <span>Created: {formatShortDate(d.createdAt?.toDate ? d.createdAt.toDate() : d.createdAt)}</span>
                  <button
                    onClick={() => handleOpenEdit(d)}
                    className="text-secondary hover:text-[#EEDADA] font-bold uppercase tracking-wider text-[10px] flex items-center space-x-1"
                  >
                    <span>Continue Application</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CRM APPLICATIONS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 border-b border-on-primary-fixed-variant/40 pb-2">
          <FileText className="h-4.5 w-4.5 text-secondary" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">Submitted Applications</h2>
        </div>

        {loadingCases ? (
          <LoadingSpinner message="Loading submitted files..." />
        ) : cases.length === 0 ? (
          <div className="glass-card p-6 border border-on-primary-fixed-variant/40 text-center text-xs text-on-primary-container/40 italic">
            You do not have any visa application cases registered under your email yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cases.map((c) => (
              <div key={c.id} className="glass-card p-6 border border-on-primary-fixed-variant/60 flex flex-col justify-between space-y-4 hover:border-secondary/20 transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono text-secondary">{c.caseNo}</span>
                    <h3 className="text-base font-semibold text-white mt-1">{c.visaType || c.destination} Case</h3>
                  </div>
                  <StatusBadge status={c.stage} />
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-on-primary-fixed-variant text-xs text-on-primary-container/40">
                  <span>Submitted: {formatShortDate(c.createdAt?.toDate ? c.createdAt.toDate() : c.createdAt)}</span>
                  <Link
                    to={`/portal/applications/${c.id}`}
                    className="text-secondary hover:text-[#EEDADA] font-bold uppercase tracking-wider text-[10px] flex items-center space-x-1"
                  >
                    <span>Track Details</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DRAFT EDIT FORM MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={selectedDraft ? `Complete Application: ${selectedDraft.visaName}` : "Complete Application"}
        size="md"
      >
        <form onSubmit={handleSubmitApplication} className="space-y-4 font-sans text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] font-bold text-[#EEDADA]/40 uppercase tracking-wider">Full Name *</label>
              <input
                type="text"
                required
                className="px-3.5 py-2.5 bg-[#231F0D] border border-[#453E1D] text-white placeholder-[#EEDADA]/20 rounded focus:outline-none focus:border-[#EAC784] text-xs"
                placeholder="Jane Doe"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] font-bold text-[#EEDADA]/40 uppercase tracking-wider">WhatsApp Phone *</label>
              <input
                type="tel"
                required
                className="px-3.5 py-2.5 bg-[#231F0D] border border-[#453E1D] text-white placeholder-[#EEDADA]/20 rounded focus:outline-none focus:border-[#EAC784] text-xs"
                placeholder="e.g. +971 50 123 4567"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] font-bold text-[#EEDADA]/40 uppercase tracking-wider">Email Address *</label>
              <input
                type="email"
                required
                className="px-3.5 py-2.5 bg-[#231F0D] border border-[#453E1D] text-white placeholder-[#EEDADA]/20 rounded focus:outline-none focus:border-[#EAC784] text-xs"
                placeholder="jane@example.com"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] font-bold text-[#EEDADA]/40 uppercase tracking-wider">Nationality</label>
              <input
                type="text"
                className="px-3.5 py-2.5 bg-[#231F0D] border border-[#453E1D] text-white placeholder-[#EEDADA]/20 rounded focus:outline-none focus:border-[#EAC784] text-xs"
                placeholder="e.g. Indian, GCC Resident"
                name="nationality"
                value={formData.nationality}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="text-[10px] font-bold text-[#EEDADA]/40 uppercase tracking-wider">Travel Start Date</label>
            <input
              type="date"
              className="px-3.5 py-2.5 bg-[#231F0D] border border-[#453E1D] text-white rounded focus:outline-none focus:border-[#EAC784] text-xs"
              name="travelDate"
              value={formData.travelDate}
              onChange={handleInputChange}
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="text-[10px] font-bold text-[#EEDADA]/40 uppercase tracking-wider">Message / Specific Requests</label>
            <textarea
              rows={3}
              className="px-3.5 py-2.5 bg-[#231F0D] border border-[#453E1D] text-white placeholder-[#EEDADA]/20 rounded focus:outline-none focus:border-[#EAC784] text-xs"
              placeholder="e.g. Urgently need booking, GCC residence visa holder details..."
              name="message"
              value={formData.message}
              onChange={handleInputChange}
            />
          </div>

          <div className="flex space-x-3 pt-4 border-t border-[#453E1D]">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={submitting}
              className="flex-1 py-2.5 bg-[#231F0D] border border-[#453E1D] text-[#EEDADA]/80 hover:text-white font-bold rounded text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>Save Draft</span>
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-gradient-to-r from-[#EAC784] to-[#EDB868] text-[#2C2712] font-extrabold rounded text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              <span>Submit Application</span>
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default PortalApplicationsPage;
