import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { getVisaTypeBySlug, saveVisaType, createLead, createApplicationDraft, getVisaTypes } from "../../lib/firestore";
import { useAuth } from "../../contexts/AuthContext";
import { generateLeadNo, formatWhatsAppPhone } from "../../utils/helpers";
import { serverTimestamp } from "../../lib/firebase";
import Modal from "../../components/ui/Modal";
import {
  Clock, TrendingUp, FileText, Calendar, Shield, Star,
  CheckCircle, Globe, CreditCard, Award, ChevronDown, Check, Phone, ArrowLeft, AlertCircle,
  X, Sparkles, Users, Briefcase, BookOpen, Stethoscope, Home, ArrowRight
} from "lucide-react";
import toast from "react-hot-toast";
import { Helmet } from "react-helmet-async";


// Icon mapping helper
const StatIcon = ({ name, className }) => {
  const icons = {
    Clock: Clock,
    TrendingUp: TrendingUp,
    FileText: FileText,
    Calendar: Calendar,
    Shield: Shield,
    Star: Star,
    CheckCircle: CheckCircle,
    Globe: Globe,
    CreditCard: CreditCard,
    Award: Award
  };
  const IconComponent = icons[name] || FileText;
  return <IconComponent className={className} />;
};

const SuitabilityIcon = ({ name, className }) => {
  const icons = {
    "Tourism": Globe,
    "Family Visit": Users,
    "Business": Briefcase,
    "Trade Shows": Calendar,
    "Training": BookOpen,
    "Medical": Stethoscope
  };
  const IconComponent = icons[name] || Globe;
  return <IconComponent className={className} />;
};

const SCHENGEN_COUNTRIES = [
  { name: "Austria", flag: "🇦🇹" },
  { name: "Belgium", flag: "🇧🇪" },
  { name: "Croatia", flag: "🇭🇷" },
  { name: "Czech Republic", flag: "🇨🇿" },
  { name: "Denmark", flag: "🇩🇰" },
  { name: "Estonia", flag: "🇪🇪" },
  { name: "Finland", flag: "🇫🇮" },
  { name: "France", flag: "🇫🇷" },
  { name: "Germany", flag: "🇩🇪" },
  { name: "Greece", flag: "🇬🇷" },
  { name: "Hungary", flag: "🇭🇺" },
  { name: "Iceland", flag: "🇮🇸" },
  { name: "Italy", flag: "🇮🇹" },
  { name: "Latvia", flag: "🇱🇻" },
  { name: "Liechtenstein", flag: "🇱🇮" },
  { name: "Lithuania", flag: "🇱🇹" },
  { name: "Luxembourg", flag: "🇱🇺" },
  { name: "Malta", flag: "🇲🇹" },
  { name: "Netherlands", flag: "🇳🇱" },
  { name: "Norway", flag: "🇳🇴" },
  { name: "Poland", flag: "🇵🇱" },
  { name: "Portugal", flag: "🇵🇹" },
  { name: "Slovakia", flag: "🇸🇰" },
  { name: "Slovenia", flag: "🇸🇮" },
  { name: "Spain", flag: "🇪🇸" },
  { name: "Sweden", flag: "🇸🇪" },
  { name: "Switzerland", flag: "🇨🇭" }
];

const SCHENGEN_SUB_VISAS_PRESETS = [
  {
    id: "france",
    slug: "france",
    name: "🇫🇷 France Visa",
    tagline: "Apply for entry to France. Document check and VFS Global appointment assistance in Dubai.",
    imageUrl: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80",
    category: "Schengen Visa",
    heroStats: [
      { label: "Processing Time", value: "8-12 Days", icon: "Clock" },
      { label: "Success Rate", value: "98.9%", icon: "TrendingUp" }
    ]
  },
  {
    id: "italy",
    slug: "italy",
    name: "Italy Visa",
    tagline: "Secure a biometrics appointment for Italy with flight itineraries & compliant hotel bookings.",
    imageUrl: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=800&q=80",
    category: "Schengen Visa",
    heroStats: [
      { label: "Processing Time", value: "10-14 Days", icon: "Clock" },
      { label: "Success Rate", value: "97.8%", icon: "TrendingUp" }
    ]
  },
  {
    id: "germany",
    slug: "germany",
    name: "🇩🇪 Germany Visa",
    tagline: "Business & tourist document audit for rapid German Schengen visa processing.",
    imageUrl: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=800&q=80",
    category: "Schengen Visa",
    heroStats: [
      { label: "Processing Time", value: "5-10 Days", icon: "Clock" },
      { label: "Success Rate", value: "98.5%", icon: "TrendingUp" }
    ]
  },
  {
    id: "spain",
    slug: "spain",
    name: "🇪🇸 Spain Visa",
    tagline: "Explore Madrid, Barcelona, and Andalucia with expert BLS Spain booking support.",
    imageUrl: "https://images.unsplash.com/photo-1509840841025-9088ba78a826?auto=format&fit=crop&w=800&q=80",
    category: "Schengen Visa",
    heroStats: [
      { label: "Processing Time", value: "10-15 Days", icon: "Clock" },
      { label: "Success Rate", value: "97.0%", icon: "TrendingUp" }
    ]
  }
];

