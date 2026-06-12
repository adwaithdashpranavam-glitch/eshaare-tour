import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Loader2, Shield, Image as ImageIcon } from "lucide-react";
import { savePackage, db } from "../../lib/firestore";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";

export const AppPackageEditorPage = () => {
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
          You do not have the required permissions to modify App Packages. Only Super Admins, Admins, and Managers can edit package content.
        </p>
      </div>
    );
  }
  const isEditMode = !!id;

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditMode);
  const [formData, setFormData] = useState({
    id: "",
    title: "",
    country: "",
    price: "",
    imageUrl: "",
    rating: 4.8,
    reviewCount: 100,
    category: "Packages",
    description: "",
    duration: "",
    nextDeparture: ""
  });

  useEffect(() => {
    if (isEditMode) {
      const fetchPackage = async () => {
        try {
          const docRef = doc(db, "packages", id);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            setFormData({ id: snap.id, ...snap.data() });
          } else {
            toast.error("Package not found");
            navigate("/admin/app/packages");
          }
        } catch (err) {
          toast.error("Failed to load package details");
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchPackage();
    }
  }, [id, isEditMode, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "rating" ? parseFloat(value) || 0 : name === "reviewCount" ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.id.trim()) {
      toast.error("Package ID/Slug is required");
      return;
    }
    setSaving(true);
    try {
      const docId = formData.id.toLowerCase().trim().replace(/[^a-z0-9-_]/g, "-");
      const packageData = { ...formData };
      delete packageData.id; // Store ID as the document ID

      await savePackage(docId, packageData);
      toast.success(isEditMode ? "Package updated successfully!" : "Package created successfully!");
      navigate("/admin/app/packages");
    } catch (err) {
      toast.error("Failed to save package");
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
          onClick={() => navigate("/admin/app/packages")}
          className="p-1.5 hover:bg-white/5 rounded border border-on-primary-fixed-variant text-on-primary-container hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-display font-bold text-white tracking-wide">
            {isEditMode ? "Edit App Package" : "Create New App Package"}
          </h1>
          <p className="text-[10px] text-on-primary-container/45 uppercase tracking-wider">
            {isEditMode ? `Package Document ID: ${id}` : "Configure a new tour/stay package for the app"}
          </p>
        </div>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-primary-container/40 border border-on-primary-fixed-variant p-6 rounded-card space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Document ID */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-primary-container/70 uppercase tracking-wider block">
              Package ID / Slug <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              name="id"
              disabled={isEditMode}
              required
              className="w-full px-3.5 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container placeholder-on-primary-container/30 rounded text-xs focus:outline-none focus:border-secondary disabled:opacity-50"
              placeholder="e.g. greece-santorini-premium"
              value={formData.id}
              onChange={handleChange}
            />
            <span className="text-[10px] text-on-primary-container/40 block">
              Used as the database document key. Lowercase alphanumeric and hyphens only.
            </span>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-primary-container/70 uppercase tracking-wider block">
              Package Title <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              name="title"
              required
              className="w-full px-3.5 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container placeholder-on-primary-container/30 rounded text-xs focus:outline-none focus:border-secondary"
              placeholder="e.g. Symphony of Santorini"
              value={formData.title}
              onChange={handleChange}
            />
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
              placeholder="e.g. Greece"
              value={formData.country}
              onChange={handleChange}
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-primary-container/70 uppercase tracking-wider block">
              Category <span className="text-danger">*</span>
            </label>
            <select
              name="category"
              className="w-full px-3.5 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container rounded text-xs focus:outline-none focus:border-secondary"
              value={formData.category}
              onChange={handleChange}
            >
              <option value="Packages">Packages</option>
              <option value="Hotels">Hotels</option>
              <option value="Flights">Flights</option>
            </select>
          </div>

          {/* Price */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-primary-container/70 uppercase tracking-wider block">
              Price Display <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              name="price"
              required
              className="w-full px-3.5 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container placeholder-on-primary-container/30 rounded text-xs focus:outline-none focus:border-secondary"
              placeholder="e.g. $1,299 or $750 / night"
              value={formData.price}
              onChange={handleChange}
            />
          </div>

          {/* Duration */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-primary-container/70 uppercase tracking-wider block">
              Duration / Info <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              name="duration"
              required
              className="w-full px-3.5 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container placeholder-on-primary-container/30 rounded text-xs focus:outline-none focus:border-secondary"
              placeholder="e.g. 7 Days / 6 Nights"
              value={formData.duration}
              onChange={handleChange}
            />
          </div>

          {/* Next Departure */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-primary-container/70 uppercase tracking-wider block">
              Next Departure
            </label>
            <input
              type="text"
              name="nextDeparture"
              className="w-full px-3.5 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container placeholder-on-primary-container/30 rounded text-xs focus:outline-none focus:border-secondary"
              placeholder="e.g. June 12, 2026 or Available Daily"
              value={formData.nextDeparture}
              onChange={handleChange}
            />
          </div>

          {/* Rating */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-primary-container/70 uppercase tracking-wider block">
              Rating (Float)
            </label>
            <input
              type="number"
              step="0.1"
              min="1.0"
              max="5.0"
              name="rating"
              className="w-full px-3.5 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container placeholder-on-primary-container/30 rounded text-xs focus:outline-none focus:border-secondary"
              placeholder="e.g. 4.9"
              value={formData.rating}
              onChange={handleChange}
            />
          </div>

          {/* Review Count */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-primary-container/70 uppercase tracking-wider block">
              Review Count
            </label>
            <input
              type="number"
              name="reviewCount"
              className="w-full px-3.5 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container placeholder-on-primary-container/30 rounded text-xs focus:outline-none focus:border-secondary"
              placeholder="e.g. 124"
              value={formData.reviewCount}
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
                placeholder="https://images.unsplash.com/..."
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
              Description / Itinerary Summary <span className="text-danger">*</span>
            </label>
            <textarea
              name="description"
              required
              rows={4}
              className="w-full px-3.5 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container placeholder-on-primary-container/30 rounded text-xs focus:outline-none focus:border-secondary"
              placeholder="Provide a compelling overview of what travelers get in this package..."
              value={formData.description}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end items-center space-x-3 pt-4 border-t border-on-primary-fixed-variant/50">
          <button
            type="button"
            disabled={saving}
            onClick={() => navigate("/admin/app/packages")}
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
                <span>Save Package</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AppPackageEditorPage;
