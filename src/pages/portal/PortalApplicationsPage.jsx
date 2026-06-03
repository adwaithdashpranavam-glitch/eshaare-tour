import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { Link } from "react-router-dom";
import { FileText, Compass, ChevronRight } from "lucide-react";
import StatusBadge from "../../components/ui/StatusBadge";
import { formatShortDate } from "../../utils/formatters";

export const PortalApplicationsPage = () => {
  const { userProfile } = useAuth();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.email) return;

    const casesRef = collection(db, "visa_cases");
    const q = query(casesRef, where("travellerEmail", "==", userProfile.email.toLowerCase()));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setCases(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
      setLoading(false);
    }, (error) => {
      console.warn("Using mock user cases:", error);
      setCases([
        { id: "1", caseNo: "VC-20260601-002", visaType: "UK Visa", destination: "United Kingdom", stage: "Docs Pending", createdAt: new Date() }
      ]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile]);

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-white tracking-wide">My Applications</h1>
        <p className="text-xs text-on-primary-container/50">Track dossier uploads, submissions, slot timings, and embassy outcomes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cases.map((c) => (
          <div key={c.id} className="glass-card p-6 border border-on-primary-fixed-variant/60 flex flex-col justify-between space-y-4 hover:border-secondary/20 transition-all">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono text-secondary">{c.caseNo}</span>
                <h3 className="text-base font-semibold text-white mt-1">{c.visaType} to {c.destination}</h3>
              </div>
              <StatusBadge status={c.stage} />
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-on-primary-fixed-variant text-xs text-on-primary-container/40">
              <span>Date Submitted: {formatShortDate(c.createdAt)}</span>
              <Link
                to={`/portal/applications/${c.id}`}
                className="text-secondary hover:text-secondary-fixed-dim font-bold uppercase tracking-wider flex items-center space-x-1"
              >
                <span>Track Details</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ))}

        {cases.length === 0 && !loading && (
          <div className="col-span-2 text-center py-12 text-xs text-on-primary-container/40 italic">
            You do not have any visa application cases registered under your email yet.
          </div>
        )}
      </div>

    </div>
  );
};

export default PortalApplicationsPage;