const getMergedSubVisas = (firestoreVisas) => {
  return SCHENGEN_SUB_VISAS_PRESETS.map(preset => {
    const firestoreMatch = firestoreVisas.find(fv => {
      const fSlug = (fv.slug || fv.id || "").toLowerCase().trim();
      return fSlug === preset.slug;
    });
    if (firestoreMatch) {
      return { 
        ...preset, 
        ...firestoreMatch,
        // Override name to ensure exact flags
        name: preset.name 
      };
    }
    return preset;
  });
};

export const VisaDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userProfile, isAdmin } = useAuth();
  const [isAuthRequiredModalOpen, setIsAuthRequiredModalOpen] = useState(false);

  const [visaData, setVisaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [subVisas, setSubVisas] = useState([]);

  // Tabs state
  const [activeTab, setActiveTab] = useState("overview");

  // Accordion state
  const [openFaqs, setOpenFaqs] = useState({});

  // Enquiry Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    nationality: "",
    travelDate: "",
    message: ""
  });
  const [submitting, setSubmitting] = useState(false);


  // Minimum loading state duration (500ms)
  useEffect(() => {
    setLoading(true);
    setNotFound(false);

    let isMounted = true;
    const startTime = Date.now();

    const fetchVisa = async () => {
      try {
        const data = await getVisaTypeBySlug(slug);
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(500 - elapsedTime, 0);

        setTimeout(() => {
          if (!isMounted) return;
          if (!data) {
            setNotFound(true);
          } else {
            setVisaData(data);
          }
          setLoading(false);
        }, remainingTime);
      } catch (err) {
        console.error("Error loading visa detail:", err);
        setNotFound(true);
        setLoading(false);
      }
    };

    fetchVisa();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Fetch sub-visas for Schengen visa page
  useEffect(() => {
    if (slug !== "schengen") {
      setSubVisas([]);
      return;
    }

    const unsubscribe = getVisaTypes(
      (data) => {
        setSubVisas(data);
      },
      true, // onlyPublished
      (err) => {
        console.error("Failed to load sub-visas:", err);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [slug]);

  // Handle accordion toggle
  const toggleFaq = (idx) => {
    setOpenFaqs(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const handlePublishNow = async () => {
    if (!visaData) return;
    try {
      await saveVisaType(visaData.id, { isPublished: true });
      toast.success("Visa page published successfully!");
      setVisaData(prev => ({ ...prev, isPublished: true }));
    } catch (err) {
      console.error(err);
      toast.error("Failed to publish page");
    }
  };

  const handleApplyClick = async (packageType = "standard", amount = 299) => {
    if (!user) {
      setIsAuthRequiredModalOpen(true);
      return;
    }

    const loadingToast = toast.loading("Creating application draft...");
    try {
      let destinationCountry = "";
      let sourcePageType = "general";
      let applicationType = "";
      
      if (slug === "schengen") {
        sourcePageType = "general-schengen";
        applicationType = "schengen";
      } else if (visaData?.id?.includes("schengen") || visaData?.name?.toLowerCase().includes("schengen")) {
        sourcePageType = "country-schengen";
        applicationType = "schengen";
        // Extract "France" from "France Schengen Visa"
        destinationCountry = visaData.name.split(" Schengen")[0] || visaData.name;
      }

      const draftId = await createApplicationDraft(
        user.uid,
        visaData.id,
        visaData.name,
        userProfile,
        packageType,
        amount,
        sourcePageType,
        destinationCountry,
        applicationType
      );
      toast.success("Application draft ready!", { id: loadingToast });
      // Schengen drafts use the multi-step wizard — open it directly so the client
      // lands on the flow they expect instead of the applications list.
      if (applicationType === "schengen" && draftId) {
        navigate(`/portal/applications/${draftId}/wizard`);
      } else {
        navigate("/portal/applications");
      }
    } catch (error) {
      console.error("Failed to create draft:", error);
      toast.error("Failed to create draft application.", { id: loadingToast });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.email) {
      toast.error("Please complete all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      const generatedNo = await generateLeadNo();
      const submission = {
        leadNo: generatedNo,
        contactName: formData.name,
        contactPhone: formatWhatsAppPhone(formData.phone),
        contactEmail: formData.email,
        nationality: formData.nationality,
        destinationCountry: visaData?.name || "Global Visa",
        serviceType: "Visa",
        travelStart: formData.travelDate,
        source: "website_cms_detail",
        stage: "New",
        priority: "Medium",
        ownerId: null,
        notes: formData.message,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await createLead(submission);
      toast.success(`Inquiry submitted! Reference: ${generatedNo}`);
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit inquiry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const scrollToSection = (id) => {
    setActiveTab(id);
    const element = document.getElementById(id);
    if (element) {
      const offset = 140; // sticky header + sticky tabs offset
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  if (loading) {
    /* Full Page Skeleton Loader */
    return (
      <div className="bg-[#FAF8F5] min-h-screen text-slate-800 font-sans">
        {/* Skeleton Hero */}
        <section className="py-24 bg-gradient-to-b from-[#0E221A] to-[#1D503A] border-b border-slate-200/20 animate-pulse">
          <div className="max-w-container-max mx-auto px-4 space-y-6">
            <div className="h-10 bg-white/10 rounded w-1/3"></div>
            <div className="h-5 bg-white/10 rounded w-2/3"></div>
            <div className="flex gap-4 pt-4">
              <div className="h-12 bg-white/10 rounded w-32"></div>
              <div className="h-12 bg-white/10 rounded w-32"></div>
            </div>
            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-10 border-t border-white/10">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-white/10 rounded"></div>
              ))}
            </div>
          </div>
        </section>
        {/* Tab bar skeleton */}
        <div className="bg-white h-14 border-b border-slate-200"></div>
      </div>
    );
  }

  // Not found or Draft Mode validation
  // Show not found if document is draft AND viewer is not admin
  const isDraft = visaData && !visaData.isPublished;
  const showNotFound = notFound || (isDraft && !isAdmin);

  if (showNotFound) {
    return (
      <div className="bg-[#FAF8F5] min-h-screen text-slate-600 flex flex-col justify-center items-center py-24 text-center px-4 font-sans">
        <div className="max-w-md space-y-6">
          <AlertCircle className="h-20 w-20 text-[#EF4444] mx-auto animate-bounce" />
          <h1 className="text-3xl font-bold font-display text-slate-900">Visa Type Not Found</h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            The page you're looking for doesn't exist or may have been un-published. Please check the URL or view our full services list.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/visa-services"
              className="px-6 py-3 border border-slate-200 text-slate-700 hover:border-[#1D503A] hover:text-[#1D503A] rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
            >
              View Services
            </Link>
            <Link
              to="/contact"
              className="px-6 py-3 bg-[#1D503A] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#0E221A] transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF8F5] min-h-screen text-slate-700 font-sans pb-24 relative">  
      <Helmet>
        <title>{visaData?.metaTitle || `${visaData?.name || "Visa"} from Dubai - Visa Consultant | ESHAARE`}</title>
        <meta name="description" content={visaData?.metaDescription || `Get dynamic visa processing support for ${visaData?.name || "global destinations"} from Dubai. Complete checklist auditing and rapid slot booking support.`} />
      </Helmet>

      {/* Draft Mode Banner (Visible to Admin only) */}
      {isDraft && isAdmin && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-800 py-3.5 px-6 sticky top-24 z-30 flex items-center justify-between text-xs font-semibold backdrop-blur-md">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4.5 w-4.5 text-amber-600" />
            <span>Draft Mode — This page is not visible to the public</span>
          </div>
          <button
            onClick={handlePublishNow}
            className="px-4 py-1.5 bg-[#1D503A] text-white font-bold rounded hover:bg-[#0E221A] transition-colors"
          >
            Publish Now
          </button>
        </div>
      )}

      {/* HERO SECTION */}
      <section className="relative py-20 overflow-hidden border-b border-[#1D503A]/20 bg-[#1D503A]">
        {visaData.imageUrl ? (
          <div className="absolute inset-0 z-0">
            <img loading="lazy"
              src={visaData.imageUrl}
              alt={visaData.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0E221A]/75 via-[#1D503A]/45 to-transparent"></div>
          </div>
        ) : (
          <div className="absolute inset-0 z-0 bg-gradient-to-r from-[#0E221A] to-[#1D503A]"></div>
        )}
        <div className="relative z-10 max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop space-y-6">

          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-xs text-white/60 pb-2">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <Link to="/visa-services" className="hover:text-white transition-colors">Visa Services</Link>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-[#C5A880] font-semibold">{visaData.name}</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold font-display text-white tracking-wide leading-tight max-w-2xl">
            {visaData.name}
          </h1>
          <p className="text-base text-white/80 max-w-xl leading-relaxed">
            {visaData.tagline}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => handleApplyClick("standard", visaData.supportPackages?.standard?.price || 299)}
              className="px-6 py-3 bg-[#C5A880] text-[#0E221A] font-bold rounded-xl text-xs uppercase tracking-wider hover:opacity-95 transition-all shadow-md flex items-center justify-center gap-1.5"
            >
              Apply Now
              <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </button>
            <button
              onClick={() => scrollToSection("documents")}
              className="px-6 py-3 bg-[#FAF8F5]/90 text-slate-800 font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-white transition-all shadow-sm"
            >
              Check Eligibility
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 border border-white/20 text-white hover:border-white hover:bg-white/5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
            >
              Get Free Consultation
            </button>
          </div>

          {/* Hero Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-12 border-t border-white/10 mt-10">
            {visaData.heroStats?.map((stat, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-xl flex items-center gap-3.5 shadow-lg hover:bg-white/10 transition-all duration-300"
              >
                <div className="p-2.5 rounded-lg bg-white/15 text-[#C5A880]">
                  <StatIcon name={stat.icon} className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-lg font-bold text-white font-mono leading-tight">{stat.value}</div>
                  <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider">{stat.label}</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* STICKY TAB NAVIGATION BAR */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-14 z-20 shadow-sm">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop flex gap-6 overflow-x-auto whitespace-nowrap scrollbar-none h-14 items-center">
          {[
            { id: "overview", label: "Overview" },
            { id: "documents", label: "Required Documents" },
            { id: "process", label: "Process Steps" },
            { id: "fees", label: "Fees & Pricing" },
            { id: "faq", label: "FAQ" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => scrollToSection(tab.id)}
              className={`h-full text-xs font-bold uppercase tracking-widest relative px-1 transition-colors ${activeTab === tab.id ? "text-[#1D503A] font-extrabold" : "text-slate-500 hover:text-[#1D503A]"
                }`}
            >
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#C5A880] rounded-t-full"></span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT SECTIONS CONTAINER */}
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16 space-y-24">

        {/* SECTION 2 - OVERVIEW, SUITABILITY & SPECS */}
        <section id="overview" className="space-y-12 scroll-mt-40">
          <div className="space-y-4">
            <h2 className="text-xl font-bold font-display text-[#0E221A] uppercase tracking-wider border-b border-slate-200/80 pb-2">
              Overview
            </h2>
            <p className="text-sm md:text-base text-slate-600 leading-relaxed max-w-4xl">
              {visaData.overviewText}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl">
            {/* Suitable For */}
            {visaData.suitableFor && visaData.suitableFor.length > 0 && (
              <div className="space-y-4 bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
                <h3 className="text-sm font-bold font-display text-[#0E221A] uppercase tracking-wider border-b border-slate-100 pb-2">
                  Suitable For
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {visaData.suitableFor.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-slate-700">
                      <div className="p-2 bg-[#1D503A]/5 text-[#1D503A] rounded-lg">
                        <SuitabilityIcon name={item} className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-semibold">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Visa Specifications */}
            {visaData.visaSpecs && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold font-display text-[#0E221A] uppercase tracking-wider">
                  Visa Specifications
                </h3>
                <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm divide-y divide-slate-100">
                  {[
                    { label: "Visa Type", value: visaData.visaSpecs.visaType },
                    { label: "Validity", value: visaData.visaSpecs.validity },
                    { label: "Entry Type", value: visaData.visaSpecs.entryType },
                    { label: "Processing Time", value: visaData.visaSpecs.processingTime },
                    { label: "Biometrics", value: visaData.visaSpecs.biometrics },
                    { label: "Insurance", value: visaData.visaSpecs.insurance },
                    { label: "Category", value: visaData.visaSpecs.category }
                  ].map((row, rIdx) => (
                    <div
                      key={rIdx}
                      className={`p-3.5 flex justify-between items-center text-xs md:text-sm ${
                        rIdx % 2 === 1 ? "bg-slate-50/40" : "bg-white"
                      }`}
                    >
                      <span className="text-slate-500 font-medium">{row.label}</span>
                      <span className="font-bold text-[#1D503A]">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* POPULAR DESTINATIONS OR SCHENGEN SUB-VISAS */}
        {visaData.slug === "schengen" ? (
          <section className="space-y-6">
            <h2 className="text-xl font-bold font-display text-[#0E221A] uppercase tracking-wider border-b border-slate-200/80 pb-2">
              Types of Schengen Visa
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {getMergedSubVisas(subVisas).map((visa) => {
                const firstStat = visa.heroStats?.[0] || { label: "Processing Time", value: "Standard", icon: "Clock" };
                const secondStat = visa.heroStats?.[1] || { label: "Success Rate", value: "High", icon: "TrendingUp" };

                return (
                  <div
                    key={visa.id}
                    className="bg-white border border-slate-100 rounded-2xl overflow-hidden hover:border-[#7FE6A2] hover:shadow-[0_20px_40px_rgba(29,80,58,0.06)] transition-all duration-300 flex flex-col justify-between group shadow-sm animate-[fadeIn_0.3s_ease-out]"
                  >
                    {/* Card Cover Image */}
                    <div className="h-44 w-full overflow-hidden bg-slate-50 relative flex-shrink-0">
                      {visa.imageUrl ? (
                        <img loading="lazy"
                          src={visa.imageUrl}
                          alt={visa.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 uppercase tracking-widest text-[9px] font-bold">
                          Eshaare Tours & Visas
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
                    </div>

                    {/* Card Text Content */}
                    <div className="p-5 pt-3 flex-grow flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        <h3 className="text-base font-bold font-display text-gray-900 group-hover:text-[#1D503A] transition-colors leading-snug">
                          {visa.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                          {visa.tagline}
                        </p>

                        {/* Accent Divider */}
                        <div className="h-[2px] bg-[#1D503A]/20 w-10 rounded"></div>

                        {/* First 2 Stats badged side-by-side */}
                        <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50/50 border border-slate-100 rounded-xl font-mono">
                          <div className="flex items-start gap-1.5 text-left">
                            <div className="p-1 rounded bg-[#1D503A]/5 text-[#1D503A] mt-0.5">
                              <StatIcon name={firstStat.icon} className="h-3.5 w-3.5" />
                            </div>
                            <div>
                              <div className="text-[11px] font-bold text-gray-900 leading-tight">{firstStat.value}</div>
                              <span className="text-[8px] text-slate-400 font-semibold uppercase tracking-wider font-sans">{firstStat.label}</span>
                            </div>
                          </div>
                          <div className="flex items-start gap-1.5 text-left">
                            <div className="p-1 rounded bg-[#1D503A]/5 text-[#1D503A] mt-0.5">
                              <StatIcon name={secondStat.icon} className="h-3.5 w-3.5" />
                            </div>
                            <div>
                              <div className="text-[11px] font-bold text-gray-900 leading-tight">{secondStat.value}</div>
                              <span className="text-[8px] text-slate-400 font-semibold uppercase tracking-wider font-sans">{secondStat.label}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <Link
                          to={`/visa/${visa.slug}`}
                          className="w-full text-center py-2 border border-[#1D503A]/25 text-[#1D503A] hover:bg-[#1D503A]/5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                        >
                          Learn More
                        </Link>
                        <Link
                          to={`/visa-services/${visa.slug}`}
                          className="w-full text-center py-2 bg-[#1D503A] hover:bg-[#0e4a1e] text-white font-bold rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-1 group group-btn"
                        >
                          <span>Apply Now</span>
                          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : (
          visaData.popularDestinations && visaData.popularDestinations.length > 0 && (
            <section className="space-y-6">
              <h2 className="text-xl font-bold font-display text-[#0E221A] uppercase tracking-wider border-b border-slate-200/80 pb-2">
                Popular Destinations
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl">
                {visaData.popularDestinations.map((dest, idx) => (
                  <Link
                    key={idx}
                    to={`/visa/${dest.slug}`}
                    className="relative h-40 rounded-2xl overflow-hidden group shadow-sm hover:shadow-md transition-all duration-300 block"
                  >
                    <img loading="lazy"
                      src={dest.imageUrl}
                      alt={dest.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-end p-4">
                      <span className="text-white font-bold text-sm tracking-wide group-hover:text-[#C5A880] transition-colors">{dest.name}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )
        )}

        {/* SCHENGEN COUNTRIES DIRECTORY */}
        {visaData.slug === "schengen" && (
          <section className="space-y-6 bg-white border border-slate-100 p-6 md:p-8 rounded-3xl shadow-sm max-w-4xl">
            <div className="space-y-2 border-b border-slate-100 pb-4">
              <h3 className="text-sm font-bold font-display text-[#0E221A] uppercase tracking-wider">
                Supported Schengen Member States
              </h3>
              <p className="text-xs text-slate-500">
                We manage biometrics slot bookings, document auditing, and flight/hotel compliance itineraries for all 27 Schengen countries:
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {SCHENGEN_COUNTRIES.map((c, idx) => (
                <div key={idx} className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-50/50 rounded-xl border border-slate-100 hover:border-[#1D503A]/20 transition-all text-xs font-semibold text-slate-700">
                  <span className="text-base leading-none">{c.flag}</span>
                  <span>{c.name}</span>
                </div>
              ))}
            </div>
            
            <div className="p-4 bg-[#1D503A]/5 border border-[#1D503A]/10 text-[#1D503A] text-xs rounded-xl flex items-start gap-2.5 mt-4 leading-relaxed">
              <span className="text-sm shrink-0">ℹ️</span>
              <span><strong>Embassy Rules:</strong> Under Schengen regulations, you must apply to the embassy of the country where you will spend the most nights, or your point of first entry if staying equal duration. Our compliance team will audit your complete travel itinerary.</span>
            </div>
          </section>
        )}

        {/* SECTION 3 - REQUIRED DOCUMENTS */}
        <section id="documents" className="space-y-6 scroll-mt-40">
          <h2 className="text-xl font-bold font-display text-[#0E221A] uppercase tracking-wider border-b border-slate-200/80 pb-2">
            Required Documents Checklist
          </h2>

          {visaData.groupedDocuments ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl">
              {/* Personal */}
              {visaData.groupedDocuments.personal && (
                <div className="bg-white p-6 rounded-2xl border-t-4 border-[#C5A880] shadow-sm space-y-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold font-display text-[#0E221A] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                      <Users className="h-4 w-4 text-[#C5A880]" />
                      <span>Personal</span>
                    </h3>
                    <ul className="space-y-3">
                      {visaData.groupedDocuments.personal.map((doc, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed">
                          <CheckCircle className="h-4 w-4 text-[#1D503A] shrink-0 mt-0.5" />
                          <span>{doc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Financial */}
              {visaData.groupedDocuments.financial && (
                <div className="bg-white p-6 rounded-2xl border-t-4 border-[#1D503A] shadow-sm space-y-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold font-display text-[#0E221A] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                      <CreditCard className="h-4 w-4 text-[#1D503A]" />
                      <span>Financial</span>
                    </h3>
                    <ul className="space-y-3">
                      {visaData.groupedDocuments.financial.map((doc, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed">
                          <CheckCircle className="h-4 w-4 text-[#1D503A] shrink-0 mt-0.5" />
                          <span>{doc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Travel */}
              {visaData.groupedDocuments.travel && (
                <div className="bg-white p-6 rounded-2xl border-t-4 border-slate-400 shadow-sm space-y-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold font-display text-[#0E221A] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                      <Globe className="h-4 w-4 text-slate-400" />
                      <span>Travel Info</span>
                    </h3>
                    <ul className="space-y-3">
                      {visaData.groupedDocuments.travel.map((doc, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed">
                          <CheckCircle className="h-4 w-4 text-[#1D503A] shrink-0 mt-0.5" />
                          <span>{doc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
              {visaData.requiredDocuments?.map((doc, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-slate-100 p-4 rounded-xl flex items-start gap-3 shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <div className="h-5 w-5 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border border-emerald-100">
                    <Check className="h-3 w-3" />
                  </div>
                  <span className="text-xs md:text-sm text-slate-700 leading-relaxed">
                    {doc}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* WHY CHOOSE ESHAARE TOURS */}
        <section className="bg-[#0E221A] text-white border border-[#1D503A]/20 rounded-3xl p-8 md:p-12 space-y-8 relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#C5A880]/10 rounded-full blur-3xl"></div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold font-display text-white tracking-wide uppercase">
              Why Choose Eshaare Tours
            </h2>
            <p className="text-xs text-white/60">
              We ensure your visa application is handled with absolute precision.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Dedicated Visa Consultant",
                desc: "Personalized guidance through the entire application process.",
                icon: Users
              },
              {
                title: "Professional Document Review",
                desc: "Strict quality checks to ensure your application meets consulate standards.",
                icon: CheckCircle
              },
              {
                title: "WhatsApp Support",
                desc: "Real-time assistance for all your visa queries on the go.",
                icon: Phone
              }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="flex gap-4 items-start">
                  <div className="bg-[#1D503A] p-3 rounded-xl border border-white/10 text-[#C5A880] shrink-0">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white leading-tight">{item.title}</h4>
                    <p className="text-xs text-white/70 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 4 - HOW ESHAARE PROCESSES YOUR VISA */}
        <section id="process" className="space-y-10 scroll-mt-40">
          <h2 className="text-xl font-bold font-display text-[#0E221A] uppercase tracking-wider border-b border-slate-200/80 pb-2">
            How Eshaare Processes Your Visa
          </h2>

          <div className="relative max-w-3xl pl-4 md:pl-10 space-y-12">
            {/* Connecting line on desktop */}
            <div className="absolute left-[20px] md:left-[43px] top-4 bottom-4 w-[2px] bg-[#1D503A]/20 hidden sm:block"></div>

            {visaData.processSteps?.map((step, idx) => (
              <div key={idx} className="relative flex flex-col sm:flex-row gap-4 md:gap-8 items-start">
                {/* Step Circle */}
                <div className="h-10 w-10 md:h-12 md:w-12 bg-white border-2 border-[#C5A880] text-[#1D503A] font-bold font-display text-lg md:text-xl rounded-full flex items-center justify-center flex-shrink-0 relative z-10 shadow-sm">
                  {step.stepNumber || idx + 1}
                </div>

                <div className="space-y-1">
                  <h4 className="text-base md:text-lg font-semibold text-slate-800">
                    {step.title}
                  </h4>
                  <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 5 - FEE TABLE */}
        <section id="fees" className="space-y-6 scroll-mt-40">
          <h2 className="text-xl font-bold font-display text-[#0E221A] uppercase tracking-wider border-b border-slate-200/80 pb-2">
            Fee & Pricing Table
          </h2>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto border border-slate-100 rounded-xl shadow-sm bg-white">
            <table className="w-full text-left border-collapse text-xs md:text-sm text-slate-600">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4">Applicant Type</th>
                  <th className="p-4">Embassy Fee</th>
                  <th className="p-4">Service Fee</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visaData.feeStructure?.map((fee, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-semibold text-slate-800">{fee.applicantType}</td>
                    <td className="p-4 font-mono text-slate-700">{fee.embassyFee}</td>
                    <td className="p-4 font-mono text-[#1D503A] font-bold">{fee.serviceFee}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={handleApplyClick}
                        className="px-4 py-1.5 bg-[#1D503A] hover:bg-[#0E221A] text-white font-bold rounded text-xs uppercase tracking-wider transition-colors"
                      >
                        Apply Now
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Stack View */}
          <div className="block sm:hidden space-y-4">
            {visaData.feeStructure?.map((fee, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-100 p-5 rounded-xl space-y-3 shadow-sm"
              >
                <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">{fee.applicantType}</h4>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Embassy Fee:</span>
                  <span className="font-mono font-semibold text-slate-700">{fee.embassyFee}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Service Fee:</span>
                  <span className="font-mono font-bold text-[#1D503A]">{fee.serviceFee}</span>
                </div>
                <button
                  onClick={handleApplyClick}
                  className="w-full py-2 bg-[#1D503A] hover:bg-[#0E221A] text-white font-bold rounded-lg text-xs uppercase tracking-wider pt-2 mt-1 transition-colors"
                >
                  Apply Now
                </button>
              </div>
            ))}
          </div>

          {/* Support Packages Side-by-Side Grid */}
          {visaData.showSupportPackages && visaData.supportPackages && (
            <div className="pt-12 space-y-8 max-w-4xl mx-auto text-left font-sans">
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold font-display text-slate-900 tracking-wide">
                  Choose the Level of Support You Need
                </h3>
                <p className="text-xs text-slate-500">
                  Select a support option best suited for your visa requirements.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                {/* Standard Package Card */}
                {visaData.supportPackages.standard && (
                  <div className="bg-white text-gray-900 rounded-3xl p-8 shadow-xl flex flex-col justify-between border border-gray-100 transform hover:-translate-y-1 transition-all duration-300">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h4 className="text-xl font-bold text-gray-900 leading-snug">
                          {visaData.supportPackages.standard.title}
                        </h4>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          {visaData.supportPackages.standard.subtitle}
                        </p>
                      </div>

                      <div className="py-2">
                        <span className="text-4xl font-extrabold text-gray-900 font-mono">
                          AED {visaData.supportPackages.standard.price}
                        </span>
                        <span className="text-xs text-gray-500 font-medium"> / applicant</span>
                      </div>

                      {/* Features list */}
                      <ul className="space-y-3.5 border-t border-gray-100 pt-6">
                        {visaData.supportPackages.standard.features?.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-xs">
                            {feat.included ? (
                              <Check className="h-4.5 w-4.5 text-[#1D503A] flex-shrink-0 mt-0.5" />
                            ) : (
                              <X className="h-4.5 w-4.5 text-gray-300 flex-shrink-0 mt-0.5" />
                            )}
                            <span className={feat.included ? "text-gray-700 font-medium" : "text-gray-400 line-through"}>
                              {feat.text}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      onClick={() => handleApplyClick("standard", visaData.supportPackages.standard.price)}
                      className="w-full mt-8 py-3.5 border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
                    >
                      Select Standard
                    </button>
                  </div>
                )}

                {/* Premium Package Card */}
                {visaData.supportPackages.premium && (
                  <div className="bg-[#0E221A] text-white rounded-3xl p-8 shadow-2xl flex flex-col justify-between border-2 border-[#C5A880]/40 relative transform hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                    {/* MOST POPULAR Badge */}
                    {visaData.supportPackages.premium.recommended && (
                      <div className="absolute top-4 right-4 bg-gradient-to-r from-[#C5A880] to-[#E3C39D] text-[#0E221A] text-[9px] font-extrabold px-3.5 py-1 rounded-full uppercase tracking-widest shadow-md border border-[#C5A880]/20">
                        Most Popular
                      </div>
                    )}

                    <div className="space-y-6">
                      <div className="space-y-2 pr-16">
                        <h4 className="text-xl font-bold text-white leading-snug">
                          {visaData.supportPackages.premium.title}
                        </h4>
                        <p className="text-xs text-white/60 leading-relaxed">
                          {visaData.supportPackages.premium.subtitle}
                        </p>
                      </div>

                      <div className="py-2">
                        <span className="text-4xl font-extrabold text-[#C5A880] font-mono">
                          AED {visaData.supportPackages.premium.price}
                        </span>
                        <span className="text-xs text-white/60 font-medium"> / applicant</span>
                      </div>

                      {/* Features list */}
                      <ul className="space-y-3.5 border-t border-white/10 pt-6">
                        {visaData.supportPackages.premium.features?.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-xs">
                            {feat.highlighted ? (
                              <Sparkles className="h-4.5 w-4.5 text-[#C5A880] flex-shrink-0 mt-0.5" />
                            ) : feat.included ? (
                              <Check className="h-4.5 w-4.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                            ) : (
                              <X className="h-4.5 w-4.5 text-white/30 flex-shrink-0 mt-0.5" />
                            )}
                            <span className={
                              feat.highlighted
                                ? "text-[#C5A880] font-semibold"
                                : feat.included
                                  ? "text-white/90 font-medium"
                                  : "text-white/40 line-through"
                            }>
                              {feat.text}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      onClick={() => handleApplyClick("premium", visaData.supportPackages.premium.price)}
                      className="w-full mt-8 py-3.5 bg-gradient-to-r from-[#C5A880] to-[#E3C39D] text-[#0E221A] hover:opacity-95 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all shadow-md"
                    >
                      Select Premium
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* SECTION 6 - FAQ ACCORDION */}
        <section id="faq" className="space-y-6 scroll-mt-40 max-w-4xl">
          <h2 className="text-xl font-bold font-display text-[#0E221A] uppercase tracking-wider border-b border-slate-200/80 pb-2">
            Frequently Asked Questions
          </h2>
          <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white shadow-sm">
            {visaData.faqs?.map((faq, idx) => {
              const isOpen = !!openFaqs[idx];
              return (
                <div key={idx} className="transition-colors hover:bg-slate-50/50">
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between p-5 text-left text-sm font-bold text-slate-800 focus:outline-none select-none"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={`h-4.5 w-4.5 text-[#1D503A] transition-transform duration-300 ${isOpen ? "rotate-180" : ""
                        }`}
                    />
                  </button>
                  <div
                    className={`px-5 text-xs md:text-sm text-slate-600 leading-relaxed overflow-hidden transition-all duration-300 ${isOpen ? "max-h-60 pb-5 opacity-100" : "max-h-0 opacity-0"
                      }`}
                  >
                    <div className="pt-2 border-t border-slate-100">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* POPULAR LOCATIONS IN COUNTRY SLIDER */}
        {visaData.popularLocations && visaData.popularLocations.length > 0 && (
          <section className="space-y-6 scroll-mt-40">
            <h2 className="text-xl font-bold font-display text-[#0E221A] uppercase tracking-wider border-b border-slate-200/80 pb-2">
              Popular in {visaData.name.replace(" Schengen Visa", "")}
            </h2>
            <div className="flex overflow-x-auto gap-6 pb-6 scroll-smooth snap-x snap-mandatory scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
              {visaData.popularLocations.map((loc, idx) => (
                <div
                  key={idx}
                  className="snap-center shrink-0 w-72 space-y-3 bg-white p-3 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 group"
                >
                  <div className="h-48 rounded-2xl overflow-hidden bg-slate-50 relative">
                    <img loading="lazy"
                      src={loc.imageUrl}
                      alt={loc.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                      <span className="text-white font-semibold text-xs tracking-wider">Explore {loc.name}</span>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-center text-slate-800 tracking-wide font-display uppercase group-hover:text-[#1D503A] transition-colors">{loc.name}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 7 - CTA BAND */}
        <section className="bg-[#1D503A] border border-[#1D503A]/20 rounded-3xl p-8 md:p-12 text-center space-y-6 relative overflow-hidden shadow-lg">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#C5A880]/15 rounded-full blur-3xl"></div>
          <div className="max-w-xl mx-auto space-y-4 relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold font-display text-white">
              Start Your {visaData.name.replace(" Schengen Visa", "")} Visa Application Today
            </h2>
            <p className="text-xs md:text-sm text-white/80 leading-relaxed">
              Get expert assistance for your {visaData.name} from Dubai. Our compliance team simplifies VFS scheduling, document preparation, and itinerary checklists.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2 max-w-md mx-auto">
              <button
                onClick={() => handleApplyClick("standard", visaData.supportPackages?.standard?.price || 299)}
                className="px-6 py-3.5 bg-gradient-to-r from-[#C5A880] to-[#E3C39D] text-[#0E221A] font-bold rounded-xl text-xs uppercase tracking-wider hover:opacity-95 transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                Apply Now
              </button>
              <a
                href={`https://wa.me/971557338429?text=Hi%2C%20I'm%20inquiring%20about%20${encodeURIComponent(visaData.name)}.`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3.5 bg-[#25D366] text-white font-bold rounded-xl text-xs uppercase tracking-wider hover:opacity-95 transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                <Phone className="h-4 w-4 shrink-0" />
                <span>Chat on WhatsApp</span>
              </a>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-3.5 border border-white/20 text-white hover:border-white hover:bg-white/5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
              >
                Free Consultation
              </button>
            </div>
          </div>
        </section>

      </div>

      {/* Enquiry Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Apply for: ${visaData.name}`}
        size="md"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 font-sans text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Full Name *</label>
              <input
                type="text"
                required
                className="px-3.5 py-2.5 bg-[#133c2a]/60 border border-white/10 text-white placeholder-white/20 rounded focus:outline-none focus:border-[#7A8F6B] text-xs"
                placeholder="Jane Doe"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider">WhatsApp Phone *</label>
              <input
                type="tel"
                required
                className="px-3.5 py-2.5 bg-[#133c2a]/60 border border-white/10 text-white placeholder-white/20 rounded focus:outline-none focus:border-[#7A8F6B] text-xs"
                placeholder="e.g. 501234567"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Email Address *</label>
              <input
                type="email"
                required
                className="px-3.5 py-2.5 bg-[#133c2a]/60 border border-white/10 text-white placeholder-white/20 rounded focus:outline-none focus:border-[#7A8F6B] text-xs"
                placeholder="jane@example.com"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Nationality</label>
              <input
                type="text"
                className="px-3.5 py-2.5 bg-[#133c2a]/60 border border-white/10 text-white placeholder-white/20 rounded focus:outline-none focus:border-[#7A8F6B] text-xs"
                placeholder="e.g. Indian, Jordanian"
                name="nationality"
                value={formData.nationality}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Travel Start Date</label>
            <input
              type="date"
              className="px-3.5 py-2.5 bg-[#133c2a]/60 border border-white/10 text-white rounded focus:outline-none focus:border-[#7A8F6B] text-xs"
              name="travelDate"
              value={formData.travelDate}
              onChange={handleInputChange}
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Message</label>
            <textarea
              rows={3}
              className="px-3.5 py-2.5 bg-[#133c2a]/60 border border-white/10 text-white placeholder-white/20 rounded focus:outline-none focus:border-[#7A8F6B] text-xs"
              placeholder="Provide details about your travel history or urgent timing..."
              name="message"
              value={formData.message}
              onChange={handleInputChange}
            />
          </div>

          <div className="flex space-x-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 py-2.5 bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/10 font-bold rounded text-xs uppercase tracking-wider transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-[#FAF8F5] text-[#1D503A] hover:bg-white font-bold rounded text-xs uppercase tracking-wider shadow-sm disabled:opacity-50 transition-colors"
            >
              {submitting ? "Submitting..." : "Submit Enquiry"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Authentication Required Modal */}
      <Modal
        isOpen={isAuthRequiredModalOpen}
        onClose={() => setIsAuthRequiredModalOpen(false)}
        title="Authentication Required"
        size="sm"
      >
        <div className="space-y-5 text-center py-4 font-sans text-xs">
          <div className="mx-auto w-12 h-12 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center border border-amber-500/20">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-bold text-white uppercase tracking-wider">Login Required</h3>
            <p className="text-white/75 leading-relaxed px-4">
              Please sign in or create a traveler account to start your visa application, upload documents, and track status.
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setIsAuthRequiredModalOpen(false)}
              className="flex-grow py-2.5 bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/10 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setIsAuthRequiredModalOpen(false);
                navigate("/portal/login", { state: { from: location } });
              }}
              className="flex-grow py-2.5 bg-[#FAF8F5] text-[#1D503A] hover:bg-white font-extrabold rounded-lg text-xs uppercase tracking-wider shadow-md transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default VisaDetailPage;
