import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, Loader2, Globe, AlertCircle, RefreshCw } from "lucide-react";
import { getVisas, deleteVisa, saveVisa } from "../../lib/firestore";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";

const DEFAULT_VISAS = [
  {
    id: "schengen",
    country: "Schengen Area (Europe)",
    visaType: "Short-Stay Tourist (Type C)",
    processingTime: "10-15 business days",
    price: "$95",
    description: "Allows entry to 27 European countries for tourism, family visits, or business conferences up to 90 days.",
    requirements: [
      "Completed & signed visa application form",
      "Valid passport with at least 6 months validity & 2 blank pages",
      "Two recent biometric passport-size photographs",
      "Roundtrip flight reservation & detailed travel itinerary",
      "Proof of accommodation (hotel booking/host invitation)",
      "Travel medical insurance covering minimum €30,000",
      "Proof of sufficient financial means (bank statements)"
    ],
    imageUrl: "https://images.unsplash.com/photo-1486299267070-83823f5448dd?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "united-kingdom",
    country: "United Kingdom",
    visaType: "Standard Visitor Visa",
    processingTime: "15-20 business days",
    price: "$145",
    description: "For tourism, business appointments, short study courses, and private medical treatment in the UK.",
    requirements: [
      "Current valid passport",
      "Online application submission & visa fee payment confirmation",
      "Financial proof showing capability to support stay (6 months statements)",
      "Employment verification letter/Business registration certificate",
      "Accommodation details & planned travel dates"
    ],
    imageUrl: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "japan",
    country: "Japan",
    visaType: "Tourist eVisa",
    processingTime: "5 business days",
    price: "$30",
    description: "Single-entry electronic visa for tourism purposes, valid for up to 90 days stay in Japan.",
    requirements: [
      "Passport photo page upload",
      "Proof of flight tickets (round-trip)",
      "Detailed schedule of stay in Japan",
      "Proof of financial resources (tax returns or bank balances)"
    ],
    imageUrl: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "united-states",
    country: "United States",
    visaType: "B1/B2 Tourist & Business",
    processingTime: "Depends on interview slot (Usually 5-7 days post-interview)",
    price: "$185",
    description: "Non-immigrant visa for temporary business, tourism, or medical treatment in the USA.",
    requirements: [
      "DS-160 online application confirmation barcode",
      "Visa interview appointment letter",
      "Valid passport & recent physical 2x2 inch photo",
      "Proof of strong ties to home country (job, property, family)",
      "Financial stability proof"
    ],
    imageUrl: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "australia",
    country: "Australia",
    visaType: "Visitor Visa (Subclass 600)",
    processingTime: "10 business days",
    price: "$125",
    description: "Online visa allowing visitors to travel to Australia for holiday, recreation, or visiting family.",
    requirements: [
      "Scanned bio-data page of passport",
      "National ID card or equivalent proof of residency",
      "Recent passport photo",
      "Proof of employment and leave approval",
      "Personal bank statement showing stable income"
    ],
    imageUrl: "https://images.unsplash.com/photo-1523482596682-cd93a6e54520?auto=format&fit=crop&w=400&q=80"
  }
];

