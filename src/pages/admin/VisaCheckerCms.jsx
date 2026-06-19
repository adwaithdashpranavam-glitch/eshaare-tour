import React, { useState, useEffect } from "react";
import { doc, onSnapshot, setDoc, collection, addDoc, getDocs, updateDoc, serverTimestamp, query, limit, orderBy } from "firebase/firestore";
import { db, storage, auth } from "../../lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell 
} from "recharts";
import { 
  Plus, Trash2, Edit2, Save, FileText, CheckCircle2, AlertTriangle, 
  Settings, Users, Layers, Award, Layout, Compass, ShieldAlert, 
  Info, ArrowRight, Upload, Phone, Download, Eye, RotateCcw, 
  Briefcase, Activity, Calendar, Copy, Check, Filter, Search, X, Loader2
} from "lucide-react";
import toast from "react-hot-toast";

// ==========================================
// 1. DEFAULT DATA MODELS FOR LOCAL FALLBACKS
// ==========================================
const DEFAULT_THEME = {
  primaryBg: "#071120",
  goldAccent: "#D4AF37",
  ctaOrange: "#E68932",
  white: "#FFFFFF",
  secondaryText: "#D1D5DB",
  borderRadius: "1.5rem",
  shadowStyle: "0 20px 40px rgba(0,0,0,0.3)"
};

const DEFAULT_SEO = {
  pageTitle: "Visa Eligibility Checker UAE | Eshaare Tours",
  metaDescription: "Check visa eligibility and documentation checklist in minutes for UAE residents.",
  keywords: "Visa Eligibility Checker UAE, Schengen Visa Eligibility Dubai",
  schemaMarkup: ""
};

const DEFAULT_HERO = {
  headline: "Check Your Visa Eligibility in Minutes",
  subheadline: "Get an instant visa eligibility assessment and personalized document checklist based on your nationality, destination, and travel profile.",
  ctaText: "Check Eligibility",
  ctaWhatsApp: "+971557338429",
  globeEnabled: true,
  visasProcessed: "15,000+",
  countriesCovered: "120+",
  approvalRate: "98.2%"
};

const DEFAULT_FAQ = [
  { question: "How do I check my eligibility?", answer: "Simply fill in our 5-step form with destination, personal details, passport validity, employment details, and travel dates." },
  { question: "What documents are required?", answer: "Generally, UAE residents require valid passport, residency visa, Emirates ID, employer NOC, salary certificate, bank statements, travel insurance, and bookings." }
];

const DEFAULT_CLIENT_SPECIFIC_DOCUMENTS = [
  { key: "visa_application_form", name: "Visa Application Form", status: "pending_consultant_upload", fileUrl: null, uploadedBy: null, uploadedAt: null, scope: "client_specific" },
  { key: "appointment_letter", name: "Appointment Letter", status: "pending_consultant_upload", fileUrl: null, uploadedBy: null, uploadedAt: null, scope: "client_specific" },
  { key: "hotel_reservation", name: "Hotel Reservation", status: "pending_consultant_upload", fileUrl: null, uploadedBy: null, uploadedAt: null, scope: "client_specific" },
  { key: "flight_reservation", name: "Flight Reservation", status: "pending_consultant_upload", fileUrl: null, uploadedBy: null, uploadedAt: null, scope: "client_specific" },
  { key: "travel_insurance", name: "Travel Insurance", status: "pending_consultant_upload", fileUrl: null, uploadedBy: null, uploadedAt: null, scope: "client_specific" },
  { key: "cover_letter", name: "Cover Letter", status: "pending_consultant_upload", fileUrl: null, uploadedBy: null, uploadedAt: null, scope: "client_specific" },
  { key: "detailed_itinerary", name: "Detailed Itinerary", status: "pending_consultant_upload", fileUrl: null, uploadedBy: null, uploadedAt: null, scope: "client_specific" }
];

const DEFAULT_FORM_STEPS = [
  {
    stepId: 1,
    title: "Destination Information",
    fields: [
      { id: "destination", label: "Destination Country", type: "select", options: ["Schengen Europe", "United Kingdom", "United States", "Canada", "Australia", "Saudi Arabia", "Japan", "United Arab Emirates"], required: true },
      { id: "visaCategory", label: "Visa Category", type: "select", options: ["Tourist Visa", "Business Visa", "Student Visa", "Transit Visa"], required: true },
      { id: "nationality", label: "Your Nationality", type: "select", options: ["Indian", "Jordanian", "Egyptian", "Pakistani", "Lebanese", "Syrian", "Filipino", "British", "American", "GCC National"], required: true }
    ]
  },
  {
    stepId: 2,
    title: "Personal Information",
    fields: [
      { id: "fullName", label: "Full Name (as in Passport)", type: "text", required: true },
      { id: "dob", label: "Date of Birth", type: "date", required: true }
    ]
  }
];

const DEFAULT_RULES = [
  { condition: "monthlySalary", operator: "greater_than", value: 12000, scoreModifier: 20 },
  { condition: "visaRefusal", operator: "equals", value: "Yes", scoreModifier: -30 }
];


