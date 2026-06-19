import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getVisaTypes, createLead } from "../../lib/firestore";
import { generateLeadNo, formatWhatsAppPhone } from "../../utils/helpers";
import { serverTimestamp } from "../../lib/firebase";
import Modal from "../../components/ui/Modal";
import { Clock, TrendingUp, FileText, Calendar, AlertCircle, Phone, ArrowRight, ShieldCheck, ClipboardCheck, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

const PRESET_VISAS = [
  {
    id: "uk",
    slug: "uk",
    name: "United Kingdom (UK) Visa",
    tagline: "Standard & Priority visitor visas for England, Scotland, Wales & Northern Ireland.",
    imageUrl: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80",
    category: "UK Visa",
    heroStats: [
      { label: "Processing Time", value: "10-15 Days", icon: "Clock" },
      { label: "Success Rate", value: "96.5%", icon: "TrendingUp" }
    ]
  },
  {
    id: "usa",
    slug: "usa",
    name: "United States (USA) B1/B2 Visa",
    tagline: "10-year multiple-entry tourist and business visa with professional DS-160 auditing.",
    imageUrl: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=800&q=80",
    category: "USA Visa",
    heroStats: [
      { label: "Processing Time", value: "4-8 Weeks", icon: "Clock" },
      { label: "Success Rate", value: "92.0%", icon: "TrendingUp" }
    ]
  },
  {
    id: "schengen",
    slug: "schengen",
    name: "Schengen Europe Visa (General)",
    tagline: "Universal access to all 27 European Schengen member states with priority biometrics slots.",
    imageUrl: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=800&q=80",
    category: "Schengen Visa",
    heroStats: [
      { label: "Processing Time", value: "5-10 Days", icon: "Clock" },
      { label: "Success Rate", value: "98.2%", icon: "TrendingUp" }
    ]
  },
  {
    id: "france",
    slug: "france",
    name: "France Schengen Visa",
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
    name: "Italy Schengen Visa",
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
    name: "Germany Schengen Visa",
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
    name: "Spain Schengen Visa",
    tagline: "Explore Madrid, Barcelona, and Andalucia with expert BLS Spain booking support.",
    imageUrl: "https://images.unsplash.com/photo-1509840841025-9088ba78a826?auto=format&fit=crop&w=800&q=80",
    category: "Schengen Visa",
    heroStats: [
      { label: "Processing Time", value: "10-15 Days", icon: "Clock" },
      { label: "Success Rate", value: "97.0%", icon: "TrendingUp" }
    ]
  },
  {
    id: "netherlands",
    slug: "netherlands",
    name: "Netherlands Schengen Visa",
    tagline: "Audit your financial statement & employment files for Dutch Schengen entry.",
    imageUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
    category: "Schengen Visa",
    heroStats: [
      { label: "Processing Time", value: "7-12 Days", icon: "Clock" },
      { label: "Success Rate", value: "98.0%", icon: "TrendingUp" }
    ]
  },
  {
    id: "switzerland",
    slug: "switzerland",
    name: "Switzerland Schengen Visa",
    tagline: "Premium travel itineraries and coverage verification for Swiss visa submissions.",
    imageUrl: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=800&q=80",
    category: "Schengen Visa",
    heroStats: [
      { label: "Processing Time", value: "6-10 Days", icon: "Clock" },
      { label: "Success Rate", value: "99.1%", icon: "TrendingUp" }
    ]
  },
  {
    id: "uae",
    slug: "uae",
    name: "United Arab Emirates (UAE) Visa",
    tagline: "Express 30 & 60-day tourist visas for families visiting the Emirates.",
    imageUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80",
    category: "GCC / Middle East Visa",
    heroStats: [
      { label: "Processing Time", value: "2-3 Days", icon: "Clock" },
      { label: "Success Rate", value: "99.5%", icon: "TrendingUp" }
    ]
  },
  {
    id: "saudi",
    slug: "saudi",
    name: "Saudi Arabia Visa",
    tagline: "Umrah, tourist, and business eVisa solutions with direct portal processing.",
    imageUrl: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80",
    category: "GCC / Middle East Visa",
    heroStats: [
      { label: "Processing Time", value: "3-5 Days", icon: "Clock" },
      { label: "Success Rate", value: "98.0%", icon: "TrendingUp" }
    ]
  },
  {
    id: "oman",
    slug: "oman",
    name: "Oman Visa",
    tagline: "Transit and tourist eVisas for road or air travelers from the UAE.",
    imageUrl: "https://images.unsplash.com/photo-1621680696874-edd80ce57b72?auto=format&fit=crop&w=800&q=80",
    category: "GCC / Middle East Visa",
    heroStats: [
      { label: "Processing Time", value: "1-2 Days", icon: "Clock" },
      { label: "Success Rate", value: "99.8%", icon: "TrendingUp" }
    ]
  },
  {
    id: "japan",
    slug: "japan",
    name: "Japan Visa",
    tagline: "Short-stay tourist visa assistance including travel plan and reservation compliance.",
    imageUrl: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80",
    category: "Asia Visa",
    heroStats: [
      { label: "Processing Time", value: "5-7 Days", icon: "Clock" },
      { label: "Success Rate", value: "98.7%", icon: "TrendingUp" }
    ]
  },
  {
    id: "korea",
    slug: "korea",
    name: "South Korea Visa",
    tagline: "Tourist visas and K-ETA application check-ins for UAE residents.",
    imageUrl: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80",
    category: "Asia Visa",
    heroStats: [
      { label: "Processing Time", value: "7-10 Days", icon: "Clock" },
      { label: "Success Rate", value: "96.2%", icon: "TrendingUp" }
    ]
  },
  {
    id: "vietnam",
    slug: "vietnam",
    name: "Vietnam Visa",
    tagline: "Fast-track approval letters and tourist eVisas handled within 72 hours.",
    imageUrl: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=800&q=80",
    category: "Asia Visa",
    heroStats: [
      { label: "Processing Time", value: "3-4 Days", icon: "Clock" },
      { label: "Success Rate", value: "99.0%", icon: "TrendingUp" }
    ]
  },
  {
    id: "australia",
    slug: "australia",
    name: "Australia Visa",
    tagline: "Visitor Visa (Subclass 600) audits for multi-entry tourism or business trips.",
    imageUrl: "https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?auto=format&fit=crop&w=800&q=80",
    category: "Oceania Visa",
    heroStats: [
      { label: "Processing Time", value: "15-20 Days", icon: "Clock" },
      { label: "Success Rate", value: "95.5%", icon: "TrendingUp" }
    ]
  },
  {
    id: "new-zealand",
    slug: "new-zealand",
    name: "New Zealand Visa",
    tagline: "Visitor Visa and NZeTA document verification for smooth travel entries.",
    imageUrl: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80",
    category: "Oceania Visa",
    heroStats: [
      { label: "Processing Time", value: "15-25 Days", icon: "Clock" },
      { label: "Success Rate", value: "94.8%", icon: "TrendingUp" }
    ]
  }
];

const getMergedVisas = (firestoreVisas) => {
  const merged = [...PRESET_VISAS];
  firestoreVisas.forEach(fVisa => {
    const fSlug = (fVisa.slug || fVisa.id || "").toLowerCase().trim();
    const normalizedFSlug = fSlug.endsWith("-visa") ? fSlug.replace("-visa", "") : fSlug;
    const index = merged.findIndex(p => p.slug === normalizedFSlug || p.id === normalizedFSlug);
    if (index !== -1) {
      merged[index] = { ...merged[index], ...fVisa };
    } else {
      let category = fVisa.category || "Schengen Visa";
      const nameLower = (fVisa.name || "").toLowerCase();
      if (nameLower.includes("uk") || nameLower.includes("united kingdom")) category = "UK Visa";
      else if (nameLower.includes("usa") || nameLower.includes("united states")) category = "USA Visa";
      else if (nameLower.includes("gcc") || nameLower.includes("middle east") || nameLower.includes("uae") || nameLower.includes("saudi") || nameLower.includes("oman")) category = "GCC / Middle East Visa";
      else if (nameLower.includes("asia") || nameLower.includes("japan") || nameLower.includes("korea") || nameLower.includes("vietnam")) category = "Asia Visa";
      else if (nameLower.includes("oceania") || nameLower.includes("australia") || nameLower.includes("zealand")) category = "Oceania Visa";

      merged.push({ ...fVisa, category });
    }
  });
  return merged;
};

// Icon mapping helper
const StatIcon = ({ name, className }) => {
  const icons = {
    Clock: Clock,
    TrendingUp: TrendingUp,
    FileText: FileText,
    Calendar: Calendar
  };
  const IconComponent = icons[name] || FileText;
  return <IconComponent className={className} />;
};

export const VisaServicesPage = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    document.title = "Schengen Visa UAE & Visa Services Dubai | ESHAARE";
  }, []);

  const [visaTypes, setVisaTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const [activeFilter, setActiveFilter] = useState("All");

  // Modal Enquiry State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVisa, setSelectedVisa] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    nationality: "",
    travelDate: "",
    message: "",
    honeypot: ""
  });
  const [submitting, setSubmitting] = useState(false);

  // Eligibility Checker State
  const [checkerStep, setCheckerStep] = useState(0);
  const [checkerForm, setCheckerForm] = useState({
    destination: "",
    nationality: "",
    employment: "Salaried",
    noc: "Yes",
    salary: "10,000 - 15,000 AED",
    bankStatement: "Yes",
    priorTravel: []
  });
  const [checkerContact, setCheckerContact] = useState({
    name: "",
    email: "",
    phone: "",
    honeypot: ""
  });
  const [checkerSubmitted, setCheckerSubmitted] = useState(false);
  const [checkerSubmitting, setCheckerSubmitting] = useState(false);

  // Fetch published visa types in real-time
  useEffect(() => {
    setLoading(true);
    setError(false);
    const unsubscribe = getVisaTypes(
      (data) => {
        setVisaTypes(data);
        setLoading(false);
      },
      true, // onlyPublished = true
      (err) => {
        setError(true);
        setLoading(false);
        console.error("Failed to load visa services:", err);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [retryTrigger]);

  const handleApplyClick = (visa) => {
    setSelectedVisa(visa);
    setFormData({
      name: "",
      phone: "",
      email: "",
      nationality: "",
      travelDate: "",
      message: "",
      honeypot: ""
    });
    setIsModalOpen(true);
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
        destinationCountry: selectedVisa?.name || "Global Visa",
        serviceType: "Visa",
        travelStart: formData.travelDate,
        source: "website_cms_listing",
        stage: "New",
        priority: "Medium",
        ownerId: null,
        notes: formData.message,
        honeypot: formData.honeypot,
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

  // Eligibility score logic
  const getEligibilityResult = () => {
    let score = 55;
    let factors = [];
    let recommendations = [];

    const dest = (checkerForm.destination || "").toLowerCase();
    const isStrict = dest && (dest.includes("schengen") || dest.includes("kingdom") || dest.includes("united states") || dest.includes("canada") || dest.includes("uk") || dest.includes("us"));

    // Nationality factor
    const nat = (checkerForm.nationality || "").toLowerCase().trim();
    if (nat) {
      if (["indian", "pakistani", "egyptian", "filipino", "syrian", "jordanian", "bangladeshi"].includes(nat)) {
        score -= 5;
        factors.push("Standard passport controls apply for this route.");
      } else {
        score += 10;
        factors.push("Favorable visa-on-arrival/access profile for nationality.");
      }
    }

    // Employment
    if (checkerForm.employment === "Salaried") {
      score += 15;
      if (checkerForm.noc === "Yes") {
        score += 10;
        factors.push("Employer No Objection Certificate (NOC) is available.");
      } else {
        score -= 15;
        factors.push("Lack of employer NOC represents an embassy refusal risk.");
        recommendations.push("Request a standard NOC template from your employer.");
      }
    } else if (checkerForm.employment === "Self-Employed") {
      score += 10;
      factors.push("Business/Trade License registry needs audits.");
      recommendations.push("Prepare standard trade license documents & corporate statements.");
    } else if (checkerForm.employment === "Freelancer") {
      score += 5;
      factors.push("Independent freelancing files require client contract backups.");
    } else {
      score -= 25;
      factors.push("Unemployed status needs sponsorship verification.");
      recommendations.push("Provide sponsorship certificate from spouse, relative, or sponsor.");
    }

    // Salary/Income
    if (checkerForm.salary === "Above 15,000 AED") {
      score += 25;
      factors.push("Exceptional monthly income level (>15k AED).");
    } else if (checkerForm.salary === "10,000 - 15,000 AED") {
      score += 15;
      factors.push("Favorable monthly income level (10k-15k AED).");
    } else if (checkerForm.salary === "5,000 - 10,000 AED") {
      score += 5;
      if (isStrict) {
        score -= 10;
        factors.push("Moderate income tier for premium destinations.");
        recommendations.push("Provide evidence of strong bank balance to back up salary limits.");
      }
    } else {
      score -= 20;
      factors.push("Salary under 5k AED represents a high refusal flag for premium visas.");
      recommendations.push("Consider visa alternatives or request certified sponsorship files.");
    }

    // Bank Statement
    if (checkerForm.bankStatement === "Yes") {
      score += 15;
      factors.push("Stable 3-6 month bank statement logs available.");
    } else {
      score -= 30;
      factors.push("Missing bank statement history is an immediate refusal cause.");
      recommendations.push("Initiate statement audits to verify alternative proof options.");
    }

    // Travel History
    if (checkerForm.priorTravel.length > 0) {
      score += 15;
      factors.push(`Established compliance history: ${checkerForm.priorTravel.join(", ")}.`);
    } else {
      factors.push("No history of premium visa approvals (fresh passport).");
    }

    // Clamp score
    score = Math.max(15, Math.min(99, score));

    let level = "Moderate Approval Rate";
    let color = "text-yellow-700 bg-yellow-50 border-yellow-200/50";
    let desc = "You meet basic criteria, but embassy review will be strict. Complete standard auditing checks to strengthen your case.";

    if (score >= 75) {
      level = "Excellent Approval Rate";
      color = "text-green-700 bg-green-50 border-green-200/50";
      desc = "Great! You have a highly competitive profile. Your parameters match standard embassy approvals. Book slots now.";
    } else if (score < 48) {
      level = "Action Required / Weak Score";
      color = "text-red-700 bg-red-50 border-red-200/50";
      desc = "High-risk factors detected (low income, missing statements or NOC). Embassy rejection probability is elevated. Consultation required.";
    }

    return { score, level, color, desc, factors, recommendations };
  };

  const eligibilityResult = getEligibilityResult();

  const handleCheckerContactChange = (e) => {
    const { name, value } = e.target;
    setCheckerContact((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckerLeadSubmit = async (e) => {
    e.preventDefault();
    if (!checkerContact.name || !checkerContact.phone || !checkerContact.email) {
      toast.error("Please enter your name, email, and phone number.");
      return;
    }
    setCheckerSubmitting(true);
    try {
      const generatedNo = await generateLeadNo();
      const submission = {
        leadNo: generatedNo,
        contactName: checkerContact.name,
        contactPhone: checkerContact.phone.startsWith("+") ? checkerContact.phone : `+971${checkerContact.phone}`,
        contactEmail: checkerContact.email,
        nationality: checkerForm.nationality,
        destinationCountry: checkerForm.destination,
        serviceType: "Visa",
        travelStart: "",
        source: "website_eligibility_checker",
        stage: "New",
        priority: eligibilityResult.score >= 75 ? "High" : eligibilityResult.score >= 48 ? "Medium" : "Low",
        ownerId: null,
        notes: `AUTOMATED ELIGIBILITY CHECKER SCORECARD:
- Score: ${eligibilityResult.score}% (${eligibilityResult.level})
- Target Destination: ${checkerForm.destination}
- Applicant Nationality: ${checkerForm.nationality}
- Employment Status: ${checkerForm.employment} (NOC available: ${checkerForm.noc})
- Monthly Income Tier: ${checkerForm.salary}
- Has Bank Statement: ${checkerForm.bankStatement}
- Travel History: ${checkerForm.priorTravel.length > 0 ? checkerForm.priorTravel.join(", ") : "None"}
- System recommendations provided: ${eligibilityResult.recommendations.join(" | ")}`,
        honeypot: checkerContact.honeypot,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await createLead(submission);
      toast.success(`Success! Assessment stored. Reference: ${generatedNo}`);
      setCheckerSubmitted(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit assessment. Please try again.");
    } finally {
      setCheckerSubmitting(false);
    }
  };

  const toggleTravelHistory = (country) => {
    setCheckerForm((prev) => {
      const history = [...prev.priorTravel];
      if (history.includes(country)) {
        return { ...prev, priorTravel: history.filter((c) => c !== country) };
      } else {
        return { ...prev, priorTravel: [...history, country] };
      }
    });
  };

  return (
    <div
      style={{
        backgroundImage: "linear-gradient(rgba(250, 248, 245, 0.94), rgba(250, 248, 245, 0.94)), url('https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?auto=format&fit=crop&w=1600&q=80')",
        backgroundAttachment: "fixed",
        backgroundSize: "cover",
        backgroundPosition: "center"
      }}
      className="min-h-screen text-on-surface font-body-md pb-24"
    >
      {/* Page Hero Banner */}
      <section className="relative min-h-[540px] py-12 md:py-20 overflow-hidden bg-[#1D503A] flex items-center justify-center">
        {/* Background Image with elegant overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1488085061387-422e29b40080?auto=format&fit=crop&w=2560&q=80"
            alt="Travel Background"
            className="w-full h-full object-cover opacity-100"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-[#2B2723]/95"></div>
          {/* Decorative accent light blur - matching the warm gold brand tone instead of green */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#C5A880] opacity-15 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-center">
            {/* Left Column: Heading and Tagline */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-white/10 border border-white/10 rounded-full backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C5A880] animate-pulse" />
                <span className="text-[10px] font-bold text-[#EAE3D5] uppercase tracking-wider font-mono">Premium Document Audits</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold font-display text-white tracking-tight leading-tight">
                Global Visa Assistance Services
              </h1>
              <p className="text-sm md:text-base lg:text-lg text-[#EAE3D5]/90 leading-relaxed max-w-xl">
                Fast, transparent document auditing & appointment booking assistance for Schengen Europe, United Kingdom, USA, UAE & Saudi Arabia.
              </p>
            </div>

            {/* Right Column: Check Eligibility Card */}
            <div className="lg:col-span-5 w-full">
              <div className="bg-white/95 backdrop-blur-md border border-outline-variant/10 rounded-3xl premium-shadow p-6 md:p-8 space-y-6 text-left max-w-sm mx-auto">
                {/* Progress Header */}
                <div className="flex items-center justify-between border-b border-outline-variant/10 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-[#1D503A]/5 text-[#1D503A]">
                      <ClipboardCheck size={20} />
                    </div>
                    <div>
                      <h3 className="font-headline-md text-body-lg font-bold text-gray-900 font-display">Visa Eligibility</h3>
                      <p className="text-[11px] text-on-surface-variant">Check approval probability in 60s.</p>
                    </div>
                  </div>

                  {/* Stepper bubbles */}
                  {!checkerSubmitted && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      {[0, 1, 2, 3].map((step) => (
                        <div
                          key={step}
                          className={`h-2 rounded-full transition-all duration-300 ${checkerStep === step
                            ? "w-6 bg-[#1D503A]"
                            : checkerStep > step
                              ? "w-2 bg-[#1D503A]/40"
                              : "w-2 bg-gray-200"
                            }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Stepper Screens */}
                {!checkerSubmitted ? (
                  <div className="space-y-6">
                    {/* STEP 0: Destination & Nationality */}
                    {checkerStep === 0 && (
                      <div className="space-y-5 animate-[fadeIn_0.25s_ease-out]">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-sans">Step 1: Travel Intentions</h4>
                        <div className="space-y-4">
                          <div className="flex flex-col space-y-1.5">
                            <label className="text-xs font-bold text-on-surface-variant">Where are you traveling to?</label>
                            <select
                              value={checkerForm.destination}
                              onChange={(e) => setCheckerForm((prev) => ({ ...prev, destination: e.target.value }))}
                              className="w-full px-3.5 py-3 bg-surface border border-outline-variant/20 rounded-xl focus:border-[#1D503A] outline-none text-sm text-gray-900 font-medium"
                            >
                              <option value="">Select Destination</option>
                              <option>Schengen Europe</option>
                              <option>United Kingdom</option>
                              <option>United States</option>
                              <option>Canada</option>
                              <option>Saudi Arabia</option>
                              <option>Japan</option>
                              <option>United Arab Emirates</option>
                            </select>
                          </div>
                          <div className="flex flex-col space-y-1.5">
                            <label className="text-xs font-bold text-on-surface-variant">What is your Nationality?</label>
                            <select
                              value={checkerForm.nationality}
                              onChange={(e) => setCheckerForm((prev) => ({ ...prev, nationality: e.target.value }))}
                              className="w-full px-3.5 py-3 bg-surface border border-outline-variant/20 rounded-xl focus:border-[#1D503A] outline-none text-sm text-gray-900 font-medium"
                            >
                              <option value="">Select Nationality</option>
                              <option>Indian</option>
                              <option>Egyptian</option>
                              <option>Syrian</option>
                              <option>Filipino</option>
                              <option>Jordanian</option>
                              <option>Pakistani</option>
                              <option>British</option>
                              <option>Other / Dual Nationality</option>
                            </select>
                          </div>
                        </div>
                        <div className="pt-4 border-t border-outline-variant/5 flex justify-end">
                          <button
                            onClick={() => {
                              if (!checkerForm.destination || !checkerForm.nationality) {
                                toast.error("Please select both a destination and a nationality.");
                                return;
                              }
                              setCheckerStep(1);
                            }}
                            disabled={!checkerForm.destination || !checkerForm.nationality}
                            className="px-5 py-2.5 bg-[#1D503A] hover:bg-[#0e4a1e] text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span>Next Step</span>
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* STEP 1: Employment & NOC */}
                    {checkerStep === 1 && (
                      <div className="space-y-5 animate-[fadeIn_0.25s_ease-out]">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-sans">Step 2: Professional Details</h4>
                        <div className="space-y-3">
                          <label className="text-xs font-bold text-on-surface-variant block">Employment status in UAE?</label>
                          <div className="grid grid-cols-2 gap-3">
                            {["Salaried", "Self-Employed", "Freelancer", "Unemployed"].map((emp) => (
                              <div
                                key={emp}
                                onClick={() => setCheckerForm((prev) => ({ ...prev, employment: emp }))}
                                className={`p-3 border rounded-xl cursor-pointer text-center transition-all ${checkerForm.employment === emp
                                  ? "border-[#1D503A] bg-[#1D503A]/5 text-[#1D503A] font-bold"
                                  : "border-outline-variant/25 hover:border-[#1D503A]/40 text-on-surface"
                                  }`}
                              >
                                <span className="text-xs block">{emp}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        {checkerForm.employment === "Salaried" && (
                          <div className="space-y-2 pt-1">
                            <label className="text-xs font-bold text-on-surface-variant block">Can you secure an NOC from your employer?</label>
                            <div className="flex gap-4">
                              {["Yes", "No"].map((opt) => (
                                <label key={opt} className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-gray-800">
                                  <input
                                    type="radio"
                                    name="noc"
                                    checked={checkerForm.noc === opt}
                                    onChange={() => setCheckerForm((prev) => ({ ...prev, noc: opt }))}
                                    className="w-4 h-4 text-[#1D503A] focus:ring-[#1D503A]"
                                  />
                                  <span>{opt === "Yes" ? "Yes" : "No"}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="pt-4 border-t border-outline-variant/5 flex justify-between">
                          <button
                            onClick={() => setCheckerStep(0)}
                            className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl text-xs font-bold uppercase tracking-wider"
                          >
                            Back
                          </button>
                          <button
                            onClick={() => setCheckerStep(2)}
                            className="px-5 py-2.5 bg-[#1D503A] hover:bg-[#0e4a1e] text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md"
                          >
                            <span>Next Step</span>
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* STEP 2: Financials & History */}
                    {checkerStep === 2 && (
                      <div className="space-y-5 animate-[fadeIn_0.25s_ease-out]">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-sans">Step 3: Finances & History</h4>
                        <div className="space-y-4">
                          <div className="flex flex-col space-y-1.5">
                            <label className="text-xs font-bold text-on-surface-variant">Monthly salary range?</label>
                            <select
                              value={checkerForm.salary}
                              onChange={(e) => setCheckerForm((prev) => ({ ...prev, salary: e.target.value }))}
                              className="w-full px-3.5 py-3 bg-surface border border-outline-variant/20 rounded-xl focus:border-[#1D503A] outline-none text-sm text-gray-900 font-medium"
                            >
                              <option>Above 15,000 AED</option>
                              <option>10,000 - 15,000 AED</option>
                              <option>5,000 - 10,000 AED</option>
                              <option>Under 5,000 AED</option>
                            </select>
                          </div>
                          <div className="flex flex-col space-y-2">
                            <label className="text-xs font-bold text-on-surface-variant">Regular 3-6 month bank statement logs?</label>
                            <div className="flex gap-4 pt-1">
                              {["Yes", "No"].map((opt) => (
                                <label key={opt} className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-gray-800">
                                  <input
                                    type="radio"
                                    name="bank"
                                    checked={checkerForm.bankStatement === opt}
                                    onChange={() => setCheckerForm((prev) => ({ ...prev, bankStatement: opt }))}
                                    className="w-4 h-4 text-[#1D503A]"
                                  />
                                  <span>{opt === "Yes" ? "Yes" : "No"}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2 pt-1">
                          <label className="text-xs font-bold text-on-surface-variant block">Recent visa approvals (last 5 years)?</label>
                          <div className="flex flex-wrap gap-2">
                            {["Schengen EU", "United Kingdom", "US / Canada"].map((country) => (
                              <div
                                key={country}
                                onClick={() => toggleTravelHistory(country)}
                                className={`px-3 py-1.5 border rounded-lg cursor-pointer text-xs transition-all ${checkerForm.priorTravel.includes(country)
                                  ? "bg-[#1D503A]/5 border-[#1D503A] text-[#1D503A] font-bold"
                                  : "border-outline-variant/20 hover:border-gray-300 text-gray-600"
                                  }`}
                              >
                                {country}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="pt-4 border-t border-outline-variant/5 flex justify-between">
                          <button
                            onClick={() => setCheckerStep(1)}
                            className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl text-xs font-bold uppercase tracking-wider"
                          >
                            Back
                          </button>
                          <button
                            onClick={() => setCheckerStep(3)}
                            className="px-5 py-2.5 bg-[#1D503A] hover:bg-[#0e4a1e] text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md"
                          >
                            <span>Verify Score</span>
                            <TrendingUp size={14} />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* STEP 3: Results Display & Form */}
                    {checkerStep === 3 && (
                      <div className="space-y-6 animate-[fadeIn_0.25s_ease-out]">
                        <div className="flex items-center gap-4 p-4 border rounded-xl bg-surface-container-low/50">
                          <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                            <svg className="w-full h-full transform -rotate-90">
                              <circle
                                cx="40"
                                cy="40"
                                r="34"
                                className="stroke-gray-100 fill-none"
                                strokeWidth="6"
                              />
                              <circle
                                cx="40"
                                cy="40"
                                r="34"
                                className="stroke-[#1D503A] fill-none transition-all duration-1000"
                                strokeWidth="6"
                                strokeDasharray={213.6}
                                strokeDashoffset={213.6 - (213.6 * eligibilityResult.score) / 100}
                              />
                            </svg>
                            <div className="absolute flex flex-col items-center justify-center">
                              <span className="text-lg font-black text-gray-900 font-mono leading-none">{eligibilityResult.score}%</span>
                              <span className="text-[8px] font-bold text-gray-500 uppercase mt-0.5 font-sans">Score</span>
                            </div>
                          </div>
                          <div className="space-y-1 text-left flex-grow">
                            <div className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold border ${eligibilityResult.color}`}>
                              {eligibilityResult.level}
                            </div>
                            <p className="text-[11px] text-on-surface-variant/95 leading-relaxed">{eligibilityResult.desc}</p>
                          </div>
                        </div>
                        <div className="space-y-3.5">
                          <div className="space-y-1.5">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block">Identified Factors</span>
                            <div className="space-y-1">
                              {eligibilityResult.factors.slice(0, 3).map((f, i) => (
                                <div key={i} className="flex items-start gap-1.5 text-xs text-gray-800 leading-normal font-medium">
                                  <span className="text-green-500 font-bold">✓</span>
                                  <span>{f}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          {eligibilityResult.recommendations.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block">Next Steps</span>
                              <div className="space-y-1">
                                {eligibilityResult.recommendations.slice(0, 2).map((r, i) => (
                                  <div key={i} className="flex items-start gap-1.5 text-xs text-gray-800 leading-normal font-medium">
                                    <span className="text-amber-500 font-bold">!</span>
                                    <span>{r}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <form onSubmit={handleCheckerLeadSubmit} className="bg-surface p-4 rounded-xl border border-outline-variant/10 space-y-3">
                          <input
                            type="text"
                            name="honeypot"
                            style={{ display: "none" }}
                            tabIndex="-1"
                            autoComplete="off"
                            value={checkerContact.honeypot || ""}
                            onChange={handleCheckerContactChange}
                          />
                          <div className="text-center pb-1.5 border-b border-outline-variant/5">
                            <span className="text-[9px] font-bold text-[#1D503A] uppercase tracking-wider">Book Express Document Audit</span>
                          </div>
                          <div className="flex flex-col space-y-1">
                            <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider font-sans">Name *</label>
                            <input
                              type="text"
                              required
                              name="name"
                              value={checkerContact.name}
                              onChange={handleCheckerContactChange}
                              placeholder="Your full name"
                              className="px-3 py-2 border rounded-lg text-xs outline-none focus:border-[#1D503A] bg-white text-gray-900"
                            />
                          </div>
                          <div className="flex flex-col space-y-1">
                            <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider font-sans">WhatsApp Phone *</label>
                            <input
                              type="tel"
                              required
                              name="phone"
                              value={checkerContact.phone}
                              onChange={handleCheckerContactChange}
                              placeholder="e.g. 501234567"
                              className="px-3 py-2 border rounded-lg text-xs outline-none focus:border-[#1D503A] bg-white text-gray-900"
                            />
                          </div>
                          <div className="flex flex-col space-y-1">
                            <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider font-sans">Email Address *</label>
                            <input
                              type="email"
                              required
                              name="email"
                              value={checkerContact.email}
                              onChange={handleCheckerContactChange}
                              placeholder="mail@address.com"
                              className="px-3 py-2 border rounded-lg text-xs outline-none focus:border-[#1D503A] bg-white text-gray-900"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={checkerSubmitting}
                            className="w-full py-2 bg-[#1D503A] hover:bg-[#0e4a1e] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-md disabled:opacity-50 mt-1 flex items-center justify-center gap-1.5"
                          >
                            {checkerSubmitting ? "Saving Audit..." : "Claim Free Callback"}
                            <ChevronRight size={14} />
                          </button>
                        </form>
                        <div className="pt-2 border-t border-outline-variant/5 flex justify-start">
                          <button
                            onClick={() => setCheckerStep(2)}
                            className="text-[10px] text-gray-500 hover:text-gray-700 hover:underline font-bold uppercase"
                          >
                            ← Modify Parameters
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-6 text-center space-y-4 max-w-xs mx-auto animate-[fadeIn_0.3s_ease-out]">
                    <div className="mx-auto h-12 w-12 bg-green-50 text-green-600 border border-green-200 rounded-full flex items-center justify-center">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-md font-bold text-gray-900">Scorecard Successfully Saved</h3>
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        Your visa parameters have been forwarded to our Dubai documentation auditors. A specialist will call you on WhatsApp shortly.
                      </p>
                    </div>
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          setCheckerSubmitted(false);
                          setCheckerStep(0);
                          setCheckerContact({ name: "", email: "", phone: "" });
                        }}
                        className="px-4 py-2 border border-[#1D503A]/20 text-[#1D503A] hover:bg-[#1D503A]/5 rounded-xl text-xs font-bold uppercase tracking-wider transition"
                      >
                        Run Another Check
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mt-10 pb-6 border-b border-outline-variant/10">
        {[
          "All",
          "UK Visa",
          "Schengen Visa",
          "USA Visa",
          "GCC / Middle East Visa",
          "Asia Visa",
          "Oceania Visa"
        ].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveFilter(cat)}
            className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 border ${activeFilter === cat
              ? "bg-[#1D503A] text-white border-[#1D503A] shadow-md shadow-[#1D503A]/10 scale-105"
              : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
          >
            {cat === "All" ? "All Visas" : cat}
          </button>
        ))}
      </div>

      {/* Main Content Layout Container */}
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12">
        <div className="w-full">

          {/* LEFT COLUMN: Available Visa Grid Listings (Full width) */}
          <div className="w-full">
            {/* <div className="border-b border-outline-variant/10 pb-4 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 font-display">Available Visa Targets</h2>
              <p className="text-xs text-on-surface-variant">Select a travel target to apply for express document auditing.</p>
            </div> */}

            {loading ? (
              /* 4 Premium Skeleton Cards Loading State */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white border border-outline-variant/10 rounded-2xl h-80 animate-pulse flex flex-col p-6 space-y-6"
                  >
                    <div className="h-6 bg-gray-200 rounded w-2/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-0.5 bg-gray-200 w-10"></div>
                  </div>
                ))}
              </div>
            ) : error ? (
              /* Error State */
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 max-w-md mx-auto">
                <div className="p-4 rounded-full bg-red-50 text-red-500 border border-red-100 shadow-sm">
                  <AlertCircle className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">System Connection Error</h3>
                <p className="text-sm text-on-surface-variant/80">Unable to load visa services. Please check your network and retry.</p>
                <button
                  onClick={() => setRetryTrigger((prev) => prev + 1)}
                  className="px-6 py-2.5 bg-[#1D503A] hover:bg-[#0e4a1e] text-white font-bold rounded-xl transition-all text-xs uppercase tracking-wider shadow-md shadow-[#1D503A]/10"
                >
                  Retry Loading
                </button>
              </div>
            ) : visaTypes.length === 0 ? (
              /* Empty State */
              <div className="bg-white border border-outline-variant/10 rounded-2xl p-12 max-w-lg mx-auto text-center space-y-6 premium-shadow">
                <div className="mx-auto h-16 w-16 bg-[#1D503A]/5 text-[#1D503A] rounded-full flex items-center justify-center border border-[#1D503A]/10">
                  <AlertCircle className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-gray-900">No visa services available yet</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Please check back soon or contact our Dubai support specialists directly for assistance.
                  </p>
                </div>
                <a
                  href="https://wa.me/971557338429?text=Hi%2C%20I'm%20inquiring%20about%20visa%20services."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#25D366] text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider hover:opacity-95 transition-all shadow-md shadow-green-500/10"
                >
                  <Phone className="h-4 w-4" />
                  <span>Contact via WhatsApp</span>
                </a>
              </div>
            ) : (() => {
              const allMergedVisas = getMergedVisas(visaTypes);
              const displayedVisas = activeFilter === "All"
                ? allMergedVisas
                : allMergedVisas.filter(visa => {
                  const cat = visa.category || "";
                  return cat.toLowerCase() === activeFilter.toLowerCase();
                });

              if (displayedVisas.length === 0) {
                return (
                  /* Empty State */
                  <div className="bg-white border border-outline-variant/10 rounded-2xl p-12 max-w-lg mx-auto text-center space-y-6 premium-shadow">
                    <div className="mx-auto h-16 w-16 bg-[#1D503A]/5 text-[#1D503A] rounded-full flex items-center justify-center border border-[#1D503A]/10">
                      <AlertCircle className="h-8 w-8" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-gray-900">No matching visas</h3>
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        No visas found matching the selected category filter. Please view other categories or contact our specialists.
                      </p>
                    </div>
                    <a
                      href="https://wa.me/971557338429?text=Hi%2C%20I'm%20inquiring%20about%20visa%20services."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-[#25D366] text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider hover:opacity-95 transition-all shadow-md shadow-green-500/10"
                    >
                      <Phone className="h-4 w-4" />
                      <span>Contact via WhatsApp</span>
                    </a>
                  </div>
                );
              }

              return (
                /* Grid of Visa Cards (3 columns layout on large screens) */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedVisas.map((visa) => {
                    // Extract first 2 stats safely
                    const firstStat = visa.heroStats?.[0] || { label: "Processing Time", value: "Standard", icon: "Clock" };
                    const secondStat = visa.heroStats?.[1] || { label: "Success Rate", value: "High", icon: "TrendingUp" };

                    return (
                      <div
                        key={visa.id}
                        className="bg-white/90 backdrop-blur-md border border-outline-variant/10 rounded-2xl overflow-hidden hover:border-[#7FE6A2] hover:shadow-[0_20px_40px_rgba(29,80,58,0.06)] transition-all duration-300 flex flex-col justify-between group animate-[fadeIn_0.3s_ease-out]"
                      >
                        {/* Card Cover Image */}
                        <div className="h-48 w-full overflow-hidden bg-surface-container-low relative flex-shrink-0">
                          {visa.imageUrl ? (
                            <img
                              src={visa.imageUrl}
                              alt={visa.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-on-surface-variant/40 uppercase tracking-widest text-[9px] font-bold">
                              Eshaare Tours & Visas
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
                        </div>

                        {/* Card Text Content */}
                        <div className="p-6 pt-4 flex-grow flex flex-col justify-between space-y-5">
                          <div className="space-y-4">
                            <h3 className="text-lg font-bold font-display text-gray-900 group-hover:text-[#1D503A] transition-colors leading-snug">
                              {visa.name}
                            </h3>
                            <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">
                              {visa.tagline}
                            </p>

                            {/* Accent Divider */}
                            <div className="h-[2.5px] bg-[#1D503A]/20 w-12 rounded"></div>

                            {/* First 2 Stats badged side-by-side */}
                            <div className="grid grid-cols-2 gap-4 p-3.5 bg-surface-container-low/50 border border-outline-variant/5 rounded-xl">
                              <div className="flex items-start gap-2">
                                <div className="p-1 rounded bg-[#1D503A]/5 text-[#1D503A] mt-0.5">
                                  <StatIcon name={firstStat.icon} className="h-3.5 w-3.5" />
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-gray-900 font-mono leading-tight">{firstStat.value}</div>
                                  <span className="text-[9px] text-on-surface-variant/70 font-semibold uppercase tracking-wider">{firstStat.label}</span>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <div className="p-1 rounded bg-[#1D503A]/5 text-[#1D503A] mt-0.5">
                                  <StatIcon name={secondStat.icon} className="h-3.5 w-3.5" />
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-gray-900 font-mono leading-tight">{secondStat.value}</div>
                                  <span className="text-[9px] text-on-surface-variant/70 font-semibold uppercase tracking-wider">{secondStat.label}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-2">
                            <Link
                              to={`/visa/${visa.slug}`}
                              className="w-full text-center py-2.5 border border-[#1D503A]/25 text-[#1D503A] hover:bg-[#1D503A]/5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                            >
                              Learn More
                            </Link>
                            <Link
                              to={`/visa-services/${visa.slug}`}
                              className="w-full text-center py-2.5 bg-[#1D503A] hover:bg-[#0e4a1e] text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-[#1D503A]/10 flex items-center justify-center gap-1 group-btn"
                            >
                              <span>Apply Now</span>
                              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

        </div>
      </div>

      {/* Enquiry Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Apply for: ${selectedVisa?.name || "Visa Assistance"}`}
        size="md"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 font-sans text-xs">
          {/* Honeypot field for bot spam protection */}
          <input
            type="text"
            name="honeypot"
            style={{ display: "none" }}
            tabIndex="-1"
            autoComplete="off"
            value={formData.honeypot || ""}
            onChange={handleInputChange}
          />
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] font-bold text-[#EAE3D5]/60 uppercase tracking-wider">Full Name *</label>
              <input
                type="text"
                required
                className="px-3.5 py-2.5 bg-white/5 border border-white/10 text-white placeholder-white/20 rounded-xl focus:outline-none focus:border-[#7FE6A2] focus:bg-white/10 text-xs transition"
                placeholder="Jane Doe"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] font-bold text-[#EAE3D5]/60 uppercase tracking-wider">WhatsApp Phone *</label>
              <input
                type="tel"
                required
                className="px-3.5 py-2.5 bg-white/5 border border-white/10 text-white placeholder-white/20 rounded-xl focus:outline-none focus:border-[#7FE6A2] focus:bg-white/10 text-xs transition"
                placeholder="e.g. 501234567"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] font-bold text-[#EAE3D5]/60 uppercase tracking-wider">Email Address *</label>
              <input
                type="email"
                required
                className="px-3.5 py-2.5 bg-white/5 border border-white/10 text-white placeholder-white/20 rounded-xl focus:outline-none focus:border-[#7FE6A2] focus:bg-white/10 text-xs transition"
                placeholder="jane@example.com"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] font-bold text-[#EAE3D5]/60 uppercase tracking-wider">Nationality</label>
              <input
                type="text"
                className="px-3.5 py-2.5 bg-white/5 border border-white/10 text-white placeholder-white/20 rounded-xl focus:outline-none focus:border-[#7FE6A2] focus:bg-white/10 text-xs transition"
                placeholder="e.g. Indian, Jordanian"
                name="nationality"
                value={formData.nationality}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="text-[10px] font-bold text-[#EAE3D5]/60 uppercase tracking-wider">Travel Start Date</label>
            <input
              type="date"
              className="px-3.5 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:border-[#7FE6A2] focus:bg-white/10 text-xs transition"
              name="travelDate"
              value={formData.travelDate}
              onChange={handleInputChange}
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="text-[10px] font-bold text-[#EAE3D5]/60 uppercase tracking-wider">Message</label>
            <textarea
              rows={3}
              className="px-3.5 py-2.5 bg-white/5 border border-white/10 text-white placeholder-white/20 rounded-xl focus:outline-none focus:border-[#7FE6A2] focus:bg-white/10 text-xs transition"
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
              className="flex-1 py-2.5 bg-white/10 border border-white/5 text-white hover:bg-white/15 font-bold rounded-xl text-xs uppercase tracking-wider transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-[#7FE6A2] hover:bg-[#68d08b] text-[#0B221A] font-bold rounded-xl text-xs uppercase tracking-wider shadow-sm transition disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Enquiry"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default VisaServicesPage;
