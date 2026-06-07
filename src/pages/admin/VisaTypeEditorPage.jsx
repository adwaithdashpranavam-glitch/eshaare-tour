import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  Save, ArrowLeft, Plus, Trash2, ArrowUp, ArrowDown, Loader2, 
  Sparkles, Clock, TrendingUp, FileText, Calendar, Shield, Users, 
  Briefcase, DollarSign, HelpCircle, Eye, CheckCircle, Upload
} from "lucide-react";
import { getVisaTypeBySlug, saveVisaType } from "../../lib/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../lib/firebase";
import toast from "react-hot-toast";

// Icon mapping dictionary for Hero Stats selection
const STAT_ICONS = {
  Clock: Clock,
  TrendingUp: TrendingUp,
  FileText: FileText,
  Calendar: Calendar,
  Shield: Shield,
  Users: Users,
  Briefcase: Briefcase,
  DollarSign: DollarSign
};

export const VisaTypeEditorPage = () => {
  const { id } = useParams(); // Doc slug if editing
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    imageUrl: "",
    tagline: "",
    isPublished: false,
    sortOrder: 1,
    heroStats: [
      { label: "Processing Time", value: "5-10 Days", icon: "Clock" },
      { label: "Success Rate", value: "98.2%", icon: "TrendingUp" },
      { label: "Required Documents", value: "4 Core Docs", icon: "FileText" },
      { label: "Appointments", value: "Express slots", icon: "Calendar" }
    ],
    overviewText: "",
    requiredDocuments: [
      "Passport valid for at least 6 months",
      "Valid UAE residency visa (3+ months validity)"
    ],
    processSteps: [
      { stepNumber: 1, title: "Submit Details", description: "Provide passport copy and complete travel questionnaire." }
    ],
    feeStructure: [
      { applicantType: "Adult (12+ years)", embassyFee: "320 AED", serviceFee: "280 AED" }
    ],
    faqs: [
      { question: "How long does processing take?", answer: "Typically 5-15 working days depending on country." }
    ],
    metaTitle: "",
    metaDescription: "",
    showSupportPackages: false,
    supportPackages: {
      standard: {
        title: "Standard Support",
        subtitle: "Ideal for travelers who already have an appointment slot.",
        price: "299",
        features: [
          { text: "Document Checklist", included: true },
          { text: "Form Filling (Online)", included: true },
          { text: "Cover Letter Drafting", included: true },
          { text: "Slot Tracking", included: false }
        ]
      },
      premium: {
        title: "Premium Fast-Track Appointment Booking",
        subtitle: "Comprehensive end-to-end management with appointment tracking.",
        price: "549",
        recommended: true,
        features: [
          { text: "All Standard Features", included: true },
          { text: "Appointment Slot Tracking", included: true, highlighted: true },
          { text: "Travel Insurance", included: true },
          { text: "Flight & Hotel Vouchers", included: true },
          { text: "In-person Document Pickup", included: true }
        ]
      }
    }
  });

  // Load existing data in Edit Mode
  useEffect(() => {
    if (!isEditMode) return;

    const fetchVisaData = async () => {
      try {
        const visa = await getVisaTypeBySlug(id);
        if (visa) {
          const defaultSupportPackages = {
            showSupportPackages: visa.showSupportPackages !== undefined ? visa.showSupportPackages : false,
            supportPackages: {
              standard: {
                title: visa.supportPackages?.standard?.title || "Standard Support",
                subtitle: visa.supportPackages?.standard?.subtitle || "Ideal for travelers who already have an appointment slot.",
                price: visa.supportPackages?.standard?.price || "299",
                features: visa.supportPackages?.standard?.features || [
                  { text: "Document Checklist", included: true },
                  { text: "Form Filling (Online)", included: true },
                  { text: "Cover Letter Drafting", included: true },
                  { text: "Slot Tracking", included: false }
                ]
              },
              premium: {
                title: visa.supportPackages?.premium?.title || "Premium Fast-Track Appointment Booking",
                subtitle: visa.supportPackages?.premium?.subtitle || "Comprehensive end-to-end management with appointment tracking.",
                price: visa.supportPackages?.premium?.price || "549",
                recommended: visa.supportPackages?.premium?.recommended !== undefined ? visa.supportPackages?.premium.recommended : true,
                features: visa.supportPackages?.premium?.features || [
                  { text: "All Standard Features", included: true },
                  { text: "Appointment Slot Tracking", included: true, highlighted: true },
                  { text: "Travel Insurance", included: true },
                  { text: "Flight & Hotel Vouchers", included: true },
                  { text: "In-person Document Pickup", included: true }
                ]
              }
            }
          };

          setFormData({
            ...formData,
            ...visa,
            ...defaultSupportPackages,
            // Ensure array fields exist
            heroStats: visa.heroStats || [],
            requiredDocuments: visa.requiredDocuments || [],
            processSteps: visa.processSteps || [],
            feeStructure: visa.feeStructure || [],
            faqs: visa.faqs || []
          });
        } else {
          toast.error("Visa page not found");
          navigate("/admin/visa-types");
        }
      } catch (err) {
        toast.error("Failed to load visa details");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchVisaData();
  }, [id, isEditMode]);

  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file size must be less than 5MB");
      return;
    }

    setUploading(true);
    const storageRef = ref(storage, `visa_banners/${formData.slug || "temp"}_${Date.now()}`);
    try {
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      setFormData(prev => ({ ...prev, imageUrl: downloadURL }));
      toast.success("Banner image uploaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload image: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  // Handle Slug Autogeneration in Create Mode
  const handleNameChange = (e) => {
    const val = e.target.value;
    if (isEditMode) {
      setFormData(prev => ({ ...prev, name: val }));
    } else {
      // Auto-generate slug from name in create mode
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      setFormData(prev => ({ 
        ...prev, 
        name: val, 
        slug: generatedSlug,
        metaTitle: `${val} Dubai | Eshaare Tours`
      }));
    }
  };

  const handleSlugChange = (e) => {
    if (isEditMode) return;
    const cleanSlug = e.target.value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, ""); // Allow only letters, numbers, and dashes
    setFormData(prev => ({ ...prev, slug: cleanSlug }));
  };

  // List Managers: Document Checklist
  const addDocument = () => {
    if (formData.requiredDocuments.length >= 15) {
      toast.error("Maximum 15 documents allowed");
      return;
    }
    setFormData(prev => ({
      ...prev,
      requiredDocuments: [...prev.requiredDocuments, ""]
    }));
  };

  const updateDocumentText = (idx, text) => {
    const nextDocs = [...formData.requiredDocuments];
    nextDocs[idx] = text;
    setFormData(prev => ({ ...prev, requiredDocuments: nextDocs }));
  };

  const removeDocument = (idx) => {
    setFormData(prev => ({
      ...prev,
      requiredDocuments: prev.requiredDocuments.filter((_, i) => i !== idx)
    }));
  };

  const moveDocument = (idx, direction) => {
    const nextIdx = idx + direction;
    if (nextIdx < 0 || nextIdx >= formData.requiredDocuments.length) return;
    
    const nextDocs = [...formData.requiredDocuments];
    const temp = nextDocs[idx];
    nextDocs[idx] = nextDocs[nextIdx];
    nextDocs[nextIdx] = temp;
    setFormData(prev => ({ ...prev, requiredDocuments: nextDocs }));
  };

  // List Managers: Process Steps
  const addStep = () => {
    if (formData.processSteps.length >= 6) {
      toast.error("Maximum 6 steps allowed");
      return;
    }
    const nextStepNum = formData.processSteps.length + 1;
    setFormData(prev => ({
      ...prev,
      processSteps: [...prev.processSteps, { stepNumber: nextStepNum, title: "", description: "" }]
    }));
  };

  const updateStepField = (idx, field, value) => {
    const nextSteps = formData.processSteps.map((step, i) => {
      if (i === idx) {
        return { ...step, [field]: value };
      }
      return step;
    });
    setFormData(prev => ({ ...prev, processSteps: nextSteps }));
  };

  const removeStep = (idx) => {
    const filteredSteps = formData.processSteps.filter((_, i) => i !== idx);
    // Re-index step numbers sequentially
    const reindexedSteps = filteredSteps.map((step, i) => ({
      ...step,
      stepNumber: i + 1
    }));
    setFormData(prev => ({ ...prev, processSteps: reindexedSteps }));
  };

  const moveStep = (idx, direction) => {
    const nextIdx = idx + direction;
    if (nextIdx < 0 || nextIdx >= formData.processSteps.length) return;
    
    const nextSteps = [...formData.processSteps];
    const temp = nextSteps[idx];
    nextSteps[idx] = nextSteps[nextIdx];
    nextSteps[nextIdx] = temp;
    
    // Fix step numbers after swap
    const reindexedSteps = nextSteps.map((step, i) => ({
      ...step,
      stepNumber: i + 1
    }));

    setFormData(prev => ({ ...prev, processSteps: reindexedSteps }));
  };

  // List Managers: Fee Structure Rows
  const addFeeRow = () => {
    if (formData.feeStructure.length >= 8) {
      toast.error("Maximum 8 fee tiers allowed");
      return;
    }
    setFormData(prev => ({
      ...prev,
      feeStructure: [...prev.feeStructure, { applicantType: "", embassyFee: "", serviceFee: "" }]
    }));
  };

  const updateFeeField = (idx, field, value) => {
    const nextFees = formData.feeStructure.map((fee, i) => {
      if (i === idx) {
        return { ...fee, [field]: value };
      }
      return fee;
    });
    setFormData(prev => ({ ...prev, feeStructure: nextFees }));
  };

  const removeFeeRow = (idx) => {
    setFormData(prev => ({
      ...prev,
      feeStructure: prev.feeStructure.filter((_, i) => i !== idx)
    }));
  };

  const moveFeeRow = (idx, direction) => {
    const nextIdx = idx + direction;
    if (nextIdx < 0 || nextIdx >= formData.feeStructure.length) return;
    
    const nextFees = [...formData.feeStructure];
    const temp = nextFees[idx];
    nextFees[idx] = nextFees[nextIdx];
    nextFees[nextIdx] = temp;
    setFormData(prev => ({ ...prev, feeStructure: nextFees }));
  };

  // List Managers: FAQs
  const addFAQ = () => {
    if (formData.faqs.length >= 12) {
      toast.error("Maximum 12 FAQs allowed");
      return;
    }
    setFormData(prev => ({
      ...prev,
      faqs: [...prev.faqs, { question: "", answer: "" }]
    }));
  };

  const updateFAQField = (idx, field, value) => {
    const nextFAQs = formData.faqs.map((faq, i) => {
      if (i === idx) {
        return { ...faq, [field]: value };
      }
      return faq;
    });
    setFormData(prev => ({ ...prev, faqs: nextFAQs }));
  };

  const removeFAQ = (idx) => {
    setFormData(prev => ({
      ...prev,
      faqs: prev.faqs.filter((_, i) => i !== idx)
    }));
  };

  const moveFAQ = (idx, direction) => {
    const nextIdx = idx + direction;
    if (nextIdx < 0 || nextIdx >= formData.faqs.length) return;
    
    const nextFAQs = [...formData.faqs];
    const temp = nextFAQs[idx];
    nextFAQs[idx] = nextFAQs[nextIdx];
    nextFAQs[nextIdx] = temp;
    setFormData(prev => ({ ...prev, faqs: nextFAQs }));
  };

  // Stats updates
  const updateStatField = (idx, field, value) => {
    const nextStats = formData.heroStats.map((stat, i) => {
      if (i === idx) {
        return { ...stat, [field]: value };
      }
      return stat;
    });
    setFormData(prev => ({ ...prev, heroStats: nextStats }));
  };

  // Helper to update text properties of a package
  const updatePackageField = (pkgKey, field, value) => {
    setFormData(prev => ({
      ...prev,
      supportPackages: {
        ...prev.supportPackages,
        [pkgKey]: {
          ...prev.supportPackages[pkgKey],
          [field]: value
        }
      }
    }));
  };

  // Helper to add a feature to a package
  const addPackageFeature = (pkgKey) => {
    const defaultFeature = pkgKey === "premium" 
      ? { text: "", included: true, highlighted: false } 
      : { text: "", included: true };

    setFormData(prev => {
      const currentFeatures = prev.supportPackages[pkgKey].features || [];
      return {
        ...prev,
        supportPackages: {
          ...prev.supportPackages,
          [pkgKey]: {
            ...prev.supportPackages[pkgKey],
            features: [...currentFeatures, defaultFeature]
          }
        }
      };
    });
  };

  // Helper to update a feature field inside a package
  const updatePackageFeatureField = (pkgKey, idx, field, value) => {
    setFormData(prev => {
      const nextFeatures = prev.supportPackages[pkgKey].features.map((feat, i) => {
        if (i === idx) {
          return { ...feat, [field]: value };
        }
        return feat;
      });
      return {
        ...prev,
        supportPackages: {
          ...prev.supportPackages,
          [pkgKey]: {
            ...prev.supportPackages[pkgKey],
            features: nextFeatures
          }
        }
      };
    });
  };

  // Helper to remove a feature from a package
  const removePackageFeature = (pkgKey, idx) => {
    setFormData(prev => {
      const nextFeatures = prev.supportPackages[pkgKey].features.filter((_, i) => i !== idx);
      return {
        ...prev,
        supportPackages: {
          ...prev.supportPackages,
          [pkgKey]: {
            ...prev.supportPackages[pkgKey],
            features: nextFeatures
          }
        }
      };
    });
  };

  // Form Save Action
  const handleSave = async (e) => {
    e.preventDefault();

    // Validations
    if (!formData.name.trim()) {
      toast.error("Visa page name is required");
      return;
    }
    if (!formData.slug.trim()) {
      toast.error("URL Slug is required");
      return;
    }
    if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      toast.error("Slug must contain only lowercase letters, numbers, and dashes");
      return;
    }
    if (!formData.tagline.trim()) {
      toast.error("Hero tagline is required");
      return;
    }
    if (!formData.overviewText.trim()) {
      toast.error("Overview paragraph text is required");
      return;
    }
    
    setSaving(true);

    try {
      // Check duplicate slug on create
      if (!isEditMode) {
        const exist = await getVisaTypeBySlug(formData.slug);
        if (exist) {
          toast.error("Slug already exists! Please use a unique URL path.");
          setSaving(false);
          return;
        }
      }

      await saveVisaType(formData.slug, {
        ...formData,
        sortOrder: Number(formData.sortOrder) || 1
      });

      toast.success(isEditMode ? "Visa details saved" : "New visa page published");
      navigate("/admin/visa-types");
    } catch (err) {
      toast.error("Save operation failed");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Length limits for SEO warning triggers
  const metaTitleExceeded = formData.metaTitle?.length > 60;
  const metaDescExceeded = formData.metaDescription?.length > 160;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-primary-container border border-on-primary-fixed-variant rounded-badge"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-48 bg-primary-container border border-on-primary-fixed-variant rounded-card"></div>
            <div className="h-64 bg-primary-container border border-on-primary-fixed-variant rounded-card"></div>
          </div>
          <div className="space-y-6">
            <div className="h-64 bg-primary-container border border-on-primary-fixed-variant rounded-card"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Back breadcrumb */}
      <div className="flex items-center space-x-2">
        <Link 
          to="/admin/visa-types" 
          className="flex items-center text-xs font-bold uppercase tracking-wider text-on-primary-container/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          <span>Back to Pages</span>
        </Link>
      </div>

      <form onSubmit={handleSave} className="flex flex-col lg:flex-row gap-6 relative items-start">
        {/* LEFT COLUMN: Editing Sections (70%) */}
        <div className="w-full lg:flex-1 space-y-6">
          
          {/* Card 1: Basic Info */}
          <div className="bg-primary-container/40 border border-on-primary-fixed-variant rounded-card p-6 border-l-4 border-l-secondary space-y-4">
            <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-1.5">
              <Sparkles className="h-4.5 w-4.5 text-secondary" />
              <span>Basic Information</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-on-primary-container/60 mb-1.5">
                  Visa Page Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleNameChange}
                  className="w-full px-3 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container rounded focus:border-secondary focus:outline-none text-xs transition-colors"
                  placeholder="e.g. Schengen Europe Visa"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-on-primary-container/60 mb-1.5">
                  URL Slug {isEditMode && "(Locked)"}
                </label>
                <input
                  type="text"
                  required
                  disabled={isEditMode}
                  value={formData.slug}
                  onChange={handleSlugChange}
                  className={`w-full px-3 py-2 border text-on-primary-container rounded focus:outline-none text-xs transition-colors font-mono ${
                    isEditMode 
                      ? "bg-primary-container/20 border-on-primary-fixed-variant/40 text-on-primary-container/40 cursor-not-allowed" 
                      : "bg-primary-container border-on-primary-fixed-variant focus:border-secondary"
                  }`}
                  placeholder="e.g. schengen"
                />
                {!isEditMode && (
                  <span className="text-[9px] text-on-primary-container/40 mt-1 block">
                    URL path will be: /visa/{formData.slug || "slug-preview"}
                  </span>
                )}
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-primary-container/60 mb-1.5">
                Hero Tagline
              </label>
              <input
                type="text"
                required
                value={formData.tagline}
                onChange={(e) => setFormData(prev => ({ ...prev, tagline: e.target.value }))}
                className="w-full px-3 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container rounded focus:border-secondary focus:outline-none text-xs transition-colors"
                placeholder="e.g. Travel freely across 27 European member states with expert support"
              />
            </div>
          </div>

          {/* Card: Cover Image Banner */}
          <div className="bg-primary-container/40 border border-on-primary-fixed-variant rounded-card p-6 border-l-4 border-l-secondary space-y-4">
            <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-1.5">
              <Upload className="h-4.5 w-4.5 text-secondary" />
              <span>Cover Banner Image</span>
            </h2>
            <p className="text-[10px] text-on-primary-container/50">
              Provide an external cover picture link or upload a local image to showcase on the services portal and detail header.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div className="md:col-span-2 space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-on-primary-container/60 mb-1.5">
                    Image Banner URL
                  </label>
                  <input
                    type="text"
                    value={formData.imageUrl || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                    className="w-full px-3 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container rounded focus:border-secondary focus:outline-none text-xs transition-colors"
                    placeholder="e.g. https://images.unsplash.com/photo-..."
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <label className="px-4 py-2 border border-[#4D4740] text-white hover:border-[#7A8F6B] hover:text-[#7A8F6B] rounded text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors flex items-center space-x-1.5">
                    {uploading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-3.5 w-3.5" />
                        <span>Upload File</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                  {formData.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, imageUrl: "" }))}
                      className="px-3 py-2 text-xs font-bold text-[#F5F1E8]/45 hover:text-error-red transition-colors"
                    >
                      Clear Image
                    </button>
                  )}
                </div>
              </div>
              <div className="flex justify-center md:justify-end">
                {formData.imageUrl ? (
                  <div className="h-24 w-36 rounded overflow-hidden border border-on-primary-fixed-variant/60 bg-black/30 relative group shadow">
                    <img 
                      src={formData.imageUrl} 
                      alt="Banner Preview" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="h-24 w-36 rounded border border-dashed border-on-primary-fixed-variant/60 bg-primary-container/10 flex flex-col items-center justify-center text-on-primary-container/30 text-center p-2">
                    <Eye className="h-6 w-6 mb-1 text-on-primary-container/30" />
                    <span className="text-[9px] uppercase tracking-wider text-on-primary-container/30">No Image Selected</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Hero Stats Grid */}
          <div className="bg-primary-container/40 border border-on-primary-fixed-variant rounded-card p-6 border-l-4 border-l-secondary space-y-4">
            <h2 className="text-base font-bold text-white tracking-wide">Hero Highlights Stats (Max 4)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData.heroStats.slice(0, 4).map((stat, idx) => (
                <div key={idx} className="bg-primary-container/20 p-3 rounded border border-on-primary-fixed-variant/60 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">Stat Slot #{idx + 1}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[8px] font-bold uppercase text-on-primary-container/40 mb-1">Label</label>
                      <input
                        type="text"
                        value={stat.label}
                        onChange={(e) => updateStatField(idx, "label", e.target.value)}
                        className="w-full px-2 py-1 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container rounded text-[11px] focus:border-secondary focus:outline-none"
                        placeholder="e.g. Processing Time"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold uppercase text-on-primary-container/40 mb-1">Value</label>
                      <input
                        type="text"
                        value={stat.value}
                        onChange={(e) => updateStatField(idx, "value", e.target.value)}
                        className="w-full px-2 py-1 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container rounded text-[11px] focus:border-secondary focus:outline-none"
                        placeholder="e.g. 5-10 Days"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[8px] font-bold uppercase text-on-primary-container/40 mb-1">Icon Indicator</label>
                    <div className="flex items-center space-x-2">
                      <select
                        value={stat.icon}
                        onChange={(e) => updateStatField(idx, "icon", e.target.value)}
                        className="flex-1 px-2 py-1 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container rounded text-[11px] focus:border-secondary focus:outline-none"
                      >
                        {Object.keys(STAT_ICONS).map((iconKey) => (
                          <option key={iconKey} value={iconKey}>{iconKey}</option>
                        ))}
                      </select>
                      <div className="h-7 w-7 rounded bg-primary-container border border-on-primary-fixed-variant flex items-center justify-center text-secondary">
                        {React.createElement(STAT_ICONS[stat.icon] || HelpCircle, { className: "h-4 w-4" })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Overview Paragraph */}
          <div className="bg-primary-container/40 border border-on-primary-fixed-variant rounded-card p-6 border-l-4 border-l-secondary space-y-4">
            <h2 className="text-base font-bold text-white tracking-wide">Detailed Overview Text</h2>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-primary-container/60 mb-1.5">
                Overview Narrative (Plain Text)
              </label>
              <textarea
                required
                rows={5}
                value={formData.overviewText}
                onChange={(e) => setFormData(prev => ({ ...prev, overviewText: e.target.value }))}
                className="w-full px-3 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container rounded focus:border-secondary focus:outline-none text-xs transition-colors"
                placeholder="Write a compelling overview describing the eligibility, jurisdiction details, and what value Eshaare Tours delivers to the client..."
              />
            </div>
          </div>

          {/* Card 4: Required Documents list */}
          <div className="bg-primary-container/40 border border-on-primary-fixed-variant rounded-card p-6 border-l-4 border-l-secondary space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-white tracking-wide">Required Documents</h2>
                <p className="text-[10px] text-on-primary-container/50">List of physical or soft copy papers the client must gather (Max 15)</p>
              </div>
              <button
                type="button"
                onClick={addDocument}
                disabled={formData.requiredDocuments.length >= 15}
                className="px-2.5 py-1.5 bg-white/5 border border-on-primary-fixed-variant hover:border-secondary hover:text-secondary text-xs rounded transition-colors flex items-center space-x-1"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Doc</span>
              </button>
            </div>
            
            {formData.requiredDocuments.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-on-primary-fixed-variant/40 rounded text-xs text-on-primary-container/40">
                No documents listed yet. Click "Add Doc" above.
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {formData.requiredDocuments.map((doc, idx) => (
                  <div key={idx} className="flex items-center space-x-2 bg-primary-container/20 p-2 rounded border border-on-primary-fixed-variant/40">
                    <span className="text-[10px] font-mono text-on-primary-container/40 w-5 text-right">{idx + 1}.</span>
                    <input
                      type="text"
                      required
                      value={doc}
                      onChange={(e) => updateDocumentText(idx, e.target.value)}
                      className="flex-1 bg-primary-container border border-on-primary-fixed-variant px-2 py-1 text-xs text-white rounded focus:border-secondary focus:outline-none"
                      placeholder="e.g. Passport valid for 6 months"
                    />
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => moveDocument(idx, -1)}
                        disabled={idx === 0}
                        className="p-1 text-on-primary-container/50 hover:text-white disabled:opacity-30 disabled:hover:text-on-primary-container/50"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveDocument(idx, 1)}
                        disabled={idx === formData.requiredDocuments.length - 1}
                        className="p-1 text-on-primary-container/50 hover:text-white disabled:opacity-30 disabled:hover:text-on-primary-container/50"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeDocument(idx)}
                        className="p-1 text-on-primary-container/40 hover:text-error-red"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card 5: Step-by-Step Timeline */}
          <div className="bg-primary-container/40 border border-on-primary-fixed-variant rounded-card p-6 border-l-4 border-l-secondary space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-white tracking-wide">How It Works: Step Timeline</h2>
                <p className="text-[10px] text-on-primary-container/50">Sequential steps of the visa filing process (Max 6)</p>
              </div>
              <button
                type="button"
                onClick={addStep}
                disabled={formData.processSteps.length >= 6}
                className="px-2.5 py-1.5 bg-white/5 border border-on-primary-fixed-variant hover:border-secondary hover:text-secondary text-xs rounded transition-colors flex items-center space-x-1"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Step</span>
              </button>
            </div>

            {formData.processSteps.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-on-primary-fixed-variant/40 rounded text-xs text-on-primary-container/40">
                No steps added yet. Click "Add Step".
              </div>
            ) : (
              <div className="space-y-3">
                {formData.processSteps.map((step, idx) => (
                  <div key={idx} className="bg-primary-container/20 p-3 rounded border border-on-primary-fixed-variant/60 space-y-2">
                    <div className="flex justify-between items-center border-b border-on-primary-fixed-variant/40 pb-2">
                      <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">Step {step.stepNumber}</span>
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => moveStep(idx, -1)}
                          disabled={idx === 0}
                          className="p-1 text-on-primary-container/50 hover:text-white disabled:opacity-30"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveStep(idx, 1)}
                          disabled={idx === formData.processSteps.length - 1}
                          className="p-1 text-on-primary-container/50 hover:text-white disabled:opacity-30"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeStep(idx)}
                          className="p-1 text-on-primary-container/40 hover:text-error-red"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <input
                          type="text"
                          required
                          value={step.title}
                          onChange={(e) => updateStepField(idx, "title", e.target.value)}
                          className="w-full bg-primary-container border border-on-primary-fixed-variant px-2.5 py-1 text-xs text-white rounded focus:border-secondary focus:outline-none"
                          placeholder="Step title (e.g. Submit details & audit check)"
                        />
                      </div>
                      <div>
                        <textarea
                          required
                          rows={2}
                          value={step.description}
                          onChange={(e) => updateStepField(idx, "description", e.target.value)}
                          className="w-full bg-primary-container border border-on-primary-fixed-variant px-2.5 py-1.5 text-xs text-on-primary-container rounded focus:border-secondary focus:outline-none"
                          placeholder="Explain what occurs in this step..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card 6: Fee Structure */}
          <div className="bg-primary-container/40 border border-on-primary-fixed-variant rounded-card p-6 border-l-4 border-l-secondary space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-white tracking-wide">Pricing & Fee Tiers</h2>
                <p className="text-[10px] text-on-primary-container/50">List of applicant categories and respective pricing (Max 8)</p>
              </div>
              <button
                type="button"
                onClick={addFeeRow}
                disabled={formData.feeStructure.length >= 8}
                className="px-2.5 py-1.5 bg-white/5 border border-on-primary-fixed-variant hover:border-secondary hover:text-secondary text-xs rounded transition-colors flex items-center space-x-1"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Fee Tier</span>
              </button>
            </div>

            {formData.feeStructure.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-on-primary-fixed-variant/40 rounded text-xs text-on-primary-container/40">
                No fee tiers added. Click "Add Fee Tier".
              </div>
            ) : (
              <div className="space-y-2">
                {formData.feeStructure.map((fee, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-primary-container/20 p-2.5 rounded border border-on-primary-fixed-variant/40">
                    <input
                      type="text"
                      required
                      value={fee.applicantType}
                      onChange={(e) => updateFeeField(idx, "applicantType", e.target.value)}
                      className="flex-1 min-w-0 bg-primary-container border border-on-primary-fixed-variant px-2 py-1 text-xs text-white rounded focus:border-secondary focus:outline-none"
                      placeholder="e.g. Adult (12+ years)"
                    />
                    <input
                      type="text"
                      required
                      value={fee.embassyFee}
                      onChange={(e) => updateFeeField(idx, "embassyFee", e.target.value)}
                      className="w-full sm:w-36 bg-primary-container border border-on-primary-fixed-variant px-2 py-1 text-xs text-white rounded focus:border-secondary focus:outline-none"
                      placeholder="Embassy Fee (e.g. 320 AED)"
                    />
                    <input
                      type="text"
                      required
                      value={fee.serviceFee}
                      onChange={(e) => updateFeeField(idx, "serviceFee", e.target.value)}
                      className="w-full sm:w-32 bg-primary-container border border-on-primary-fixed-variant px-2 py-1 text-xs text-white rounded focus:border-secondary focus:outline-none"
                      placeholder="Service Fee (e.g. 280 AED)"
                    />
                    <div className="flex items-center justify-end space-x-1 mt-2 sm:mt-0">
                      <button
                        type="button"
                        onClick={() => moveFeeRow(idx, -1)}
                        disabled={idx === 0}
                        className="p-1 text-on-primary-container/50 hover:text-white disabled:opacity-30"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveFeeRow(idx, 1)}
                        disabled={idx === formData.feeStructure.length - 1}
                        className="p-1 text-on-primary-container/50 hover:text-white disabled:opacity-30"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFeeRow(idx)}
                        className="p-1 text-on-primary-container/40 hover:text-error-red"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card 7: FAQs */}
          <div className="bg-primary-container/40 border border-on-primary-fixed-variant rounded-card p-6 border-l-4 border-l-secondary space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-white tracking-wide">Frequently Asked Questions</h2>
                <p className="text-[10px] text-on-primary-container/50">Questions & detailed answers (Max 12)</p>
              </div>
              <button
                type="button"
                onClick={addFAQ}
                disabled={formData.faqs.length >= 12}
                className="px-2.5 py-1.5 bg-white/5 border border-on-primary-fixed-variant hover:border-secondary hover:text-secondary text-xs rounded transition-colors flex items-center space-x-1"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add FAQ</span>
              </button>
            </div>

            {formData.faqs.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-on-primary-fixed-variant/40 rounded text-xs text-on-primary-container/40">
                No FAQs added. Click "Add FAQ".
              </div>
            ) : (
              <div className="space-y-3">
                {formData.faqs.map((faq, idx) => (
                  <div key={idx} className="bg-primary-container/20 p-3 rounded border border-on-primary-fixed-variant/60 space-y-2">
                    <div className="flex justify-between items-center border-b border-on-primary-fixed-variant/40 pb-2">
                      <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">FAQ #{idx + 1}</span>
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => moveFAQ(idx, -1)}
                          disabled={idx === 0}
                          className="p-1 text-on-primary-container/50 hover:text-white disabled:opacity-30"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveFAQ(idx, 1)}
                          disabled={idx === formData.faqs.length - 1}
                          className="p-1 text-on-primary-container/50 hover:text-white disabled:opacity-30"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFAQ(idx)}
                          className="p-1 text-on-primary-container/40 hover:text-error-red"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <input
                          type="text"
                          required
                          value={faq.question}
                          onChange={(e) => updateFAQField(idx, "question", e.target.value)}
                          className="w-full bg-primary-container border border-on-primary-fixed-variant px-2.5 py-1 text-xs text-white rounded focus:border-secondary focus:outline-none"
                          placeholder="Question (e.g. Can you guarantee visa approval?)"
                        />
                      </div>
                      <div>
                        <textarea
                          required
                          rows={2}
                          value={faq.answer}
                          onChange={(e) => updateFAQField(idx, "answer", e.target.value)}
                          className="w-full bg-primary-container border border-on-primary-fixed-variant px-2.5 py-1.5 text-xs text-on-primary-container rounded focus:border-secondary focus:outline-none"
                          placeholder="Detailed answer text..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card: Support Packages Configuration */}
          <div className="bg-primary-container/40 border border-on-primary-fixed-variant rounded-card p-6 border-l-4 border-l-secondary space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-white tracking-wide">Support Level Packages</h2>
                <p className="text-[10px] text-on-primary-container/50">Configure Standard & Premium support package offerings on the details page</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, showSupportPackages: !prev.showSupportPackages }))}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                    formData.showSupportPackages ? "bg-success-green" : "bg-on-primary-fixed-variant"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 ${
                      formData.showSupportPackages ? "translate-x-4.5" : "translate-x-1"
                    }`}
                  />
                </button>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${formData.showSupportPackages ? "text-success-green" : "text-on-primary-container/40"}`}>
                  {formData.showSupportPackages ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>

            {formData.showSupportPackages && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-on-primary-fixed-variant/40">
                {/* Standard Package */}
                <div className="bg-primary-container/20 p-4 rounded-xl border border-on-primary-fixed-variant/60 space-y-4">
                  <h3 className="text-xs font-bold text-secondary uppercase tracking-widest border-b border-on-primary-fixed-variant/40 pb-2">
                    Standard Package
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-on-primary-container/60 mb-1">Package Title</label>
                      <input
                        type="text"
                        required
                        value={formData.supportPackages.standard.title}
                        onChange={(e) => updatePackageField("standard", "title", e.target.value)}
                        className="w-full bg-primary-container border border-on-primary-fixed-variant px-2.5 py-1 text-xs text-white rounded focus:border-secondary focus:outline-none"
                        placeholder="e.g. Standard Support"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-on-primary-container/60 mb-1">Subtitle / description</label>
                      <input
                        type="text"
                        required
                        value={formData.supportPackages.standard.subtitle}
                        onChange={(e) => updatePackageField("standard", "subtitle", e.target.value)}
                        className="w-full bg-primary-container border border-on-primary-fixed-variant px-2.5 py-1 text-xs text-white rounded focus:border-secondary focus:outline-none"
                        placeholder="e.g. Ideal for travelers who already have an appointment slot."
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-on-primary-container/60 mb-1">Price (AED)</label>
                      <input
                        type="text"
                        required
                        value={formData.supportPackages.standard.price}
                        onChange={(e) => updatePackageField("standard", "price", e.target.value)}
                        className="w-full bg-primary-container border border-on-primary-fixed-variant px-2.5 py-1 text-xs text-white rounded focus:border-secondary focus:outline-none font-mono"
                        placeholder="e.g. 299"
                      />
                    </div>
                    
                    {/* Standard Features Checklist */}
                    <div className="space-y-2 pt-2 border-t border-on-primary-fixed-variant/40">
                      <div className="flex justify-between items-center">
                        <label className="text-[9px] font-bold uppercase text-[#F5F1E8]/50">Features Checklist</label>
                        <button
                          type="button"
                          onClick={() => addPackageFeature("standard")}
                          className="px-2 py-0.5 border border-on-primary-fixed-variant text-[9px] font-semibold text-secondary hover:text-white rounded transition-colors"
                        >
                          + Add Item
                        </button>
                      </div>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {formData.supportPackages.standard.features.map((feat, idx) => (
                          <div key={idx} className="flex items-center space-x-2 bg-primary-container/40 p-1.5 rounded border border-on-primary-fixed-variant/40">
                            <input
                              type="checkbox"
                              checked={feat.included}
                              onChange={(e) => updatePackageFeatureField("standard", idx, "included", e.target.checked)}
                              className="rounded border-[#4D4740] text-secondary focus:ring-secondary/50 bg-[#2B2723] h-3.5 w-3.5"
                              title="Is Included"
                            />
                            <input
                              type="text"
                              required
                              value={feat.text}
                              onChange={(e) => updatePackageFeatureField("standard", idx, "text", e.target.value)}
                              className="flex-1 bg-transparent border-none p-0 text-[11px] text-white focus:ring-0 focus:outline-none"
                              placeholder="Feature text..."
                            />
                            <button
                              type="button"
                              onClick={() => removePackageFeature("standard", idx)}
                              className="text-on-primary-container/40 hover:text-error-red p-0.5"
                              title="Delete Feature"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Premium Package */}
                <div className="bg-primary-container/20 p-4 rounded-xl border border-on-primary-fixed-variant/60 space-y-4 relative">
                  <h3 className="text-xs font-bold text-secondary uppercase tracking-widest border-b border-on-primary-fixed-variant/40 pb-2 flex justify-between items-center">
                    <span>Premium Package</span>
                    
                    {/* Recommended / Most Popular toggle */}
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[8px] font-bold text-on-primary-container/60 uppercase">Recommended:</span>
                      <button
                        type="button"
                        onClick={() => updatePackageField("premium", "recommended", !formData.supportPackages.premium.recommended)}
                        className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                          formData.supportPackages.premium.recommended ? "bg-amber-500" : "bg-on-primary-fixed-variant"
                        }`}
                      >
                        <span
                          className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform duration-200 ${
                            formData.supportPackages.premium.recommended ? "translate-x-3" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </div>
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-on-primary-container/60 mb-1">Package Title</label>
                      <input
                        type="text"
                        required
                        value={formData.supportPackages.premium.title}
                        onChange={(e) => updatePackageField("premium", "title", e.target.value)}
                        className="w-full bg-primary-container border border-on-primary-fixed-variant px-2.5 py-1 text-xs text-white rounded focus:border-secondary focus:outline-none"
                        placeholder="e.g. Premium Support"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-on-primary-container/60 mb-1">Subtitle / description</label>
                      <input
                        type="text"
                        required
                        value={formData.supportPackages.premium.subtitle}
                        onChange={(e) => updatePackageField("premium", "subtitle", e.target.value)}
                        className="w-full bg-primary-container border border-on-primary-fixed-variant px-2.5 py-1 text-xs text-white rounded focus:border-secondary focus:outline-none"
                        placeholder="e.g. Comprehensive end-to-end management."
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-on-primary-container/60 mb-1">Price (AED)</label>
                      <input
                        type="text"
                        required
                        value={formData.supportPackages.premium.price}
                        onChange={(e) => updatePackageField("premium", "price", e.target.value)}
                        className="w-full bg-primary-container border border-on-primary-fixed-variant px-2.5 py-1 text-xs text-white rounded focus:border-secondary focus:outline-none font-mono"
                        placeholder="e.g. 549"
                      />
                    </div>
                    
                    {/* Premium Features Checklist */}
                    <div className="space-y-2 pt-2 border-t border-on-primary-fixed-variant/40">
                      <div className="flex justify-between items-center">
                        <label className="text-[9px] font-bold uppercase text-[#F5F1E8]/50">Features Checklist</label>
                        <button
                          type="button"
                          onClick={() => addPackageFeature("premium")}
                          className="px-2 py-0.5 border border-on-primary-fixed-variant text-[9px] font-semibold text-secondary hover:text-white rounded transition-colors"
                        >
                          + Add Item
                        </button>
                      </div>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {formData.supportPackages.premium.features.map((feat, idx) => (
                          <div key={idx} className="flex items-center space-x-2 bg-primary-container/40 p-1.5 rounded border border-on-primary-fixed-variant/40">
                            <input
                              type="checkbox"
                              checked={feat.included}
                              onChange={(e) => updatePackageFeatureField("premium", idx, "included", e.target.checked)}
                              className="rounded border-[#4D4740] text-secondary focus:ring-secondary/50 bg-[#2B2723] h-3.5 w-3.5"
                              title="Is Included"
                            />
                            <input
                              type="text"
                              required
                              value={feat.text}
                              onChange={(e) => updatePackageFeatureField("premium", idx, "text", e.target.value)}
                              className="flex-1 bg-transparent border-none p-0 text-[11px] text-white focus:ring-0 focus:outline-none"
                              placeholder="Feature text..."
                            />
                            {/* Highlighted checkbox (Gold Star icon toggle) */}
                            <button
                              type="button"
                              onClick={() => updatePackageFeatureField("premium", idx, "highlighted", !feat.highlighted)}
                              className={`p-0.5 rounded text-[10px] ${feat.highlighted ? "text-amber-500 hover:text-amber-600" : "text-on-primary-container/30 hover:text-[#F5F1E8]/70"}`}
                              title={feat.highlighted ? "Highlighted (Gold Star Active)" : "Click to highlight gold star"}
                            >
                              ★
                            </button>
                            <button
                              type="button"
                              onClick={() => removePackageFeature("premium", idx)}
                              className="text-on-primary-container/40 hover:text-error-red p-0.5"
                              title="Delete Feature"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Card 8: SEO Settings */}
          <div className="bg-primary-container/40 border border-on-primary-fixed-variant rounded-card p-6 border-l-4 border-l-secondary space-y-4">
            <h2 className="text-base font-bold text-white tracking-wide">SEO Metadata & Google Preview</h2>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-on-primary-container/60">
                    Meta Title
                  </label>
                  <span className={`text-[9px] font-mono font-bold ${metaTitleExceeded ? "text-error-red animate-pulse" : "text-on-primary-container/40"}`}>
                    {formData.metaTitle?.length || 0} / 60 chars
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={formData.metaTitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, metaTitle: e.target.value }))}
                  className={`w-full px-3 py-2 bg-primary-container border text-on-primary-container rounded focus:outline-none text-xs transition-colors ${
                    metaTitleExceeded ? "border-error-red" : "border-on-primary-fixed-variant focus:border-secondary"
                  }`}
                  placeholder="e.g. Schengen Europe Visa Dubai | Eshaare Tours"
                />
                {metaTitleExceeded && (
                  <span className="text-[9px] text-error-red mt-1 block font-semibold">
                    Warning: Title exceeds recommended Google length limits. Keep it under 60 characters for best display.
                  </span>
                )}
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-on-primary-container/60">
                    Meta Description
                  </label>
                  <span className={`text-[9px] font-mono font-bold ${metaDescExceeded ? "text-error-red animate-pulse" : "text-on-primary-container/40"}`}>
                    {formData.metaDescription?.length || 0} / 160 chars
                  </span>
                </div>
                <textarea
                  required
                  rows={3}
                  value={formData.metaDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, metaDescription: e.target.value }))}
                  className={`w-full px-3 py-2 bg-primary-container border text-on-primary-container rounded focus:outline-none text-xs transition-colors ${
                    metaDescExceeded ? "border-error-red" : "border-on-primary-fixed-variant focus:border-secondary"
                  }`}
                  placeholder="e.g. Apply for Schengen Europe Visa in Dubai with audit checks and fast VFS booking..."
                />
                {metaDescExceeded && (
                  <span className="text-[9px] text-error-red mt-1 block font-semibold">
                    Warning: Description exceeds recommended Google length limits. Keep it under 160 characters for best display.
                  </span>
                )}
              </div>
            </div>

            {/* Google Mockup Box */}
            <div className="bg-primary-container/60 border border-on-primary-fixed-variant/80 rounded p-4 font-sans text-left space-y-1 mt-4">
              <span className="text-[10px] text-on-primary-container/40 uppercase tracking-wider block font-bold mb-1">Google Search Mockup</span>
              <div className="text-[11px] text-[#8ab4f8] hover:underline cursor-pointer truncate font-medium">
                {formData.metaTitle || formData.name || "Schengen Europe Visa Dubai | Eshaare Tours"}
              </div>
              <div className="text-[10px] text-[#30a14e] truncate">
                https://eshaare-tour.vercel.app/visa/{formData.slug || "schengen"}
              </div>
              <div className="text-[11px] text-on-primary-container/70 leading-relaxed line-clamp-2">
                {formData.metaDescription || formData.tagline || formData.overviewText || "Apply for Schengen visa in Dubai with expert support. VFS slot booking, document audit, and 98% success rate. Contact Eshaare Tours today."}
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Sticky settings & save actions (30%) */}
        {/* Responsive: order-first on mobile so controls move to top */}
        <div className="w-full lg:w-80 space-y-6 lg:sticky lg:top-4 order-first lg:order-last">
          
          <div className="bg-primary-container/40 border border-on-primary-fixed-variant rounded-card p-6 border-l-4 border-l-secondary-container space-y-6">
            <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-1.5">
              <span>Publish Actions</span>
            </h2>

            {/* Publish toggle */}
            <div className="flex items-center justify-between border-b border-on-primary-fixed-variant/40 pb-4">
              <div>
                <span className="text-xs font-bold text-white block">Status</span>
                <span className="text-[10px] text-on-primary-container/50">Draft pages are hidden on the public site</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, isPublished: !prev.isPublished }))}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                    formData.isPublished ? "bg-success-green" : "bg-on-primary-fixed-variant"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 ${
                      formData.isPublished ? "translate-x-4.5" : "translate-x-1"
                    }`}
                  />
                </button>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${formData.isPublished ? "text-success-green" : "text-on-primary-container/40"}`}>
                  {formData.isPublished ? "Live" : "Draft"}
                </span>
              </div>
            </div>

            {/* Display Order index */}
            <div className="space-y-1.5 border-b border-on-primary-fixed-variant/40 pb-4">
              <label className="text-xs font-bold text-white block">Display Sorting Index</label>
              <input
                type="number"
                min={1}
                required
                value={formData.sortOrder}
                onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: e.target.value }))}
                className="w-full px-3 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container rounded focus:border-secondary focus:outline-none text-xs"
                placeholder="e.g. 1"
              />
              <span className="text-[9px] text-on-primary-container/40 block">Lower numbers display first (e.g. 1 shows before 2).</span>
            </div>

            {/* Save Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 bg-gradient-to-r from-secondary-container to-secondary-container hover:shadow-[0_0_15px_rgba(201,168,76,0.35)] text-on-primary-fixed font-bold text-xs rounded-button flex items-center justify-center space-x-1.5 shadow-sm transition-all"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-on-primary-fixed" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save CMS Page</span>
                  </>
                )}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => navigate("/admin/visa-types")}
                className="w-full py-2.5 bg-white/5 border border-on-primary-fixed-variant text-on-primary-container hover:text-white hover:bg-white/10 text-xs font-bold rounded-button transition-colors text-center"
              >
                Discard Changes
              </button>
            </div>

            {isEditMode && formData.isPublished && (
              <div className="pt-2 border-t border-on-primary-fixed-variant/40 text-center">
                <a
                  href={`/visa/${formData.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-[10px] font-bold text-secondary uppercase hover:text-white tracking-wider gap-1 transition-colors"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Preview Published Page</span>
                </a>
              </div>
            )}

          </div>

        </div>

      </form>
    </div>
  );
};

export default VisaTypeEditorPage;
