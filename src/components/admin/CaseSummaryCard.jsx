import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import {
  User,
  Globe,
  FileText,
  Hash,
  Calendar,
  CreditCard,
  Activity,
  CheckSquare,
  UserCheck,
  ExternalLink,
  Mail,
  FolderOpen,
} from "lucide-react";
import {
  deriveApplicationPipelineStatus,
  getPipelineStatusLabel,
  countReadyDeliverables,
  TOTAL_DELIVERABLES,
  formatDeliverableDate,
} from "../../utils/caseWorkspace";

// Right-rail "Case Summary" card for the admin Case Workspace. Replaces the old
// Timeline Benchmarks + Financial Ledger panels (payment is already confirmed by
// the time a case reaches this workspace). Read-only operational snapshot plus
// quick actions; the financial ledger is intentionally NOT shown here.
export default function CaseSummaryCard({ caseData, applicationId }) {
  const [appData, setAppData] = useState(null);

  useEffect(() => {
    if (!applicationId) return;
    const appRef = doc(db, "applications", applicationId);
    const unsub = onSnapshot(
      appRef,
      (snap) => setAppData(snap.exists() ? snap.data() : null),
      (err) => console.warn("CaseSummaryCard application load failed:", err?.message)
    );
    return () => unsub();
  }, [applicationId]);

  const effStatus = deriveApplicationPipelineStatus(appData);
  const statusLabel = effStatus ? getPipelineStatusLabel(effStatus) : "In Progress";
  const readyCount = countReadyDeliverables(appData);
  const paymentStatus = appData?.paymentStatus || caseData?.paymentStatus || "—";
  const submittedAt =
    formatDeliverableDate(appData?.submittedAt) ||
    formatDeliverableDate(caseData?.createdAt) ||
    "—";
  const appRef = applicationId
    ? `ES-SCH-${applicationId.substring(0, 8).toUpperCase()}`
    : caseData?.caseNo || "—";
  const officer = caseData?.assignedOfficer || caseData?.assignedOfficerName || "Visa Ops Officer";
  const email = caseData?.travellerEmail || "";

  const Row = ({ icon: Icon, label, children }) => (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-[10px] text-on-primary-container/50 uppercase flex items-center gap-1.5">
        <Icon className="h-3 w-3" /> {label}
      </span>
      <span className="text-xs font-semibold text-white text-right truncate max-w-[60%]">
        {children}
      </span>
    </div>
  );

  return (
    <div className="glass-card p-6 border border-on-primary-fixed-variant/60 space-y-4 font-sans">
      <h3 className="text-sm font-semibold text-white border-b border-on-primary-fixed-variant pb-2 flex items-center gap-2">
        <Activity className="h-4 w-4 text-secondary" /> Case Summary
      </h3>

      <div className="divide-y divide-on-primary-fixed-variant/30">
        <Row icon={User} label="Client">{caseData?.travellerName || "—"}</Row>
        <Row icon={Globe} label="Destination">{caseData?.destination || caseData?.destinationCountry || "—"}</Row>
        <Row icon={FileText} label="Visa Type">{caseData?.visaType || "—"}</Row>
        <Row icon={Hash} label="Application Ref">
          <span className="font-mono text-secondary">{appRef}</span>
        </Row>
        <Row icon={Calendar} label="Submitted">{submittedAt}</Row>
        <Row icon={CreditCard} label="Payment">
          <span className={paymentStatus === "paid" ? "text-success" : "text-warning"}>
            {paymentStatus === "paid" ? "Paid" : paymentStatus}
          </span>
        </Row>
        <Row icon={Activity} label="Case Status">
          <span className="text-secondary">{statusLabel}</span>
        </Row>
        <Row icon={CheckSquare} label="Deliverables">
          <span className={readyCount === TOTAL_DELIVERABLES ? "text-success" : "text-white"}>
            {readyCount} / {TOTAL_DELIVERABLES} Ready
          </span>
        </Row>
        <Row icon={UserCheck} label="Assigned Officer">{officer}</Row>
      </div>

      {/* Quick actions */}
      <div className="pt-2 space-y-2">
        {applicationId && (
          <a
            href={`/portal/applications/${applicationId}/wizard`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2 px-3 bg-secondary-container hover:bg-secondary-container text-on-primary-fixed font-bold text-[11px] rounded-button uppercase tracking-wider flex items-center justify-center gap-1.5"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Open Client Application
          </a>
        )}
        {email && (
          <a
            href={`mailto:${email}`}
            className="w-full py-2 px-3 bg-primary-container border border-on-primary-fixed-variant hover:border-secondary text-on-primary-container hover:text-white font-bold text-[11px] rounded-button uppercase tracking-wider flex items-center justify-center gap-1.5"
          >
            <Mail className="h-3.5 w-3.5" /> Message Client
          </a>
        )}
        <Link
          to="/admin/documents"
          className="w-full py-2 px-3 bg-primary-container border border-on-primary-fixed-variant hover:border-secondary text-on-primary-container hover:text-white font-bold text-[11px] rounded-button uppercase tracking-wider flex items-center justify-center gap-1.5"
        >
          <FolderOpen className="h-3.5 w-3.5" /> View Documents
        </Link>
      </div>
    </div>
  );
}
