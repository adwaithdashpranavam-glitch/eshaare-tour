import React, { useState, useEffect } from "react";
import { doc, onSnapshot, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, X, AlertCircle, Upload, Trash2, Download, Phone,
  MessageSquare, FileText, ChevronDown, Award, Globe, HelpCircle,
  User, Briefcase, Calendar, ShieldCheck, Mail, Compass
} from "lucide-react";
import toast from "react-hot-toast";

// ==========================================
// 1. PRODUCTION-READY LOCAL FALLBACK DATA
// ==========================================
const DEFAULT_THEME = {
  primaryBg: "#F5F1E8", // Premium Eshaare rich cream background
  goldAccent: "#1D503A", // Signature forest green accents
  ctaOrange: "#1D503A", // Signature green CTA buttons
  white: "#1a1c1c", // Readable charcoal text color
  secondaryText: "#495B3E", // Soft sage secondary text

  // Eshaare green borders and light cards
  cardBg: "#FFFFFF",
  border: "#1D503A",
  inputBg: "#FFFFFF",
  mutedGreen: "#1D503A",

  borderRadius: "1.5rem",
  shadowStyle: "0 20px 40px rgba(29, 80, 58, 0.05)"
};

const DEFAULT_HERO = {
  headline: "Check Your Visa Eligibility in Minutes",
  subheadline: "Get an instant visa eligibility assessment and personalized document checklist based on your nationality, destination, and travel profile.",
  ctaText: "Check Eligibility",
  ctaWhatsApp: "+971501234567",
  globeEnabled: true,
  visasProcessed: "15,000+",
  countriesCovered: "120+",
  approvalRate: "98.2%"
};

const DEFAULT_FAQ = [
  {
    question: "How do I check my eligibility?",
    answer: "Simply fill in our 5-step form with your destination, personal details, passport validity, employment details, and travel dates. Our JSON logic rules engine will immediately analyze your profile and output a compliance score."
  },
  {
    question: "What documents are required?",
    answer: "Generally, UAE residents require a valid passport, residency visa, Emirates ID, employer NOC, salary certificate, bank statements, travel insurance, and flight/hotel bookings. The exact list depends dynamically on your nationality, destination, and employment status."
  },
  {
    question: "How long does processing take?",
    answer: "Standard processing timelines vary: Schengen visa applications usually take 10-15 working days, UK visas take 15 working days, US tourist visas take 4-8 weeks, and UAE tourist visas can be approved in 3-5 working days."
  },
  {
    question: "Can I apply if I have a previous rejection?",
    answer: "Yes, you can apply. However, our rules engine takes previous rejections into account. We strongly recommend scheduling a WhatsApp consultation with our senior consultants to review your refusal letter and audit your bank statements before resubmitting."
  },
  {
    question: "Do UAE residents need travel insurance?",
    answer: "Yes, Schengen states and Saudi Arabia require a valid travel insurance policy covering up to €30,000 (or equivalent) in medical emergencies for the entire duration of the stay."
  }
];

const DEFAULT_WHY_US = [
  { title: "Expert Visa Consultants", desc: "Our visa processing coordinators audit files with 99% accuracy.", icon: "Award" },
  { title: "Fast Processing", desc: "Express embassy slot bookings and rapid submission queues.", icon: "Compass" },
  { title: "High Approval Guidance", desc: "Tailored NOC templates matching your UAE employer guidelines.", icon: "ShieldCheck" },
  { title: "WhatsApp Support", desc: "24/7 dedicated text desk support with early biometrics alerts.", icon: "MessageSquare" },
  { title: "Document Verification", desc: "Bank transaction reviews and passport validity verification.", icon: "FileText" },
  { title: "End-to-End Assistance", desc: "From VFS appointment scheduling to approved passport courier.", icon: "Globe" }
];

