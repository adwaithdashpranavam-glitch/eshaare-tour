import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { Link, useNavigate } from "react-router-dom";
import { FileText, ChevronRight, Edit3, Send, Save, AlertCircle, FilePlus, Globe, Calendar as CalendarIcon } from "lucide-react";
import StatusBadge from "../../components/ui/StatusBadge";
import { formatShortDate } from "../../utils/formatters";
import Modal from "../../components/ui/Modal";
import { getApplicationsForCustomer, updateApplication, submitApplication } from "../../lib/firestore";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import toast from "react-hot-toast";

export const PortalApplicationsPage = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
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

  // Fetch CRM cases from both 'visa_cases' (CRM-originated) and 'bookings' (app-originated)
  useEffect(() => {
    if (!user?.uid && !userProfile?.email) {
      setLoadingCases(false);
      return;
    }

    const mergeAndSort = (casesArr, bookingsArr) => {
      // Normalize bookings to the visa_cases shape
      const normalizedBookings = bookingsArr.map(b => ({
        id: b.id,
        caseNo: b.bookingId || b.id,
        travellerName: b.travellerName || b.clientName || userProfile?.name || "",
        travellerEmail: b.clientEmail || b.travellerEmail || "",
        visaType: b.serviceType || b.visaType || "Visa Booking",
        destination: b.destination || b.country || "",
        stage: b.bookingStatus || b.status || "Submitted",
        createdAt: b.createdAt,
        source: "booking"
      }));

      // Deduplicate: visa_cases entries created from Android have the same ID as booking
      const visaCaseIds = new Set(casesArr.map(c => c.id));
      const uniqueBookings = normalizedBookings.filter(b => !visaCaseIds.has(b.id));

      const merged = [...casesArr, ...uniqueBookings];
      return merged.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB - dateA;
      });
    };

    let casesDocs = [];
    let bookingsDocs = [];
    let casesLoaded = false;
    let bookingsLoaded = false;

    const updateCases = () => {
      if (casesLoaded && bookingsLoaded) {
        setCases(mergeAndSort(casesDocs, bookingsDocs));
        setLoadingCases(false);
      }
    };

    // Query 1: visa_cases by travellerEmail
    let unsubCases = () => {};
    if (userProfile?.email) {
      const casesRef = collection(db, "visa_cases");
      const qCases = query(casesRef, where("travellerEmail", "==", userProfile.email.toLowerCase()));
      unsubCases = onSnapshot(qCases, (snapshot) => {
        casesDocs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        casesLoaded = true;
        updateCases();
      }, (error) => {
        console.error("Error fetching visa_cases:", error);
        casesLoaded = true;
        updateCases();
      });
    } else {
      casesLoaded = true;
    }

    // Query 2: bookings by clientUid (from Android app)
    let unsubBookings = () => {};
    if (user?.uid) {
      const bookingsRef = collection(db, "bookings");
      const qBookings = query(bookingsRef, where("clientUid", "==", user.uid));
      unsubBookings = onSnapshot(qBookings, (snapshot) => {
        bookingsDocs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        bookingsLoaded = true;
        updateCases();
      }, (error) => {
        console.error("Error fetching bookings:", error);
        bookingsLoaded = true;
        updateCases();
      });
    } else {
      bookingsLoaded = true;
    }

    return () => {
      unsubCases();
      unsubBookings();
    };
  }, [user, userProfile]);

  const handleOpenEdit = (draft) => {
    if (draft.applicationType === "schengen" || draft.visaId === "schengen" || draft?.visaName?.toLowerCase().includes("schengen")) {
      navigate(`/portal/applications/${draft.id}/wizard`);
    } else {
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
    }
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
        <h1 className="text-2xl font-semibold text-[#1A1A1A]">My Applications</h1>
        <p className="text-xs text-[#6B7280]">Manage draft forms and track active visa files submitted to the ops desk.</p>
      </div>

      {/* DRAFTS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 border-b border-[#E5E7EB] pb-2">
          <FilePlus className="h-4.5 w-4.5 text-[#0F3D2E]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">Draft Applications</h2>
        </div>

        {loadingDrafts ? (
          <LoadingSpinner message="Loading draft files..." />
        ) : drafts.length === 0 ? (
          <div className="bg-white border border-[#E5E7EB] p-8 rounded-[20px] text-center text-xs text-[#6B7280] italic">
            No active drafts. Start an application on any visa type page.
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-[#6B7280]">Already started an application? Continue your latest draft below.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {drafts.map((d) => {
              // Calculate rough progress
              let progress = 20;
              if (d.destinationCountry) progress += 20;
              if (d.visaType) progress += 20;
              if (d.appointmentPreference?.startDate) progress += 20;
              if (d.paymentStatus === "confirmed") progress += 20;
              return (
              <div key={d.id} className="bg-white border border-[#E5E7EB] rounded-[20px] p-6 flex flex-col justify-between space-y-4 hover:border-[#C6A969]/40 transition-all duration-200 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded border border-amber-500/10">Draft</span>
                    <h3 className="text-base font-semibold text-[#1A1A1A] mt-2">{d.visaName} Application</h3>
                    
                    {(d.destinationCountry || d.visaType) && (
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-[10px] text-gray-500 font-medium">
                        {d.destinationCountry && (
                          <span className="flex items-center gap-1"><Globe className="h-3 w-3"/> {d.destinationCountry}</span>
                        )}
                        {d.visaType && (
                          <span className="flex items-center gap-1"><FileText className="h-3 w-3"/> {d.visaType}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleOpenEdit(d)}
                    className="p-2 bg-[#F8F6F2] border border-[#E5E7EB] text-[#0F3D2E] hover:text-[#C6A969] rounded-xl flex items-center justify-center transition-colors shrink-0"
                    title="Continue Application"
                  >
                    <Edit3 className="h-4.5 w-4.5" />
                  </button>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1 mt-2">
                  <div className="bg-[#0F3D2E] h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-[#E5E7EB] text-[10px] text-[#6B7280]">
                  <div className="flex flex-col">
                    <span>Created: {formatShortDate(d.createdAt?.toDate ? d.createdAt.toDate() : d.createdAt)}</span>
                    {d.updatedAt && <span>Updated: {formatShortDate(d.updatedAt?.toDate ? d.updatedAt.toDate() : d.updatedAt)}</span>}
                  </div>
                  <button
                    onClick={() => handleOpenEdit(d)}
                    className="text-[#0F3D2E] hover:text-[#C6A969] font-bold uppercase tracking-wider text-[10px] flex items-center space-x-1"
                  >
                    <span>Continue Application</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              );
            })}
            </div>
          </div>
        )}
      </div>

      {/* CRM APPLICATIONS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 border-b border-[#E5E7EB] pb-2">
          <FileText className="h-4.5 w-4.5 text-[#0F3D2E]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">Submitted Applications</h2>
        </div>

        {loadingCases ? (
          <LoadingSpinner message="Loading submitted files..." />
        ) : cases.length === 0 ? (
          <div className="bg-white border border-[#E5E7EB] p-8 rounded-[20px] text-center text-xs text-[#6B7280] italic">
            You do not have any visa application cases registered under your email yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cases.map((c) => (
              <div key={c.id} className="bg-white border border-[#E5E7EB] rounded-[20px] p-6 flex flex-col justify-between space-y-4 hover:border-[#C6A969]/40 transition-all duration-200 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono text-gray-400">{c.caseNo}</span>
                    <h3 className="text-base font-semibold text-[#1A1A1A] mt-1">{c.visaType || c.destination} Case</h3>
                  </div>
                  <StatusBadge status={c.stage} />
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-[#E5E7EB] text-xs text-[#6B7280]">
                  <span>Submitted: {formatShortDate(c.createdAt?.toDate ? c.createdAt.toDate() : c.createdAt)}</span>
                  <Link
                    to={`/portal/applications/${c.id}`}
                    className="text-[#0F3D2E] hover:text-[#C6A969] font-bold uppercase tracking-wider text-[10px] flex items-center space-x-1"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Full Name *</label>
              <input
                type="text"
                required
                className="px-3.5 py-2.5 bg-[#F8F6F2] border border-[#E5E7EB] text-[#1A1A1A] placeholder-gray-400 rounded-xl focus:outline-none focus:border-[#0F3D2E] text-xs"
                placeholder="Jane Doe"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">WhatsApp Phone *</label>
              <input
                type="tel"
                required
                className="px-3.5 py-2.5 bg-[#F8F6F2] border border-[#E5E7EB] text-[#1A1A1A] placeholder-gray-400 rounded-xl focus:outline-none focus:border-[#0F3D2E] text-xs"
                placeholder="e.g. +971 50 123 4567"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Email Address *</label>
              <input
                type="email"
                required
                className="px-3.5 py-2.5 bg-[#F8F6F2] border border-[#E5E7EB] text-[#1A1A1A] placeholder-gray-400 rounded-xl focus:outline-none focus:border-[#0F3D2E] text-xs"
                placeholder="jane@example.com"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Nationality</label>
              <input
                type="text"
                className="px-3.5 py-2.5 bg-[#F8F6F2] border border-[#E5E7EB] text-[#1A1A1A] placeholder-gray-400 rounded-xl focus:outline-none focus:border-[#0F3D2E] text-xs"
                placeholder="e.g. Indian, GCC Resident"
                name="nationality"
                value={formData.nationality}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Travel Start Date</label>
            <input
              type="date"
              className="px-3.5 py-2.5 bg-[#F8F6F2] border border-[#E5E7EB] text-[#1A1A1A] rounded-xl focus:outline-none focus:border-[#0F3D2E] text-xs"
              name="travelDate"
              value={formData.travelDate}
              onChange={handleInputChange}
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Message / Specific Requests</label>
            <textarea
              rows={3}
              className="px-3.5 py-2.5 bg-[#F8F6F2] border border-[#E5E7EB] text-[#1A1A1A] placeholder-gray-400 rounded-xl focus:outline-none focus:border-[#0F3D2E] text-xs"
              placeholder="e.g. Urgently need booking, GCC residence visa holder details..."
              name="message"
              value={formData.message}
              onChange={handleInputChange}
            />
          </div>

          <div className="flex space-x-3 pt-4 border-t border-[#E5E7EB]">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={submitting}
              className="flex-1 py-2.5 bg-[#F8F6F2] border border-[#E5E7EB] text-[#1A1A1A] hover:bg-gray-100 font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors"
            >
              <Save className="h-4 w-4 text-[#C6A969]" />
              <span>Save Draft</span>
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-[#0F3D2E] text-white hover:bg-[#0F3D2E]/90 font-extrabold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 transition-colors"
            >
              <Send className="h-4 w-4 text-[#C6A969]" />
              <span>Submit Application</span>
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default PortalApplicationsPage;
