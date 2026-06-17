import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, addDoc, updateDoc, doc, query, where } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { 
  DndContext, 
  useDraggable, 
  useDroppable, 
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor
} from "@dnd-kit/core";
import { 
  Plus, Upload, Search, Table, Kanban, ArrowRight, 
  Trash2, UserPlus, FileEdit, Check, RefreshCw 
} from "lucide-react";
import StatusBadge from "../../components/ui/StatusBadge";
import FilterBar from "../../components/ui/FilterBar";
import Modal from "../../components/ui/Modal";
import SearchInput from "../../components/ui/SearchInput";
import { LEAD_STAGES, SOURCE_OPTIONS } from "../../utils/constants";
import { formatShortDate } from "../../utils/formatters";
import { generateLeadNo } from "../../utils/helpers";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";

// Get flag emoji helper
const getFlag = (dest) => {
  if (!dest) return "✈️";
  const d = dest.toLowerCase();
  if (d.includes("france")) return "🇫🇷";
  if (d.includes("germany")) return "🇩🇪";
  if (d.includes("switzerland")) return "🇨🇭";
  if (d.includes("united kingdom") || d.includes("uk")) return "🇬🇧";
  if (d.includes("united states") || d.includes("usa")) return "🇺🇸";
  if (d.includes("uae") || d.includes("emirates")) return "🇦🇪";
  if (d.includes("saudi")) return "🇸🇦";
  if (d.includes("japan")) return "🇯🇵";
  if (d.includes("schengen")) return "🇪🇺";
  return "✈️";
};

// Get initials helper
const getInitials = (name) => {
  if (!name || name === "Unassigned") return "U";
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
};

// Get days ago helper
const getDaysAgo = (timestamp) => {
  if (!timestamp) return "Recently";
  let dateObj = timestamp;
  if (timestamp.toDate && typeof timestamp.toDate === "function") {
    dateObj = timestamp.toDate();
  } else if (timestamp.seconds) {
    dateObj = new Date(timestamp.seconds * 1000);
  } else {
    dateObj = new Date(timestamp);
  }
  const diffTime = Math.abs(new Date() - dateObj);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays <= 1) return "Today";
  if (diffDays === 2) return "1 day ago";
  return `${diffDays - 1} days ago`;
};

// Reusable Inner Lead Card Presentational Component
const KanbanCardInner = ({ lead, isDragging, ...props }) => {
  const isUrgent = lead.priority === "High" || lead.priority === "Urgent";
  return (
    <div
      {...props}
      className={`glass-card p-4 bg-primary-container/95 hover:border-secondary/40 transition-all select-none rounded-[16px] text-left space-y-3 cursor-grab active:cursor-grabbing border ${
        isUrgent ? "border-l-[3.5px] border-l-secondary border-t-primary-container border-r-primary-container border-b-primary-container" : "border-on-primary-fixed-variant/60"
      } ${isDragging ? "opacity-30" : "opacity-100"}`}
    >
      <div className="flex justify-between items-start">
        <h4 className="text-xs font-bold text-on-primary-container truncate max-w-[130px]">{lead.contactName}</h4>
        <span className="text-[9px] font-mono text-secondary">{lead.leadNo}</span>
      </div>

      <p className="text-[10px] text-on-primary-container/60 font-mono leading-none">{lead.contactPhone}</p>
      
      <div className="flex items-center space-x-1.5 text-[10px] text-white/90 font-sans">
        <span className="text-sm leading-none">{getFlag(lead.destination)}</span>
        <span className="font-semibold truncate">{lead.destination}</span>
      </div>

      <div className="flex flex-wrap gap-1.5 pt-1">
        <span className="px-2 py-0.5 rounded-badge bg-primary-container text-secondary-fixed text-[9px] font-bold uppercase tracking-wider border border-outline-variant/10">
          {lead.visaType || "Visa"}
        </span>
        <span className="px-2 py-0.5 rounded-badge bg-primary-container text-on-primary-container/70 text-[9px] font-bold uppercase tracking-wider border border-outline-variant/10">
          {lead.source}
        </span>
      </div>

      <div className="flex justify-between items-center border-t border-on-primary-fixed-variant/80 pt-2.5">
        <div className="flex items-center space-x-1.5">
          <div 
            className="h-5 w-5 rounded-full bg-gradient-to-br from-secondary-container to-secondary-container text-on-primary-fixed font-bold text-[8px] flex items-center justify-center border border-primary-container shadow-sm"
            title={`Assigned to: ${lead.assignedTo || "Unassigned"}`}
          >
            {getInitials(lead.assignedTo)}
          </div>
          <span className="text-[9px] text-on-primary-container/50 truncate max-w-[80px] font-medium">
            {lead.assignedTo || "Unassigned"}
          </span>
        </div>
        <span className="text-[9px] text-on-primary-container/40 font-mono">{getDaysAgo(lead.createdAt)}</span>
      </div>
    </div>
  );
};