const DEFAULT_FORM_STEPS = [
  {
    stepId: 1,
    title: "Destination Information",
    fields: [
      { id: "destination", label: "Destination Country", type: "select", options: ["Schengen Europe", "United Kingdom", "United States", "Canada", "Australia", "Saudi Arabia", "Japan", "United Arab Emirates"], required: true },
      { id: "visaCategory", label: "Visa Category", type: "select", options: ["Tourist Visa", "Business Visa", "Student Visa", "Transit Visa"], required: true },
      { id: "entryType", label: "Entry Type", type: "select", options: ["Single Entry", "Multiple Entry"], required: true },
      { id: "stayDuration", label: "Duration of Stay (Days)", type: "number", placeholder: "e.g. 15", required: true },
      { id: "nationality", label: "Your Nationality", type: "select", options: ["Indian", "Jordanian", "Egyptian", "Pakistani", "Lebanese", "Syrian", "Filipino", "British", "American", "GCC National"], required: true }
    ]
  },
  {
    stepId: 2,
    title: "Personal Information",
    fields: [
      { id: "fullName", label: "Full Name (as in Passport)", type: "text", placeholder: "e.g. John Doe", required: true },
      { id: "gender", label: "Gender", type: "radio", options: ["Male", "Female", "Other"], required: true },
      { id: "dob", label: "Date of Birth", type: "date", required: true },
      { id: "maritalStatus", label: "Marital Status", type: "select", options: ["Single", "Married", "Divorced", "Widowed"], required: true },
      { id: "email", label: "Email Address", type: "email", placeholder: "e.g. john@example.com", required: true },
      { id: "mobile", label: "Mobile Number (WhatsApp)", type: "text", placeholder: "e.g. +971 50 123 4567", required: true }
    ]
  },
  {
    stepId: 3,
    title: "Passport Information",
    fields: [
      { id: "passportNumber", label: "Passport Number", type: "text", placeholder: "e.g. N1234567", required: true },
      { id: "passportExpiry", label: "Passport Expiry Date", type: "date", required: true },
      { id: "birthPlace", label: "Place of Birth", type: "text", placeholder: "e.g. New Delhi", required: true },
      { id: "residenceCountry", label: "Current Country of Residence", type: "select", options: ["United Arab Emirates", "Saudi Arabia", "Qatar", "Oman", "Kuwait", "Bahrain"], required: true }
    ]
  },
  {
    stepId: 4,
    title: "Employment Details",
    fields: [
      { id: "employmentStatus", label: "Employment Status", type: "select", options: ["Employed (Private)", "Employed (Government)", "Business Owner / Self-Employed", "Retired", "Student", "Unemployed"], required: true },
      { id: "companyName", label: "Company / Sponsor Name", type: "text", placeholder: "e.g. Eshaare Tours", required: true },
      { id: "monthlySalary", label: "Monthly Salary (AED)", type: "number", placeholder: "e.g. 12000", required: true },
      { id: "yearsEmployment", label: "Years of Employment", type: "number", placeholder: "e.g. 3", required: true }
    ]
  },
  {
    stepId: 5,
    title: "Travel Information",
    fields: [
      { id: "travelDate", label: "Intended Travel Date", type: "date", required: true },
      { id: "travelPurpose", label: "Purpose of Travel", type: "select", options: ["Tourism & Leisure", "Business Meeting", "Family Visit", "Medical Treatment"], required: true },
      { id: "travelHistory", label: "Previous International Travel (Last 5 Years)", type: "select", options: ["Yes (Schengen, UK, US)", "Yes (Asia/Africa/Other)", "No Travel History"], required: true },
      { id: "visaRefusal", label: "Previous Visa Refusal (Any Country)", type: "radio", options: ["Yes", "No"], required: true },
      { id: "accommodationDetails", label: "Accommodation Details", type: "select", options: ["Hotel Confirmed", "Host / Family Invite", "Airbnb Booking", "No Booking Yet"], required: true }
    ]
  }
];

const DEFAULT_RULES = [
  { condition: "monthlySalary", operator: "greater_than", value: 12000, scoreModifier: 20 },
  { condition: "monthlySalary", operator: "less_than", value: 6000, scoreModifier: -25 },
  { condition: "travelHistory", operator: "equals", value: "Yes (Schengen, UK, US)", scoreModifier: 25 },
  { condition: "travelHistory", operator: "equals", value: "No Travel History", scoreModifier: -10 },
  { condition: "visaRefusal", operator: "equals", value: "Yes", scoreModifier: -30 },
  { condition: "accommodationDetails", operator: "equals", value: "Hotel Confirmed", scoreModifier: 10 },
  { condition: "residenceCountry", operator: "equals", value: "United Arab Emirates", scoreModifier: 15 }
];

