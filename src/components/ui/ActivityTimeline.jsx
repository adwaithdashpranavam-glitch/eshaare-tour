import React, { useState } from "react";
import { MessageSquare, Phone, Mail, CheckSquare, RefreshCw, FileText, Send, User } from "lucide-react";
import { formatDate } from "../../utils/formatters";

export const ActivityTimeline = ({ 
  activities = [], 
  onAdd 
}) => {
  const [activeTab, setActiveTab] = useState("note");
  const [content, setContent] = useState("");
  const [callOutcome, setCallOutcome] = useState("No Answer");
  const [taskDueDate, setTaskDueDate] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim() && activeTab !== "call") return;

    let payload = {
      type: activeTab,
      content: content.trim(),
      createdAt: new Date()
    };

    if (activeTab === "call") {
      payload.content = `Call Logged - Outcome: ${callOutcome}. Notes: ${content.trim() || "None"}`;
    } else if (activeTab === "task") {
      payload.content = `Task Created: ${content.trim()}${taskDueDate ? ` | Due Date: ${taskDueDate}` : ""}`;
      payload.dueDate = taskDueDate;
    }

    if (onAdd) {
      onAdd(payload);
    }
    
    setContent("");
    setTaskDueDate("");
  };

  const getIcon = (type) => {
    const base = "h-4 w-4";
    switch (type) {
      case "note":
        return <MessageSquare className={base} />;
      case "call":
        return <Phone className={base} />;
      case "email":
        return <Mail className={base} />;
      case "task":
        return <CheckSquare className={base} />;
      case "status":
      case "status_change":
        return <RefreshCw className={base} />;
      case "document":
        return <FileText className={base} />;
      default:
        return <User className={base} />;
    }
  };

  const getIconColor = (type) => {
    switch (type) {
      case "note":
        return "text-secondary bg-secondary-container/10 border-secondary/20";
      case "call":
        return "text-success bg-success/10 border-success/20";
      case "email":
        return "text-info bg-info/10 border-info/20";
      case "task":
        return "text-warning bg-warning/10 border-warning/20";
      case "status":
      case "status_change":
        return "text-purple-400 bg-purple-500/10 border-purple-500/20";
      case "document":
        return "text-on-primary-container bg-white/5 border-on-primary-fixed-variant";
      default:
        return "text-on-primary-container bg-white/5 border-on-primary-fixed-variant";
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Activity Add Tabs Form */}
      {onAdd && (
        <form onSubmit={handleSubmit} className="bg-primary-container border border-on-primary-fixed-variant/60 p-4 rounded-card space-y-4">
          <div className="flex border-b border-on-primary-fixed-variant pb-2">
            {[
              { id: "note", label: "Add Note", icon: MessageSquare },
              { id: "call", label: "Log Call", icon: Phone },
              { id: "task", label: "Create Task", icon: CheckSquare }
            ].map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 border-b-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
                    activeTab === tab.id
                      ? "border-secondary text-secondary"
                      : "border-transparent text-on-primary-container/50 hover:text-white"
                  }`}
                >
                  <TabIcon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="space-y-3">
            {activeTab === "call" && (
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <span className="text-xs font-semibold text-on-primary-container/60 uppercase font-sans">Outcome:</span>
                <div className="flex flex-wrap gap-2">
                  {["Answered", "No Answer", "Busy", "Wrong Number"].map((outcome) => (
                    <button
                      key={outcome}
                      type="button"
                      onClick={() => setCallOutcome(outcome)}
                      className={`px-3 py-1 rounded text-xs border font-semibold transition-colors ${
                        callOutcome === outcome
                          ? "bg-secondary-container border-secondary text-on-primary-fixed"
                          : "bg-primary-container border-on-primary-fixed-variant text-on-primary-container hover:border-secondary/40"
                      }`}
                    >
                      {outcome}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "task" && (
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <span className="text-xs font-semibold text-on-primary-container/60 uppercase font-sans">Due Date:</span>
                <input
                  type="date"
                  className="px-3 py-1.5 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container text-xs rounded focus:outline-none"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                />
              </div>
            )}

            <div className="relative">
              <textarea
                className="w-full px-4 py-3 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container rounded-button text-sm focus:outline-none focus:border-secondary"
                rows={3}
                placeholder={
                  activeTab === "note" 
                    ? "Type internal follow-up notes here..." 
                    : activeTab === "call" 
                    ? "Enter call details and next steps..." 
                    : "Task title and details..."
                }
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <button
                type="submit"
                className="absolute bottom-3.5 right-3.5 p-1.5 bg-secondary-container hover:bg-secondary-container text-on-primary-fixed rounded-lg shadow-sm transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Timeline Stream */}
      <div className="flow-root">
        <ul className="-mb-8">
          {activities.length === 0 ? (
            <div className="text-center py-6 text-xs text-on-primary-container/40 italic font-sans">
              No logged activities or notes yet.
            </div>
          ) : (
            activities.map((item, idx) => (
              <li key={item.id || idx}>
                <div className="relative pb-8">
                  {idx !== activities.length - 1 && (
                    <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-on-primary-fixed-variant" aria-hidden="true"></span>
                  )}
                  <div className="relative flex space-x-3">
                    <div>
                      <span className={`h-8 w-8 rounded-full border flex items-center justify-center ${getIconColor(item.type)}`}>
                        {getIcon(item.type)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 pt-1.5">
                      <div className="flex justify-between items-center space-x-4">
                        <div className="text-sm font-semibold text-white">
                          {item.authorName || "System"}
                        </div>
                        <div className="text-xs text-on-primary-container/40 font-mono">
                          {formatDate(item.createdAt)}
                        </div>
                      </div>
                      <p className="text-sm text-on-primary-container/80 mt-1 font-sans leading-relaxed whitespace-pre-wrap">
                        {item.content}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};

export default ActivityTimeline;