export const AppVisasListPage = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [visas, setVisas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const canModifyCMS = ["super_admin", "admin", "manager"].includes(userProfile?.role);

  useEffect(() => {
    const unsubscribe = getVisas(
      (items) => {
        setVisas(items);
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const filteredVisas = visas.filter((v) => {
    return (
      v.country?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.visaType?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    if (!canModifyCMS) {
      toast.error("Unauthorized operation");
      return;
    }
    setDeleting(true);
    try {
      await deleteVisa(deleteTarget.id);
      toast.success(`Visa for "${deleteTarget.country}" deleted successfully`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error("Failed to delete visa");
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const handleSeedDefaults = async () => {
    if (!canModifyCMS) {
      toast.error("Unauthorized operation");
      return;
    }
    setSeeding(true);
    try {
      for (const visa of DEFAULT_VISAS) {
        await saveVisa(visa.id, visa);
      }
      toast.success("Default visas seeded successfully!");
    } catch (err) {
      toast.error("Failed to seed visas");
      console.error(err);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-wide">App Visas CMS</h1>
          <p className="text-xs text-on-primary-container/50">
            Create, edit, and delete visa guides synced directly with the mobile application.
          </p>
        </div>
        <div className="flex gap-2">
          {canModifyCMS && visas.length === 0 && (
            <button
              onClick={handleSeedDefaults}
              disabled={seeding}
              className="px-4 py-2 bg-white/5 border border-on-primary-fixed-variant text-on-primary-container hover:text-white hover:bg-white/10 text-xs font-semibold rounded flex items-center space-x-1.5 transition-all"
            >
              {seeding ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              <span>Seed Defaults</span>
            </button>
          )}
          {canModifyCMS && (
            <button
              onClick={() => navigate("/admin/app/visa/new")}
              className="px-4 py-2 bg-gradient-to-r from-secondary-container to-secondary-container text-on-primary-fixed font-bold text-xs rounded-button flex items-center space-x-1.5 shadow-sm transition-all hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4" />
              <span>Add Visa</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex flex-col p-6 bg-error-container/10 border border-error/30 rounded-card text-white space-y-3 font-sans">
          <div className="flex items-center space-x-2 text-error-red font-bold">
            <AlertCircle className="h-5 w-5" />
            <span>Database Connection Error</span>
          </div>
          <p className="text-xs text-on-primary-container/85 leading-relaxed">
            The app could not access the <span className="font-semibold font-mono text-secondary-container">visas</span> collection in your Firestore database.
          </p>
        </div>
      )}

      {/* Filter Card */}
      <div className="bg-primary-container/20 border border-on-primary-fixed-variant p-4 rounded-card flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="w-full md:max-w-xs relative">
          <input
            type="text"
            className="w-full pl-4 pr-10 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container placeholder-on-primary-container/30 rounded-button text-xs focus:outline-none focus:border-secondary"
            placeholder="Filter visas by country or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner message="Loading App Visas..." />
      ) : filteredVisas.length === 0 ? (
        <div className="border border-on-primary-fixed-variant bg-primary-container/40 rounded-card p-12 text-center space-y-3">
          <Globe className="h-10 w-10 text-on-primary-container/30 mx-auto animate-pulse" />
          <h3 className="text-sm font-bold text-white">No Visas Found</h3>
          <p className="text-xs text-on-primary-container/50 max-w-sm mx-auto">
            {searchQuery ? "No visas match your search filters." : "Start by creating a new visa guide or click Seed Defaults above."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-card border border-on-primary-fixed-variant bg-primary-container/40">
          <table className="min-w-full divide-y divide-outline-variant/15 text-left text-sm text-on-primary-container">
            <thead className="bg-primary-container/80 uppercase text-xs font-semibold text-on-primary-container/60 tracking-wider">
              <tr>
                <th className="px-6 py-4">Image</th>
                <th className="px-6 py-4">Country</th>
                <th className="px-6 py-4">Visa Type</th>
                <th className="px-6 py-4">Processing Time</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Requirements Count</th>
                {canModifyCMS && <th className="px-6 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/15 bg-transparent">
              {filteredVisas.map((v) => (
                <tr key={v.id} className="hover:bg-white/5 transition-all duration-150">
                  <td className="px-6 py-4 w-20">
                    <img 
                      src={v.imageUrl || "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=100&q=80"} 
                      alt={v.country} 
                      className="w-12 h-12 rounded object-cover border border-on-primary-fixed-variant/40"
                    />
                  </td>
                  <td className="px-6 py-4 font-semibold text-white">
                    {v.country}
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-secondary-container">
                    {v.visaType}
                  </td>
                  <td className="px-6 py-4 text-xs text-on-primary-container/80">
                    {v.processingTime}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-white">
                    {v.price}
                  </td>
                  <td className="px-6 py-4 text-xs">
                    <span className="px-2 py-0.5 rounded bg-primary-container border border-on-primary-fixed-variant/40 text-on-primary-container/70 text-[10px] font-bold">
                      {(v.requirements || []).length} Requirements
                    </span>
                  </td>
                  {canModifyCMS && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => navigate(`/admin/app/visa/${v.id}/edit`)}
                          className="p-1.5 bg-white/5 border border-on-primary-fixed-variant hover:border-secondary hover:text-secondary text-on-primary-container rounded transition-colors"
                          title="Edit Visa"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(v)}
                          className="p-1.5 bg-white/5 border border-on-primary-fixed-variant hover:border-error-red hover:text-error-red text-on-primary-container rounded transition-colors"
                          title="Delete Visa"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-primary-container border border-on-primary-fixed-variant max-w-sm w-full rounded-card p-6 shadow-xl space-y-4 animate-[fadeIn_0.15s_ease-out]">
            <h3 className="text-base font-bold text-white">Delete Visa Guide?</h3>
            <p className="text-xs text-on-primary-container/70 leading-relaxed">
              Are you sure you want to delete the visa guide for <span className="font-semibold text-white">"{deleteTarget.country}"</span>? 
              This will remove the visa guide from the mobile app immediately.
            </p>
            <div className="flex justify-end items-center space-x-3 pt-2">
              <button
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-xs font-bold text-on-primary-container/60 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={deleting}
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-error-red text-white text-xs font-bold rounded-button hover:bg-red-600 transition-colors flex items-center space-x-1.5"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppVisasListPage;
