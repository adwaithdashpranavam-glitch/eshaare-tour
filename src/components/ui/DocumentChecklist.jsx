import React, { useState, useEffect } from "react";
import { doc, getDoc, collection, query, where, onSnapshot, updateDoc, addDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { Check, X, FileText, AlertCircle, Upload, Eye, MessageCircle, RefreshCw } from "lucide-react";
import StatusBadge from "./StatusBadge";
import FileUpload from "./FileUpload";
import PortalUploadModal from "./PortalUploadModal";
import Modal from "./Modal";
import { useAuth } from "../../contexts/AuthContext";
import { VISA_REQUIREMENTS } from "../../utils/constants";
import toast from "react-hot-toast";

export const DocumentChecklist = ({ 
  caseId, 
  visaType, 
  travellerId, 
  isAdmin = false 
}) => {
  const { user, userProfile } = useAuth();
  
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [caseDetails, setCaseDetails] = useState(null);

  // Modals state
  const [activeUploadDoc, setActiveUploadDoc] = useState(null);
  const [activeRejectDoc, setActiveRejectDoc] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [activeWhatsAppDoc, setActiveWhatsAppDoc] = useState(null);
  const [whatsAppMessage, setWhatsAppMessage] = useState("");
  const [whatsAppType, setWhatsAppType] = useState("Pending"); // 'Pending' | 'Rejected'

  // Fetch case details for metadata (like phone and client name)
  useEffect(() => {
    if (!caseId) return;
    const caseRef = doc(db, "visa_cases", caseId);
    const unsubscribe = onSnapshot(caseRef, (snap) => {
      if (snap.exists()) {
        setCaseDetails(snap.data());
      }
    }, () => {});
    return unsubscribe;
  }, [caseId]);

  // Main fetch & merge logic
  useEffect(() => {
    if (!caseId || !visaType) return;

    setLoading(true);

    // 1. Fetch settings/visaTypes
    const fetchVisaTypes = async () => {
      try {
        const typesRef = doc(db, "settings", "visaTypes");
        const snap = await getDoc(typesRef);
        let reqDocs = [];
        if (snap.exists()) {
          const data = snap.data();
          const key = Object.keys(data).find(k => k.toLowerCase() === visaType.toLowerCase());
          if (key) {
            reqDocs = data[key]?.requiredDocs || data[key]?.requiredDocuments || data[key]?.docs || data[key] || [];
          }
        }
        
        // Fallback to local requirements if empty
        if (!Array.isArray(reqDocs) || reqDocs.length === 0) {
          const normKey = Object.keys(VISA_REQUIREMENTS).find(k => visaType.toLowerCase().includes(k.toLowerCase())) || "Schengen";
          reqDocs = VISA_REQUIREMENTS[normKey] || [];
        }
        return reqDocs;
      } catch (err) {
        console.warn("Failed to fetch settings/visaTypes, using local fallback:", err);
        const normKey = Object.keys(VISA_REQUIREMENTS).find(k => visaType.toLowerCase().includes(k.toLowerCase())) || "Schengen";
        return VISA_REQUIREMENTS[normKey] || [];
      }
    };

    let unsubscribeDocs = () => {};

    fetchVisaTypes().then((requiredDocs) => {
      // 2. Fetch existing documents from documents collection
      const docsRef = collection(db, "documents");
      const q = query(docsRef, where("visaCaseId", "==", caseId));
      
      unsubscribeDocs = onSnapshot(q, (snapshot) => {
        const uploadedDocs = snapshot.docs.map(d => ({ docId: d.id, ...d.data() }));

        // 3. Merge: for each required doc, check if uploaded document exists
        const merged = requiredDocs.map((docName, idx) => {
          const match = uploadedDocs.find(ud => 
            ud.type?.toLowerCase() === docName.toLowerCase() || 
            ud.docType?.toLowerCase() === docName.toLowerCase()
          );

          if (match) {
            return {
              id: idx,
              docId: match.docId,
              name: docName,
              status: match.verificationStatus === "Pending" ? "Uploaded" : (match.verificationStatus || match.status || "Uploaded"),
              fileUrl: match.fileUrl,
              uploadedBy: match.uploadedBy || "Client",
              rejectionReason: match.rejectionReason || "",
              docRecord: match
            };
          } else {
            return {
              id: idx,
              docId: null,
              name: docName,
              status: "Pending",
              fileUrl: "",
              uploadedBy: "",
              rejectionReason: ""
            };
          }
        });

        setItems(merged);
        setLoading(false);

        // Update overall progress on visa case document
        const verifiedCount = merged.filter(i => i.status === "Verified").length;
        const totalCount = merged.length;
        const progress = totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 0;
        
        const updateCaseProgress = async () => {
          try {
            const caseRef = doc(db, "visa_cases", caseId);
            await updateDoc(caseRef, { checklistProgress: progress });
          } catch (err) {
            console.error("Error updating checklist progress in case:", err);
          }
        };
        updateCaseProgress();

      }, (error) => {
        console.error("Error listening to documents:", error);
        setLoading(false);
      });
    });

    return () => {
      unsubscribeDocs();
    };
  }, [caseId, visaType]);

  const handleUploadSuccess = async (fileInfo) => {
    if (!activeUploadDoc) return;
    try {
      if (activeUploadDoc.docId) {
        // Replace existing document
        const docRef = doc(db, "documents", activeUploadDoc.docId);
        await updateDoc(docRef, {
          name: fileInfo.name,
          fileUrl: fileInfo.url,
          uploadedBy: userProfile?.name || user?.email || "Staff Agent",
          verificationStatus: "Uploaded",
          updatedAt: new Date(),
          rejectionReason: "" // Clear rejection reason on re-upload
        });
        toast.success(`Replaced ${activeUploadDoc.name} successfully!`);
      } else {
        // Create new document record in Firestore
        const docsRef = collection(db, "documents");
        await addDoc(docsRef, {
          name: fileInfo.name,
          type: activeUploadDoc.name,
          fileUrl: fileInfo.url,
          travellerId: travellerId || "general",
          visaCaseId: caseId,
          uploadedBy: userProfile?.name || user?.email || "Client",
          verificationStatus: "Uploaded",
          createdAt: new Date()
        });
        toast.success(`${activeUploadDoc.name} uploaded successfully!`);
      }
      setActiveUploadDoc(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to record document upload");
    }
  };

  const handleVerify = async (item) => {
    if (!item.docId) return;
    try {
      const docRef = doc(db, "documents", item.docId);
      await updateDoc(docRef, { verificationStatus: "Verified" });
      toast.success(`${item.name} Verified!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to verify document");
    }
  };

  const handleRejectSubmit = async () => {
    if (!activeRejectDoc || !rejectReason.trim()) return;
    try {
      const docRef = doc(db, "documents", activeRejectDoc.docId);
      await updateDoc(docRef, {
        verificationStatus: "Rejected",
        rejectionReason: rejectReason.trim(),
        rejectedAt: new Date()
      });
      toast.success(`${activeRejectDoc.name} marked as rejected`);
      setActiveRejectDoc(null);
      setRejectReason("");
    } catch (err) {
      console.error(err);
      toast.error("Failed to reject document");
    }
  };

  // WhatsApp helper trigger
  const handleWhatsAppOpen = (item, type = "Pending") => {
    setWhatsAppType(type);
    const clientName = caseDetails?.travellerName || "Client";
    const visa = caseDetails?.visaType || visaType || "Visa";
    
    let msg = "";
    if (type === "Rejected") {
      msg = `Hi ${clientName}, this is ESHAARE travel support. The "${item.name}" you uploaded for your ${visa} application was rejected for the following reason: "${item.rejectionReason || "Details not clear"}". Please log into your client portal and upload a revised document. Thank you!`;
    } else {
      msg = `Hi ${clientName}, this is ESHAARE travel support. We require you to upload the following document for your ${visa} application: "${item.name}". Please log into your client portal to upload it. Thank you!`;
    }

    setWhatsAppMessage(msg);
    setActiveWhatsAppDoc(item);
  };

  const triggerWhatsAppSend = () => {
    const phone = caseDetails?.travellerPhone || "";
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsAppMessage)}`;
    window.open(url, "_blank");
    setActiveWhatsAppDoc(null);
  };

  const completedCount = items.filter(i => i.status === "Verified").length;
  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 space-x-2 text-secondary text-xs font-mono">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span>Syncing dossier documents...</span>
      </div>
    );
  }

  return (
    <div className="w-full space-y-5 font-sans">
      
      {/* Progress Bar (Gold fill, navy background) */}
      <div className="bg-primary-container border border-on-primary-fixed-variant p-4 rounded-[16px] shadow-inner">
        <div className="flex justify-between items-center mb-2 text-xs font-sans">
          <span className="font-semibold uppercase tracking-wider text-on-primary-container/50 text-[10px]">Dossier Completion</span>
          <span className="font-mono font-bold text-secondary">{completedCount} of {totalCount} documents complete ({progressPercent}%)</span>
        </div>
        <div className="w-full bg-primary-container rounded-full h-2 overflow-hidden border border-on-primary-fixed-variant">
          <div 
            className="bg-secondary-container h-2 rounded-full transition-all duration-500 shadow-sm"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Render as table (desktop) */}
      <div className="hidden md:block overflow-x-auto rounded-[16px] border border-on-primary-fixed-variant/60 bg-primary-container/40">
        <table className="min-w-full divide-y divide-outline-variant/15 text-left text-xs text-on-primary-container font-sans">
          <thead className="bg-primary-container uppercase font-semibold text-on-primary-container/60 tracking-wider">
            <tr>
              <th className="px-6 py-3.5">Document Name</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5">Uploaded File</th>
              <th className="px-6 py-3.5">Uploaded By</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/15 bg-transparent">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-semibold text-white">{item.name}</td>
                <td className="px-6 py-4">
                  {item.status === "Pending" && (
                    <span className="px-2.5 py-0.5 rounded-badge bg-warning/10 text-warning border border-warning/20 text-[9px] font-bold uppercase tracking-wider">
                      Pending Upload
                    </span>
                  )}
                  {item.status === "Uploaded" && (
                    <span className="px-2.5 py-0.5 rounded-badge bg-on-primary-fixed-variant text-on-primary-container/50 border border-on-primary-fixed-variant text-[9px] font-bold uppercase tracking-wider">
                      Under Review
                    </span>
                  )}
                  {item.status === "Verified" && (
                    <span className="px-2.5 py-0.5 rounded-badge bg-success/10 text-success border border-success/20 text-[9px] font-bold uppercase tracking-wider flex items-center w-fit">
                      ✓ Verified
                    </span>
                  )}
                  {item.status === "Rejected" && (
                    <span className="px-2.5 py-0.5 rounded-badge bg-danger/10 text-danger border border-danger/20 text-[9px] font-bold uppercase tracking-wider relative group cursor-help w-fit block">
                      Rejected
                      {item.rejectionReason && (
                        <div className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container text-[10px] rounded shadow-2xl z-50 min-w-[200px] text-center normal-case font-normal leading-relaxed">
                          Reason: {item.rejectionReason}
                        </div>
                      )}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 truncate max-w-[150px]">
                  {item.fileUrl ? (
                    <a 
                      href={item.fileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-secondary hover:underline font-semibold"
                    >
                      View Document
                    </a>
                  ) : "-"}
                </td>
                <td className="px-6 py-4 text-on-primary-container/60 font-semibold">{item.uploadedBy || "-"}</td>
                <td className="px-6 py-4 text-right">
                  {/* Actions for Admin */}
                  {isAdmin && (
                    <div className="flex justify-end space-x-2">
                      {item.status === "Pending" && (
                        <>
                          <button 
                            type="button"
                            onClick={() => handleWhatsAppOpen(item, "Pending")}
                            className="px-2.5 py-1 bg-on-primary-fixed-variant border border-on-primary-fixed-variant hover:border-secondary text-on-primary-container hover:text-secondary font-bold uppercase rounded-button text-[10px] flex items-center space-x-1"
                          >
                            <MessageCircle className="h-3 w-3 text-success" />
                            <span>Request</span>
                          </button>
                          <button 
                            type="button"
                            onClick={() => setActiveUploadDoc(item)}
                            className="px-2.5 py-1 bg-gradient-to-r from-secondary-container to-secondary-container text-on-primary-fixed font-bold uppercase rounded-button text-[10px]"
                          >
                            Upload
                          </button>
                        </>
                      )}
                      
                      {item.status === "Uploaded" && (
                        <>
                          <button 
                            type="button"
                            onClick={() => handleVerify(item)}
                            className="px-2.5 py-1 bg-success text-white font-bold uppercase rounded-button text-[10px]"
                          >
                            Verify
                          </button>
                          <button 
                            type="button"
                            onClick={() => setActiveRejectDoc(item)}
                            className="px-2.5 py-1 bg-danger text-white font-bold uppercase rounded-button text-[10px]"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {item.status === "Verified" && (
                        <>
                          <a 
                            href={item.fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="px-2.5 py-1 bg-primary-container hover:bg-on-primary-fixed-variant text-on-primary-container font-bold uppercase rounded-button text-[10px]"
                          >
                            View File
                          </a>
                          <button 
                            type="button"
                            onClick={() => setActiveUploadDoc(item)}
                            className="px-2.5 py-1 bg-on-primary-fixed-variant border border-on-primary-fixed-variant hover:border-secondary text-on-primary-container hover:text-secondary font-bold uppercase rounded-button text-[10px]"
                          >
                            Replace
                          </button>
                        </>
                      )}

                      {item.status === "Rejected" && (
                        <>
                          {item.fileUrl && (
                            <a 
                              href={item.fileUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="px-2.5 py-1 bg-primary-container hover:bg-on-primary-fixed-variant text-on-primary-container font-bold uppercase rounded-button text-[10px] mr-2"
                            >
                              View
                            </a>
                          )}
                          <button 
                            type="button"
                            onClick={() => handleWhatsAppOpen(item, "Rejected")}
                            className="px-2.5 py-1 bg-on-primary-fixed-variant border border-on-primary-fixed-variant hover:border-secondary text-on-primary-container hover:text-secondary font-bold uppercase rounded-button text-[10px] flex items-center space-x-1"
                          >
                            <MessageCircle className="h-3 w-3 text-success" />
                            <span>Request Resubmission</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Actions for Client */}
                  {!isAdmin && (
                    <div className="flex justify-end space-x-2">
                      {(item.status === "Pending" || item.status === "Rejected") && (
                        <button 
                          type="button"
                          onClick={() => setActiveUploadDoc(item)}
                          className="px-3 py-1 bg-gradient-to-r from-secondary-container to-secondary-container text-on-primary-fixed font-bold uppercase rounded-button text-[10px] flex items-center space-x-1"
                        >
                          <Upload className="h-3 w-3" />
                          <span>Upload File</span>
                        </button>
                      )}
                      {item.status === "Uploaded" && (
                        <span className="text-on-primary-container/40 italic text-[11px]">Under Review</span>
                      )}
                      {item.status === "Verified" && (
                        <a 
                          href={item.fileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="px-3 py-1 bg-on-primary-fixed-variant border border-outline text-on-primary-container font-semibold uppercase rounded-button text-[10px]"
                        >
                          View File
                        </a>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Render as card list (mobile) */}
      <div className="md:hidden space-y-4">
        {items.map((item) => (
          <div key={item.id} className="glass-card p-4 border border-on-primary-fixed-variant/60 space-y-3">
            <div className="flex justify-between items-start">
              <h4 className="font-semibold text-white text-xs">{item.name}</h4>
              <div>
                {item.status === "Pending" && (
                  <span className="px-2.5 py-0.5 rounded-badge bg-warning/10 text-warning border border-warning/20 text-[8px] font-bold uppercase tracking-wider">
                    Pending Upload
                  </span>
                )}
                {item.status === "Uploaded" && (
                  <span className="px-2.5 py-0.5 rounded-badge bg-on-primary-fixed-variant text-on-primary-container/50 border border-on-primary-fixed-variant text-[8px] font-bold uppercase tracking-wider">
                    Under Review
                  </span>
                )}
                {item.status === "Verified" && (
                  <span className="px-2.5 py-0.5 rounded-badge bg-success/10 text-success border border-success/20 text-[8px] font-bold uppercase tracking-wider">
                    ✓ Verified
                  </span>
                )}
                {item.status === "Rejected" && (
                  <span className="px-2.5 py-0.5 rounded-badge bg-danger/10 text-danger border border-danger/20 text-[8px] font-bold uppercase tracking-wider block">
                    Rejected
                  </span>
                )}
              </div>
            </div>

            {item.rejectionReason && item.status === "Rejected" && (
              <p className="text-[10px] text-danger bg-danger/5 p-2 border border-danger/10 rounded font-sans">
                Reason: {item.rejectionReason}
              </p>
            )}

            <div className="flex justify-between items-center text-[10px] text-on-primary-container/60 pt-2 border-t border-on-primary-fixed-variant">
              <span>Uploader: {item.uploadedBy || "-"}</span>
              {item.fileUrl && (
                <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="text-secondary font-semibold">
                  View File
                </a>
              )}
            </div>

            {/* Actions for Mobile */}
            <div className="pt-2 flex justify-end gap-2">
              {isAdmin ? (
                <>
                  {item.status === "Pending" && (
                    <>
                      <button 
                        type="button"
                        onClick={() => handleWhatsAppOpen(item, "Pending")}
                        className="px-3 py-1.5 bg-primary-container border border-outline text-on-primary-container font-bold uppercase text-[9px] rounded-button"
                      >
                        Request
                      </button>
                      <button 
                        type="button"
                        onClick={() => setActiveUploadDoc(item)}
                        className="px-3 py-1.5 bg-secondary-container text-on-primary-fixed font-bold uppercase text-[9px] rounded-button"
                      >
                        Upload
                      </button>
                    </>
                  )}
                  {item.status === "Uploaded" && (
                    <>
                      <button 
                        type="button"
                        onClick={() => handleVerify(item)}
                        className="px-3 py-1.5 bg-success text-white font-bold uppercase text-[9px] rounded-button"
                      >
                        Verify
                      </button>
                      <button 
                        type="button"
                        onClick={() => setActiveRejectDoc(item)}
                        className="px-3 py-1.5 bg-danger text-white font-bold uppercase text-[9px] rounded-button"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {item.status === "Verified" && (
                    <button 
                      type="button"
                      onClick={() => setActiveUploadDoc(item)}
                      className="px-3 py-1.5 bg-on-primary-fixed-variant text-on-primary-container font-bold uppercase text-[9px] rounded-button border border-on-primary-fixed-variant"
                    >
                      Replace
                    </button>
                  )}
                  {item.status === "Rejected" && (
                    <button 
                      type="button"
                      onClick={() => handleWhatsAppOpen(item, "Rejected")}
                      className="px-3 py-1.5 bg-on-primary-fixed-variant text-on-primary-container font-bold uppercase text-[9px] rounded-button border border-on-primary-fixed-variant"
                    >
                      Request Resubmission
                    </button>
                  )}
                </>
              ) : (
                <>
                  {(item.status === "Pending" || item.status === "Rejected") && (
                    <button 
                      type="button"
                      onClick={() => setActiveUploadDoc(item)}
                      className="px-3 py-1.5 bg-secondary-container text-on-primary-fixed font-bold uppercase text-[9px] rounded-button flex items-center space-x-1"
                    >
                      <Upload className="h-3 w-3" />
                      <span>Upload File</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Client Upload Modal */}
      {!isAdmin && (
        <PortalUploadModal
          isOpen={activeUploadDoc !== null}
          onClose={() => setActiveUploadDoc(null)}
          initialDocType={activeUploadDoc?.name || ""}
          initialCaseId={caseId || ""}
        />
      )}

      {/* Admin Upload/Replace Modal */}
      {isAdmin && (
        <Modal
          isOpen={activeUploadDoc !== null}
          onClose={() => setActiveUploadDoc(null)}
          title={activeUploadDoc?.docId ? `Replace ${activeUploadDoc?.name}` : `Upload ${activeUploadDoc?.name}`}
          size="md"
        >
          {activeUploadDoc && (
            <div className="space-y-4">
              <p className="text-xs text-on-primary-container/60 leading-relaxed font-sans">
                Please choose a clear scanned PDF copy or a high-quality photo (JPG/PNG) of your {activeUploadDoc.name}. Maximum file size is 10MB.
              </p>
              <FileUpload
                collectionName="travellers"
                documentId={travellerId || "general"}
                docType={activeUploadDoc.name}
                customPath={`travellers/${travellerId || "general"}/docs/{timestamp}_{filename}`}
                onUploadSuccess={handleUploadSuccess}
              />
            </div>
          )}
        </Modal>
      )}

      {/* Rejection Reason Modal */}
      <Modal
        isOpen={activeRejectDoc !== null}
        onClose={() => {
          setActiveRejectDoc(null);
          setRejectReason("");
        }}
        title={`Reject ${activeRejectDoc?.name}`}
        size="sm"
      >
        <div className="space-y-4 font-sans text-xs">
          <div className="flex flex-col space-y-1.5">
            <label className="text-[10px] font-bold text-on-primary-container/50 uppercase tracking-wider">Reason for Rejection</label>
            <textarea
              className="w-full px-3 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container rounded focus:outline-none focus:border-secondary"
              rows={3}
              placeholder="e.g. Scanned copy is blurry, residence visa is expired, incorrect slot..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <div className="flex space-x-3 pt-2">
            <button
              onClick={() => {
                setActiveRejectDoc(null);
                setRejectReason("");
              }}
              className="flex-1 py-2 bg-on-primary-fixed-variant border border-on-primary-fixed-variant text-on-primary-container font-semibold rounded text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleRejectSubmit}
              disabled={!rejectReason.trim()}
              className="flex-1 py-2 bg-danger text-white font-semibold rounded text-xs disabled:opacity-40"
            >
              Reject Document
            </button>
          </div>
        </div>
      </Modal>

      {/* WhatsApp Template Message Modal */}
      <Modal
        isOpen={activeWhatsAppDoc !== null}
        onClose={() => setActiveWhatsAppDoc(null)}
        title="WhatsApp Message Template"
        size="md"
      >
        <div className="space-y-4 font-sans text-xs">
          <p className="text-on-primary-container/60 leading-relaxed">
            Review and customize the notification message below before sending it to the client. Clicking "Send Message" will launch a new WhatsApp window.
          </p>
          <div className="flex flex-col space-y-1.5">
            <label className="text-[10px] font-bold text-on-primary-container/50 uppercase tracking-wider">Pre-formatted Message</label>
            <textarea
              className="w-full p-3 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container rounded leading-relaxed focus:outline-none focus:border-secondary"
              rows={5}
              value={whatsAppMessage}
              onChange={(e) => setWhatsAppMessage(e.target.value)}
            />
          </div>
          <div className="flex space-x-3 pt-4 border-t border-on-primary-fixed-variant">
            <button
              onClick={() => setActiveWhatsAppDoc(null)}
              className="flex-1 py-2.5 bg-on-primary-fixed-variant border border-on-primary-fixed-variant text-on-primary-container font-semibold rounded text-xs"
            >
              Cancel
            </button>
            <button
              onClick={triggerWhatsAppSend}
              className="flex-1 py-2.5 bg-gradient-to-r from-success to-emerald-500 text-white font-bold rounded text-xs flex items-center justify-center space-x-1.5 shadow"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Send Message</span>
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default DocumentChecklist;
