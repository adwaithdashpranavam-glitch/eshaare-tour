import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { Link } from "react-router-dom";
import { FileText, ChevronRight, Edit3, Send, Save, FilePlus } from "lucide-react";
import { formatShortDate } from "../../utils/formatters";
import Modal from "../../components/ui/Modal";
import { getApplicationsForCustomer, updateApplication, submitApplication } from "../../lib/firestore";
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

  const getCountryFlag = (destination) => {
    const dest = destination?.toLowerCase() || "";
    if (dest.includes("france")) return "🇫🇷";
    if (dest.includes("uk") || dest.includes("united kingdom") || dest.includes("london")) return "🇬🇧";
    if (dest.includes("usa") || dest.includes("united states") || dest.includes("america")) return "🇺🇸";
    if (dest.includes("canada")) return "🇨🇦";
    if (dest.includes("japan")) return "🇯🇵";
    if (dest.includes("australia")) return "🇦🇺";
    if (dest.includes("saudi") || dest.includes("ksa")) return "🇸🇦";
    if (dest.includes("uae") || dest.includes("dubai") || dest.includes("emirates")) return "🇦🇪";
    if (dest.includes("europe") || dest.includes("schengen")) return "🇪🇺";
    if (dest.includes("thailand")) return "🇹🇭";
    if (dest.includes("maldives")) return "🇲🇻";
    if (dest.includes("bali") || dest.includes("indonesia")) return "🇮🇩";
    if (dest.includes("turkey")) return "🇹🇷";
    if (dest.includes("georgia")) return "🇬🇪";
    return "🌐";
  };

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
      setTimeout(() => {
        setLoadingCases(false);
      }, 0);
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
    <div className="space-y-10 pb-16">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-[#1A1A1A] tracking-wide">My Applications</h1>
        <p className="text-xs text-gray-500">Manage draft forms and track active visa files submitted to the ops desk.</p>
      </div>

      {/* DRAFTS SECTION */}
      <div className="bg-white border border-[#E7E1D6] rounded-[20px] p-6 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 border-b border-[#E7E1D6]/60 pb-2">
          <FilePlus className="h-4.5 w-4.5 text-[#C8A45D]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A] font-display">Draft Applications</h2>
        </div>

        {loadingDrafts ? (
          <LoadingSpinner message="Loading draft files..." />
        ) : drafts.length === 0 ? (
          <div className="p-6 text-center text-xs text-gray-400 italic">
            No active drafts. Start an application on any visa type page.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {drafts.map((d) => (
              <div key={d.id} className="p-5 bg-white border border-[#E7E1D6] rounded-xl flex flex-col justify-between space-y-4 hover:border-[#C8A45D] hover:shadow-sm transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200">Draft</span>
                    <h3 className="text-sm font-semibold text-[#1A1A1A] mt-2">{d.visaName} Application</h3>
                  </div>
                  <button
                    onClick={() => handleOpenEdit(d)}
                    className="p-2 bg-[#F7F5F1] border border-[#E7E1D6] text-[#C8A45D] hover:text-[#b08e4f] rounded-lg flex items-center justify-center transition-colors"
                    title="Continue Application"
                  >
                    <Edit3 className="h-4.5 w-4.5" />
                  </button>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-100 text-xs text-gray-500">
                  <span>Created: {formatShortDate(d.createdAt?.toDate ? d.createdAt.toDate() : d.createdAt)}</span>
                  <button
                    onClick={() => handleOpenEdit(d)}
                    className="text-[#C8A45D] hover:text-[#b08e4f] font-bold uppercase tracking-wider text-[10px] flex items-center space-x-1"
                  >
                    <span>Continue</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CRM APPLICATIONS SECTION */}
      <div className="bg-white border border-[#E7E1D6] rounded-[20px] p-6 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 border-b border-[#E7E1D6]/60 pb-2">
          <FileText className="h-4.5 w-4.5 text-[#C8A45D]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A] font-display">Submitted Portfolios</h2>
        </div>

        {loadingCases ? (
          <LoadingSpinner message="Loading submitted files..." />
        ) : cases.length === 0 ? (
          <div className="p-6 text-center text-xs text-gray-400 italic">
            You do not have any visa application cases registered under your email yet.
          </div>
        ) : (
          <div className="space-y-4">
            {cases.map((c) => {
              const updatedDate = c.createdAt?.toDate ? c.createdAt.toDate() : c.createdAt;
              return (
                <div 
                  key={c.id} 
                  className="p-5 bg-white border border-[#E7E1D6] rounded-xl flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 hover:border-[#C8A45D] hover:shadow-sm transition-all"
                >
                  <div className="flex items-center space-x-4">
                    {/* Flag Avatar */}
                    <div className="h-12 w-12 rounded-xl bg-[#F7F5F1] flex items-center justify-center text-2xl border border-[#E7E1D6] shrink-0">
                      {getCountryFlag(c.destination || c.visaType)}
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono font-bold text-[#C8A45D] uppercase tracking-wider">{c.caseNo}</span>
                      <h4 className="text-sm font-semibold text-[#1A1A1A]">{c.visaType}</h4>
                      <span className="text-[10px] text-gray-500 block font-medium">
                        Updated: {formatShortDate(updatedDate)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end space-x-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
                    <PortalStatusBadge status={c.stage} />
                    <Link
                      to={`/portal/applications/${c.id}`}
                      className="flex items-center space-x-1 px-4 py-2 rounded-lg bg-[#F7F5F1] border border-[#E7E1D6] hover:border-[#C8A45D] hover:text-[#C8A45D] text-xs font-semibold uppercase tracking-wider transition-all"
                    >
                      <span>Track Details</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
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
        <form onSubmit={handleSubmitApplication} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Full Name *</label>
              <input
                type="text"
                required
                className="px-3.5 py-2.5 bg-[#F7F5F1] border border-[#E7E1D6] text-[#1A1A1A] placeholder-gray-400 rounded focus:outline-none focus:border-[#C8A45D] text-xs transition-colors"
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
                className="px-3.5 py-2.5 bg-[#F7F5F1] border border-[#E7E1D6] text-[#1A1A1A] placeholder-gray-400 rounded focus:outline-none focus:border-[#C8A45D] text-xs transition-colors"
                placeholder="e.g. +971 50 123 4567"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Email Address *</label>
              <input
                type="email"
                required
                className="px-3.5 py-2.5 bg-[#F7F5F1] border border-[#E7E1D6] text-[#1A1A1A] placeholder-gray-400 rounded focus:outline-none focus:border-[#C8A45D] text-xs transition-colors"
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
                className="px-3.5 py-2.5 bg-[#F7F5F1] border border-[#E7E1D6] text-[#1A1A1A] placeholder-gray-400 rounded focus:outline-none focus:border-[#C8A45D] text-xs transition-colors"
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
              className="px-3.5 py-2.5 bg-[#F7F5F1] border border-[#E7E1D6] text-[#1A1A1A] rounded focus:outline-none focus:border-[#C8A45D] text-xs transition-colors"
              name="travelDate"
              value={formData.travelDate}
              onChange={handleInputChange}
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Message / Specific Requests</label>
            <textarea
              rows={3}
              className="px-3.5 py-2.5 bg-[#F7F5F1] border border-[#E7E1D6] text-[#1A1A1A] placeholder-gray-400 rounded focus:outline-none focus:border-[#C8A45D] text-xs transition-colors"
              placeholder="e.g. Urgently need booking, GCC residence visa holder details..."
              name="message"
              value={formData.message}
              onChange={handleInputChange}
            />
          </div>

          <div className="flex space-x-3 pt-4 border-t border-[#E7E1D6]">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={submitting}
              className="flex-1 py-2.5 bg-white border border-[#E7E1D6] text-gray-700 hover:text-[#C8A45D] hover:border-[#C8A45D] font-bold rounded text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>Save Draft</span>
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-[#C8A45D] text-white hover:bg-[#b08e4f] font-bold rounded text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 transition-all"
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
