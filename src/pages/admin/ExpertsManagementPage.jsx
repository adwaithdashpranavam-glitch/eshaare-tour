import React, { useState, useEffect } from "react";
import { getExperts, saveExpert, deleteExpert } from "../../lib/firestore";
import { storage } from "../../lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { 
  UserPlus, Shield, Mail, Trash2, Edit, Upload, Loader2, 
  Phone, Award, Hash, Sparkles
} from "lucide-react";
import Modal from "../../components/ui/Modal";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";

export const ExpertsManagementPage = () => {
  const { userProfile } = useAuth();
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // UID of expert undergoing toggle/delete
  
  // Form State
  const initialFormState = {
    name: "",
    email: "",
    phone: "",
    designation: "",
    department: "Visa Expert",
    intro: "",
    experienceYears: 5,
    successRate: 98,
    visasFiled: 100,
    img: "",
    tagsInput: "",
    displayOrder: 1,
    status: "active"
  };

  const [expertForm, setExpertForm] = useState(initialFormState);
  const [uploadingPic, setUploadingPic] = useState(false);

  const isAuthorized = userProfile?.role === "super_admin";

  useEffect(() => {
    if (!isAuthorized) return;

    const unsubscribe = getExperts(
      (items) => {
        setExperts(items);
        setLoading(false);
      },
      (error) => {
        console.error("Error loading experts:", error);
        toast.error("Failed to load experts.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isAuthorized]);

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4 font-sans">
        <Shield className="h-16 w-16 text-danger animate-pulse" />
        <h1 className="text-xl font-bold text-white uppercase tracking-wide">Access Denied</h1>
        <p className="text-xs text-on-primary-container/60 max-w-md leading-relaxed">
          You do not have the required permissions to access Experts Management. Only Super Admins can manage experts.
        </p>
      </div>
    );
  }

  // Handle Pic Upload to Firebase Storage
  const handlePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Profile picture size must be less than 5MB");
      return;
    }

    setUploadingPic(true);
    const storageRef = ref(storage, `expert_pics/${Date.now()}_${file.name}`);
    try {
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      setExpertForm(prev => ({ ...prev, img: downloadURL }));
      toast.success("Profile picture uploaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload image: " + err.message);
    } finally {
      setUploadingPic(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const tagsArray = expertForm.tagsInput
        ? expertForm.tagsInput.split(",").map(t => t.trim()).filter(Boolean)
        : [];

      const payload = {
        name: expertForm.name,
        email: expertForm.email,
        phone: expertForm.phone || "",
        designation: expertForm.designation,
        department: expertForm.department,
        intro: expertForm.intro,
        experienceYears: Number(expertForm.experienceYears) || 0,
        successRate: Number(expertForm.successRate) || 0,
        visasFiled: Number(expertForm.visasFiled) || 0,
        img: expertForm.img || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80&fm=webp",
        tags: tagsArray,
        displayOrder: Number(expertForm.displayOrder) || 1,
        status: expertForm.status
      };

      await saveExpert(expertForm.id || null, payload);
      toast.success(expertForm.id ? "Expert updated successfully!" : "Expert added successfully!");
      
      setIsAddOpen(false);
      setIsEditOpen(false);
      setExpertForm(initialFormState);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to save expert");
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (expert) => {
    setExpertForm({
      id: expert.id,
      name: expert.name || "",
      email: expert.email || "",
      phone: expert.phone || "",
      designation: expert.designation || "",
      department: expert.department || "Visa Expert",
      intro: expert.intro || "",
      experienceYears: expert.experienceYears || 0,
      successRate: expert.successRate || 98,
      visasFiled: expert.visasFiled || 0,
      img: expert.img || "",
      tagsInput: expert.tags ? expert.tags.join(", ") : "",
      displayOrder: expert.displayOrder || 1,
      status: expert.status || "active"
    });
    setIsEditOpen(true);
  };

  const handleToggleStatus = async (expert) => {
    const nextStatus = expert.status === "active" ? "inactive" : "active";
    setActionLoading(expert.id);
    try {
      await saveExpert(expert.id, { status: nextStatus });
      toast.success(`Expert status set to ${nextStatus}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update expert status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteClick = async (expert) => {
    if (!window.confirm(`Are you sure you want to permanently delete expert "${expert.name}"?`)) {
      return;
    }
    setActionLoading(expert.id);
    try {
      await deleteExpert(expert.id);
      toast.success("Expert deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete expert");
    } finally {
      setActionLoading(null);
    }
  };

  const handleImportFallbacks = async () => {
    setActionLoading("import");
    try {
      const fallbackSpecialists = [
        {
          name: "RJohn Doe",
          email: "John@eshaareuae.com",
          phone: "",
          designation: "Managing Director",
          department: "Leadership",
          intro: "Coordinating premium custom holiday designs and ensuring absolute file compliance for high-net-worth travelers.",
          img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80&fm=webp",
          visasFiled: 2400,
          experienceYears: 12,
          successRate: 99,
          tags: ["Schengen", "UK Visas"],
          displayOrder: 1,
          status: "active"
        },
        {
          name: "Suresh Kumar",
          email: "suresh@eshaareuae.com",
          phone: "",
          designation: "Senior Visa Specialist",
          department: "Business Visas",
          intro: "Expert in Schengen, UK, and USA document audits with deep knowledge of VFS visa operations and embassy protocols.",
          img: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=80&fm=webp",
          visasFiled: 1850,
          experienceYears: 9,
          successRate: 98,
          tags: ["USA B1/B2", "NOC Templates"],
          displayOrder: 2,
          status: "active"
        },
        {
          name: "Aisha Al-Mansoori",
          email: "aisha@eshaareuae.com",
          phone: "",
          designation: "Luxury Tour Consultant",
          department: "Bespoke Tours",
          intro: "Crafting bespoke global itineraries for European tours, Japan escapes, and exotic destination getaways.",
          img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80&fm=webp",
          visasFiled: 950,
          experienceYears: 6,
          successRate: 100,
          tags: ["Europe Packages", "Japan Itinerary"],
          displayOrder: 3,
          status: "active"
        },
        {
          name: "Hassan Ali",
          email: "hassan@eshaareuae.com",
          phone: "",
          designation: "VFS Operations Lead",
          department: "VFS Slots",
          intro: "Managing slot bookings, biometric appointments, and rapid document dispatch for all Eshaare clients.",
          img: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80&fm=webp",
          visasFiled: 3200,
          experienceYears: 11,
          successRate: 98,
          tags: ["Biometrics", "Express Booking"],
          displayOrder: 4,
          status: "active"
        }
      ];

      for (const spec of fallbackSpecialists) {
        const docId = `expert_${spec.name.toLowerCase().replace(/\s+/g, "_")}`;
        await saveExpert(docId, spec);
      }
      toast.success("Curated specialists imported successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to import curated specialists: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-wide">Experts Management</h1>
          <p className="text-xs text-on-primary-container/50">Manage specialists, consultants, and public-facing profile carousels.</p>
        </div>
        <div className="flex items-center space-x-2.5">
          {experts.length === 0 && !loading && (
            <button
              onClick={handleImportFallbacks}
              disabled={actionLoading === "import"}
              className="px-4 py-2 border border-on-primary-fixed-variant hover:border-secondary text-white hover:text-secondary rounded-button text-xs font-bold transition-all flex items-center space-x-1.5 disabled:opacity-50"
            >
              {actionLoading === "import" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-secondary" />
                  <span>Import Fallback Specialists</span>
                </>
              )}
            </button>
          )}
          <button
            onClick={() => {
              setExpertForm(initialFormState);
              setIsAddOpen(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-secondary-container to-secondary-container text-on-primary-fixed font-bold text-xs rounded-button flex items-center space-x-1.5 shadow-sm hover:-translate-y-0.5 transition-all"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Expert</span>
          </button>
        </div>
      </div>

      {/* Experts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center text-xs text-on-primary-container/50 py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-secondary" />
            Loading Expert Records...
          </div>
        ) : experts.length === 0 ? (
          <div className="col-span-full text-center text-xs text-on-primary-container/50 py-12 border border-dashed border-on-primary-fixed-variant/40 rounded-xl">
            No experts found. Click "Add Expert" to populate the collection.
          </div>
        ) : (
          experts.map((expert) => (
            <div 
              key={expert.id} 
              className={`glass-card p-6 border border-on-primary-fixed-variant/60 flex flex-col justify-between space-y-4 relative transition-all hover:border-secondary/40 ${
                actionLoading === expert.id ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              {/* Top Row: Picture + Status badge */}
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <div className="h-14 w-14 rounded-full overflow-hidden border border-secondary/30 bg-black/20 flex-shrink-0">
                    <img
                      src={expert.img}
                      alt={expert.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=100&q=80&fm=webp"; }}
                    />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white leading-tight">{expert.name}</h3>
                    <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mt-0.5">{expert.department}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => handleToggleStatus(expert)}
                  className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase transition-colors ${
                    expert.status === "active" ? "bg-success/15 text-success hover:bg-success/25" : "bg-danger/15 text-danger hover:bg-danger/25"
                  }`}
                  title="Click to toggle status"
                >
                  {expert.status || "active"}
                </button>
              </div>

              {/* Middle Row: Contact & Designation */}
              <div className="space-y-1.5 text-xs text-on-primary-container/70 border-t border-b border-on-primary-fixed-variant/40 py-3">
                <p className="flex items-center truncate">
                  <Mail className="h-3.5 w-3.5 mr-2 text-on-primary-container/40 flex-shrink-0" />
                  {expert.email || "No Email"}
                </p>
                {expert.phone && (
                  <p className="flex items-center truncate">
                    <Phone className="h-3.5 w-3.5 mr-2 text-on-primary-container/40 flex-shrink-0" />
                    {expert.phone}
                  </p>
                )}
                <p className="flex items-center font-medium text-white truncate">
                  <Award className="h-3.5 w-3.5 mr-2 text-secondary flex-shrink-0" />
                  {expert.designation || "No Title"}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs bg-black/10 py-2 rounded-lg border border-on-primary-fixed-variant/30">
                <div>
                  <span className="block font-bold text-white text-sm">{expert.visasFiled || 0}+</span>
                  <span className="block text-[8px] uppercase tracking-wider text-on-primary-container/40">Visas</span>
                </div>
                <div>
                  <span className="block font-bold text-[#D4AF37] text-sm">{expert.experienceYears || 0} yrs</span>
                  <span className="block text-[8px] uppercase tracking-wider text-on-primary-container/40">Exp</span>
                </div>
                <div>
                  <span className="block font-bold text-success text-sm">{expert.successRate || 98}%</span>
                  <span className="block text-[8px] uppercase tracking-wider text-on-primary-container/40">Success</span>
                </div>
              </div>

              {/* Tags Preview */}
              {expert.tags && expert.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {expert.tags.map((tag, idx) => (
                    <span 
                      key={idx} 
                      className="px-2 py-0.5 bg-[#2d2d2d] text-white/80 rounded text-[9px] border border-white/5 uppercase font-medium tracking-wide"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Bio Preview */}
              <p className="text-[11px] text-on-primary-container/60 line-clamp-2 italic leading-relaxed">
                "{expert.intro || "No bio description provided."}"
              </p>

              {/* Display Order & Action Buttons */}
              <div className="pt-3 border-t border-on-primary-fixed-variant flex items-center justify-between">
                <span className="text-[10px] text-on-primary-container/40 flex items-center">
                  <Hash className="h-3 w-3 mr-0.5" /> Display Order: <strong className="text-white ml-1">{expert.displayOrder || 1}</strong>
                </span>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditClick(expert)}
                    className="p-1.5 bg-secondary/15 text-secondary hover:bg-secondary/35 rounded transition-colors flex items-center justify-center"
                    title="Edit Expert"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(expert)}
                    className="p-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/25 rounded transition-colors flex items-center justify-center"
                    title="Delete Expert"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

            </div>
          ))
        )}
      </div>

      {/* Add / Edit Expert Modal */}
      <Modal
        isOpen={isAddOpen || isEditOpen}
        onClose={() => {
          setIsAddOpen(false);
          setIsEditOpen(false);
          setExpertForm(initialFormState);
        }}
        title={isEditOpen ? "Edit Expert Profile" : "Add New Expert"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 font-sans text-xs max-h-[75vh] overflow-y-auto pr-1">
          
          {/* Main Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-on-primary-container/50 uppercase">Full Name</label>
              <input
                type="text"
                required
                disabled={saving}
                placeholder="e.g. Rakhi G Hari"
                className="px-3 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container rounded focus:outline-none focus:border-secondary disabled:opacity-50"
                value={expertForm.name}
                onChange={(e) => setExpertForm({ ...expertForm, name: e.target.value })}
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-on-primary-container/50 uppercase">Email Address</label>
              <input
                type="email"
                required
                disabled={saving}
                placeholder="rakhi@eshaareuae.com"
                className="px-3 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container rounded focus:outline-none focus:border-secondary disabled:opacity-50"
                value={expertForm.email}
                onChange={(e) => setExpertForm({ ...expertForm, email: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-on-primary-container/50 uppercase">Phone / WhatsApp</label>
              <input
                type="text"
                disabled={saving}
                placeholder="e.g. +971 50 123 4567"
                className="px-3 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container rounded focus:outline-none focus:border-secondary disabled:opacity-50"
                value={expertForm.phone}
                onChange={(e) => setExpertForm({ ...expertForm, phone: e.target.value })}
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-on-primary-container/50 uppercase">Role Title / Designation</label>
              <input
                type="text"
                required
                disabled={saving}
                placeholder="e.g. Senior Visa Specialist"
                className="px-3 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container rounded focus:outline-none focus:border-secondary disabled:opacity-50"
                value={expertForm.designation}
                onChange={(e) => setExpertForm({ ...expertForm, designation: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-on-primary-container/50 uppercase">Department / Category</label>
              <select
                disabled={saving}
                className="px-3 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container rounded focus:outline-none focus:border-secondary disabled:opacity-50 cursor-pointer"
                value={expertForm.department}
                onChange={(e) => setExpertForm({ ...expertForm, department: e.target.value })}
              >
                <option value="Visa Expert">Visa Expert</option>
                <option value="Travel Consultant">Travel Consultant</option>
                <option value="VFS Slots">VFS Slots</option>
                <option value="Documentation">Documentation</option>
                <option value="Holiday Specialist">Holiday Specialist</option>
                <option value="Other">Other / General</option>
              </select>
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-on-primary-container/50 uppercase">Display Status</label>
              <select
                disabled={saving}
                className="px-3 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container rounded focus:outline-none focus:border-secondary disabled:opacity-50 cursor-pointer"
                value={expertForm.status}
                onChange={(e) => setExpertForm({ ...expertForm, status: e.target.value })}
              >
                <option value="active">Active (Visible Publicly)</option>
                <option value="inactive">Inactive (Hidden Publicly)</option>
              </select>
            </div>
          </div>

          {/* Short Bio */}
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-on-primary-container/50 uppercase">Small Introduction / Bio</label>
            <textarea
              required
              rows={3}
              disabled={saving}
              placeholder="Provide a short, customer-facing introduction (3-4 sentences)..."
              className="px-3 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container rounded focus:outline-none focus:border-secondary disabled:opacity-50"
              value={expertForm.intro}
              onChange={(e) => setExpertForm({ ...expertForm, intro: e.target.value })}
            />
          </div>

          {/* Stats Inputs */}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-[9px] font-bold text-on-primary-container/50 uppercase">Visas Filed</label>
              <input
                type="number"
                disabled={saving}
                min={0}
                className="px-3 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container rounded focus:outline-none focus:border-secondary disabled:opacity-50"
                value={expertForm.visasFiled}
                onChange={(e) => setExpertForm({ ...expertForm, visasFiled: e.target.value })}
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-[9px] font-bold text-on-primary-container/50 uppercase">Years Exp.</label>
              <input
                type="number"
                disabled={saving}
                min={0}
                className="px-3 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container rounded focus:outline-none focus:border-secondary disabled:opacity-50"
                value={expertForm.experienceYears}
                onChange={(e) => setExpertForm({ ...expertForm, experienceYears: e.target.value })}
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-[9px] font-bold text-on-primary-container/50 uppercase">Success %</label>
              <input
                type="number"
                disabled={saving}
                min={0}
                max={100}
                className="px-3 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container rounded focus:outline-none focus:border-secondary disabled:opacity-50"
                value={expertForm.successRate}
                onChange={(e) => setExpertForm({ ...expertForm, successRate: e.target.value })}
              />
            </div>
          </div>

          {/* Profile Picture Section */}
          <div className="flex flex-col space-y-2">
            <label className="text-[10px] font-bold text-on-primary-container/50 uppercase">Profile Picture</label>
            <div className="flex items-center space-x-3">
              <input
                type="text"
                disabled={saving}
                placeholder="https://images.unsplash.com/...?fm=webp or upload"
                className="flex-1 px-3 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container rounded focus:outline-none focus:border-secondary disabled:opacity-50 text-xs truncate"
                value={expertForm.img}
                onChange={(e) => setExpertForm({ ...expertForm, img: e.target.value })}
              />
              <label className="px-3 py-2 border border-[#4D4740] text-white hover:border-[#7A8F6B] hover:text-[#7A8F6B] rounded text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors flex items-center space-x-1.5 shrink-0">
                {uploadingPic ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePicUpload(e)}
                  disabled={uploadingPic || saving}
                  className="hidden"
                />
              </label>
            </div>
            {expertForm.img && (
              <div className="h-14 w-14 rounded-full overflow-hidden border border-on-primary-fixed-variant bg-black/20">
                <img
                  src={expertForm.img}
                  alt="Profile Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=100&q=80&fm=webp"; }}
                />
              </div>
            )}
          </div>

          {/* Tags / Display Order */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-on-primary-container/50 uppercase">Tags / Specialities (Comma separated)</label>
              <input
                type="text"
                disabled={saving}
                placeholder="e.g. Schengen, UK Visas, Express Booking"
                className="px-3 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container rounded focus:outline-none focus:border-secondary disabled:opacity-50"
                value={expertForm.tagsInput}
                onChange={(e) => setExpertForm({ ...expertForm, tagsInput: e.target.value })}
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-on-primary-container/50 uppercase">Display Order</label>
              <input
                type="number"
                required
                disabled={saving}
                min={1}
                className="px-3 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container rounded focus:outline-none focus:border-secondary disabled:opacity-50"
                value={expertForm.displayOrder}
                onChange={(e) => setExpertForm({ ...expertForm, displayOrder: e.target.value })}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4 border-t border-on-primary-fixed-variant">
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                setIsAddOpen(false);
                setIsEditOpen(false);
                setExpertForm(initialFormState);
              }}
              className="flex-1 py-2.5 bg-on-primary-fixed-variant border border-on-primary-fixed-variant text-on-primary-container font-semibold rounded text-xs disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploadingPic}
              className="flex-1 py-2.5 bg-gradient-to-r from-secondary-container to-secondary-container text-on-primary-fixed font-bold rounded text-xs shadow-sm disabled:opacity-50 flex items-center justify-center space-x-1"
            >
              {saving ? <span>Saving...</span> : <span>Save changes</span>}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default ExpertsManagementPage;