// Draggable card component wrapper
const KanbanCard = ({ lead }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 100,
  } : undefined;

  const navigate = useNavigate();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        // Prevent click when dragging
        if (transform) return;
        navigate(`/admin/leads/${lead.id}`);
      }}
    >
      <KanbanCardInner lead={lead} isDragging={isDragging} />
    </div>
  );
};

// Droppable column component
const KanbanColumn = ({ stage, id, leads = [] }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  return (
    <div 
      ref={setNodeRef}
      className={`flex flex-col space-y-4 p-4 rounded-card transition-colors w-72 flex-shrink-0 bg-on-primary-fixed-variant border ${
        isOver ? "border-secondary shadow-sm/5" : "border-on-primary-fixed-variant/60"
      }`}
    >
      <div className={`flex items-center justify-between pb-2 border-b transition-colors ${
        isOver ? "border-secondary" : "border-on-primary-fixed-variant/60"
      }`}>
        <span className="text-xs font-bold text-white uppercase tracking-wider">{stage}</span>
        <span className="px-2 py-0.5 rounded-badge bg-primary-container text-secondary-fixed text-[10px] font-bold border border-outline-variant/10">
          {leads.length}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 max-h-[calc(100vh-300px)] min-h-[350px]">
        {leads.map(lead => (
          <KanbanCard key={lead.id} lead={lead} />
        ))}
        {leads.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 border border-dashed border-on-primary-fixed-variant/40 rounded-card text-on-primary-container/30 text-[10px] font-sans">
            Drop leads here
          </div>
        )}
      </div>
    </div>
  );
};

