import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { GripVertical, Plus, Edit, Trash2, Loader2, Eye, Globe, ArrowUpDown, AlertCircle } from "lucide-react";
import { getVisaTypes, saveVisaType, deleteVisaType, updateVisaTypeSortOrders } from "../../lib/firestore";
import { formatShortDate } from "../../utils/formatters";
import toast from "react-hot-toast";

export const VisaTypesListPage = () => {
  const navigate = useNavigate();
  const [visaTypes, setVisaTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  
  const draggedIdx = useRef(null);

  // Subscriptions to live visa types list
  useEffect(() => {
    const unsubscribe = getVisaTypes(
      (items) => {
        setVisaTypes(items);
        setError(null);
        setLoading(false);
      },
      false, // Fetch all (including drafts)
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filter list by search query
  const filteredVisaTypes = visaTypes.filter((v) => {
    return (
      v.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.slug?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.tagline?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Toggle isPublished state
  const handleTogglePublish = async (visa) => {
    const nextStatus = !visa.isPublished;
    try {
      await saveVisaType(visa.id, { isPublished: nextStatus });
      toast.success(`"${visa.name}" status updated to ${nextStatus ? "Published" : "Draft"}`);
    } catch (err) {
      toast.error("Failed to update status");
      console.error(err);
    }
  };

  // Drag Handlers for Native HTML5 Drag and Drop
  const handleDragStart = (e, index) => {
    draggedIdx.current = index;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", e.target);
    e.currentTarget.classList.add("opacity-50", "border-dashed", "border-secondary");
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIdx.current === null || draggedIdx.current === index) return;
    
    const reorderedItems = [...visaTypes];
    const draggedItem = reorderedItems[draggedIdx.current];
    reorderedItems.splice(draggedIdx.current, 1);
    reorderedItems.splice(index, 0, draggedItem);
    draggedIdx.current = index;
    setVisaTypes(reorderedItems);
  };

  const handleDragEnd = async (e) => {
    e.currentTarget.classList.remove("opacity-50", "border-dashed", "border-secondary");
    draggedIdx.current = null;
    
    // Commit new sortOrder numbers to database in a single batch
    const updates = visaTypes.map((item, idx) => ({
      id: item.id,
      sortOrder: idx + 1
    }));

    try {
      await updateVisaTypeSortOrders(updates);
      toast.success("Sort order saved successfully");
    } catch (err) {
      toast.error("Failed to save new sort order");
      console.error(err);
    }
  };

  // Delete Handlers
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteVisaType(deleteTarget.id);
      toast.success(`"${deleteTarget.name}" deleted successfully`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error("Failed to delete visa type");
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-wide">Visa Page CMS</h1>
          <p className="text-xs text-on-primary-container/50">
            Create, edit, and reorder public-facing visa pages. Reorder items using the drag handles to set display order.
          </p>
        </div>
        <button
          onClick={() => navigate("/admin/visa-types/new")}
          className="px-4 py-2 bg-gradient-to-r from-secondary-container to-secondary-container text-on-primary-fixed font-bold text-xs rounded-button flex items-center space-x-1.5 shadow-sm transition-all hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" />
          <span>Add Visa Page</span>
        </button>
      </div>

      {error && (
        <div className="flex flex-col p-6 bg-error-container/10 border border-error/30 rounded-card text-white space-y-3 font-sans">
          <div className="flex items-center space-x-2 text-error-red font-bold">
            <AlertCircle className="h-5 w-5 animate-pulse" />
            <span>Database Permission Denied</span>
          </div>
          <p className="text-xs text-on-primary-container/85 leading-relaxed">
            The app could not access the <span className="font-semibold font-mono text-secondary-container">visa_types</span> collection in your Firestore database. 
            This usually means you need to add security rules for this new collection in your Firebase Console online.
          </p>
          <div className="bg-primary-container/80 p-4 rounded border border-on-primary-fixed-variant/50 font-mono text-[10px] text-white overflow-x-auto space-y-1">
            <span className="text-on-primary-container/40 font-sans block font-bold mb-1">Recommended Firestore Security Rules:</span>
            <div>match /visa_types/&#123;document&#125; &#123;</div>
            <div className="pl-4 text-secondary-container">allow read: if true; <span className="text-on-primary-container/40 font-sans">// Allows public browsing of visa pages</span></div>
            <div className="pl-4 text-secondary-container">allow write: if request.auth != null; <span className="text-on-primary-container/40 font-sans">// Requires staff login to edit</span></div>
            <div>&#125;</div>
          </div>
        </div>
      )}

      {/* Search Input Card */}
      <div className="bg-primary-container/20 border border-on-primary-fixed-variant p-4 rounded-card flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="w-full md:max-w-xs relative">
          <input
            type="text"
            className="w-full pl-4 pr-10 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container placeholder-on-primary-container/30 rounded-button text-xs focus:outline-none focus:border-secondary"
            placeholder="Filter visa pages by name or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="text-[10px] text-on-primary-container/40 uppercase tracking-widest flex items-center gap-2">
          <ArrowUpDown className="h-3.5 w-3.5" />
          <span>Drag the grip handle <GripVertical className="h-3.5 w-3.5 inline text-secondary" /> to change site ordering</span>
        </div>
      </div>

      {/* Table Section */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <Loader2 className="h-8 w-8 text-secondary animate-spin" />
          <span className="text-xs text-on-primary-container/60">Loading CMS Pages...</span>
        </div>
      ) : filteredVisaTypes.length === 0 ? (
        <div className="border border-on-primary-fixed-variant bg-primary-container/40 rounded-card p-12 text-center space-y-3">
          <Globe className="h-10 w-10 text-on-primary-container/30 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Visa Pages Found</h3>
          <p className="text-xs text-on-primary-container/50 max-w-sm mx-auto">
            {searchQuery ? "No pages match your current filters." : "Start by creating a new visa service page or seed database in Settings."}
          </p>
          {!searchQuery && (
            <button
              onClick={() => navigate("/admin/settings")}
              className="mt-2 px-4 py-1.5 bg-white/5 border border-on-primary-fixed-variant text-on-primary-container hover:text-white hover:bg-white/10 text-xs font-semibold rounded transition-all"
            >
              Go to Settings to Seed
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-card border border-on-primary-fixed-variant bg-primary-container/40">
          <table className="min-w-full divide-y divide-outline-variant/15 text-left text-sm text-on-primary-container">
            <thead className="bg-primary-container/80 uppercase text-xs font-semibold text-on-primary-container/60 tracking-wider">
              <tr>
                <th className="px-6 py-4 w-12 text-center">Order</th>
                <th className="px-6 py-4">Visa Page Name</th>
                <th className="px-6 py-4">URL Slug</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Last Updated</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/15 bg-transparent">
              {filteredVisaTypes.map((v, index) => {
                const updatedTime = v.updatedAt?.seconds 
                  ? new Date(v.updatedAt.seconds * 1000) 
                  : v.updatedAt 
                    ? new Date(v.updatedAt) 
                    : new Date();

                return (
                  <tr 
                    key={v.id} 
                    className="hover:bg-white/5 transition-all duration-150 border-l-2 border-transparent"
                    onDragOver={(e) => handleDragOver(e, index)}
                  >
                    {/* Reorder grip */}
                    <td className="px-4 py-4 text-center">
                      <div 
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragEnd={handleDragEnd}
                        className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-white/5 text-on-primary-container/40 hover:text-secondary inline-block transition-colors"
                        title="Drag to reorder"
                      >
                        <GripVertical className="h-4.5 w-4.5" />
                      </div>
                    </td>

                    {/* Visa Name & tagline */}
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{v.name}</div>
                      <div className="text-[10px] text-on-primary-container/50 truncate max-w-xs">{v.tagline}</div>
                    </td>

                    {/* Slug */}
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs bg-primary-container px-2 py-0.5 rounded border border-on-primary-fixed-variant/50 text-secondary">
                        /visa/{v.slug}
                      </span>
                    </td>

                    {/* Publish Status Toggle */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleTogglePublish(v)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                            v.isPublished ? "bg-success-green" : "bg-on-primary-fixed-variant"
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 ${
                              v.isPublished ? "translate-x-4.5" : "translate-x-1"
                            }`}
                          />
                        </button>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${v.isPublished ? "text-success-green" : "text-on-primary-container/40"}`}>
                          {v.isPublished ? "Live" : "Draft"}
                        </span>
                      </div>
                    </td>

                    {/* Last Updated */}
                    <td className="px-6 py-4 text-xs text-on-primary-container/70">
                      {formatShortDate(updatedTime)}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {v.isPublished && (
                          <a
                            href={`/visa/${v.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-white/5 border border-on-primary-fixed-variant hover:border-secondary hover:text-secondary text-on-primary-container rounded transition-colors"
                            title="View Public Page"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => navigate(`/admin/visa-types/${v.id}/edit`)}
                          className="p-1.5 bg-white/5 border border-on-primary-fixed-variant hover:border-secondary hover:text-secondary text-on-primary-container rounded transition-colors"
                          title="Edit Content"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(v)}
                          className="p-1.5 bg-white/5 border border-on-primary-fixed-variant hover:border-error-red hover:text-error-red text-on-primary-container rounded transition-colors"
                          title="Delete Page"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-primary-container border border-on-primary-fixed-variant max-w-sm w-full rounded-card p-6 shadow-xl space-y-4 animate-[fadeIn_0.15s_ease-out]">
            <h3 className="text-base font-bold text-white">Delete Visa Page?</h3>
            <p className="text-xs text-on-primary-container/70 leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-white">"{deleteTarget.name}"</span>? 
              This will remove the page from the website immediately. This action cannot be undone.
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
                  <span>Delete Page</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisaTypesListPage;