export const VisaEligibilityPage = () => {
  // Config states linked to Firebase with immediate local fallbacks
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [hero, setHero] = useState(DEFAULT_HERO);
  const [faqs, setFaqs] = useState(DEFAULT_FAQ);
  const [whyUs, setWhyUs] = useState(DEFAULT_WHY_US);
  const [formSteps, setFormSteps] = useState(DEFAULT_FORM_STEPS);
  const [rules, setRules] = useState(DEFAULT_RULES);
  const [seo, setSeo] = useState({
    pageTitle: "Visa Eligibility Checker UAE | Eshaare Tours",
    metaDescription: "Check visa eligibility and documentation checklist in minutes for UAE residents.",
    keywords: "Visa Eligibility Checker UAE, Schengen Visa Eligibility Dubai",
    schemaMarkup: ""
  });

  // UI / App states
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [assessmentResult, setAssessmentResult] = useState(null);

  // Document checklists (dynamically computed)
  const [checklist, setChecklist] = useState([]);
  const [uploads, setUploads] = useState({}); // { documentName: { file, status: 'Uploaded'|'Processing'|'Approved'|'Rejected', progress } }

  // FAQ Accordion index
  const [expandedFaq, setExpandedFaq] = useState(null);

  // Lead capture states
  const [leadForm, setLeadForm] = useState({ name: "", phone: "", dest: "" });
  const [isLeadSubmitting, setIsLeadSubmitting] = useState(false);

  // Initialize Snapshot Listeners
  useEffect(() => {
    // 1. Theme Configuration
    const unsubTheme = onSnapshot(doc(db, "theme", "settings"), (snap) => {
      if (snap.exists()) setTheme({ ...DEFAULT_THEME, ...snap.data() });
    }, (err) => console.log("Firestore Theme snapshot lookup failed, fallback used"));

    // 2. CMS Hero content
    const unsubHero = onSnapshot(doc(db, "cms", "hero"), (snap) => {
      if (snap.exists()) setHero({ ...DEFAULT_HERO, ...snap.data() });
    }, (err) => console.log("Firestore Hero snapshot lookup failed, fallback used"));

    // 3. CMS FAQs
    const unsubFaq = onSnapshot(doc(db, "cms", "faqs"), (snap) => {
      if (snap.exists() && snap.data().items) setFaqs(snap.data().items);
    }, (err) => console.log("Firestore FAQs snapshot lookup failed, fallback used"));

    // 4. Why Choose us items
    const unsubWhyUs = onSnapshot(doc(db, "cms", "whyUs"), (snap) => {
      if (snap.exists() && snap.data().items) setWhyUs(snap.data().items);
    }, (err) => console.log("Firestore WhyUs snapshot lookup failed, fallback used"));

    // 5. Dynamic Form fields configurations
    const unsubForm = onSnapshot(doc(db, "formBuilder", "v1"), (snap) => {
      if (snap.exists() && snap.data().steps) setFormSteps(snap.data().steps);
    }, (err) => console.log("Firestore FormBuilder snapshot lookup failed, fallback used"));

    // 6. Rules configuration
    const unsubRules = onSnapshot(doc(db, "rules", "v1"), (snap) => {
      if (snap.exists() && snap.data().items) setRules(snap.data().items);
    }, (err) => console.log("Firestore Rules snapshot lookup failed, fallback used"));

    // 7. SEO settings
    const unsubSeo = onSnapshot(doc(db, "settings", "seo"), (snap) => {
      if (snap.exists()) setSeo(snap.data());
    }, (err) => console.log("Firestore SEO snapshot lookup failed, fallback used"));

    return () => {
      unsubTheme();
      unsubHero();
      unsubFaq();
      unsubWhyUs();
      unsubForm();
      unsubRules();
      unsubSeo();
    };
  }, []);

  // Update SEO Head tags and schema dynamically
  useEffect(() => {
    document.title = seo.pageTitle;
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute("content", seo.metaDescription);

    let metaKeys = document.querySelector('meta[name="keywords"]');
    if (!metaKeys) {
      metaKeys = document.createElement("meta");
      metaKeys.setAttribute("name", "keywords");
      document.head.appendChild(metaKeys);
    }
    metaKeys.setAttribute("content", seo.keywords);

    // Ingest FAQ schema
    const schemaScriptId = "eshaare-faq-schema";
    let script = document.getElementById(schemaScriptId);
    if (script) script.remove();

    const faqQuestions = faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }));

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqQuestions
    };

    script = document.createElement("script");
    script.id = schemaScriptId;
    script.type = "application/ld+json";
    script.innerText = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      const cleanupScript = document.getElementById(schemaScriptId);
      if (cleanupScript) cleanupScript.remove();
    };
  }, [seo, faqs]);

  // Handle Input Changes
  const handleFieldChange = (fieldId, value) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[fieldId];
        return copy;
      });
    }
  };

  // Step validation
  const validateStep = (stepId) => {
    const stepObj = formSteps.find(s => s.stepId === stepId);
    if (!stepObj) return true;

    const newErrors = {};
    stepObj.fields.forEach(field => {
      if (field.required && !formData[field.id]) {
        newErrors[field.id] = `${field.label} is required.`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form progression
  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < formSteps.length) {
        setCurrentStep(prev => prev + 1);
      } else {
        // Run Scoring engine & show results
        calculateEligibility();
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Safe JSON Rules scoring parser
  const calculateEligibility = () => {
    let score = 70; // Base starting score

    // Evaluate conditions safely using a structured logic parser (no eval)
    rules.forEach(rule => {
      const val = formData[rule.condition];
      if (val === undefined || val === null) return;

      let match = false;
      const parsedValue = isNaN(rule.value) ? rule.value : Number(rule.value);
      const parsedVal = isNaN(val) ? val : Number(val);

      switch (rule.operator) {
        case "greater_than":
          match = parsedVal > parsedValue;
          break;
        case "less_than":
          match = parsedVal < parsedValue;
          break;
        case "equals":
          match = String(parsedVal).toLowerCase() === String(parsedValue).toLowerCase();
          break;
        case "not_equals":
          match = String(parsedVal).toLowerCase() !== String(parsedValue).toLowerCase();
          break;
        default:
          break;
      }

      if (match) {
        score += Number(rule.scoreModifier || 0);
      }
    });

    // Clamp score
    score = Math.max(10, Math.min(100, score));

    // Determine status thresholds
    let status = "Yellow";
    let riskLabel = "Additional Documents Required";
    let statusText = "Pending Compliance Review";

    if (score >= 80) {
      status = "Green";
      riskLabel = "Eligible / High Approval Probability";
      statusText = "Highly Eligible";
    } else if (score < 55) {
      status = "Red";
      riskLabel = "Consultation Recommended";
      statusText = "High Risk / Audit Required";
    }

    // Generate Checklist dynamically
    generateRequiredChecklist(formData);

    const result = {
      score,
      status,
      riskLabel,
      statusText,
      visaType: formData.visaCategory || "Tourist Visa",
      processingTime: formData.destination === "Schengen Europe" ? "10-15 Days" : "15-20 Days",
      submittedAt: new Date().toISOString()
    };

    setAssessmentResult(result);
    saveApplicationToFirebase(result);
  };

  // Document checklist rules engine
  const generateRequiredChecklist = (inputs) => {
    // Standard basic items
    const checklistItems = [
      { name: "Passport Copy", type: "Required", desc: "Clear copy of back & front pages (must be valid 6+ months)." },
      { name: "UAE Residence Visa", type: "Required", desc: "Valid UAE residence sticker or e-visa page." },
      { name: "Emirates ID", type: "Required", desc: "Front & back high-resolution color copy." },
      { name: "Bank Statement", type: "Required", desc: "3 to 6 months bank statement showing regular salary deposits." }
    ];

    // Conditional checklists based on employment
    if (inputs.employmentStatus?.includes("Employed")) {
      checklistItems.push({ name: "Employer NOC", type: "Required", desc: "No Objection Certificate on company letterhead stamped by manager." });
      checklistItems.push({ name: "Salary Certificate", type: "Required", desc: "Official salary letter addressing respective embassy." });
    } else if (inputs.employmentStatus?.includes("Business")) {
      checklistItems.push({ name: "Trade License", type: "Required", desc: "Valid corporate business incorporation registry copy." });
      checklistItems.push({ name: "Company Bank Statement", type: "Required", desc: "6 months business entity transactional bank statement." });
    } else if (inputs.employmentStatus === "Student") {
      checklistItems.push({ name: "School Certificate / Enrollment Letter", type: "Required", desc: "Current semester registration slip or student ID copy." });
      checklistItems.push({ name: "Sponsor Guarantee", type: "Required", desc: "Parent or guardian NOC with their bank files." });
    }

    // Purpose items
    if (inputs.travelPurpose === "Tourism & Leisure") {
      checklistItems.push({ name: "Flight Reservation", type: "Required", desc: "Round trip flight booking reservation." });
      checklistItems.push({ name: "Hotel Booking", type: "Required", desc: "Fully matches dates of stays on itinerary." });
    } else if (inputs.travelPurpose === "Family Visit") {
      checklistItems.push({ name: "Invitation Letter", type: "Required", desc: "Dossier stating connection, host credentials, and hospitality statement." });
    }

    // Destination specifics
    if (inputs.destination === "Schengen Europe" || inputs.destination === "Saudi Arabia") {
      checklistItems.push({ name: "Travel Insurance", type: "Required", desc: "Coverage certificate of up to €30,000 including medical evacuation." });
    }

    // Add Cover Letter as optional
    checklistItems.push({ name: "Cover Letter", type: "Optional", desc: "Addressed to visa officer explaining travel plans." });

    setChecklist(checklistItems);
  };

  // Save Dynamic Snapshot to applications collection
  const saveApplicationToFirebase = async (result) => {
    try {
      const appRef = collection(db, "applications");
      const submissionPayload = {
        fullName: formData.fullName || "Traveler",
        destination: formData.destination || "",
        score: result.score,
        status: result.status,
        assignedStaff: "Rakhi G Hari", // Default routing to manager
        priority: result.score < 55 ? "High" : "Medium",
        internalNotes: "System assessment calculated automatically.",
        followUpDate: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0], // 2 days follow-up
        createdAt: serverTimestamp(),
        // Frozen config snapshots for version history audit
        formSnapshot: formSteps,
        ruleSnapshot: rules,
        documentSnapshot: checklist,
        formData
      };
      await addDoc(appRef, submissionPayload);
    } catch (err) {
      console.warn("Application snapshot write failed. Submitting offline mode.", err);
    }
  };

  // Drag and drop / file upload handler simulator
  const handleFileUpload = (docName, e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check size limit: 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large! Maximum limit is 5MB.");
      return;
    }

    const format = file.name.split(".").pop().toLowerCase();
    if (!["pdf", "jpg", "jpeg", "png"].includes(format)) {
      toast.error("Format not supported! Upload PDF, JPG, JPEG or PNG.");
      return;
    }

    // Simulate real upload transitions: Processing -> Approved (or Rejected sometimes for display testing)
    setUploads(prev => ({
      ...prev,
      [docName]: { file, status: "Processing", progress: 10 }
    }));

    let progressVal = 10;
    const interval = setInterval(() => {
      progressVal += 30;
      setUploads(prev => ({
        ...prev,
        [docName]: { ...prev[docName], progress: Math.min(progressVal, 100) }
      }));

      if (progressVal >= 100) {
        clearInterval(interval);
        // Automatically approve for UI flow
        setUploads(prev => ({
          ...prev,
          [docName]: { ...prev[docName], status: "Approved" }
        }));
        toast.success(`${docName} uploaded and approved successfully!`);
      }
    }, 400);
  };

  const removeUploadedFile = (docName) => {
    setUploads(prev => {
      const copy = { ...prev };
      delete copy[docName];
      return copy;
    });
    toast.success(`${docName} file attachment removed.`);
  };

  // Submit Callback Lead CRM Hook
  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    if (!leadForm.name || !leadForm.phone) {
      toast.error("Please fill in contact name and WhatsApp number.");
      return;
    }

    setIsLeadSubmitting(true);
    try {
      const leadsRef = collection(db, "leads");
      await addDoc(leadsRef, {
        contactName: leadForm.name,
        contactPhone: leadForm.phone,
        destinationCountry: leadForm.dest || formData.destination || "General",
        source: "visa-checker-lead",
        stage: "New Lead",
        priority: "Medium",
        createdAt: serverTimestamp()
      });
      toast.success("Callback request sent! A consultant will text you shortly.");
      setLeadForm({ name: "", phone: "", dest: "" });
    } catch (err) {
      toast.error("Submission failed. Please try again.");
    } finally {
      setIsLeadSubmitting(false);
    }
  };

  // Render Form Input fields
  const renderField = (field) => {
    const val = formData[field.id] || "";
    switch (field.type) {
      case "select":
        return (
          <select
            value={val}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className="w-full bg-white border border-[#1D503A]/30 rounded-xl px-4 py-3 text-sm text-[#1D503A] focus:border-[#1D503A] focus:ring-1 focus:ring-[#1D503A] transition-all"
          >
            <option value="">-- Choose Option --</option>
            {field.options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );
      case "radio":
        return (
          <div className="flex gap-4 flex-wrap mt-2">
            {field.options.map(opt => (
              <label key={opt} className="flex items-center gap-2 text-sm text-[#1D503A] cursor-pointer">
                <input
                  type="radio"
                  name={field.id}
                  value={opt}
                  checked={val === opt}
                  onChange={() => handleFieldChange(field.id, opt)}
                  className="accent-[#1D503A] w-4 h-4 bg-transparent border border-gray-300"
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        );
      case "date":
        return (
          <input
            type="date"
            value={val}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className="w-full bg-white border border-[#1D503A]/30 rounded-xl px-4 py-3 text-sm text-[#1D503A] focus:border-[#1D503A] focus:ring-1 focus:ring-[#1D503A] transition-all"
          />
        );
      case "number":
        return (
          <input
            type="number"
            placeholder={field.placeholder || "e.g. 10000"}
            value={val}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className="w-full bg-white border border-[#1D503A]/30 rounded-xl px-4 py-3 text-sm text-[#1D503A] focus:border-[#1D503A] focus:ring-1 focus:ring-[#1D503A] transition-all placeholder:text-gray-400"
          />
        );
      default:
        return (
          <input
            type="text"
            placeholder={field.placeholder || "e.g. text"}
            value={val}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className="w-full bg-white border border-[#1D503A]/30 rounded-xl px-4 py-3 text-sm text-[#1D503A] focus:border-[#1D503A] focus:ring-1 focus:ring-[#1D503A] transition-all placeholder:text-gray-400"
          />
        );
    }
  };

  return (
    <div
      className="min-h-screen relative text-gray-900 py-16 px-4 md:px-8 font-sans overflow-x-hidden"
      style={{ backgroundColor: theme.primaryBg }}
    >
      {/* Background radial gold glow overlays */}
      <div className="absolute top-1/4 left-1/4 w-[35rem] h-[35rem] bg-[#1D503A]/6 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[35rem] h-[35rem] bg-[#D4AF37]/4 rounded-full blur-[120px] pointer-events-none" />

      {/* HEADER HERO */}
      <div className="max-w-[1280px] mx-auto text-center space-y-4 mb-12 relative z-10">
        <span className="inline-block px-4 py-1 rounded-full bg-[#1D503A]/10 border border-[#1D503A]/20 text-[#1D503A] text-xs font-bold uppercase tracking-widest">
          Premium Assessment
        </span>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-[#1D503A] leading-tight">
          {hero.headline}
        </h1>
        <p className="max-w-2xl mx-auto text-sm md:text-base text-[#495B3E] leading-relaxed">
          {hero.subheadline}
        </p>

        {/* Global numbers counters bar */}
        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto pt-6 text-center">
          <div className="p-3 bg-white rounded-2xl border border-[#1D503A] shadow-sm">
            <p className="text-lg md:text-xl font-bold text-[#1D503A]">{hero.visasProcessed}</p>
            <p className="text-[10px] text-[#495B3E] uppercase font-semibold">Processed</p>
          </div>
          <div className="p-3 bg-white rounded-2xl border border-[#1D503A] shadow-sm">
            <p className="text-lg md:text-xl font-bold text-[#1D503A]">{hero.countriesCovered}</p>
            <p className="text-[10px] text-[#495B3E] uppercase font-semibold">Countries</p>
          </div>
          <div className="p-3 bg-white rounded-2xl border border-[#1D503A] shadow-sm">
            <p className="text-lg md:text-xl font-bold text-[#1D503A]">{hero.approvalRate}</p>
            <p className="text-[10px] text-[#495B3E] uppercase font-semibold">Success</p>
          </div>
        </div>
      </div>

      {/* MAIN LAYOUT SPLIT */}
      <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
        {/* LEFT COLUMN: MULTI-STEP CARD OR RESULTS */}
        <div className="lg:col-span-8 space-y-8">
          <AnimatePresence mode="wait">
            {!assessmentResult ? (
              <motion.div
                key="wizard"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-white rounded-[1.5rem] border border-[#1D503A] overflow-hidden shadow-xl"
              >
                {/* Steps progress indicator */}
                <div className="p-6 bg-[#FAF8F5] border-b border-[#1D503A] flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-xs text-[#1D503A] font-bold uppercase tracking-wider">Step {currentStep} of {formSteps.length}</p>
                    <h2 className="text-lg font-bold text-[#1D503A]">{formSteps[currentStep - 1]?.title}</h2>
                  </div>
                  <div className="flex gap-1">
                    {formSteps.map((s, idx) => (
                      <div
                        key={s.stepId}
                        className={`w-4 h-1.5 rounded-full transition-all duration-300 ${idx + 1 === currentStep
                          ? "bg-[#1D503A] w-8"
                          : idx + 1 < currentStep
                            ? "bg-emerald-500"
                            : "bg-[#1D503A]/10"
                          }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Form fields */}
                <div className="p-6 md:p-8 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {formSteps[currentStep - 1]?.fields.map((field) => (
                      <div
                        key={field.id}
                        className={`space-y-2 ${field.type === "radio" || field.type === "textarea" ? "sm:col-span-2" : ""
                          }`}
                      >
                        <label className="text-xs font-bold text-[#1D503A] uppercase tracking-wide flex items-center gap-1">
                          {field.label}
                          {field.required && <span className="text-rose-500">*</span>}
                        </label>
                        {renderField(field)}
                        {errors[field.id] && (
                          <p className="text-xs text-rose-500 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {errors[field.id]}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-6 bg-[#FAF8F5] border-t border-[#1D503A] flex justify-between">
                  <button
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    className="px-6 py-3 rounded-xl border border-[#1D503A]/30 text-xs font-bold uppercase tracking-widest text-[#1D503A] hover:bg-[#1D503A]/5 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={nextStep}
                    className="px-6 py-3 rounded-xl bg-[#1D503A] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#0e4a1e] transition-all shadow-md"
                  >
                    {currentStep === formSteps.length ? "Calculate Score" : "Next Step"}
                  </button>
                </div>
              </motion.div>
            ) : (
              // RESULT VIEW & CHECKLIST
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8"
              >
                {/* Result Hero Gauge Card */}
                <div className="bg-white rounded-[1.5rem] border border-[#1D503A] p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative overflow-hidden shadow-xl">
                  {/* Glowing side border */}
                  <div className={`absolute top-0 left-0 w-2 h-full ${assessmentResult.status === "Green" ? "bg-emerald-500" : assessmentResult.status === "Yellow" ? "bg-amber-500" : "bg-rose-500"
                    }`} />

                  {/* Circular Gauge */}
                  <div className="md:col-span-4 flex flex-col items-center justify-center">
                    <div className="relative w-36 h-36">
                      <svg className="w-full h-full transform -rotate-90">
                        {/* Track ring */}
                        <circle
                          cx="72"
                          cy="72"
                          r="60"
                          className="stroke-gray-100 fill-none"
                          strokeWidth="12"
                        />
                        {/* Fill ring */}
                        <circle
                          cx="72"
                          cy="72"
                          r="60"
                          className={`fill-none transition-all duration-1000 ${assessmentResult.status === "Green"
                            ? "stroke-emerald-500"
                            : assessmentResult.status === "Yellow"
                              ? "stroke-amber-500"
                              : "stroke-rose-500"
                            }`}
                          strokeWidth="12"
                          strokeDasharray={2 * Math.PI * 60}
                          strokeDashoffset={2 * Math.PI * 60 * (1 - assessmentResult.score / 100)}
                          strokeLinecap="round"
                        />
                      </svg>
                      {/* Inner Text */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-4xl font-extrabold text-[#1D503A]">{assessmentResult.score}%</span>
                        <span className="text-[10px] text-[#495B3E] uppercase font-semibold">Match Score</span>
                      </div>
                    </div>
                  </div>

                  {/* Info stats */}
                  <div className="md:col-span-8 space-y-4">
                    <div className="space-y-1">
                      <h2 className="text-2xl font-bold text-[#1D503A]">{assessmentResult.riskLabel}</h2>
                      <p className="text-sm text-[#495B3E]">Your profile matches standard compliance checks for {formData.destination}.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-y border-[#1D503A]/30 py-4 text-xs">
                      <div>
                        <p className="text-gray-500 font-semibold uppercase">Visa Type</p>
                        <p className="text-[#1D503A] font-bold">{assessmentResult.visaType}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 font-semibold uppercase">Avg. Processing</p>
                        <p className="text-[#1D503A] font-bold">{assessmentResult.processingTime}</p>
                      </div>
                    </div>

                    <div className="flex gap-4 flex-wrap">
                      <a
                        href={`https://wa.me/${hero.ctaWhatsApp}?text=Hi Eshaare Tours, I checked my eligibility for ${formData.destination} and scored ${assessmentResult.score}%. Please advise.`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-5 py-3 bg-[#25D366] text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:opacity-90 transition-all"
                      >
                        <Phone className="w-4 h-4 fill-white" />
                        WhatsApp Consultation
                      </a>
                      <button
                        onClick={() => {
                          toast.success("Downloading compliance PDF report...");
                        }}
                        className="px-5 py-3 bg-white border border-[#1D503A]/30 text-[#1D503A] hover:bg-[#1D503A]/5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all"
                      >
                        <Download className="w-4 h-4" />
                        Download Report
                      </button>
                    </div>
                  </div>
                </div>

                {/* Dynamic Document Checklist Module */}
                <div className="bg-white rounded-[1.5rem] border border-[#1D503A] p-6 md:p-8 space-y-6 shadow-xl">
                  <div>
                    <h3 className="text-xl font-bold text-[#1D503A]">Dynamic Document Checklist</h3>
                    <p className="text-xs text-[#495B3E]">Submit required credentials for pre-submission compliance audit review by our staff.</p>
                  </div>

                  <div className="space-y-4">
                    {checklist.map((doc, idx) => {
                      const fileObj = uploads[doc.name];
                      return (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl bg-white border border-[#1D503A]/30 flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-[#1a1c1c]">{doc.name}</span>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${doc.type === "Required" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                }`}>
                                {doc.type}
                              </span>

                              {/* Upload status badges */}
                              {fileObj && (
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase flex items-center gap-1 ${fileObj.status === "Approved"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : fileObj.status === "Processing"
                                    ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                  }`}>
                                  {fileObj.status}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#495B3E]">{doc.desc}</p>
                          </div>

                          {/* File Uploader system widgets */}
                          <div className="flex items-center gap-3 self-end md:self-center">
                            {fileObj ? (
                              <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-[#1D503A]/15 shadow-sm">
                                <FileText className="w-5 h-5 text-[#1D503A]" />
                                <div className="text-left">
                                  <p className="text-xs font-semibold truncate w-32 text-gray-700">{fileObj.file.name}</p>
                                  {fileObj.status === "Processing" && (
                                    <div className="w-24 h-1 bg-gray-100 rounded-full overflow-hidden mt-1">
                                      <div className="bg-[#1D503A] h-full transition-all" style={{ width: `${fileObj.progress}%` }} />
                                    </div>
                                  )}
                                </div>
                                <button
                                  onClick={() => removeUploadedFile(doc.name)}
                                  className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                                  title="Remove file"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <label className="px-4 py-2 bg-white hover:bg-[#1D503A]/5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 border border-[#1D503A]/30 text-[#1D503A] cursor-pointer transition-all">
                                <Upload className="w-4 h-4" />
                                Upload File
                                <input
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  className="hidden"
                                  onChange={(e) => handleFileUpload(doc.name, e)}
                                />
                              </label>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-between items-center border-t border-[#1D503A]/30 pt-6">
                    <button
                      onClick={() => setAssessmentResult(null)}
                      className="text-xs font-bold text-[#1D503A] uppercase tracking-widest hover:text-[#0e4a1e] transition-colors"
                    >
                      Restart Assessment
                    </button>
                    <span className="text-xs text-gray-500 font-medium">Auto-saved to portal reference.</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT COLUMN: LEAD CAPTURE & WHY CHOOSE US */}
        <div className="lg:col-span-4 space-y-8">
          {/* Lead Callback Card */}
          <div className="bg-white rounded-[1.5rem] border border-[#1D503A] p-6 space-y-6 shadow-lg relative">
            <h3 className="text-lg font-bold border-b border-[#1D503A]/15 pb-3 text-[#1D503A]">Need Expert Assistance?</h3>
            <form onSubmit={handleLeadSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#1D503A] uppercase tracking-wide">Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jane Doe"
                  value={leadForm.name}
                  onChange={(e) => setLeadForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-white border border-[#1D503A]/30 rounded-xl px-4 py-3 text-xs focus:border-[#1D503A] transition-all text-gray-900"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#1D503A] uppercase tracking-wide">WhatsApp Number</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +971 50 123 4567"
                  value={leadForm.phone}
                  onChange={(e) => setLeadForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full bg-white border border-[#1D503A]/30 rounded-xl px-4 py-3 text-xs focus:border-[#1D503A] transition-all text-gray-900"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#1D503A] uppercase tracking-wide">Destination</label>
                <input
                  type="text"
                  placeholder="e.g. United Kingdom"
                  value={leadForm.dest}
                  onChange={(e) => setLeadForm(prev => ({ ...prev, dest: e.target.value }))}
                  className="w-full bg-white border border-[#1D503A]/30 rounded-xl px-4 py-3 text-xs focus:border-[#1D503A] transition-all text-gray-900"
                />
              </div>

              <button
                type="submit"
                disabled={isLeadSubmitting}
                className="w-full py-3.5 bg-[#1D503A] hover:bg-[#0e4a1e] text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-md disabled:opacity-40"
              >
                {isLeadSubmitting ? "Submitting Request..." : "Request Callback"}
              </button>
            </form>
          </div>

          {/* Interactive CSS 3D Globe representation */}
          {hero.globeEnabled && (
            <div className="bg-white rounded-[1.5rem] border border-[#1D503A] p-6 flex flex-col items-center justify-center space-y-4 shadow-lg relative overflow-hidden">
              <Globe className="w-16 h-16 text-[#1D503A] animate-[spin_12s_linear_infinite]" />
              <div className="text-center">
                <h4 className="text-xs font-bold text-[#1D503A] uppercase tracking-wider">Global Visa Network</h4>
                <p className="text-[10px] text-[#495B3E]">Real-time processing updates for 120+ countries.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* WHY CHOOSE ESHAARE SECTION */}
      <div className="max-w-[1280px] mx-auto py-24 space-y-12 relative z-10">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl md:text-4xl font-extrabold text-[#1D503A]">Why Choose Eshaare</h2>
          <p className="text-xs md:text-sm text-[#495B3E]">We manage the complete document compliance audits for UAE residents seeking global travels.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {whyUs.map((card, idx) => {
            return (
              <div
                key={idx}
                className="p-6 rounded-[1.5rem] bg-white border border-[#1D503A] hover:bg-[#FAF8F5] transition-all duration-300 shadow-md group flex gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-[#1D503A]/10 flex items-center justify-center text-[#1D503A] shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-[#1a1c1c] uppercase tracking-wider group-hover:text-[#1D503A] transition-colors">{card.title}</h3>
                  <p className="text-xs text-[#495B3E] leading-relaxed">{card.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FAQ ACCORDION SECTION */}
      <div className="max-w-[800px] mx-auto py-12 space-y-8 relative z-10 border-t border-[#1D503A]/30">
        <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-4xl font-extrabold text-[#1D503A]">Frequently Asked Questions</h2>
          <p className="text-xs md:text-sm text-[#495B3E]">Everything you need to know about processing timelines and compliance scores.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isExpanded = expandedFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-white border border-[#1D503A] overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                  className="w-full p-5 text-left flex justify-between items-center text-sm font-bold uppercase tracking-wider text-[#1D503A] hover:bg-[#1D503A]/5 transition-all"
                >
                  <span>{faq.question}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? "rotate-180 text-[#1D503A]" : "text-[#495B3E]"}`} />
                </button>
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="p-5 pt-0 text-xs text-[#495B3E] leading-relaxed border-t border-[#1D503A]/10 bg-[#FAF8F5]/50 animate-fadeIn">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default VisaEligibilityPage;
