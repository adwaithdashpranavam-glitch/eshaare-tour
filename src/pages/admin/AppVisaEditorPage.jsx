import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Loader2, Plus, Trash2, Shield, Image as ImageIcon } from "lucide-react";
import { saveVisa, db } from "../../lib/firestore";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";

export const AppVisaEditorPage = () => {
  const { userProfile } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const isAuthorized = ["super_admin", "admin", "manager"].includes(userProfile?.role);

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4 font-sans">
        <Shield className="h-16 w-16 text-danger animate-pulse" />
        <h1 className="text-xl font-bold text-white uppercase tracking-wide">Access Denied</h1>
        <p className="text-xs text-on-primary-container/60 max-w-md leading-relaxed">
          You do not have the required permissions to modify App Visa Guides. Only Super Admins, Admins, and Managers can edit visa guides.
        </p>
      </div>
    );
  }
  const isEditMode = !!id;

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditMode);
  const [formData, setFormData] = useState({
    id: "",
    country: "",
    visaType: "",
    processingTime: "",
    price: "",
    description: "",
    imageUrl: "",
    requirements: []
  });

  const [newRequirement, setNewRequirement] = useState("");

  useEffect(() => {
    if (isEditMode) {
      const fetchVisa = async () => {
        try {
          const docRef = doc(db, "visas", id);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            setFormData({ id: snap.id, ...snap.data() });
          } else {
            toast.error("Visa not found");
            navigate("/admin/app/visa");
          }
        } catch (err) {
          toast.error("Failed to load visa details");
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchVisa();
    }
  }, [id, isEditMode, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddRequirement = (e) => {
    e.preventDefault();
    if (!newRequirement.trim()) return;
    setFormData((prev) => ({
      ...prev,
      requirements: [...(prev.requirements || []), newRequirement.trim()]
    }));
    setNewRequirement("");
  };

  const handleRemoveRequirement = (idx) => {
    setFormData((prev) => ({
      ...prev,
      requirements: (prev.requirements || []).filter((_, i) => i !== idx)
    }));
  };

  const handleRequirementChange = (idx, val) => {
    setFormData((prev) => {
      const updated = [...(prev.requirements || [])];
      updated[idx] = val;
      return { ...prev, requirements: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.id.trim()) {
      toast.error("Visa ID/Slug is required");
      return;
    }
    setSaving(true);
    try {
      const docId = formData.id.toLowerCase().trim().replace(/[^a-z0-9-_]/g, "-");
      const visaData = { ...formData };
      delete visaData.id; // Store ID as the document ID

      await saveVisa(docId, visaData);
      toast.success(isEditMode ? "Visa updated successfully!" : "Visa created successfully!");
      navigate("/admin/app/visa");
    } catch (err) {
      toast.error("Failed to save visa");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate("/admin/app/visa")}
          className="p-1.5 hover:bg-white/5 rounded border border-on-primary-fixed-variant text-on-primary-container hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-display font-bold text-white tracking-wide">
            {isEditMode ? "Edit App Visa Guide" : "Create New App Visa Guide"}
          </h1>
          <p className="text-[10px] text-on-primary-container/45 uppercase tracking-wider">
            {isEditMode ? `Visa Document ID: ${id}` : "Configure a new visa requirement guide for the app"}
          </p>
        </div>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-primary-container/40 border border-on-primary-fixed-variant p-6 rounded-card space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Document ID */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-primary-container/70 uppercase tracking-wider block">
              Visa ID / Slug <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              name="id"
              disabled={isEditMode}
              required
              className="w-full px-3.5 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container placeholder-on-primary-container/30 rounded text-xs focus:outline-none focus:border-secondary disabled:opacity-50"
              placeholder="e.g. schengen or uk-visa"
              value={formData.id}
              onChange={handleChange}
            />
            <span className="text-[10px] text-on-primary-container/40 block">
              Used as the database document key. Lowercase alphanumeric and hyphens only.
            </span>
          </div>

          {/* Country */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-primary-container/70 uppercase tracking-wider block">
              Country <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              name="country"
              required
              className="w-full px-3.5 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container placeholder-on-primary-container/30 rounded text-xs focus:outline-none focus:border-secondary"
              placeholder="e.g. Schengen Area (Europe)"
              value={formData.country}
              onChange={handleChange}
            />
          </div>

          {/* Visa Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-primary-container/70 uppercase tracking-wider block">
              Visa Type / Class <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              name="visaType"
              required
              className="w-full px-3.5 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container placeholder-on-primary-container/30 rounded text-xs focus:outline-none focus:border-secondary"
              placeholder="e.g. Short-Stay Tourist (Type C)"
              value={formData.visaType}
              onChange={handleChange}
            />
          </div>

          {/* Processing Time */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-primary-container/70 uppercase tracking-wider block">
              Processing Time <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              name="processingTime"
              required
              className="w-full px-3.5 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container placeholder-on-primary-container/30 rounded text-xs focus:outline-none focus:border-secondary"
              placeholder="e.g. 10-15 business days"
              value={formData.processingTime}
              onChange={handleChange}
            />
          </div>

          {/* Price */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-primary-container/70 uppercase tracking-wider block">
              Consular/Service Price <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              name="price"
              required
              className="w-full px-3.5 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container placeholder-on-primary-container/30 rounded text-xs focus:outline-none focus:border-secondary"
              placeholder="e.g. $95"
              value={formData.price}
              onChange={handleChange}
            />
          </div>

          {/* Image URL */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-on-primary-container/70 uppercase tracking-wider block">
              Image URL <span className="text-danger">*</span>
            </label>
            <div className="flex gap-4">
              <input
                type="text"
                name="imageUrl"
                required
                className="flex-1 px-3.5 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container placeholder-on-primary-container/30 rounded text-xs focus:outline-none focus:border-secondary"
                placeholder="https://images.unsplash.com/...?fm=webp"
                value={formData.imageUrl}
                onChange={handleChange}
              />
              <div className="h-10 w-16 border border-on-primary-fixed-variant bg-primary-container rounded flex items-center justify-center overflow-hidden">
                {formData.imageUrl ? (
                  <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="h-4 w-4 text-on-primary-container/30" />
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-on-primary-container/70 uppercase tracking-wider block">
              Description <span className="text-danger">*</span>
            </label>
            <textarea
              name="description"
              required
              rows={3}
              className="w-full px-3.5 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container placeholder-on-primary-container/30 rounded text-xs focus:outline-none focus:border-secondary"
              placeholder="Provide a general overview of this visa type..."
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          {/* Dynamic Requirements Section */}
          <div className="space-y-3 md:col-span-2 border-t border-on-primary-fixed-variant/40 pt-4">
            <label className="text-xs font-bold text-white uppercase tracking-wider block">
              Visa Requirements Checklist
            </label>

            {/* List of requirements */}
            <div className="space-y-2">
              {(!formData.requirements || formData.requirements.length === 0) ? (
                <p className="text-xs text-on-primary-container/40 italic">No requirements added yet. Add requirements using the form below.</p>
              ) : (
                formData.requirements.map((req, idx) => (
                  <div key={idx} className="flex items-center space-x-2 bg-primary-container border border-on-primary-fixed-variant/70 p-2 rounded">
                    <span className="text-xs font-bold text-secondary font-mono w-5 text-right">{idx + 1}.</span>
                    <input
                      type="text"
                      className="flex-1 bg-transparent text-xs text-white focus:outline-none"
                      value={req}
                      onChange={(e) => handleRequirementChange(idx, e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveRequirement(idx)}
                      className="p-1 hover:bg-danger/10 text-on-primary-container/60 hover:text-danger rounded"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add requirement form */}
            <div className="flex gap-2 items-center mt-2">
              <input
                type="text"
                className="flex-1 px-3.5 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container placeholder-on-primary-container/30 rounded text-xs focus:outline-none focus:border-secondary"
                placeholder="Type a visa requirement, e.g. Passport copy valid for 6 months..."
                value={newRequirement}
                onChange={(e) => setNewRequirement(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddRequirement(e); } }}
              />
              <button
                type="button"
                onClick={handleAddRequirement}
                className="px-3 py-2 bg-white/5 border border-on-primary-fixed-variant text-on-primary-container hover:text-white hover:bg-white/10 text-xs font-semibold rounded flex items-center space-x-1"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end items-center space-x-3 pt-4 border-t border-on-primary-fixed-variant/50">
          <button
            type="button"
            disabled={saving}
            onClick={() => navigate("/admin/app/visa")}
            className="px-4 py-2 text-xs font-bold text-on-primary-container/60 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-gradient-to-r from-secondary-container to-secondary-container text-on-primary-fixed font-bold text-xs rounded-button flex items-center space-x-1.5 shadow-sm transition-all hover:-translate-y-0.5"
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                <span>Save Visa Guide</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AppVisaEditorPage;
