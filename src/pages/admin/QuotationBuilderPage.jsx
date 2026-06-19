import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Plus, Trash2, ArrowLeft, Eye, Save, Send, Search, X, CheckSquare, Square } from "lucide-react";
import { collection, onSnapshot, query, where, getDoc, doc, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { formatCurrency } from "../../utils/formatters";
import { generateQuoteNo } from "../../utils/helpers";
import Modal from "../../components/ui/Modal";
import toast from "react-hot-toast";

export const QuotationBuilderPage = () => {
  const [searchParams] = useSearchParams();
  const leadIdParam = searchParams.get("leadId");
  const navigate = useNavigate();

  // Quote properties
  const [quoteNo, setQuoteNo] = useState("");
  const [client, setClient] = useState({ 
    name: "", 
    phone: "", 
    email: "", 
    destination: "Schengen", 
    nationality: "",
    leadId: null 
  });
  
  const [rows, setRows] = useState([
    { serviceType: "Visa", desc: "Professional Visa Dossier Compilation & Slots Booking", qty: 1, price: 450, discount: 0 }
  ]);

  const [additionalCharges, setAdditionalCharges] = useState({
    govFee: false,
    govFeeAmount: 380,
    vfsFee: false,
    vfsFeeAmount: 220,
    translation: false,
    translationAmount: 150,
    courier: false,
    courierAmount: 60,
    urgency: false,
    urgencyPercent: 15
  });

  const [quoteSettings, setQuoteSettings] = useState({
    validUntil: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    paymentTerms: "50% deposit + 50% on approval",
    internalNotes: ""
  });

  // Autocomplete leads state
  const [leadsList, setLeadsList] = useState([]);
  const [clientSearch, setClientSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Settings fee configs state
  const [visaFeeConfigs, setVisaFeeConfigs] = useState({});
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Initialize Quote Number and load Settings / lead details
  useEffect(() => {
    const initQuoteNo = async () => {
      const num = await generateQuoteNo();
      setQuoteNo(num);
    };
    initQuoteNo();

    // Fetch leads for autocomplete
    const leadsRef = collection(db, "leads");
    const qLeads = query(leadsRef, where("isDeleted", "==", false));
    const unsubscribeLeads = onSnapshot(qLeads, (snapshot) => {
      setLeadsList(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {});

    // Fetch visaTypes settings
    const fetchVisaTypes = async () => {
      try {
        const typesRef = doc(db, "settings", "visaTypes");
        const snap = await getDoc(typesRef);
        if (snap.exists()) {
          setVisaFeeConfigs(snap.data());
        }
      } catch (err) {
        console.warn("Failed to load settings/visaTypes:", err);
      }
    };
    fetchVisaTypes();

    return () => {
      unsubscribeLeads();
    };
  }, []);

  // Handle URL leadId param if present
  useEffect(() => {
    if (leadIdParam && leadsList.length > 0) {
      const matchedLead = leadsList.find(l => l.id === leadIdParam);
      if (matchedLead) {
        selectClientFromLead(matchedLead);
      }
    }
  }, [leadIdParam, leadsList]);

  const selectClientFromLead = (lead) => {
    setClient({
      name: lead.contactName || "",
      phone: lead.contactPhone || "",
      email: lead.contactEmail || "",
      destination: lead.destinationCountry || lead.destination || "Schengen",
      nationality: lead.nationality || "",
      leadId: lead.id
    });
    setClientSearch("");
    setShowDropdown(false);
    
    // Auto-update first row price and gov fee based on new destination
    const dest = lead.destinationCountry || lead.destination || "Schengen";
    updateFirstRowVisaPrice(dest);
  };

  const updateFirstRowVisaPrice = (destination) => {
    const serviceFee = getVisaServiceFee(destination);
    const govFee = getVisaGovFee(destination);

    setRows(prev => prev.map((row, idx) => 
      idx === 0 && row.serviceType === "Visa"
        ? { ...row, price: serviceFee }
        : row
    ));

    setAdditionalCharges(prev => ({
      ...prev,
      govFeeAmount: govFee
    }));
  };

  const getVisaServiceFee = (dest) => {
    if (visaFeeConfigs && Object.keys(visaFeeConfigs).length > 0) {
      const key = Object.keys(visaFeeConfigs).find(k => k.toLowerCase() === dest?.toLowerCase());
      if (key && visaFeeConfigs[key]) {
        return Number(visaFeeConfigs[key].serviceFee || visaFeeConfigs[key].price || 450);
      }
    }
    const defaults = [
      { dest: "France", serviceFee: 450 },
      { dest: "Germany", serviceFee: 450 },
      { dest: "United Kingdom", serviceFee: 650 },
      { dest: "United States", serviceFee: 800 }
    ];
    const match = defaults.find(d => d.dest.toLowerCase() === dest?.toLowerCase());
    return match ? match.serviceFee : 450;
  };

  const getVisaGovFee = (dest) => {
    if (visaFeeConfigs && Object.keys(visaFeeConfigs).length > 0) {
      const key = Object.keys(visaFeeConfigs).find(k => k.toLowerCase() === dest?.toLowerCase());
      if (key && visaFeeConfigs[key]) {
        return Number(visaFeeConfigs[key].govFee || 380);
      }
    }
    const defaults = [
      { dest: "France", govFee: 380 },
      { dest: "Germany", govFee: 380 },
      { dest: "United Kingdom", govFee: 570 },
      { dest: "United States", govFee: 730 }
    ];
    const match = defaults.find(d => d.dest.toLowerCase() === dest?.toLowerCase());
    return match ? match.govFee : 380;
  };

  const handleRowTypeChange = (idx, type) => {
    const defaultDescs = {
      "Visa": "Professional Visa Dossier Compilation & Slots Booking",
      "Insurance": "Embassy-Compliant Travel Medical Insurance Coverage",
      "Flight Reservation": "Verifiable Flight Reservation Booking",
      "Hotel Booking": "VFS-Compliant Hotel Accommodation Reservation",
      "Translation": "Certified Legal Document Translation Services",
      "Other": "Consultancy & General Administration Surcharge"
    };

    const defaultPrices = {
      "Visa": getVisaServiceFee(client.destination),
      "Insurance": 150,
      "Flight Reservation": 120,
      "Hotel Booking": 200,
      "Translation": 100,
      "Other": 150
    };

    const newRows = [...rows];
    newRows[idx].serviceType = type;
    newRows[idx].desc = defaultDescs[type] || "Service Line Charge";
    newRows[idx].price = defaultPrices[type] || 150;
    setRows(newRows);
  };

  const handleAddRow = () => {
    setRows([...rows, { 
      serviceType: "Other", 
      desc: "Consultancy & General Administration Surcharge", 
      qty: 1, 
      price: 150, 
      discount: 0 
    }]);
  };

  const handleRemoveRow = (idx) => {
    if (rows.length === 1) return;
    setRows(rows.filter((_, i) => i !== idx));
  };

  const handleRowFieldChange = (idx, field, val) => {
    const newRows = [...rows];
    newRows[idx][field] = val;
    setRows(newRows);
  };

  const clearSelectedClient = () => {
    setClient({
      name: "",
      phone: "",
      email: "",
      destination: "Schengen",
      nationality: "",
      leadId: null
    });
  };

  // Pricing calculations
  const calculateSubtotal = () => {
    return rows.reduce((acc, row) => acc + (row.qty * row.price), 0);
  };

  const calculateDiscounts = () => {
    return rows.reduce((acc, row) => acc + (row.qty * row.price * (row.discount / 100)), 0);
  };

  const getNetSubtotal = () => {
    return calculateSubtotal() - calculateDiscounts();
  };

  const calculateAdditionalCharges = () => {
    let total = 0;
    if (additionalCharges.govFee) total += Number(additionalCharges.govFeeAmount || 0);
    if (additionalCharges.vfsFee) total += Number(additionalCharges.vfsFeeAmount || 0);
    if (additionalCharges.translation) total += Number(additionalCharges.translationAmount || 0);
    if (additionalCharges.courier) total += Number(additionalCharges.courierAmount || 0);
    return total;
  };

  const calculateUrgencySurcharge = () => {
    if (!additionalCharges.urgency) return 0;
    const baseTotal = getNetSubtotal() + calculateAdditionalCharges();
    return baseTotal * (additionalCharges.urgencyPercent / 100);
  };

  const getGrandTotal = () => {
    return getNetSubtotal() + calculateAdditionalCharges() + calculateUrgencySurcharge();
  };

  const saveQuotationToFirestore = async (status) => {
    if (!client.name.trim()) {
      toast.error("Please enter a client name.");
      return null;
    }

    try {
      const generatedQuoteNo = quoteNo || await generateQuoteNo();
      const quotesRef = collection(db, "quotations");
      
      const quotePayload = {
        quoteNo: generatedQuoteNo,
        clientName: client.name,
        clientPhone: client.phone,
        clientEmail: client.email,
        destination: client.destination,
        nationality: client.nationality,
        leadId: client.leadId,
        items: rows,
        additionalCharges: {
          govFee: additionalCharges.govFee,
          govFeeAmount: Number(additionalCharges.govFeeAmount),
          vfsFee: additionalCharges.vfsFee,
          vfsFeeAmount: Number(additionalCharges.vfsFeeAmount),
          translation: additionalCharges.translation,
          translationAmount: Number(additionalCharges.translationAmount),
          courier: additionalCharges.courier,
          courierAmount: Number(additionalCharges.courierAmount),
          urgency: additionalCharges.urgency,
          urgencyPercent: Number(additionalCharges.urgencyPercent)
        },
        validUntil: quoteSettings.validUntil,
        paymentTerms: quoteSettings.paymentTerms,
        internalNotes: quoteSettings.internalNotes,
        subtotal: calculateSubtotal(),
        discounts: calculateDiscounts(),
        additionalChargesTotal: calculateAdditionalCharges(),
        urgencySurcharge: calculateUrgencySurcharge(),
        amount: getGrandTotal(),
        approvalStatus: status,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(quotesRef, quotePayload);

      // Log communication/activity if linked to a lead
      if (client.leadId) {
        const actRef = collection(db, "leads", client.leadId, "activities");
        await addDoc(actRef, {
          type: "status",
          content: `Quotation generated: ${generatedQuoteNo} (${status}) - Amount: ${getGrandTotal()} AED`,
          authorName: "Staff Agent",
          createdAt: new Date()
        });
      }

      return { docId: docRef.id, quoteNo: generatedQuoteNo };
    } catch (err) {
      console.error("Error creating quotation:", err);
      toast.error("Error creating quotation in database.");
      return null;
    }
  };

  const handleSaveDraft = async () => {
    const res = await saveQuotationToFirestore("Draft");
    if (res) {
      toast.success(`Draft Quotation ${res.quoteNo} saved successfully!`);
      navigate("/admin/quotations");
    }
  };

  const handleSendToClient = async () => {
    const res = await saveQuotationToFirestore("Sent");
    if (res) {
      toast.success(`Quotation ${res.quoteNo} dispatched!`);

      // WhatsApp communication prompt message
      const msg = `Hi ${client.name}, this is ESHAARE travel support. Here are your quotation details (${res.quoteNo}) for destination ${client.destination}. Total: ${getGrandTotal()} AED. Payments terms: ${quoteSettings.paymentTerms}. Valid until: ${quoteSettings.validUntil}. Thank you!`;
      const encoded = encodeURIComponent(msg);
      const cleanPhone = client.phone.replace(/[^0-9]/g, "");
      window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, "_blank");
      
      navigate("/admin/quotations");
    }
  };

  const matchingLeads = clientSearch.trim() === "" ? [] : leadsList.filter(lead => 
    lead.contactName?.toLowerCase().includes(clientSearch.toLowerCase()) ||
    lead.contactPhone?.includes(clientSearch)
  );

  return (
    <div className="space-y-6 font-sans">
      
      {/* Back Link */}
      <Link 
        to="/admin/quotations" 
        className="inline-flex items-center text-xs font-bold text-secondary hover:text-secondary-fixed-dim uppercase tracking-wider space-x-1"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Quotes</span>
      </Link>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-wide">Quotation Builder</h1>
          <p className="text-xs text-on-primary-container/50">Draft premium invoice quotations and service listings.</p>
        </div>
        {quoteNo && (
          <span className="text-xs font-mono font-bold text-secondary bg-white/5 border border-on-primary-fixed-variant px-3 py-1.5 rounded-[6px]">
            {quoteNo}
          </span>
        )}
      </div>

      {/* 3-Panel Layout (Left: client + services, Right: live pricing summary) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT PANEL */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Client Section */}
          <div className="glass-card p-6 border border-on-primary-fixed-variant/60 space-y-4">
            <h3 className="text-sm font-semibold text-white border-b border-on-primary-fixed-variant pb-2">Client Profile</h3>
            
            {/* Lead Search Autocomplete */}
            {!client.leadId && (
              <div className="relative flex flex-col space-y-1.5 text-xs">
                <span className="text-[10px] text-on-primary-container/40 uppercase font-semibold">Search Existing Leads</span>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-on-primary-container/30" />
                  <input
                    type="text"
                    className="w-full pl-9 pr-4 py-2.5 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container placeholder-on-primary-container/25 rounded-button focus:outline-none focus:border-secondary"
                    placeholder="Search by client name or phone number..."
                    value={clientSearch}
                    onChange={(e) => {
                      setClientSearch(e.target.value);
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                  />
                  {clientSearch && (
                    <button 
                      type="button" 
                      onClick={() => setClientSearch("")}
                      className="absolute right-3 top-2.5 text-on-primary-container/40 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Dropdown options */}
                {showDropdown && matchingLeads.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-primary-container border border-on-primary-fixed-variant rounded-card shadow-2xl z-50 divide-y divide-outline-variant/15 overflow-hidden max-h-48 overflow-y-auto">
                    {matchingLeads.map((lead) => (
                      <div
                        key={lead.id}
                        onClick={() => selectClientFromLead(lead)}
                        className="p-3 hover:bg-white/5 cursor-pointer flex justify-between items-center transition-colors"
                      >
                        <div>
                          <span className="font-semibold text-white text-xs block">{lead.contactName}</span>
                          <span className="text-[10px] text-on-primary-container/45 font-mono">{lead.contactPhone}</span>
                        </div>
                        <span className="text-[9px] uppercase tracking-wider font-bold bg-secondary-container/10 text-secondary-fixed-dim border border-secondary/20 px-2 py-0.5 rounded-[4px]">
                          {lead.destination || "Schengen"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Read-Only display or Manual Entry fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="flex flex-col space-y-1.5">
                <span className="text-[10px] text-on-primary-container/40 uppercase">Full Name *</span>
                <input
                  type="text"
                  required
                  disabled={client.leadId !== null}
                  className={`bg-primary-container border border-on-primary-fixed-variant text-on-primary-container p-2.5 rounded-button focus:outline-none focus:border-secondary ${
                    client.leadId ? "opacity-60 cursor-not-allowed bg-primary-container/80" : ""
                  }`}
                  value={client.name}
                  onChange={(e) => setClient({ ...client, name: e.target.value })}
                  placeholder="e.g. John Doe"
                />
              </div>

              <div className="flex flex-col space-y-1.5">
                <span className="text-[10px] text-on-primary-container/40 uppercase">Phone Number *</span>
                <input
                  type="tel"
                  required
                  disabled={client.leadId !== null}
                  className={`bg-primary-container border border-on-primary-fixed-variant text-on-primary-container p-2.5 rounded-button focus:outline-none focus:border-secondary ${
                    client.leadId ? "opacity-60 cursor-not-allowed bg-primary-container/80" : ""
                  }`}
                  value={client.phone}
                  onChange={(e) => setClient({ ...client, phone: e.target.value })}
                  placeholder="e.g. +971557338429"
                />
              </div>

              <div className="flex flex-col space-y-1.5">
                <span className="text-[10px] text-on-primary-container/40 uppercase">Email Address</span>
                <input
                  type="email"
                  disabled={client.leadId !== null}
                  className={`bg-primary-container border border-on-primary-fixed-variant text-on-primary-container p-2.5 rounded-button focus:outline-none focus:border-secondary ${
                    client.leadId ? "opacity-60 cursor-not-allowed bg-primary-container/80" : ""
                  }`}
                  value={client.email}
                  onChange={(e) => setClient({ ...client, email: e.target.value })}
                  placeholder="e.g. john@example.com"
                />
              </div>

              <div className="flex flex-col space-y-1.5">
                <span className="text-[10px] text-on-primary-container/40 uppercase">Destination Country</span>
                {client.leadId ? (
                  <input
                    type="text"
                    disabled
                    className="bg-primary-container border border-on-primary-fixed-variant text-on-primary-container p-2.5 rounded-button opacity-60 cursor-not-allowed bg-primary-container/80"
                    value={client.destination}
                  />
                ) : (
                  <input
                    type="text"
                    className="bg-primary-container border border-on-primary-fixed-variant text-on-primary-container p-2.5 rounded-button focus:outline-none focus:border-secondary"
                    value={client.destination}
                    onChange={(e) => {
                      setClient({ ...client, destination: e.target.value });
                      updateFirstRowVisaPrice(e.target.value);
                    }}
                    placeholder="e.g. France"
                  />
                )}
              </div>

              <div className="flex flex-col space-y-1.5">
                <span className="text-[10px] text-on-primary-container/40 uppercase">Nationality</span>
                <input
                  type="text"
                  disabled={client.leadId !== null}
                  className={`bg-primary-container border border-on-primary-fixed-variant text-on-primary-container p-2.5 rounded-button focus:outline-none focus:border-secondary ${
                    client.leadId ? "opacity-60 cursor-not-allowed bg-primary-container/80" : ""
                  }`}
                  value={client.nationality}
                  onChange={(e) => setClient({ ...client, nationality: e.target.value })}
                  placeholder="e.g. Lebanese"
                />
              </div>

              {client.leadId && (
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={clearSelectedClient}
                    className="w-full py-2.5 bg-on-primary-fixed-variant border border-on-primary-fixed-variant hover:border-secondary hover:text-secondary font-bold uppercase rounded-button text-[10px] transition-colors"
                  >
                    Clear & Enter Manually
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Service Lines Section */}
          <div className="glass-card p-6 border border-on-primary-fixed-variant/60 space-y-4">
            <h3 className="text-sm font-semibold text-white border-b border-on-primary-fixed-variant pb-2">Service Lines</h3>
            <div className="space-y-4">
              {rows.map((row, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-center border-b border-on-primary-fixed-variant/60 pb-5">
                  
                  {/* Service Type */}
                  <div className="sm:col-span-2 flex flex-col space-y-1">
                    <label className="text-[9px] text-on-primary-container/45 font-bold uppercase tracking-wider">Service Type</label>
                    <select
                      className="bg-primary-container border border-on-primary-fixed-variant text-on-primary-container p-2.5 rounded-button text-xs focus:outline-none focus:border-secondary font-medium"
                      value={row.serviceType}
                      onChange={(e) => handleRowTypeChange(idx, e.target.value)}
                    >
                      <option value="Visa">Visa</option>
                      <option value="Insurance">Insurance</option>
                      <option value="Flight Reservation">Flight Reservation</option>
                      <option value="Hotel Booking">Hotel Booking</option>
                      <option value="Translation">Translation</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Description */}
                  <div className="sm:col-span-3 flex flex-col space-y-1">
                    <label className="text-[9px] text-on-primary-container/45 font-bold uppercase tracking-wider">Line Description</label>
                    <input
                      type="text"
                      className="bg-primary-container border border-on-primary-fixed-variant text-on-primary-container p-2.5 rounded-button text-xs focus:outline-none focus:border-secondary"
                      value={row.desc}
                      onChange={(e) => handleRowFieldChange(idx, "desc", e.target.value)}
                    />
                  </div>

                  {/* Qty */}
                  <div className="sm:col-span-1 flex flex-col space-y-1">
                    <label className="text-[9px] text-on-primary-container/45 font-bold uppercase tracking-wider text-center">Qty</label>
                    <input
                      type="number"
                      min="1"
                      className="bg-primary-container border border-on-primary-fixed-variant text-on-primary-container p-2.5 rounded-button text-xs focus:outline-none text-center"
                      value={row.qty}
                      onChange={(e) => handleRowFieldChange(idx, "qty", Math.max(1, Number(e.target.value)))}
                    />
                  </div>

                  {/* Price */}
                  <div className="sm:col-span-2 flex flex-col space-y-1">
                    <label className="text-[9px] text-on-primary-container/45 font-bold uppercase tracking-wider text-right">Price (AED)</label>
                    <input
                      type="number"
                      min="0"
                      className="bg-primary-container border border-on-primary-fixed-variant text-on-primary-container p-2.5 rounded-button text-xs focus:outline-none text-right font-mono"
                      value={row.price}
                      onChange={(e) => handleRowFieldChange(idx, "price", Math.max(0, Number(e.target.value)))}
                    />
                  </div>

                  {/* Discount */}
                  <div className="sm:col-span-1.5 flex flex-col space-y-1">
                    <label className="text-[9px] text-on-primary-container/45 font-bold uppercase tracking-wider text-center">Disc %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="bg-primary-container border border-on-primary-fixed-variant text-on-primary-container p-2.5 rounded-button text-xs focus:outline-none text-center font-mono"
                      value={row.discount}
                      onChange={(e) => handleRowFieldChange(idx, "discount", Math.max(0, Math.min(100, Number(e.target.value))))}
                    />
                  </div>

                  {/* Line Total */}
                  <div className="sm:col-span-2 flex flex-col space-y-1">
                    <label className="text-[9px] text-on-primary-container/45 font-bold uppercase tracking-wider text-right">Line Total</label>
                    <div className="bg-primary-container/80 border border-on-primary-fixed-variant p-2.5 rounded-button text-xs text-right text-secondary font-bold font-mono">
                      {(row.qty * row.price * (1 - (row.discount || 0) / 100)).toFixed(2)} AED
                    </div>
                  </div>

                  {/* Delete row */}
                  <div className="sm:col-span-0.5 flex justify-end pt-4">
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(idx)}
                      disabled={rows.length === 1}
                      className="p-2 text-danger hover:bg-danger/10 rounded transition-colors disabled:opacity-30"
                      title="Remove Row"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                onClick={handleAddRow}
                className="px-3 py-1.5 bg-white/5 border border-on-primary-fixed-variant hover:border-secondary hover:text-secondary text-[10px] font-bold uppercase rounded-button flex items-center space-x-1.5 transition-colors"
              >
                <Plus className="h-4 w-4 text-secondary" />
                <span>Add Service Row</span>
              </button>
            </div>
          </div>

          {/* Additional Charges Section */}
          <div className="glass-card p-6 border border-on-primary-fixed-variant/60 space-y-4">
            <h3 className="text-sm font-semibold text-white border-b border-on-primary-fixed-variant pb-2">Additional Charges / Multipliers</h3>
            <div className="space-y-4 text-xs font-sans">
              
              {/* Grid of Addons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Government Fee */}
                <div className="p-3 bg-primary-container rounded-button border border-on-primary-fixed-variant flex items-center justify-between">
                  <label className="flex items-center space-x-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="rounded text-secondary bg-primary-container border-on-primary-fixed-variant focus:ring-0"
                      checked={additionalCharges.govFee}
                      onChange={(e) => setAdditionalCharges({ ...additionalCharges, govFee: e.target.checked })}
                    />
                    <span className="font-semibold text-on-primary-container">Government Fee</span>
                  </label>
                  {additionalCharges.govFee && (
                    <div className="flex items-center space-x-1.5">
                      <input
                        type="number"
                        className="w-20 bg-primary-container border border-outline text-right p-1.5 rounded text-xs text-white font-mono"
                        value={additionalCharges.govFeeAmount}
                        onChange={(e) => setAdditionalCharges({ ...additionalCharges, govFeeAmount: Math.max(0, Number(e.target.value)) })}
                      />
                      <span className="text-[10px] text-on-primary-container/40 font-bold uppercase font-sans">AED</span>
                    </div>
                  )}
                </div>

                {/* VFS Service Fee */}
                <div className="p-3 bg-primary-container rounded-button border border-on-primary-fixed-variant flex items-center justify-between">
                  <label className="flex items-center space-x-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="rounded text-secondary bg-primary-container border-on-primary-fixed-variant focus:ring-0"
                      checked={additionalCharges.vfsFee}
                      onChange={(e) => setAdditionalCharges({ ...additionalCharges, vfsFee: e.target.checked })}
                    />
                    <span className="font-semibold text-on-primary-container">VFS Service Fee</span>
                  </label>
                  {additionalCharges.vfsFee && (
                    <div className="flex items-center space-x-1.5">
                      <input
                        type="number"
                        className="w-20 bg-primary-container border border-outline text-right p-1.5 rounded text-xs text-white font-mono"
                        value={additionalCharges.vfsFeeAmount}
                        onChange={(e) => setAdditionalCharges({ ...additionalCharges, vfsFeeAmount: Math.max(0, Number(e.target.value)) })}
                      />
                      <span className="text-[10px] text-on-primary-container/40 font-bold uppercase font-sans">AED</span>
                    </div>
                  )}
                </div>

                {/* Translation Services */}
                <div className="p-3 bg-primary-container rounded-button border border-on-primary-fixed-variant flex items-center justify-between">
                  <label className="flex items-center space-x-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="rounded text-secondary bg-primary-container border-on-primary-fixed-variant focus:ring-0"
                      checked={additionalCharges.translation}
                      onChange={(e) => setAdditionalCharges({ ...additionalCharges, translation: e.target.checked })}
                    />
                    <span className="font-semibold text-on-primary-container">Translation Services</span>
                  </label>
                  {additionalCharges.translation && (
                    <div className="flex items-center space-x-1.5">
                      <input
                        type="number"
                        className="w-20 bg-primary-container border border-outline text-right p-1.5 rounded text-xs text-white font-mono"
                        value={additionalCharges.translationAmount}
                        onChange={(e) => setAdditionalCharges({ ...additionalCharges, translationAmount: Math.max(0, Number(e.target.value)) })}
                      />
                      <span className="text-[10px] text-on-primary-container/40 font-bold uppercase font-sans">AED</span>
                    </div>
                  )}
                </div>

                {/* Courier Logistics */}
                <div className="p-3 bg-primary-container rounded-button border border-on-primary-fixed-variant flex items-center justify-between">
                  <label className="flex items-center space-x-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="rounded text-secondary bg-primary-container border-on-primary-fixed-variant focus:ring-0"
                      checked={additionalCharges.courier}
                      onChange={(e) => setAdditionalCharges({ ...additionalCharges, courier: e.target.checked })}
                    />
                    <span className="font-semibold text-on-primary-container">Courier Logistics</span>
                  </label>
                  {additionalCharges.courier && (
                    <div className="flex items-center space-x-1.5">
                      <input
                        type="number"
                        className="w-20 bg-primary-container border border-outline text-right p-1.5 rounded text-xs text-white font-mono"
                        value={additionalCharges.courierAmount}
                        onChange={(e) => setAdditionalCharges({ ...additionalCharges, courierAmount: Math.max(0, Number(e.target.value)) })}
                      />
                      <span className="text-[10px] text-on-primary-container/40 font-bold uppercase font-sans">AED</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Urgency Surcharge */}
              <div className="p-3 bg-primary-container rounded-button border border-on-primary-fixed-variant flex items-center justify-between">
                <label className="flex items-center space-x-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="rounded text-secondary bg-primary-container border-on-primary-fixed-variant focus:ring-0"
                    checked={additionalCharges.urgency}
                    onChange={(e) => setAdditionalCharges({ ...additionalCharges, urgency: e.target.checked })}
                  />
                  <span className="font-semibold text-on-primary-container">Urgency Surcharge (Multiplier on Total)</span>
                </label>
                {additionalCharges.urgency && (
                  <div className="flex items-center space-x-1.5">
                    <input
                      type="number"
                      className="w-20 bg-primary-container border border-outline text-center p-1.5 rounded text-xs text-white font-mono"
                      value={additionalCharges.urgencyPercent}
                      onChange={(e) => setAdditionalCharges({ ...additionalCharges, urgencyPercent: Math.max(0, Math.min(100, Number(e.target.value))) })}
                    />
                    <span className="text-[10px] text-secondary font-bold font-mono">%</span>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Quote Settings Section */}
          <div className="glass-card p-6 border border-on-primary-fixed-variant/60 space-y-4">
            <h3 className="text-sm font-semibold text-white border-b border-on-primary-fixed-variant pb-2">Terms & Validities</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
              <div className="flex flex-col space-y-1.5">
                <span className="text-[10px] text-on-primary-container/40 uppercase">Valid Until</span>
                <input
                  type="date"
                  className="bg-primary-container border border-on-primary-fixed-variant text-on-primary-container p-2.5 rounded-button focus:outline-none focus:border-secondary"
                  value={quoteSettings.validUntil}
                  onChange={(e) => setQuoteSettings({ ...quoteSettings, validUntil: e.target.value })}
                />
              </div>

              <div className="flex flex-col space-y-1.5">
                <span className="text-[10px] text-on-primary-container/40 uppercase">Payment Terms</span>
                <input
                  type="text"
                  className="bg-primary-container border border-on-primary-fixed-variant text-on-primary-container p-2.5 rounded-button focus:outline-none focus:border-secondary"
                  value={quoteSettings.paymentTerms}
                  onChange={(e) => setQuoteSettings({ ...quoteSettings, paymentTerms: e.target.value })}
                />
              </div>
            </div>

            <div className="flex flex-col space-y-1.5 text-xs font-sans pt-2">
              <span className="text-[10px] text-on-primary-container/40 uppercase">Internal Staff Notes (Hidden on Client PDF)</span>
              <textarea
                className="w-full bg-primary-container border border-on-primary-fixed-variant text-on-primary-container p-3 rounded-button focus:outline-none focus:border-secondary"
                rows={3}
                placeholder="Internal administrative guidelines, agent splits..."
                value={quoteSettings.internalNotes}
                onChange={(e) => setQuoteSettings({ ...quoteSettings, internalNotes: e.target.value })}
              />
            </div>
          </div>

        </div>

        {/* RIGHT PANEL - Sticky Ledger Summary */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card p-6 border border-secondary/20 shadow-xl bg-primary-container/60 sticky top-24 space-y-6">
            <h3 className="text-sm font-semibold text-white border-b border-on-primary-fixed-variant pb-2">Ledger Pricing Summary</h3>
            
            <div className="space-y-3.5 text-xs font-sans text-on-primary-container/60">
              <div className="flex justify-between">
                <span>Subtotal:</span> 
                <span className="text-white font-mono font-semibold">{formatCurrency(calculateSubtotal())}</span>
              </div>
              <div className="flex justify-between text-danger">
                <span>Total Discounts:</span> 
                <span className="font-mono font-semibold">-{formatCurrency(calculateDiscounts())}</span>
              </div>
              <div className="flex justify-between">
                <span>Additional Add-ons:</span> 
                <span className="text-white font-mono font-semibold">+{formatCurrency(calculateAdditionalCharges())}</span>
              </div>
              
              {additionalCharges.urgency && (
                <div className="flex justify-between text-warning">
                  <span>Urgency Surcharge ({additionalCharges.urgencyPercent}%):</span> 
                  <span className="font-mono font-semibold">+{formatCurrency(calculateUrgencySurcharge())}</span>
                </div>
              )}

              <div className="flex justify-between border-t border-on-primary-fixed-variant pt-4 text-base font-bold">
                <span className="text-white font-display">Grand Total:</span>
                <span className="text-secondary font-mono text-lg">{formatCurrency(getGrandTotal())}</span>
              </div>
            </div>

            {/* Payment Schedule breakdown */}
            <div className="bg-primary-container p-4 border border-on-primary-fixed-variant rounded-button space-y-2 text-xs font-sans">
              <h4 className="font-bold text-white uppercase text-[10px] tracking-wider mb-2">50/50 Payment Schedule</h4>
              <div className="flex justify-between text-on-primary-container/65">
                <span>Deposit AED (50%):</span>
                <span className="text-white font-mono font-semibold">{formatCurrency(getGrandTotal() * 0.5)}</span>
              </div>
              <div className="flex justify-between text-on-primary-container/65">
                <span>Balance AED (50%):</span>
                <span className="text-white font-mono font-semibold">{formatCurrency(getGrandTotal() * 0.5)}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="w-full py-2.5 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container hover:text-white font-bold text-xs rounded-button uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Eye className="h-4 w-4 text-secondary" />
                <span>Preview Proposal</span>
              </button>
              
              <button
                type="button"
                onClick={handleSaveDraft}
                className="w-full py-2.5 bg-on-primary-fixed-variant border border-on-primary-fixed-variant text-secondary hover:text-secondary-fixed-dim font-bold text-xs rounded-button uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>Save Draft</span>
              </button>

              <button
                type="button"
                onClick={handleSendToClient}
                className="w-full py-3 bg-gradient-to-r from-secondary-container to-secondary-container hover:from-secondary-container hover:to-secondary-fixed text-on-primary-fixed font-bold text-xs rounded-button uppercase tracking-wider shadow-sm flex items-center justify-center space-x-1.5 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <Send className="h-4 w-4" />
                <span>Send to Client</span>
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* Quote Preview Modal */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title="Quotation PDF Proposal"
        size="lg"
      >
        <div className="space-y-6 font-sans text-xs bg-primary-container p-8 rounded-card border border-on-primary-fixed-variant text-left">
          
          {/* Header */}
          <div className="flex justify-between items-start border-b border-on-primary-fixed-variant pb-5">
            <div>
              <h2 className="text-lg font-display font-bold text-white uppercase tracking-wider">ESHAARE TRAVEL & SERVICES</h2>
              <span className="text-on-primary-container/50 block mt-0.5">Sheikh Zayed Road, G-Tower, Dubai, UAE</span>
              <span className="text-on-primary-container/40 block mt-0.5">WhatsApp support: +971 55 733 8429</span>
            </div>
            <div className="text-right">
              <h3 className="text-sm font-mono font-bold text-secondary">{quoteNo || "QT-DRAFT"}</h3>
              <span className="text-[10px] text-on-primary-container/50 block mt-1">Date: {new Date().toLocaleDateString("en-AE", { day: "2-digit", month: "short", year: "numeric" })}</span>
              <span className="text-[10px] text-danger block font-semibold mt-1">Valid Until: {quoteSettings.validUntil}</span>
            </div>
          </div>

          {/* Client metadata */}
          <div className="space-y-1 py-2">
            <span className="text-[9px] font-bold text-on-primary-container/40 uppercase tracking-widest block">Quotation Prepared For:</span>
            <p className="text-sm font-bold text-white">{client.name || "Walk-in Client"}</p>
            <p className="text-on-primary-container/60 leading-relaxed font-mono text-[10px]">
              {client.email || "No Email Provided"} | {client.phone || "No Phone Provided"}
            </p>
            <p className="text-on-primary-container/50 text-[10px]">
              Destination: <span className="font-semibold text-white">{client.destination}</span> {client.nationality && <>| Nationality: <span className="font-semibold text-white">{client.nationality}</span></>}
            </p>
          </div>

          {/* Table items */}
          <table className="min-w-full divide-y divide-outline-variant/15 text-left text-on-primary-container mt-4">
            <thead>
              <tr className="text-[9px] uppercase tracking-wider text-on-primary-container/45 font-bold">
                <th className="py-2.5">Service Detail</th>
                <th className="py-2.5 text-center">Qty</th>
                <th className="py-2.5 text-right">Unit Price</th>
                <th className="py-2.5 text-center">Discount</th>
                <th className="py-2.5 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {rows.map((r, i) => {
                const lineTotal = r.qty * r.price;
                const discAmt = lineTotal * (r.discount / 100);
                return (
                  <tr key={i} className="text-on-primary-container/80">
                    <td className="py-3">
                      <span className="font-bold text-white block">{r.serviceType}</span>
                      <span className="text-[10px] text-on-primary-container/50">{r.desc}</span>
                    </td>
                    <td className="py-3 text-center font-mono">{r.qty}</td>
                    <td className="py-3 text-right font-mono">{r.price} AED</td>
                    <td className="py-3 text-center font-mono text-danger">{r.discount > 0 ? `-${r.discount}%` : "0%"}</td>
                    <td className="py-3 text-right font-mono text-white">{lineTotal - discAmt} AED</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Additional Charges / Totals */}
          <div className="border-t border-on-primary-fixed-variant pt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            
            {/* Payment Terms */}
            <div className="space-y-1.5 bg-white/5 p-4 rounded-button border border-outline-variant/10">
              <span className="text-[9px] font-bold text-on-primary-container/40 uppercase tracking-widest block">Proposed Terms</span>
              <p className="text-xs text-on-primary-container font-semibold">{quoteSettings.paymentTerms}</p>
              <div className="pt-2 text-[10px] text-on-primary-container/50 font-sans leading-relaxed">
                * Payment schedule represents 50% deposit for visa slot allocations. Balance due upon submission output confirmation.
              </div>
            </div>

            {/* Calculations breakdown */}
            <div className="flex flex-col items-end space-y-2 font-sans font-semibold text-on-primary-container/70">
              <div className="flex justify-between w-full max-w-xs text-[11px]">
                <span>Items Subtotal:</span> 
                <span className="text-white font-mono">{formatCurrency(calculateSubtotal())}</span>
              </div>
              <div className="flex justify-between w-full max-w-xs text-[11px] text-danger">
                <span>Discounts Slashed:</span> 
                <span className="font-mono">-{formatCurrency(calculateDiscounts())}</span>
              </div>
              <div className="flex justify-between w-full max-w-xs text-[11px]">
                <span>Add-ons / Government Fees:</span> 
                <span className="text-white font-mono">+{formatCurrency(calculateAdditionalCharges())}</span>
              </div>
              {additionalCharges.urgency && (
                <div className="flex justify-between w-full max-w-xs text-[11px] text-warning">
                  <span>Urgency Surcharge ({additionalCharges.urgencyPercent}%):</span> 
                  <span className="font-mono">+{formatCurrency(calculateUrgencySurcharge())}</span>
                </div>
              )}
              <div className="flex justify-between w-full max-w-xs border-t border-outline-variant/10 pt-2.5 text-sm font-bold">
                <span className="text-white">Grand Total:</span>
                <span className="text-secondary font-mono text-base">{formatCurrency(getGrandTotal())}</span>
              </div>
            </div>

          </div>

          <div className="flex justify-end pt-4 border-t border-on-primary-fixed-variant">
            <button
              onClick={() => setIsPreviewOpen(false)}
              className="px-5 py-2 bg-secondary-container hover:bg-secondary-container text-on-primary-fixed font-bold uppercase rounded-button text-xs"
            >
              Close Preview
            </button>
          </div>

        </div>
      </Modal>

    </div>
  );
};

export default QuotationBuilderPage;