export const LeadsListPage = () => {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const isSales = userProfile?.role === "sales";

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("table"); // table or kanban
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [activeId, setActiveId] = useState(null);

  // Setup sensors for dnd-kit to prevent accidental drags on clicks
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Filters
  const [filters, setFilters] = useState({
    stage: "All",
    source: "All",
    assignedTo: "All"
  });

  // Add lead form state
  const [newLead, setNewLead] = useState({
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    nationality: "",
    destination: "Schengen",
    source: "Walk-in",
    stage: "New",
    assignedTo: "Unassigned"
  });

  useEffect(() => {
    if (!user) return;
    // Realtime Listener with role filtering
    const leadsRef = collection(db, "leads");
    let q = query(leadsRef, where("isDeleted", "==", false));
    if (isSales) {
      q = query(leadsRef, where("isDeleted", "==", false), where("assignedToId", "==", user.uid));
    }
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(l => !l.isDeleted);
      setLeads(items);
      setLoading(false);
    }, (error) => {
      console.error("Leads list snapshot error:", error);
      setLeads([]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const leadId = active.id;
    const nextStage = over.id; // column ID corresponds to stage key

    const leadToMove = leads.find(l => l.id === leadId);
    if (!leadToMove || leadToMove.stage === nextStage) return;

    // Save previous state for rollback
    const previousLeads = [...leads];

    // Optimistic update: move card instantly in React state
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, stage: nextStage } : l));

    try {
      const leadRef = doc(db, "leads", leadId);
      await updateDoc(leadRef, { stage: nextStage });
      // Show mini toast on stage change success
      toast.success(`Lead moved to ${nextStage}`, { id: "stage-change-success" });
    } catch (err) {
      console.error("Failed to update lead stage in Firestore:", err);
      // Revert on Firestore error
      setLeads(previousLeads);
      toast.error(`Failed to move lead to ${nextStage}. Reverting changes...`);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const generatedNo = await generateLeadNo();
      const collRef = collection(db, "leads");
      await addDoc(collRef, {
        ...newLead,
        leadNo: generatedNo,
        isDeleted: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      toast.success("Lead created successfully!");
      setIsAddOpen(false);
      setNewLead({
        contactName: "",
        contactPhone: "",
        contactEmail: "",
        nationality: "",
        destination: "Schengen",
        source: "Walk-in",
        stage: "New",
        assignedTo: "Unassigned"
      });
    } catch (err) {
      console.error(err);
      toast.error("Error creating lead");
    }
  };

  // Perform client side search and filters, taking role-based assignments into account
  const filteredLeads = leads.filter(lead => {
    // Role filter: If role is sales, restrict leads to those assigned to the current user
    if (isSales) {
      const isAssigned = 
        lead.ownerId === user?.uid || 
        lead.assignedToId === user?.uid || 
        (userProfile?.name && lead.assignedTo === userProfile.name);
      if (!isAssigned) return false;
    }

    const matchesSearch = 
      lead.contactName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.contactPhone?.includes(searchQuery) ||
      lead.contactEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.leadNo?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStage = filters.stage === "All" || lead.stage === filters.stage;
    const matchesSource = filters.source === "All" || lead.source === filters.source;

    return matchesSearch && matchesStage && matchesSource;
  });

  const filterConfigs = [
    {
      key: "stage",
      label: "Stage",
      value: filters.stage,
      options: Object.values(LEAD_STAGES).map(s => ({ value: s, label: s }))
    },
    {
      key: "source",
      label: "Source",
      value: filters.source,
      options: Object.values(SOURCE_OPTIONS).map(s => ({ value: s, label: s }))
    }
  ];

  return (
    <div className="space-y-6 font-sans">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-wide">Leads</h1>
          <p className="text-xs text-on-primary-container/50">Manage enquiries, inbound prospects and outbound followups.</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setViewMode(viewMode === "table" ? "kanban" : "table")}
            className="px-3 py-2 bg-primary-container border border-on-primary-fixed-variant hover:bg-primary-container text-on-primary-container/80 rounded-button text-xs font-semibold flex items-center space-x-1.5"
          >
            {viewMode === "table" ? <Kanban className="h-4 w-4 text-secondary" /> : <Table className="h-4 w-4 text-secondary" />}
            <span>{viewMode === "table" ? "Kanban Board" : "Table View"}</span>
          </button>
          
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-secondary-container to-secondary-container text-on-primary-fixed font-bold text-xs rounded-button flex items-center space-x-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="w-full md:max-w-xs">
          <SearchInput
            placeholder="Search leads by name, email, ref..."
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </div>
        <div className="w-full md:w-auto">
          <FilterBar
            filters={filterConfigs}
            onChange={handleFilterChange}
            onClearAll={() => setFilters({ stage: "All", source: "All", assignedTo: "All" })}
          />
        </div>
      </div>

      {/* TABLE VIEW */}
      {viewMode === "table" && (
        <div className="overflow-x-auto rounded-card border border-on-primary-fixed-variant bg-primary-container/40">
          <table className="min-w-full divide-y divide-outline-variant/15 text-left text-sm text-on-primary-container">
            <thead className="bg-primary-container/80 uppercase text-xs font-semibold text-on-primary-container/60 font-sans tracking-wider">
              <tr>
                <th className="px-6 py-4">Lead #</th>
                <th className="px-6 py-4">Full Name</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Destination</th>
                <th className="px-6 py-4">Source</th>
                <th className="px-6 py-4">Assigned To</th>
                <th className="px-6 py-4">Stage</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/15 bg-transparent">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-secondary text-xs">{lead.leadNo}</td>
                  <td className="px-6 py-4 font-semibold text-white">{lead.contactName}</td>
                  <td className="px-6 py-4 text-xs font-mono">{lead.contactPhone}</td>
                  <td className="px-6 py-4 text-xs">{lead.destination}</td>
                  <td className="px-6 py-4"><StatusBadge status={lead.source} /></td>
                  <td className="px-6 py-4 text-xs font-semibold text-white/80">{lead.assignedTo || "Unassigned"}</td>
                  <td className="px-6 py-4"><StatusBadge status={lead.stage} /></td>
                  <td className="px-6 py-4 text-xs font-mono">{formatShortDate(lead.createdAt)}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => navigate(`/admin/leads/${lead.id}`)}
                      className="px-3 py-1 bg-white/5 border border-on-primary-fixed-variant hover:border-secondary hover:text-secondary text-on-primary-container text-[10px] font-bold uppercase rounded transition-colors"
                    >
                      View Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* KANBAN BOARD VIEW */}
      {viewMode === "kanban" && (
        <DndContext 
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="flex space-x-4 overflow-x-auto pb-6 pt-2 max-w-full">
            {Object.values(LEAD_STAGES).map(stage => (
              <KanbanColumn
                key={stage}
                id={stage}
                stage={stage}
                leads={filteredLeads.filter(l => l.stage === stage)}
              />
            ))}
          </div>

          <DragOverlay>
            {activeId ? (
              <div className="rotate-2 scale-[1.01] shadow-sm/20 shadow-2xl opacity-90 transition-transform">
                <KanbanCardInner lead={leads.find(l => l.id === activeId)} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Add Lead Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add New Lead"
        size="md"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 font-sans text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] font-bold text-on-primary-container/50 uppercase tracking-wider">Full Name *</label>
              <input
                type="text"
                required
                className="px-3.5 py-2.5 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container placeholder-on-primary-container/20 rounded focus:outline-none focus:border-secondary"
                placeholder="Client name"
                value={newLead.contactName}
                onChange={(e) => setNewLead({ ...newLead, contactName: e.target.value })}
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] font-bold text-on-primary-container/50 uppercase tracking-wider">Phone *</label>
              <input
                type="tel"
                required
                className="px-3.5 py-2.5 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container placeholder-on-primary-container/20 rounded focus:outline-none focus:border-secondary"
                placeholder="+97150..."
                value={newLead.contactPhone}
                onChange={(e) => setNewLead({ ...newLead, contactPhone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] font-bold text-on-primary-container/50 uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                className="px-3.5 py-2.5 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container placeholder-on-primary-container/20 rounded focus:outline-none focus:border-secondary"
                placeholder="name@example.com"
                value={newLead.contactEmail}
                onChange={(e) => setNewLead({ ...newLead, contactEmail: e.target.value })}
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] font-bold text-on-primary-container/50 uppercase tracking-wider">Nationality</label>
              <input
                type="text"
                className="px-3.5 py-2.5 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container placeholder-on-primary-container/20 rounded focus:outline-none focus:border-secondary"
                placeholder="e.g. Lebanese"
                value={newLead.nationality}
                onChange={(e) => setNewLead({ ...newLead, nationality: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] font-bold text-on-primary-container/50 uppercase tracking-wider">Destination</label>
              <select
                className="px-3.5 py-2.5 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container rounded focus:outline-none focus:border-secondary"
                value={newLead.destination}
                onChange={(e) => setNewLead({ ...newLead, destination: e.target.value })}
              >
                <option value="Schengen">Schengen</option>
                <option value="UK">UK</option>
                <option value="USA">USA</option>
                <option value="Saudi">Saudi</option>
                <option value="Japan">Japan</option>
              </select>
            </div>
            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] font-bold text-on-primary-container/50 uppercase tracking-wider">Source</label>
              <select
                className="px-3.5 py-2.5 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container rounded focus:outline-none focus:border-secondary"
                value={newLead.source}
                onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
              >
                <option value="WhatsApp">WhatsApp</option>
                <option value="Website">Website</option>
                <option value="Instagram">Instagram</option>
                <option value="Referral">Referral</option>
                <option value="Walk-in">Walk-in</option>
              </select>
            </div>
          </div>

          <div className="flex space-x-3 pt-6 border-t border-on-primary-fixed-variant">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="flex-1 py-2.5 bg-on-primary-fixed-variant border border-on-primary-fixed-variant text-on-primary-container font-semibold rounded-button text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-gradient-to-r from-secondary-container to-secondary-container text-on-primary-fixed font-bold rounded-button text-xs shadow-sm"
            >
              Save Lead
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default LeadsListPage;