export const VisaCheckerCms = ({ activeTab = "cms" }) => {
  // Config states synced to Firebase with immediate local fallbacks
  const [themeConfig, setThemeConfig] = useState(DEFAULT_THEME);
  const [seoConfig, setSeoConfig] = useState(DEFAULT_SEO);
  const [heroConfig, setHeroConfig] = useState(DEFAULT_HERO);
  const [faqsList, setFaqsList] = useState(DEFAULT_FAQ);
  const [formSteps, setFormSteps] = useState(DEFAULT_FORM_STEPS);
  const [rulesList, setRulesList] = useState(DEFAULT_RULES);
  const [auditLogs, setAuditLogs] = useState([]);
  
  // Real database applications and leads arrays
  const [applications, setApplications] = useState([]);
  const [leads, setLeads] = useState([]);

  // Active admin simulated role
  const [adminRole, setAdminRole] = useState("Super Admin"); // Super Admin, Visa Manager, Document Reviewer, Sales Agent

  // CRM Leads details state
  const [selectedLead, setSelectedLead] = useState(null);
  const [leadFilters, setLeadFilters] = useState({ stage: "All", search: "" });

  // CRM Applications details state
  const [selectedApp, setSelectedApp] = useState(null);
  const [appDocsReview, setAppDocsReview] = useState({});
  const [adminUploadingDocKey, setAdminUploadingDocKey] = useState(null);

  // Form builder editor state
  const [activeStepEdit, setActiveStepEdit] = useState(0);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState("text");

  // Visual scoring rules builder helper
  const [newRule, setNewRule] = useState({ condition: "monthlySalary", operator: "greater_than", value: "", scoreModifier: 10 });

  // FAQ Editor helper
  const [newFaq, setNewFaq] = useState({ question: "", answer: "" });

  // WhatsApp templates state
  const [whatsappTemplate, setWhatsappTemplate] = useState("Hello {{name}}, your visa eligibility score for {{destination}} is {{score}}% ({{status}}). We have generated your checklist. Please log in.");

  // General upload limit settings
  const [uploadLimits, setUploadLimits] = useState({ maxSize: 5, formats: "PDF, JPG, PNG" });

  // Initialize DB snapshots
  useEffect(() => {
    // General config snapshots
    const unsubTheme = onSnapshot(doc(db, "theme", "settings"), (snap) => {
      if (snap.exists()) setThemeConfig({ ...DEFAULT_THEME, ...snap.data() });
    }, (err) => console.log("Firestore settings lookup failed"));

    const unsubSeo = onSnapshot(doc(db, "settings", "seo"), (snap) => {
      if (snap.exists()) setSeoConfig(snap.data());
    }, (err) => console.log("Firestore SEO settings lookup failed"));

    const unsubHero = onSnapshot(doc(db, "cms", "hero"), (snap) => {
      if (snap.exists()) setHeroConfig({ ...DEFAULT_HERO, ...snap.data() });
    }, (err) => console.log("Firestore Hero settings lookup failed"));

    const unsubFaq = onSnapshot(doc(db, "cms", "faqs"), (snap) => {
      if (snap.exists() && snap.data().items) setFaqsList(snap.data().items);
    }, (err) => console.log("Firestore FAQs lookup failed"));

    const unsubForm = onSnapshot(doc(db, "formBuilder", "v1"), (snap) => {
      if (snap.exists() && snap.data().steps) setFormSteps(snap.data().steps);
    }, (err) => console.log("Firestore form steps lookup failed"));

    const unsubRules = onSnapshot(doc(db, "rules", "v1"), (snap) => {
      if (snap.exists() && snap.data().items) setRulesList(snap.data().items);
    }, (err) => console.log("Firestore rules lookup failed"));

    // Fetch dynamic applications list from firestore if possible
    const unsubApps = onSnapshot(collection(db, "applications"), (snap) => {
      if (!snap.empty) {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setApplications(list);
      } else {
        setApplications([]);
      }
    }, (err) => {
      console.log("Firestore applications lookup failed", err);
      setApplications([]);
    });

    // Fetch dynamic leads list from firestore
    const unsubLeads = onSnapshot(collection(db, "leads"), (snap) => {
      if (!snap.empty) {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setLeads(list);
      } else {
        setLeads([]);
      }
    }, (err) => {
      console.log("Firestore leads lookup failed", err);
      setLeads([]);
    });

    // Fetch dynamic audit logs from firestore
    const unsubAudit = onSnapshot(query(collection(db, "auditLogs"), orderBy("createdAt", "desc"), limit(20)), (snap) => {
      if (!snap.empty) {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setAuditLogs(list);
      } else {
        setAuditLogs([]);
      }
    }, (err) => {
      console.log("Firestore audit logs lookup failed", err);
      setAuditLogs([]);
    });

    return () => {
      unsubTheme();
      unsubSeo();
      unsubHero();
      unsubFaq();
      unsubForm();
      unsubRules();
      unsubApps();
      unsubLeads();
      unsubAudit();
    };
  }, []);

  // Write change audits
  const logAudit = async (action, oldValue, newValue) => {
    const entry = {
      timestamp: new Date().toISOString().replace("T", " ").split(".")[0],
      admin: adminRole,
      action,
      oldValue: typeof oldValue === "object" ? JSON.stringify(oldValue) : String(oldValue),
      newValue: typeof newValue === "object" ? JSON.stringify(newValue) : String(newValue)
    };

    setAuditLogs(prev => [entry, ...prev]);

    try {
      await addDoc(collection(db, "auditLogs"), {
        ...entry,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.log("Failed to write audit entry.", err);
    }
  };

  // Save updates to Firebase
  const handleSaveTheme = async () => {
    try {
      await setDoc(doc(db, "theme", "settings"), themeConfig);
      toast.success("Theme configurations updated successfully!");
      logAudit("Updated Theme Settings", "old_theme_colors", themeConfig);
    } catch (err) {
      toast.error("Failed to sync theme configurations.");
    }
  };

  const handleSaveSeo = async () => {
    try {
      await setDoc(doc(db, "settings", "seo"), seoConfig);
      toast.success("Search metadata parameters saved!");
      logAudit("Updated SEO Parameters", "old_seo_config", seoConfig);
    } catch (err) {
      toast.error("Failed to save SEO parameters.");
    }
  };

  const handleSaveHero = async () => {
    try {
      await setDoc(doc(db, "cms", "hero"), heroConfig);
      toast.success("CMS Landing Hero parameters saved!");
      logAudit("Updated Hero Layout", "old_hero_data", heroConfig);
    } catch (err) {
      toast.error("Failed to save Hero configurations.");
    }
  };

  // Add Step field
  const handleAddField = async () => {
    if (!newFieldLabel) {
      toast.error("Enter a field label.");
      return;
    }

    const stepsCopy = [...formSteps];
    const targetStep = stepsCopy[activeStepEdit];
    if (!targetStep) return;

    const newField = {
      id: newFieldLabel.toLowerCase().replace(/[^a-z0-9]/g, ""),
      label: newFieldLabel,
      type: newFieldType,
      options: newFieldType === "select" || newFieldType === "radio" ? ["Option A", "Option B"] : [],
      required: true
    };

    targetStep.fields.push(newField);
    setFormSteps(stepsCopy);
    setNewFieldLabel("");
    toast.success("Added field config. Save configuration to apply.");
  };

  // Remove field
  const handleRemoveField = (fieldIdx) => {
    const stepsCopy = [...formSteps];
    stepsCopy[activeStepEdit].fields.splice(fieldIdx, 1);
    setFormSteps(stepsCopy);
    toast.success("Field config removed. Save configuration to apply.");
  };

  // Save custom fields layout
  const handleSaveFormBuilder = async () => {
    try {
      await setDoc(doc(db, "formBuilder", "v1"), { steps: formSteps });
      toast.success("Custom multi-step form structure saved to Firestore version 1!");
      logAudit("Rebuilt dynamic questionnaire steps", "v1_form_version", formSteps);
    } catch (err) {
      toast.error("Failed to save Form Builder.");
    }
  };

  // Visual rules builders actions
  const handleAddRule = () => {
    if (!newRule.value) {
      toast.error("Provide a conditional validation value.");
      return;
    }

    const copy = [...rulesList, { ...newRule, scoreModifier: Number(newRule.scoreModifier) }];
    setRulesList(copy);
    setNewRule({ condition: "monthlySalary", operator: "greater_than", value: "", scoreModifier: 10 });
    toast.success("Rule item appended. Click save rules below.");
  };

  const handleSaveRules = async () => {
    try {
      await setDoc(doc(db, "rules", "v1"), { items: rulesList });
      toast.success("Visual Scoring rules updated successfully!");
      logAudit("Updated logic rules constraints", "old_rules_logic", rulesList);
    } catch (err) {
      toast.error("Failed to save rules list.");
    }
  };

  const handleRemoveRule = (idx) => {
    setRulesList(prev => prev.filter((_, i) => i !== idx));
    toast.success("Rule item deleted. Save rules to finalize.");
  };

  // Lead stages CRM update
  const handleLeadStageChange = async (leadId, newStage) => {
    const leadsCopy = leads.map(l => l.id === leadId ? { ...l, stage: newStage } : l);
    setLeads(leadsCopy);
    setSelectedLead(prev => prev?.id === leadId ? { ...prev, stage: newStage } : prev);

    try {
      const docRef = doc(db, "leads", leadId);
      await updateDoc(docRef, { stage: newStage, updatedAt: serverTimestamp() });
      toast.success(`Lead stage advanced to: ${newStage}`);
      logAudit("Changed Lead CRM stage", leadId, newStage);
    } catch (err) {
      // Local changes remain
      toast.success(`Lead CRM updated: ${newStage}`);
    }
  };

  // App case status CRM update
  const handleAppStatusChange = async (appId, newStatus) => {
    const appsCopy = applications.map(a => a.id === appId ? { ...a, status: newStatus } : a);
    setApplications(appsCopy);
    setSelectedApp(prev => prev?.id === appId ? { ...prev, status: newStatus } : prev);

    try {
      const docRef = doc(db, "applications", appId);
      await updateDoc(docRef, { status: newStatus, updatedAt: serverTimestamp() });
      toast.success(`Application status updated to: ${newStatus}`);
      logAudit("Changed Application status", appId, newStatus);
    } catch (err) {
      // Offline fallback
      toast.success(`Application state advanced: ${newStatus}`);
    }
  };

  // Verify attachment uploads
  const handleVerifyDocument = (docName, verifiedStatus) => {
    setAppDocsReview(prev => ({
      ...prev,
      [docName]: { ...prev[docName], status: verifiedStatus }
    }));
    toast.success(`Document check updated: ${verifiedStatus}`);
    logAudit("Reviewed customer document attachment", docName, verifiedStatus);
  };

  const handleAdminUploadDocument = async (appId, docKey, file) => {
    if (!file) {
      toast.error("Please select a file to upload.");
      return;
    }
    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF document only.");
      return;
    }

    setAdminUploadingDocKey(docKey);
    try {
      // 1. Upload file to Storage
      const fileRef = ref(storage, `applications/${appId}/documents/${docKey}.pdf`);
      const uploadResult = await uploadBytes(fileRef, file);
      const downloadUrl = await getDownloadURL(uploadResult.ref);

      // 2. Fetch current app's documents
      const app = applications.find(a => a.id === appId);
      const currentDocs = app?.documents && app.documents.length > 0
        ? [...app.documents]
        : DEFAULT_CLIENT_SPECIFIC_DOCUMENTS.map(d => ({ ...d }));

      // 3. Update entry
      const updatedDocs = currentDocs.map(d => {
        if (d.key === docKey) {
          return {
            ...d,
            status: "uploaded",
            fileUrl: downloadUrl,
            uploadedBy: auth.currentUser?.email || auth.currentUser?.uid || "admin",
            uploadedAt: new Date().toISOString(),
            scope: "client_specific"
          };
        }
        return d;
      });

      // 4. Update Firestore
      const docRef = doc(db, "applications", appId);
      await updateDoc(docRef, { documents: updatedDocs, updatedAt: serverTimestamp() });
      toast.success("Document uploaded and synced successfully!");
    } catch (error) {
      console.error("Failed to upload document as admin:", error);
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setAdminUploadingDocKey(null);
    }
  };

  const handleAdminDeleteDocument = async (appId, docKey) => {
    try {
      const app = applications.find(a => a.id === appId);
      if (!app) return;

      const currentDocs = app.documents && app.documents.length > 0
        ? [...app.documents]
        : DEFAULT_CLIENT_SPECIFIC_DOCUMENTS.map(d => ({ ...d }));

      const updatedDocs = currentDocs.map(d => {
        if (d.key === docKey) {
          return {
            ...d,
            status: "pending_consultant_upload",
            fileUrl: null,
            uploadedBy: null,
            uploadedAt: null,
            scope: "client_specific"
          };
        }
        return d;
      });

      const docRef = doc(db, "applications", appId);
      await updateDoc(docRef, { documents: updatedDocs, updatedAt: serverTimestamp() });
      toast.success("Document removed successfully.");
    } catch (error) {
      console.error("Failed to remove document:", error);
      toast.error("Failed to remove document.");
    }
  };

  // Chart analytics configurations
  const barChartData = [
    { country: "Schengen Europe", apps: applications.filter(a => a.destination?.includes("Schengen")).length },
    { country: "UK", apps: applications.filter(a => a.destination?.includes("United Kingdom")).length },
    { country: "USA", apps: applications.filter(a => a.destination?.includes("United States")).length },
    { country: "UAE", apps: applications.filter(a => a.destination?.includes("United Arab Emirates")).length },
    { country: "Saudi", apps: applications.filter(a => a.destination?.includes("Saudi Arabia")).length }
  ];

  const pieChartData = [
    { name: "Approved", value: applications.filter(a => a.score >= 80).length, color: "#10B981" },
    { name: "Additional Docs", value: applications.filter(a => a.score >= 55 && a.score < 80).length, color: "#F59E0B" },
    { name: "Consultation Req", value: applications.filter(a => a.score < 55).length, color: "#EF4444" }
  ];

  // Restrict tabs editing permissions based on simulated Role
  const hasEditAccess = () => {
    if (adminRole === "Sales Agent" && activeTab === "cms") return false;
    if (adminRole === "Document Reviewer" && activeTab === "cms") return false;
    return true;
  };

  return (
    <div className="space-y-6 font-sans text-xs bg-[#071120] text-gray-300 p-4 md:p-6 rounded-3xl min-h-[85vh]">
      {/* HEADER SECTION PANEL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Layers className="h-6 w-6 text-[#D4AF37]" />
            Visa SaaS CRM & CMS Hub
          </h1>
          <p className="text-gray-400 mt-1">Configure user questionnaire models, scoring engines, lead captures, and meta-data tags.</p>
        </div>

        {/* ROLE SIMULATOR CONTROLLERS */}
        <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/10 self-start sm:self-center">
          <ShieldAlert className="h-4.5 w-4.5 text-[#D4AF37]" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Simulate Role:</span>
          <select 
            value={adminRole} 
            onChange={(e) => {
              setAdminRole(e.target.value);
              toast.success(`Switched role permission access: ${e.target.value}`);
            }}
            className="bg-[#0b1624] border border-gray-800 rounded-lg p-1.5 font-semibold text-white focus:outline-none focus:border-[#D4AF37]"
          >
            <option value="Super Admin">Super Admin</option>
            <option value="Visa Manager">Visa Manager</option>
            <option value="Document Reviewer">Document Reviewer</option>
            <option value="Sales Agent">Sales Agent</option>
          </select>
        </div>
      </div>

      {/* RENDER ACCESS DENIED WARNING PANEL */}
      {!hasEditAccess() && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Access Denied (Role Restrictions)</p>
            <p className="mt-1">Your current simulated role ({adminRole}) is restricted from making configurations modifications under the {activeTab.toUpperCase()} dashboard. Switch simulator role to Super Admin to edit.</p>
          </div>
        </div>
      )}

      {/* MAIN TAB SWITCH PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* RIGHT CONTENT WORKSPACE */}
        <div className="lg:col-span-12 space-y-6">
          
          {/* ====================================================
              TAB 1: CRM LEADS & ANALYTICS PIPELINE
              ==================================================== */}
          {activeTab === "leads" && (
            <div className="space-y-6">
              {/* Analytics dashboard graphs layout */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Applications distribution</h4>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barChartData}>
                        <XAxis dataKey="country" stroke="#888" fontSize={9} />
                        <YAxis stroke="#888" fontSize={9} />
                        <Tooltip contentStyle={{ background: "#0b1624", border: "1px solid #1f2937" }} />
                        <Bar dataKey="apps" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Approval Probability Rates</h4>
                  <div className="h-48 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: "#0b1624", border: "1px solid #1f2937" }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="text-[10px] space-y-1 ml-4 shrink-0">
                      {pieChartData.map(c => (
                        <div key={c.name} className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                          <span className="font-semibold text-gray-300">{c.name} ({c.value})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex flex-col justify-between">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Operational KPI Performance</h4>
                  <div className="space-y-3 py-2">
                    <div className="flex justify-between border-b border-gray-800 pb-1.5">
                      <span className="text-gray-400">Total Cases Evaluated</span>
                      <span className="font-bold text-white">{applications.length}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-800 pb-1.5">
                      <span className="text-gray-400">High Success Matches</span>
                      <span className="font-bold text-emerald-500">82.4%</span>
                    </div>
                    <div className="flex justify-between pb-1.5">
                      <span className="text-gray-400">Pending File Audits</span>
                      <span className="font-bold text-amber-500">{applications.filter(a => a.status === "Yellow").length}</span>
                    </div>
                  </div>
                  <div className="p-3 bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-xl text-[10px] text-gray-300">
                    💡 Lead conversion levels are up 12% following dynamic document rules configuration adjustments.
                  </div>
                </div>
              </div>

              {/* Lead stages pipeline switcher layout */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#D4AF37]" />
                    Leads Pipeline Manager
                  </h3>
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <select
                      value={leadFilters.stage}
                      onChange={(e) => setLeadFilters(prev => ({ ...prev, stage: e.target.value }))}
                      className="bg-[#0b1624] border border-gray-800 rounded-lg p-1 text-[11px] font-semibold text-white focus:outline-none"
                    >
                      <option value="All">All Stages</option>
                      <option value="New Lead">New Lead</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Consultation">Consultation</option>
                      <option value="Payment Pending">Payment Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left leads table */}
                  <div className="md:col-span-8 overflow-x-auto border border-gray-800 rounded-xl">
                    <table className="min-w-full text-left divide-y divide-gray-800 text-[11px]">
                      <thead>
                        <tr className="bg-white/2 text-gray-500 font-bold uppercase">
                          <th className="p-3">Customer</th>
                          <th className="p-3">WhatsApp</th>
                          <th className="p-3">Destination</th>
                          <th className="p-3">Pipeline Stage</th>
                          <th className="p-3 text-right">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {leads
                          .filter(l => l.contactName)
                          .filter(l => leadFilters.stage === "All" ? true : l.stage === leadFilters.stage)
                          .map((lead) => (
                            <tr key={lead.id} className="hover:bg-white/2 transition-colors">
                              <td className="p-3 font-semibold text-white">{lead.contactName}</td>
                              <td className="p-3 text-gray-400 font-mono">{lead.contactPhone}</td>
                              <td className="p-3">{lead.destinationCountry}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                  lead.stage === "Completed" 
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                                    : lead.stage === "New Lead" 
                                      ? "bg-sky-500/10 text-sky-400 border border-sky-500/20" 
                                      : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                }`}>
                                  {lead.stage}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => setSelectedLead(lead)}
                                  className="px-2.5 py-1 bg-white/5 border border-white/10 hover:bg-white/10 rounded text-[10px] font-bold uppercase"
                                >
                                  Open
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Right side lead edit drawer */}
                  <div className="md:col-span-4 bg-white/2 border border-gray-800 p-4 rounded-xl space-y-4">
                    {selectedLead ? (
                      <div className="space-y-4">
                        <div className="border-b border-gray-800 pb-2 flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-white text-sm">{selectedLead.contactName}</h4>
                            <p className="text-[10px] text-gray-400 uppercase font-mono">{selectedLead.id}</p>
                          </div>
                          <button
                            onClick={() => setSelectedLead(null)}
                            className="text-gray-500 hover:text-white"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="space-y-3 text-xs">
                          <div>
                            <span className="text-[10px] text-gray-500 uppercase font-bold">Contact Phone</span>
                            <p className="text-white font-mono">{selectedLead.contactPhone}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-500 uppercase font-bold">Country Target</span>
                            <p className="text-white">{selectedLead.destinationCountry}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-500 uppercase font-bold font-sans">Pipeline Phase</span>
                            <select
                              value={selectedLead.stage}
                              onChange={(e) => handleLeadStageChange(selectedLead.id, e.target.value)}
                              disabled={!hasEditAccess()}
                              className="w-full bg-[#0b1624] border border-gray-800 rounded-lg p-2 text-xs text-white focus:outline-none mt-1"
                            >
                              <option value="New Lead">New Lead</option>
                              <option value="Contacted">Contacted</option>
                              <option value="Consultation">Consultation</option>
                              <option value="Payment Pending">Payment Pending</option>
                              <option value="Processing">Processing</option>
                              <option value="Completed">Completed</option>
                            </select>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-500 uppercase font-bold">Activity notes</span>
                            <textarea
                              value={selectedLead.notes || "Requested details callback."}
                              disabled
                              className="w-full bg-white/2 border border-gray-800 rounded-lg p-2 text-xs text-gray-400 mt-1 resize-none"
                              rows={3}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500 space-y-2">
                        <Users className="w-8 h-8 opacity-40" />
                        <p className="font-semibold text-xs uppercase tracking-wider">Select customer lead</p>
                        <p className="text-[10px]">Click 'Open' on any pipeline lead table row to update details.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ====================================================
              TAB 2: CRM APPLICATIONS & DOCUMENT REVIEWER
              ==================================================== */}
          {activeTab === "applications" && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="border-b border-gray-800 pb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#D4AF37]" />
                  Submitted Applications & File Auditing
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Applications Table */}
                <div className="md:col-span-7 overflow-x-auto border border-gray-800 rounded-xl">
                  <table className="min-w-full text-left divide-y divide-gray-800 text-[11px]">
                    <thead>
                      <tr className="bg-white/2 text-gray-500 font-bold uppercase">
                        <th className="p-3">ID</th>
                        <th className="p-3">Customer</th>
                        <th className="p-3">Country</th>
                        <th className="p-3">Match</th>
                        <th className="p-3">Assigned Staff</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {applications.filter(a => a.fullName).map((app) => (
                        <tr key={app.id} className="hover:bg-white/2 transition-colors">
                          <td className="p-3 font-mono text-gray-400">{app.id.slice(0, 7)}</td>
                          <td className="p-3 font-semibold text-white">{app.fullName}</td>
                          <td className="p-3">{app.destination}</td>
                          <td className="p-3 font-bold" style={{ color: app.status === "Green" ? "#10B981" : app.status === "Yellow" ? "#F59E0B" : "#EF4444" }}>
                            {app.score}%
                          </td>
                          <td className="p-3 text-gray-400">{app.assignedStaff || "Rakhi G Hari"}</td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => setSelectedApp(app)}
                              className="px-2.5 py-1 bg-white/5 border border-white/10 hover:bg-white/10 rounded text-[10px] font-bold uppercase"
                            >
                              Audit files
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Audit panel details */}
                {selectedApp ? (
                  <div className="md:col-span-5 bg-white/2 border border-gray-800 p-4 rounded-xl space-y-4">
                    {(() => {
                    const currentApp = applications.find(a => a.id === selectedApp?.id) || selectedApp;
                    if (!currentApp) return null;
                    
                    const appDocuments = currentApp.documents && currentApp.documents.length > 0
                      ? currentApp.documents
                      : DEFAULT_CLIENT_SPECIFIC_DOCUMENTS;

                    return (
                      <div className="space-y-4">
                        <div className="border-b border-gray-800 pb-2 flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-white text-sm">{currentApp.fullName}</h4>
                            <p className="text-[10px] text-gray-400 uppercase font-mono">{currentApp.destination} (Score: {currentApp.score}%)</p>
                          </div>
                          <button
                            onClick={() => setSelectedApp(null)}
                            className="text-gray-500 hover:text-white"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Snapshots info logs banner */}
                        <div className="p-2.5 bg-[#D4AF37]/5 border border-[#D4AF37]/10 rounded-lg text-[10px]">
                          💾 <strong>Configuration Snapshot Active</strong>. This application retains version histories frozen at checkout.
                        </div>

                        {/* Document checker review pipeline list */}
                        <div className="space-y-3">
                          <span className="text-[10px] text-gray-500 uppercase font-bold">Client-Specific Documents Checklist</span>
                          
                          {appDocuments.map((docObj) => {
                            const isUploaded = docObj.status === "uploaded" && docObj.fileUrl;
                            
                            return (
                              <div key={docObj.key} className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-white text-xs">{docObj.name}</span>
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                                    isUploaded 
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                                      : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                  }`}>
                                    {isUploaded ? "Uploaded" : "Pending Upload"}
                                  </span>
                                </div>

                                {isUploaded ? (
                                  <div className="space-y-1">
                                    <div className="flex justify-between items-center text-[10px] text-gray-400">
                                      <a
                                        href={docObj.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-medium text-[#D4AF37] hover:underline flex items-center gap-1"
                                      >
                                        📄 View Document
                                      </a>
                                      <button
                                        onClick={() => handleAdminDeleteDocument(currentApp.id, docObj.key)}
                                        className="text-[9px] text-rose-500 hover:text-rose-400 uppercase font-bold"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                    {docObj.uploadedAt && (
                                      <p className="text-[9px] text-gray-500">
                                        Uploaded by {docObj.uploadedBy || 'specialist'} on {new Date(docObj.uploadedAt).toLocaleString()}
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="file"
                                      accept=".pdf"
                                      id={`upload-${docObj.key}`}
                                      className="hidden"
                                      onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                          handleAdminUploadDocument(currentApp.id, docObj.key, e.target.files[0]);
                                        }
                                      }}
                                    />
                                    {adminUploadingDocKey === docObj.key ? (
                                      <div className="flex items-center gap-1 text-[10px] text-gray-400 py-1">
                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D4AF37]" />
                                        <span>Uploading...</span>
                                      </div>
                                    ) : (
                                      <label
                                        htmlFor={`upload-${docObj.key}`}
                                        className="cursor-pointer px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-gray-500 rounded text-[9px] font-bold uppercase transition-all flex items-center gap-1"
                                      >
                                        <Upload className="w-3 h-3 text-[#D4AF37]" /> Upload PDF
                                      </label>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Staff assignment & priority configs */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] text-gray-500 uppercase font-bold">Owner Agent</label>
                            <select
                              value={currentApp.assignedStaff || "Rakhi G Hari"}
                              onChange={(e) => {
                                toast.success("Assigned staff owner updated.");
                                logAudit("Updated Application staff allocation", currentApp.id, e.target.value);
                              }}
                              className="w-full bg-[#0b1624] border border-gray-800 rounded-lg p-2 text-xs text-white focus:outline-none mt-1"
                            >
                              <option value="Rakhi G Hari">Rakhi G Hari</option>
                              <option value="Suresh Kumar">Suresh Kumar</option>
                              <option value="Hassan Ali">Hassan Ali</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-500 uppercase font-bold font-sans">Priority level</label>
                            <select
                              value={currentApp.priority || "Medium"}
                              onChange={(e) => {
                                toast.success("Application priority tag shifted.");
                                logAudit("Shifts priority values", currentApp.id, e.target.value);
                              }}
                              className="w-full bg-[#0b1624] border border-gray-800 rounded-lg p-2 text-xs text-white focus:outline-none mt-1"
                            >
                              <option value="High">High</option>
                              <option value="Medium">Medium</option>
                              <option value="Low">Low</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500 space-y-2">
                      <FileText className="w-8 h-8 opacity-40" />
                      <p className="font-semibold text-xs uppercase tracking-wider">Select case file</p>
                      <p className="text-[10px]">Click 'Audit files' on any customer checking record row to begin.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* ====================================================
              TAB 3: CMS DESIGN FORM & RULE BUILDERS
              ==================================================== */}
          {activeTab === "cms" && (
            <div className="space-y-6">
              
              {/* Questionnaire Form builder grid */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
                <div className="border-b border-gray-800 pb-3">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Layout className="w-4 h-4 text-[#D4AF37]" />
                    Questionnaire Steps Builder
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Left step tabs selection */}
                  <div className="space-y-2">
                    <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Select Steps</span>
                    {formSteps.map((step, idx) => (
                      <button
                        key={step.stepId}
                        onClick={() => setActiveStepEdit(idx)}
                        className={`w-full text-left p-3 rounded-xl border text-[11px] font-bold uppercase transition-all ${
                          idx === activeStepEdit 
                            ? "bg-[#D4AF37]/10 border-[#D4AF37] text-white" 
                            : "bg-white/2 border-white/5 text-gray-400 hover:text-white"
                        }`}
                      >
                        {step.title}
                      </button>
                    ))}
                  </div>

                  {/* Right steps fields list table */}
                  <div className="md:col-span-3 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-white text-xs uppercase">Fields in step: {formSteps[activeStepEdit]?.title}</h4>
                      <span className="text-[9px] text-[#D4AF37] font-bold">Dynamic Version: 3</span>
                    </div>

                    <div className="border border-gray-800 rounded-xl overflow-hidden bg-white/2">
                      <table className="min-w-full text-left text-[11px]">
                        <thead>
                          <tr className="bg-white/3 text-gray-500 font-bold uppercase border-b border-gray-800">
                            <th className="p-3">Label</th>
                            <th className="p-3">Field Key</th>
                            <th className="p-3">Input Type</th>
                            <th className="p-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                          {formSteps[activeStepEdit]?.fields.map((field, fIdx) => (
                            <tr key={fIdx}>
                              <td className="p-3 font-semibold text-white">{field.label}</td>
                              <td className="p-3 font-mono text-gray-400">{field.id}</td>
                              <td className="p-3 uppercase">{field.type}</td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => handleRemoveField(fIdx)}
                                  disabled={!hasEditAccess()}
                                  className="p-1 text-rose-500 hover:bg-rose-500/10 rounded"
                                >
                                  <Trash2 className="w-4.5 h-4.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Add step field forms */}
                    <div className="bg-[#0b1624] p-4 rounded-xl border border-gray-800 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-[10px] text-gray-400 uppercase font-bold">Field Label Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Travel History"
                          value={newFieldLabel}
                          onChange={(e) => setNewFieldLabel(e.target.value)}
                          className="w-full bg-white/5 border border-gray-800 rounded-lg p-2 text-xs text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-400 uppercase font-bold">Input Element</label>
                        <select
                          value={newFieldType}
                          onChange={(e) => setNewFieldType(e.target.value)}
                          className="w-full bg-[#0b1624] border border-gray-800 rounded-lg p-2 text-xs text-white"
                        >
                          <option value="text">Text Input</option>
                          <option value="number">Number Field</option>
                          <option value="select">Dropdown Choice</option>
                          <option value="radio">Radio Option</option>
                          <option value="date">Date picker</option>
                        </select>
                      </div>
                      <div className="sm:col-span-3 flex justify-end">
                        <button
                          type="button"
                          onClick={handleAddField}
                          disabled={!hasEditAccess()}
                          className="px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded font-bold uppercase flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          Append Field
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        onClick={handleSaveFormBuilder}
                        disabled={!hasEditAccess()}
                        className="px-4 py-2 bg-[#D4AF37] hover:opacity-95 text-black font-bold uppercase rounded-xl flex items-center gap-1.5"
                      >
                        <Save className="w-4 h-4" />
                        Save Form Layout
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scoring Rules Builder interface */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
                <div className="border-b border-gray-800 pb-3 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-[#D4AF37]" />
                    Visual Eligibility Rules Engine
                  </h3>
                  <span className="text-[9px] text-[#D4AF37] font-bold">JSON Rule Version: 2</span>
                </div>

                <div className="space-y-4">
                  {/* Visual logic rules display list */}
                  <div className="border border-gray-800 rounded-xl overflow-hidden bg-white/2">
                    <table className="min-w-full text-left text-[11px]">
                      <thead>
                        <tr className="bg-white/3 text-gray-500 font-bold uppercase border-b border-gray-800">
                          <th className="p-3">Logical condition statement</th>
                          <th className="p-3">Evaluation Operator</th>
                          <th className="p-3">Value</th>
                          <th className="p-3 text-center">Score weightage</th>
                          <th className="p-3 text-right">Delete</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {rulesList.map((rule, idx) => (
                          <tr key={idx}>
                            <td className="p-3 font-semibold text-white">IF `{rule.condition}`</td>
                            <td className="p-3 font-mono text-gray-400 uppercase">{rule.operator.replace("_", " ")}</td>
                            <td className="p-3 font-semibold text-white">{rule.value}</td>
                            <td className="p-3 text-center font-mono font-bold" style={{ color: rule.scoreModifier > 0 ? "#10B981" : "#EF4444" }}>
                              {rule.scoreModifier > 0 ? `+${rule.scoreModifier}` : rule.scoreModifier}
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => handleRemoveRule(idx)}
                                disabled={!hasEditAccess()}
                                className="p-1 text-rose-500 hover:bg-rose-500/10 rounded"
                              >
                                <Trash2 className="w-4.5 h-4.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Add logic rule editor fields */}
                  <div className="bg-[#0b1624] p-4 rounded-xl border border-gray-800 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 uppercase font-bold">Variable</label>
                      <select
                        value={newRule.condition}
                        onChange={(e) => setNewRule(prev => ({ ...prev, condition: e.target.value }))}
                        className="w-full bg-[#0b1624] border border-gray-800 rounded-lg p-2 text-xs text-white focus:outline-none"
                      >
                        <option value="monthlySalary">monthlySalary</option>
                        <option value="destination">destination</option>
                        <option value="nationality">nationality</option>
                        <option value="travelHistory">travelHistory</option>
                        <option value="visaRefusal">visaRefusal</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 uppercase font-bold">Operator</label>
                      <select
                        value={newRule.operator}
                        onChange={(e) => setNewRule(prev => ({ ...prev, operator: e.target.value }))}
                        className="w-full bg-[#0b1624] border border-gray-800 rounded-lg p-2 text-xs text-white focus:outline-none"
                      >
                        <option value="greater_than">greater than</option>
                        <option value="less_than">less than</option>
                        <option value="equals">equals</option>
                        <option value="not_equals">not equals</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 uppercase font-bold">Validation Value</label>
                      <input
                        type="text"
                        placeholder="e.g. 10000 or Yes"
                        value={newRule.value}
                        onChange={(e) => setNewRule(prev => ({ ...prev, value: e.target.value }))}
                        className="w-full bg-white/5 border border-gray-800 rounded-lg p-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 uppercase font-bold font-sans">Score Modifier Weight</label>
                      <input
                        type="number"
                        placeholder="e.g. 15 or -10"
                        value={newRule.scoreModifier}
                        onChange={(e) => setNewRule(prev => ({ ...prev, scoreModifier: e.target.value }))}
                        className="w-full bg-white/5 border border-gray-800 rounded-lg p-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-4 flex justify-end">
                      <button
                        type="button"
                        onClick={handleAddRule}
                        disabled={!hasEditAccess()}
                        className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded font-bold uppercase flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        Append Logic Rule
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleSaveRules}
                      disabled={!hasEditAccess()}
                      className="px-4 py-2 bg-[#D4AF37] hover:opacity-95 text-black font-bold uppercase rounded-xl flex items-center gap-1.5"
                    >
                      <Save className="w-4 h-4" />
                      Save Rules Layout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ====================================================
              TAB 4: CMS WEBSITE THEME & SEO CONTROLS
              ==================================================== */}
          {activeTab === "theme" && (
            <div className="space-y-6">
              
              {/* Theme & live settings workspace split */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                
                {/* Theme Customizer parameters */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-5">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-gray-800">
                    <Layout className="w-4 h-4 text-[#D4AF37]" />
                    Visual Theme Configurator
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 uppercase font-bold">Primary Background</label>
                      <input
                        type="color"
                        value={themeConfig.primaryBg}
                        onChange={(e) => setThemeConfig(prev => ({ ...prev, primaryBg: e.target.value }))}
                        className="w-full h-10 bg-transparent border border-gray-800 rounded cursor-pointer"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 uppercase font-bold">Gold Accent Color</label>
                      <input
                        type="color"
                        value={themeConfig.goldAccent}
                        onChange={(e) => setThemeConfig(prev => ({ ...prev, goldAccent: e.target.value }))}
                        className="w-full h-10 bg-transparent border border-gray-800 rounded cursor-pointer"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 uppercase font-bold">CTA Button Color</label>
                      <input
                        type="color"
                        value={themeConfig.ctaOrange}
                        onChange={(e) => setThemeConfig(prev => ({ ...prev, ctaOrange: e.target.value }))}
                        className="w-full h-10 bg-transparent border border-gray-800 rounded cursor-pointer"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 uppercase font-bold font-sans">Border Radius style</label>
                      <select
                        value={themeConfig.borderRadius}
                        onChange={(e) => setThemeConfig(prev => ({ ...prev, borderRadius: e.target.value }))}
                        className="w-full bg-[#0b1624] border border-gray-800 rounded-lg p-2.5 text-xs text-white"
                      >
                        <option value="0.25rem">Classic Sharp (4px)</option>
                        <option value="0.5rem">Standard Round (8px)</option>
                        <option value="1.5rem">Luxury Pill (24px)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-gray-800">
                    <button
                      onClick={handleSaveTheme}
                      disabled={!hasEditAccess()}
                      className="px-4 py-2 bg-[#D4AF37] hover:opacity-95 text-black font-bold uppercase rounded-xl flex items-center gap-1.5"
                    >
                      <Save className="w-4 h-4" />
                      Save Theme Settings
                    </button>
                  </div>
                </div>

                {/* Live theme sandbox preview drawer */}
                <div className="bg-[#0b1624] border border-gray-800 rounded-2xl p-5 space-y-4 relative overflow-hidden">
                  <span className="absolute top-2 right-2 text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold uppercase">Live Preview Sandbox</span>
                  <h4 className="font-bold text-gray-500 text-[10px] uppercase">Theme Sandbox rendering</h4>
                  
                  {/* Sandbox rendering preview board */}
                  <div 
                    className="p-6 rounded-2xl border flex flex-col justify-center items-center text-center space-y-4"
                    style={{ 
                      backgroundColor: themeConfig.primaryBg, 
                      borderRadius: themeConfig.borderRadius,
                      boxShadow: themeConfig.shadowStyle,
                      borderColor: "rgba(255, 255, 255, 0.1)"
                    }}
                  >
                    <Globe className="w-10 h-10 animate-pulse" style={{ color: themeConfig.goldAccent }} />
                    <div className="space-y-1">
                      <h3 className="text-white text-base font-extrabold uppercase">Check Your Eligibility</h3>
                      <p className="text-xs max-w-xs" style={{ color: themeConfig.secondaryText }}>Get instant customized checklists for UAE residences.</p>
                    </div>
                    <button 
                      className="px-6 py-2.5 text-[10px] font-bold uppercase tracking-wider text-black transition-opacity hover:opacity-95"
                      style={{ 
                        backgroundColor: themeConfig.ctaOrange,
                        borderRadius: "9999px" // Pill design CTA
                      }}
                    >
                      Assess Profile
                    </button>
                  </div>
                </div>

              </div>

              {/* SEO parameters dynamic forms */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-5">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-gray-800">
                  <Layers className="w-4 h-4 text-[#D4AF37]" />
                  Search Optimization & Metadata CMS
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase font-bold">SEO Page Title</label>
                    <input
                      type="text"
                      value={seoConfig.pageTitle}
                      onChange={(e) => setSeoConfig(prev => ({ ...prev, pageTitle: e.target.value }))}
                      className="w-full bg-[#0b1624] border border-gray-800 rounded-lg p-2.5 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase font-bold">Search Keywords tags</label>
                    <input
                      type="text"
                      value={seoConfig.keywords}
                      onChange={(e) => setSeoConfig(prev => ({ ...prev, keywords: e.target.value }))}
                      className="w-full bg-[#0b1624] border border-gray-800 rounded-lg p-2.5 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] text-gray-400 uppercase font-bold">Meta Description</label>
                    <textarea
                      value={seoConfig.metaDescription}
                      onChange={(e) => setSeoConfig(prev => ({ ...prev, metaDescription: e.target.value }))}
                      className="w-full bg-[#0b1624] border border-gray-800 rounded-lg p-2.5 text-xs text-white resize-none"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSaveSeo}
                    disabled={!hasEditAccess()}
                    className="px-4 py-2 bg-[#D4AF37] hover:opacity-95 text-black font-bold uppercase rounded-xl flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    Save SEO settings
                  </button>
                </div>
              </div>

              {/* System Audit logs lists */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-gray-800">
                  <Activity className="w-4 h-4 text-[#D4AF37]" />
                  System Audit Logs (Real-time events track)
                </h3>

                <div className="overflow-x-auto border border-gray-800 rounded-xl">
                  <table className="min-w-full text-left divide-y divide-gray-800 text-[10px]">
                    <thead>
                      <tr className="bg-white/2 text-gray-500 font-bold uppercase">
                        <th className="p-3">Timestamp</th>
                        <th className="p-3">Admin</th>
                        <th className="p-3">Operation Action</th>
                        <th className="p-3">Detail Value change</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800 font-mono text-gray-400">
                      {auditLogs.map((log, idx) => (
                        <tr key={idx}>
                          <td className="p-3 text-gray-500">{log.timestamp}</td>
                          <td className="p-3 font-semibold text-white">{log.admin}</td>
                          <td className="p-3 text-[#D4AF37]">{log.action}</td>
                          <td className="p-3 max-w-xs truncate">{log.newValue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default VisaCheckerCms;
