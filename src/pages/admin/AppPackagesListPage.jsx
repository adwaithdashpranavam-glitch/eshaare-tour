import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, Loader2, Compass, AlertCircle, ArrowUpDown, RefreshCw } from "lucide-react";
import { getPackages, deletePackage, savePackage } from "../../lib/firestore";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import toast from "react-hot-toast";

const DEFAULT_PACKAGES = [
  {
    id: "greece-santorini",
    title: "Symphony of Santorini",
    country: "Greece",
    price: "$1,299",
    imageUrl: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=600&q=80",
    rating: 4.9,
    reviewCount: 124,
    category: "Packages",
    description: "Experience breathtaking sunsets over whitewashed domes, crystal-clear Aegean waters, and premium cliffside suites in the pearl of the Cyclades.",
    duration: "7 Days / 6 Nights",
    nextDeparture: "June 12, 2026"
  },
  {
    id: "japan-zen",
    title: "Zen Gardens & Neon Lights",
    country: "Japan",
    price: "$2,450",
    imageUrl: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80",
    rating: 4.8,
    reviewCount: 98,
    category: "Packages",
    description: "A perfect blend of historical Kyoto shrines, serene Mount Fuji views, and the futuristic high-energy streets of Tokyo.",
    duration: "10 Days / 9 Nights",
    nextDeparture: "May 29, 2026"
  },
  {
    id: "maldives-sanctuary",
    title: "Overwater Maldives Sanctuary",
    country: "Maldives",
    price: "$1,890",
    imageUrl: "https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=600&q=80",
    rating: 4.9,
    reviewCount: 210,
    category: "Packages",
    description: "Sleep above turquoise lagoons in private overwater villas, swim with manta rays, and enjoy private candlelight beach dinners.",
    duration: "5 Days / 4 Nights",
    nextDeparture: "June 05, 2026"
  },
  {
    id: "swiss-alps",
    title: "Swiss Alps Chamonix Explorer",
    country: "Switzerland",
    price: "$3,100",
    imageUrl: "https://images.unsplash.com/photo-1502784444187-359ac186c5bb?auto=format&fit=crop&w=600&q=80",
    rating: 4.7,
    reviewCount: 64,
    category: "Packages",
    description: "Conquer Alpine peaks, ride scenic panoramic trains, and relax in luxury thermal resorts in St. Moritz and Zermatt.",
    duration: "8 Days / 7 Nights",
    nextDeparture: "July 15, 2026"
  }
];

export const AppPackagesListPage = () => {
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    const unsubscribe = getPackages(
      (items) => {
        setPackages(items);
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

  const filteredPackages = packages.filter((p) => {
    return (
      p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.country?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deletePackage(deleteTarget.id);
      toast.success(`"${deleteTarget.title}" deleted successfully`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error("Failed to delete package");
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const handleSeedDefaults = async () => {
    setSeeding(true);
    try {
      for (const pkg of DEFAULT_PACKAGES) {
        await savePackage(pkg.id, pkg);
      }
      toast.success("Default packages seeded successfully!");
    } catch (err) {
      toast.error("Failed to seed packages");
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
          <h1 className="text-2xl font-display font-bold text-white tracking-wide">App Packages CMS</h1>
          <p className="text-xs text-on-primary-container/50">
            Create, edit, and delete travel tour packages synced directly with the mobile application.
          </p>
        </div>
        <div className="flex gap-2">
          {packages.length === 0 && (
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
          <button
            onClick={() => navigate("/admin/app/packages/new")}
            className="px-4 py-2 bg-gradient-to-r from-secondary-container to-secondary-container text-on-primary-fixed font-bold text-xs rounded-button flex items-center space-x-1.5 shadow-sm transition-all hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" />
            <span>Add Package</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex flex-col p-6 bg-error-container/10 border border-error/30 rounded-card text-white space-y-3 font-sans">
          <div className="flex items-center space-x-2 text-error-red font-bold">
            <AlertCircle className="h-5 w-5" />
            <span>Database Connection Error</span>
          </div>
          <p className="text-xs text-on-primary-container/85 leading-relaxed">
            The app could not access the <span className="font-semibold font-mono text-secondary-container">packages</span> collection in your Firestore database.
          </p>
        </div>
      )}

      {/* Filter Card */}
      <div className="bg-primary-container/20 border border-on-primary-fixed-variant p-4 rounded-card flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="w-full md:max-w-xs relative">
          <input
            type="text"
            className="w-full pl-4 pr-10 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container placeholder-on-primary-container/30 rounded-button text-xs focus:outline-none focus:border-secondary"
            placeholder="Filter packages by name, country or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner message="Loading App Packages..." />
      ) : filteredPackages.length === 0 ? (
        <div className="border border-on-primary-fixed-variant bg-primary-container/40 rounded-card p-12 text-center space-y-3">
          <Compass className="h-10 w-10 text-on-primary-container/30 mx-auto animate-pulse" />
          <h3 className="text-sm font-bold text-white">No Packages Found</h3>
          <p className="text-xs text-on-primary-container/50 max-w-sm mx-auto">
            {searchQuery ? "No packages match your search filters." : "Start by creating a new package or click Seed Defaults above."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-card border border-on-primary-fixed-variant bg-primary-container/40">
          <table className="min-w-full divide-y divide-outline-variant/15 text-left text-sm text-on-primary-container">
            <thead className="bg-primary-container/80 uppercase text-xs font-semibold text-on-primary-container/60 tracking-wider">
              <tr>
                <th className="px-6 py-4">Image</th>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Country</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Rating</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/15 bg-transparent">
              {filteredPackages.map((p) => (
                <tr key={p.id} className="hover:bg-white/5 transition-all duration-150">
                  <td className="px-6 py-4 w-20">
                    <img 
                      src={p.imageUrl || "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=100&q=80"} 
                      alt={p.title} 
                      className="w-12 h-12 rounded object-cover border border-on-primary-fixed-variant/40"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-white">{p.title}</div>
                    <div className="text-[10px] text-on-primary-container/50 truncate max-w-xs">{p.description}</div>
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-secondary-container">
                    {p.country}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-white">
                    {p.price}
                  </td>
                  <td className="px-6 py-4 text-xs text-on-primary-container/80">
                    {p.duration}
                  </td>
                  <td className="px-6 py-4 text-xs">
                    <span className="px-2 py-0.5 rounded bg-secondary-container/10 border border-secondary/20 text-secondary text-[10px] uppercase font-bold">
                      {p.category || "Packages"}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">
                    ⭐ {p.rating || "4.8"} ({p.reviewCount || "100"})
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => navigate(`/admin/app/packages/${p.id}/edit`)}
                        className="p-1.5 bg-white/5 border border-on-primary-fixed-variant hover:border-secondary hover:text-secondary text-on-primary-container rounded transition-colors"
                        title="Edit Package"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(p)}
                        className="p-1.5 bg-white/5 border border-on-primary-fixed-variant hover:border-error-red hover:text-error-red text-on-primary-container rounded transition-colors"
                        title="Delete Package"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
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
            <h3 className="text-base font-bold text-white">Delete Package?</h3>
            <p className="text-xs text-on-primary-container/70 leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-white">"{deleteTarget.title}"</span>? 
              This will remove the package from the mobile app and website immediately.
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

export default AppPackagesListPage;
