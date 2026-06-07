import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { getVisaTypeBySlug, saveVisaType, createLead, createApplicationDraft } from "../../lib/firestore";
import { useAuth } from "../../contexts/AuthContext";
import { generateLeadNo } from "../../utils/helpers";
import { serverTimestamp } from "../../lib/firebase";
import Modal from "../../components/ui/Modal";
import {
  Clock, TrendingUp, FileText, Calendar, Shield, Star,
  CheckCircle, Globe, CreditCard, Award, ChevronDown, Check, Phone, ArrowLeft, AlertCircle,
  X, Sparkles
} from "lucide-react";
import toast from "react-hot-toast";

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

export const VisaDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userProfile, isAdmin } = useAuth();
  const [isAuthRequiredModalOpen, setIsAuthRequiredModalOpen] = useState(false);

  const [visaData, setVisaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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
      const draftId = await createApplicationDraft(
        user.uid,
        visaData.id,
        visaData.name,
        userProfile,
        packageType,
        amount
      );
      toast.success("Application draft created!", { id: loadingToast });
      navigate("/portal/applications");
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
        contactPhone: formData.phone.startsWith("+") ? formData.phone : `+971${formData.phone}`,
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
      <div className="bg-[#2C2712] min-h-screen text-[#EEDADA] font-sans">
        {/* Skeleton Hero */}
        <section className="py-24 bg-[#1C190B] border-b border-[#453E1D] animate-pulse">
          <div className="max-w-container-max mx-auto px-4 space-y-6">
            <div className="h-10 bg-[#453E1D] rounded w-1/3"></div>
            <div className="h-5 bg-[#453E1D] rounded w-2/3"></div>
            <div className="flex gap-4 pt-4">
              <div className="h-12 bg-[#453E1D] rounded w-32"></div>
              <div className="h-12 bg-[#453E1D] rounded w-32"></div>
            </div>
            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-10 border-t border-[#453E1D]/40">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-[#453E1D] rounded"></div>
              ))}
            </div>
          </div>
        </section>
        {/* Tab bar skeleton */}
        <div className="bg-[#1C190B] h-14 border-b border-[#453E1D]"></div>
      </div>
    );
  }

  // Not found or Draft Mode validation
  // Show not found if document is draft AND viewer is not admin
  const isDraft = visaData && !visaData.isPublished;
  const showNotFound = notFound || (isDraft && !isAdmin);

  if (showNotFound) {
    return (
      <div className="bg-[#2C2712] min-h-screen text-[#EEDADA] flex flex-col justify-center items-center py-24 text-center px-4 font-sans">
        <div className="max-w-md space-y-6">
          <AlertCircle className="h-20 w-20 text-[#E24B4A] mx-auto animate-bounce" />
          <h1 className="text-3xl font-bold font-display text-white">Visa Type Not Found</h1>
          <p className="text-sm text-[#EEDADA]/60 leading-relaxed">
            The page you're looking for doesn't exist or may have been un-published. Please check the URL or view our full services list.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/visa-services"
              className="px-6 py-3 border border-[#453E1D] text-white hover:border-[#EAC784] hover:text-[#EAC784] rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
            >
              View Services
            </Link>
            <Link
              to="/contact"
              className="px-6 py-3 bg-[#EAC784] text-[#2C2712] rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#2C2712] min-h-screen text-[#EEDADA] font-sans pb-24 relative">

      {/* Draft Mode Banner (Visible to Admin only) */}
      {isDraft && isAdmin && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-400 py-3.5 px-6 sticky top-24 z-30 flex items-center justify-between text-xs font-semibold backdrop-blur-md">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4.5 w-4.5" />
            <span>Draft Mode — This page is not visible to the public</span>
          </div>
          <button
            onClick={handlePublishNow}
            className="px-4 py-1.5 bg-[#EAC784] text-[#2C2712] font-bold rounded hover:opacity-95 transition-opacity"
          >
            Publish Now
          </button>
        </div>
      )}

      {/* HERO SECTION */}
      <section className="relative py-20 overflow-hidden border-b border-[#453E1D]">
        {visaData.imageUrl && (
          <div className="absolute inset-0 z-0">
            <img
              src={visaData.imageUrl}
              alt={visaData.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#1C190B]/95 via-[#1C190B]/80 to-transparent"></div>
          </div>
        )}
        <div className="relative z-10 max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop space-y-6">

          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-xs text-[#EEDADA]/60 pb-2">
            <Link to="/" className="hover:text-white">Home</Link>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <Link to="/visa-services" className="hover:text-white">Visa Services</Link>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-[#EAC784] font-medium">{visaData.name}</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold font-display text-white tracking-wide leading-tight max-w-2xl">
            {visaData.name}
          </h1>
          <p className="text-base text-[#EEDADA]/70 max-w-xl leading-relaxed">
            {visaData.tagline}
          </p>

          <div className="flex gap-4 pt-2">
            <button
              onClick={handleApplyClick}
              className="px-8 py-3.5 bg-[#EAC784] text-[#2C2712] font-bold rounded-xl text-xs uppercase tracking-wider hover:opacity-95 hover:shadow-[0_0_15px_rgba(201,168,76,0.3)] transition-all"
            >
              Start Application
            </button>
            <button
              onClick={() => scrollToSection("documents")}
              className="px-8 py-3.5 border border-[#453E1D] text-white hover:border-[#EAC784] hover:text-[#EAC784] rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
            >
              View Requirements
            </button>
          </div>

          {/* Hero Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-12 border-t border-[#453E1D]/40 mt-10">
            {visaData.heroStats?.map((stat, index) => (
              <div
                key={index}
                className="bg-[#231F0D] border border-[#453E1D] p-4 rounded-xl flex items-center gap-3.5 shadow-sm"
              >
                <div className="p-2.5 rounded-lg bg-[#1C190B] text-[#EAC784]">
                  <StatIcon name={stat.icon} className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-lg font-bold text-white font-mono leading-tight">{stat.value}</div>
                  <span className="text-[10px] text-[#EEDADA]/45 font-bold uppercase tracking-wider">{stat.label}</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* STICKY TAB NAVIGATION BAR */}
      <div className="bg-[#1C190B] border-b border-[#453E1D] sticky top-14 z-20 shadow-md">
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
              className={`h-full text-xs font-bold uppercase tracking-widest relative px-1 transition-colors hover:text-white ${activeTab === tab.id ? "text-[#EAC784]" : "text-[#EEDADA]/60"
                }`}
            >
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#EAC784] rounded-t-full"></span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT SECTIONS CONTAINER */}
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16 space-y-24">

        {/* SECTION 2 - OVERVIEW */}
        <section id="overview" className="space-y-4 scroll-mt-40">
          <h2 className="text-xl font-bold font-display text-[#EAC784] uppercase tracking-wider border-b border-[#453E1D] pb-2">
            Overview
          </h2>
          <p className="text-sm md:text-base text-[#EEDADA]/80 leading-relaxed max-w-4xl">
            {visaData.overviewText}
          </p>
        </section>

        {/* SECTION 3 - REQUIRED DOCUMENTS */}
        <section id="documents" className="space-y-6 scroll-mt-40">
          <h2 className="text-xl font-bold font-display text-[#EAC784] uppercase tracking-wider border-b border-[#453E1D] pb-2">
            Required Documents Checklist
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
            {visaData.requiredDocuments?.map((doc, idx) => (
              <div
                key={idx}
                className="bg-[#1C190B] border border-[#453E1D]/60 p-4 rounded-xl flex items-start gap-3"
              >
                <div className="h-5 w-5 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border border-emerald-500/20">
                  <Check className="h-3 w-3" />
                </div>
                <span className="text-xs md:text-sm text-[#EEDADA]/80 leading-relaxed">
                  {doc}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 4 - HOW ESHAARE PROCESSES YOUR VISA */}
        <section id="process" className="space-y-10 scroll-mt-40">
          <h2 className="text-xl font-bold font-display text-[#EAC784] uppercase tracking-wider border-b border-[#453E1D] pb-2">
            How Eshaare Processes Your Visa
          </h2>

          <div className="relative max-w-3xl pl-4 md:pl-10 space-y-12">
            {/* Connecting line on desktop */}
            <div className="absolute left-[20px] md:left-[43px] top-4 bottom-4 w-[2px] bg-[#EAC784]/25 hidden sm:block"></div>

            {visaData.processSteps?.map((step, idx) => (
              <div key={idx} className="relative flex flex-col sm:flex-row gap-4 md:gap-8 items-start">
                {/* Step Circle */}
                <div className="h-10 w-10 md:h-12 md:w-12 bg-[#1C190B] border-2 border-[#EAC784] text-[#EAC784] font-bold font-display text-lg md:text-xl rounded-full flex items-center justify-center flex-shrink-0 relative z-10">
                  {step.stepNumber || idx + 1}
                </div>

                <div className="space-y-1">
                  <h4 className="text-base md:text-lg font-semibold text-white">
                    {step.title}
                  </h4>
                  <p className="text-xs md:text-sm text-[#EEDADA]/60 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 5 - FEE TABLE */}
        <section id="fees" className="space-y-6 scroll-mt-40">
          <h2 className="text-xl font-bold font-display text-[#EAC784] uppercase tracking-wider border-b border-[#453E1D] pb-2">
            Fee & Pricing Table
          </h2>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto border border-[#453E1D] rounded-xl shadow-lg bg-[#1C190B]">
            <table className="w-full text-left border-collapse text-xs md:text-sm text-[#EEDADA]/80">
              <thead>
                <tr className="bg-[#231F0D] border-b border-[#453E1D] text-[#EEDADA]/50 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4">Applicant Type</th>
                  <th className="p-4">Embassy Fee</th>
                  <th className="p-4">Service Fee</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#453E1D]/60">
                {visaData.feeStructure?.map((fee, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-semibold text-white">{fee.applicantType}</td>
                    <td className="p-4 font-mono">{fee.embassyFee}</td>
                    <td className="p-4 font-mono text-[#EAC784] font-bold">{fee.serviceFee}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={handleApplyClick}
                        className="px-4 py-1.5 bg-gradient-to-r from-[#EAC784] to-[#EDB868] text-[#2C2712] font-bold rounded text-xs uppercase tracking-wider"
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
                className="bg-[#1C190B] border border-[#453E1D] p-5 rounded-xl space-y-3"
              >
                <h4 className="text-sm font-bold text-white border-b border-[#453E1D]/50 pb-2">{fee.applicantType}</h4>
                <div className="flex justify-between text-xs text-[#EEDADA]/70">
                  <span>Embassy Fee:</span>
                  <span className="font-mono font-semibold text-white">{fee.embassyFee}</span>
                </div>
                <div className="flex justify-between text-xs text-[#EEDADA]/70">
                  <span>Service Fee:</span>
                  <span className="font-mono font-bold text-[#EAC784]">{fee.serviceFee}</span>
                </div>
                <button
                  onClick={handleApplyClick}
                  className="w-full py-2 bg-gradient-to-r from-[#EAC784] to-[#EDB868] text-[#2C2712] font-bold rounded-lg text-xs uppercase tracking-wider pt-2 mt-1"
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
                <h3 className="text-2xl font-bold font-display text-white tracking-wide">
                  Choose the Level of Support You Need
                </h3>
                <p className="text-xs text-[#EEDADA]/60">
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
                              <Check className="h-4.5 w-4.5 text-[#EAC784] flex-shrink-0 mt-0.5" />
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
                  <div className="bg-[#1C190B] text-white rounded-3xl p-8 shadow-2xl flex flex-col justify-between border-2 border-[#EAC784] relative transform hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                    {/* MOST POPULAR Badge */}
                    {visaData.supportPackages.premium.recommended && (
                      <div className="absolute top-4 right-4 bg-gradient-to-r from-[#EAC784] to-[#EDB868] text-[#2C2712] text-[9px] font-extrabold px-3.5 py-1 rounded-full uppercase tracking-widest shadow-md">
                        Most Popular
                      </div>
                    )}

                    <div className="space-y-6">
                      <div className="space-y-2 pr-16">
                        <h4 className="text-xl font-bold text-white leading-snug">
                          {visaData.supportPackages.premium.title}
                        </h4>
                        <p className="text-xs text-[#EEDADA]/60 leading-relaxed">
                          {visaData.supportPackages.premium.subtitle}
                        </p>
                      </div>

                      <div className="py-2">
                        <span className="text-4xl font-extrabold text-[#EAC784] font-mono">
                          AED {visaData.supportPackages.premium.price}
                        </span>
                        <span className="text-xs text-[#EEDADA]/60 font-medium"> / applicant</span>
                      </div>

                      {/* Features list */}
                      <ul className="space-y-3.5 border-t border-[#453E1D] pt-6">
                        {visaData.supportPackages.premium.features?.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-xs">
                            {feat.highlighted ? (
                              <Sparkles className="h-4.5 w-4.5 text-[#EAC784] flex-shrink-0 mt-0.5" />
                            ) : feat.included ? (
                              <Check className="h-4.5 w-4.5 text-[#EAC784] flex-shrink-0 mt-0.5" />
                            ) : (
                              <X className="h-4.5 w-4.5 text-[#EEDADA]/30 flex-shrink-0 mt-0.5" />
                            )}
                            <span className={
                              feat.highlighted
                                ? "text-[#EAC784] font-semibold"
                                : feat.included
                                  ? "text-[#EEDADA]/90 font-medium"
                                  : "text-[#EEDADA]/40 line-through"
                            }>
                              {feat.text}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      onClick={() => handleApplyClick("premium", visaData.supportPackages.premium.price)}
                      className="w-full mt-8 py-3.5 bg-gradient-to-r from-[#EAC784] to-[#EDB868] text-[#2C2712] hover:opacity-95 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md font-extrabold"
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
          <h2 className="text-xl font-bold font-display text-[#EAC784] uppercase tracking-wider border-b border-[#453E1D] pb-2">
            Frequently Asked Questions
          </h2>
          <div className="border border-[#453E1D] rounded-xl overflow-hidden divide-y divide-[#453E1D] bg-[#1C190B]">
            {visaData.faqs?.map((faq, idx) => {
              const isOpen = !!openFaqs[idx];
              return (
                <div key={idx} className="transition-colors hover:bg-white/2">
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between p-5 text-left text-sm font-bold text-white focus:outline-none select-none"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={`h-4.5 w-4.5 text-[#EAC784] transition-transform duration-300 ${isOpen ? "rotate-180" : ""
                        }`}
                    />
                  </button>
                  <div
                    className={`px-5 text-xs md:text-sm text-[#EEDADA]/60 leading-relaxed overflow-hidden transition-all duration-300 ${isOpen ? "max-h-60 pb-5 opacity-100" : "max-h-0 opacity-0"
                      }`}
                  >
                    <div className="pt-2 border-t border-[#453E1D]/20">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 7 - CTA BAND */}
        <section className="bg-[#1C190B] border border-[#453E1D] rounded-3xl p-8 md:p-12 text-center space-y-6 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#EAC784]/5 rounded-full blur-3xl"></div>
          <div className="max-w-xl mx-auto space-y-4 relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold font-display text-white">
              Ready to apply for your {visaData.name}?
            </h2>
            <p className="text-xs md:text-sm text-[#EEDADA]/60 leading-relaxed">
              Start your visa application today. Our experienced document compliance team will guide you through VFS slot schedules, NOC forms, and interview prep.
            </p>
            <button
              onClick={handleApplyClick}
              className="px-8 py-3.5 bg-gradient-to-r from-[#EAC784] to-[#EDB868] text-[#2C2712] font-bold rounded-xl text-xs uppercase tracking-wider hover:opacity-95 transition-all shadow-md inline-flex items-center gap-1.5"
            >
              <Phone className="h-4 w-4" />
              <span>Start Application Now</span>
            </button>
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
                placeholder="e.g. 501234567"
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
                placeholder="e.g. Indian, Jordanian"
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
            <label className="text-[10px] font-bold text-[#EEDADA]/40 uppercase tracking-wider">Message</label>
            <textarea
              rows={3}
              className="px-3.5 py-2.5 bg-[#231F0D] border border-[#453E1D] text-white placeholder-[#EEDADA]/20 rounded focus:outline-none focus:border-[#EAC784] text-xs"
              placeholder="Provide details about your travel history or urgent timing..."
              name="message"
              value={formData.message}
              onChange={handleInputChange}
            />
          </div>

          <div className="flex space-x-3 pt-4 border-t border-[#453E1D]">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 py-2.5 bg-[#453E1D] border border-[#453E1D] text-white font-bold rounded text-xs uppercase tracking-wider"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-gradient-to-r from-[#EAC784] to-[#EDB868] text-[#2C2712] font-bold rounded text-xs uppercase tracking-wider shadow-sm disabled:opacity-50"
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
            <p className="text-[#EEDADA]/60 leading-relaxed px-4">
              Please sign in or create a traveler account to start your visa application, upload documents, and track status.
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setIsAuthRequiredModalOpen(false)}
              className="flex-grow py-2.5 bg-[#231F0D] border border-[#453E1D] text-[#EEDADA]/85 hover:text-white rounded-lg font-bold text-xs uppercase tracking-wider transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setIsAuthRequiredModalOpen(false);
                navigate("/portal/login", { state: { from: location } });
              }}
              className="flex-grow py-2.5 bg-gradient-to-r from-[#EAC784] to-[#EDB868] text-[#2C2712] font-extrabold rounded-lg text-xs uppercase tracking-wider hover:opacity-95 transition-all shadow-md"
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
