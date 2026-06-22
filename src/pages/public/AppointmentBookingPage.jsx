import React, { useState, useReducer, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";

const initialState = {
  destinationCountry: "",
  visaType: "",
  nearestVfsCenter: "",
  earliestDate: "",
  latestDate: "",
  fullName: "",
  dob: "",
  nationality: "",
  passportNumber: "",
  passportExpiry: "",
  email: "",
  whatsapp: "",
  numApplicants: 1,
  specialRequirements: ""
};

function formReducer(state, action) {
  switch (action.type) {
    case "UPDATE_FIELD":
      return { ...state, [action.field]: action.value };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

export const AppointmentBookingPage = () => {
  const [step, setStep] = useState(0);
  const [formData, dispatch] = useReducer(formReducer, initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leadNo, setLeadNo] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Search filter states for Step 0 landing page
  const [selectedDest, setSelectedDest] = useState("");
  const [selectedCat, setSelectedCat] = useState("");
  const [selectedCenter, setSelectedCenter] = useState("");

  // React states for mock file uploads on Step 2
  const [uploads, setUploads] = useState({
    passport: "idle", // "idle" | "uploading" | "done"
    visa: "idle",
    emiratesId: "idle"
  });

  // Emergency Visa Slot Tracking Toggle on Step 3
  const [emergencyTracking, setEmergencyTracking] = useState(true);

  const handleFieldChange = (field, value) => {
    dispatch({ type: "UPDATE_FIELD", field, value });
  };

  const handleUpload = (type) => {
    setUploads((prev) => ({ ...prev, [type]: "uploading" }));
    setTimeout(() => {
      setUploads((prev) => ({ ...prev, [type]: "done" }));
      toast.success(`${type === "passport" ? "Passport Bio Page" : type === "visa" ? "UAE Residence Visa" : "Emirates ID"} uploaded!`);
    }, 1500);
  };

  // Prefill details and bypass Step 0 when location.state is passed
  useEffect(() => {
    if (location.state && location.state.destinationCountry) {
      handleFieldChange("destinationCountry", location.state.destinationCountry);
      if (location.state.visaType) {
        handleFieldChange("visaType", location.state.visaType);
      } else {
        handleFieldChange("visaType", "Tourist Visa");
      }
      if (location.state.nearestVfsCenter) {
        handleFieldChange("nearestVfsCenter", location.state.nearestVfsCenter);
      } else {
        handleFieldChange("nearestVfsCenter", "VFS Global Dubai (Wafi Mall)");
      }
      setStep(1);
    }
  }, [location.state]);

  const allSlots = [
    {
      country: "France",
      visaType: "Schengen Visitor",
      center: "VFS Dubai",
      date: "Oct 24, 2026",
      flagUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCc9KXlObNAVDuFjPyzsYmxxNe1-vPqjCihbu0tAfTK0TCpGP72BX874onu12jiKa4x695eyF8JL-BOkLQpWxbxyRTAbxuBrmNW_19g4dl2WSGIAwJuNw9kq8AOalPop3rYhdAqPQYMrI98otvZCRz2-N-Lp4xAjk827POvzok0vlTvuPpZ-hEeqD6DF0F61F2e8iOgU84_VtpxNA2c-JV4QPpaRob2-0N-SodbE9jYEXLRygD575DlaNplfaGw5ZrYz0DlsTY1sg7_"
    },
    {
      country: "Italy",
      visaType: "Business Visa",
      center: "VFS Abu Dhabi",
      date: "Oct 28, 2026",
      flagUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDFJeiuKBLWjJi-l1uPlIiKK-TundTYJBO8P7XhIN_T9LNxYhYfNNakp77EHKabu_BwiU193z090WXqCNnAPdmpiaeUZ3QyApjBSPK-b00OfXCcsgoio-AycO1gESs55bO6MWvw8yfN8UaTwnigjnD-V45rPxQCDc-x5gSK0V_LcjkpSTSkxMPfo0FY85T-bAzPAi9HCQ0VyPDbZUz95HGyQhhqD9Sw626kFXWG-AsIiDgBRmqrr8AO2NkeOebRoxNzILIqp7ZAa0cx"
    },
    {
      country: "United Kingdom",
      visaType: "Standard Visitor",
      center: "UK Visa Center",
      date: "Nov 02, 2026",
      flagUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuA4hlrxOTQSYypkhUGhuRqwXBWx-tlCBYEJyrf1dkhvVsOe0b5zrH1PpcKKXgvNnKgJqH9DP9vR6dZM4P_gzkukHFazBnC_g2Ra6mFEKmfL2WlVgL7nvk9ZimfW3MqoowN51pp1UrfSeFMxumTWVRolnI0dfK00Crjtdl8IHc27KQGcbbo44MKAwFH_TqnztAv_hd-n-l1Fp0OzrAxdKNWkeu_yXfMR7szuudRddXE4KxmtaNeCBrxgVLHgPp1WAImuJvnAtnLqpeFf"
    }
  ];

  // Filtering live slots based on search widget options
  const filteredSlots = useMemo(() => {
    return allSlots.filter((slot) => {
      const matchDest = !selectedDest || selectedDest === "All" || slot.country.toLowerCase() === selectedDest.toLowerCase();
      const matchCat = !selectedCat || selectedCat === "All" || slot.visaType.toLowerCase().includes(selectedCat.toLowerCase());
      const matchCenter = !selectedCenter || selectedCenter === "All" || slot.center.toLowerCase().includes(selectedCenter.toLowerCase());
      return matchDest && matchCat && matchCenter;
    });
  }, [selectedDest, selectedCat, selectedCenter]);

  const handleBookSlot = (slot) => {
    let mappedCenter = "VFS Global Dubai (Wafi Mall)";
    if (slot.center.includes("Abu Dhabi")) {
      mappedCenter = "VFS Global Abu Dhabi (The Mall, World Trade Center)";
    }

    let mappedVisaType = "Tourist Visa";
    if (slot.visaType.includes("Business")) {
      mappedVisaType = "Business Visa";
    }

    handleFieldChange("destinationCountry", slot.country);
    handleFieldChange("visaType", mappedVisaType);
    handleFieldChange("nearestVfsCenter", mappedCenter);
    setStep(1);
    toast.success(`Selected ${slot.country} appointment. Let's finish the details!`);
  };

  const handleNext = () => {
    // Basic validation for Step 1 (Service Selection)
    if (step === 1) {
      if (!formData.destinationCountry || !formData.visaType || !formData.nearestVfsCenter || !formData.earliestDate || !formData.latestDate) {
        toast.error("Please fill in all travel details.");
        return;
      }
    }
    // Basic validation for Step 2 (Applicant Details)
    if (step === 2) {
      if (!formData.fullName || !formData.passportNumber || !formData.nationality || !formData.dob || !formData.whatsapp || !formData.email) {
        toast.error("Please fill in all applicant details.");
        return;
      }
    }
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { generateLeadNo } = await import("../../utils/helpers");
      const { createLead } = await import("../../lib/firestore");
      
      const generatedNo = await generateLeadNo();
      const newLead = {
        leadNo: generatedNo,
        contactName: formData.fullName,
        contactPhone: formData.whatsapp.startsWith("+") ? formData.whatsapp : `+971${formData.whatsapp}`,
        contactEmail: formData.email,
        nationality: formData.nationality,
        destinationCountry: formData.destinationCountry,
        serviceType: "Visa",
        visaType: formData.visaType,
        nearestVfsCenter: formData.nearestVfsCenter,
        travelStart: formData.earliestDate,
        travelEnd: formData.latestDate,
        numApplicants: Number(formData.numApplicants),
        notes: `Passport No: ${formData.passportNumber}, DOB: ${formData.dob}. Special requirements: ${formData.specialRequirements}. Files mock uploaded: Passport: ${uploads.passport}, Visa: ${uploads.visa}, EID: ${uploads.emiratesId}. Emergency slot tracking: ${emergencyTracking ? "Enabled" : "Disabled"}.`,
        source: "appointment_form",
        stage: "New",
        priority: emergencyTracking ? "High" : "Medium",
        ownerId: null
      };

      await createLead(newLead);
      setLeadNo(generatedNo);
      setIsSuccess(true);
      toast.success("Appointment request submitted successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit appointment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (isSuccess) {
    return (
      <>
        <Helmet>
          <title>Appointment Request Submitted | Eshaare Tours</title>
          <meta name="description" content="Your visa appointment request has been submitted successfully." />
        </Helmet>
        <div className="bg-surface py-20 px-margin-mobile md:px-margin-desktop min-h-[60vh] flex items-center justify-center">
        <div className="max-w-md w-full bg-surface-container-lowest p-8 rounded-xl premium-shadow border border-outline-variant/10 text-center space-y-6">
          <span className="material-symbols-outlined text-success-green text-6xl block">check_circle</span>
          <h2 className="font-headline-lg text-headline-lg text-primary font-bold">Request Submitted!</h2>
          <p className="text-on-surface-variant text-body-md">
            Thank you for booking with Eshaare Tours. Your application reference number is:
          </p>
          <div className="bg-surface-container-low py-4 px-6 rounded-lg font-mono text-xl font-bold text-secondary tracking-wide select-all mb-4">
            {leadNo}
          </div>

          {/* WhatsApp Concierge block from Figma HTML */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 bg-surface-container-high rounded-xl p-6 border border-secondary/20 text-left">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-whatsapp-green/10 rounded-full">
                <span className="material-symbols-outlined text-whatsapp-green">support_agent</span>
              </div>
              <div className="flex-grow">
                <h4 className="text-label-md font-label-md font-bold text-primary mb-2">WHATSAPP CONCIERGE</h4>
                <p className="text-body-sm text-on-surface-variant leading-relaxed">
                  Our elite support team will reach out via WhatsApp within <span className="font-bold text-primary">15 minutes</span> to finalize your biometric slot.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate("/")}
            className="w-full bg-primary text-on-primary py-3.5 rounded-xl font-bold hover:opacity-90 transition-opacity"
          >
            Return to Homepage
          </button>
        </div>
      </div>
      </>
    );
  }

  // Step 0: Landing Page View
  if (step === 0) {
    return (
      <>
        <Helmet>
          <title>Book VFS & Embassy Visa Appointment | Eshaare Tours</title>
          <meta name="description" content="Secure your VFS and Embassy visa appointments for Schengen, UK, and USA. Real-time slot monitoring and expert assistance." />
        </Helmet>
        <div className="bg-surface text-on-surface font-body-md overflow-x-hidden">
        
        {/* Hero Section */}
        <section className="relative min-h-[70vh] flex items-center justify-center py-section-gap overflow-hidden bg-primary-container">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <img 
              alt="UAE Skyline" 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCBksZdVq6gDrnKDLpNBIUHsMqKFElY4wwZU-gQ5vl0vsf0tGn3BUBtz4WFwdoiAUyX2kC73lMV5GPzfwz2bRwCA1RqB00ZP3gis-CcUBzLRO2uAR4wFYoft6qOD2dsdiO7JEqTrPa-XFME3V8ptTvxPb1j-TkVSYw476UIwL8K2t8M16qj_ABTnhbhPtAEyd0SxincCt86MVHRU1MPM3XMCzHE602VrCd_2Re2cr3T-iP0VN-xUCALaQP9R0yc2k_THR95WPDIC7P9"
            />
          </div>
          <div className="relative z-10 w-full px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto text-center">
            <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-primary mb-6">
              Secure Your VFS & Embassy Visa Appointment Today
            </h1>
            <p className="font-body-lg text-body-lg text-on-primary-container max-w-2xl mx-auto mb-12">
              Professional assistance for UAE, Schengen, UK, and USA visa bookings. We monitor slots 24/7 so you don't have to.
            </p>

            {/* Search Widget */}
            <div className="bg-surface-container-lowest p-4 md:p-8 rounded-xl shadow-2xl max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-2 text-left">
                <label className="text-label-md font-label-md text-on-surface-variant block ml-1">Destination Country</label>
                <select 
                  value={selectedDest}
                  onChange={(e) => setSelectedDest(e.target.value)}
                  className="w-full bg-surface-container border-none rounded-lg p-3 text-body-md focus:ring-2 focus:ring-secondary"
                >
                  <option value="">Find your destination</option>
                  <option value="France">France</option>
                  <option value="Italy">Italy</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="United States">United States</option>
                  <option value="Spain">Spain</option>
                </select>
              </div>

              <div className="space-y-2 text-left">
                <label className="text-label-md font-label-md text-on-surface-variant block ml-1">Visa Category</label>
                <select 
                  value={selectedCat}
                  onChange={(e) => setSelectedCat(e.target.value)}
                  className="w-full bg-surface-container border-none rounded-lg p-3 text-body-md focus:ring-2 focus:ring-secondary"
                >
                  <option value="">Select Type</option>
                  <option value="Schengen">Schengen Short-Stay</option>
                  <option value="Standard">UK Standard Visitor</option>
                  <option value="USA">USA B1/B2</option>
                  <option value="Business">Business/Corporate</option>
                </select>
              </div>

              <div className="space-y-2 text-left">
                <label className="text-label-md font-label-md text-on-surface-variant block ml-1">VFS/Embassy Center</label>
                <select 
                  value={selectedCenter}
                  onChange={(e) => setSelectedCenter(e.target.value)}
                  className="w-full bg-surface-container border-none rounded-lg p-3 text-body-md focus:ring-2 focus:ring-secondary"
                >
                  <option value="">Select Location</option>
                  <option value="Dubai">VFS Global Dubai</option>
                  <option value="Abu Dhabi">VFS Global Abu Dhabi</option>
                  <option value="Consulate">US Consulate Dubai</option>
                  <option value="Visa Center">UK Visa Center</option>
                </select>
              </div>

              <button 
                onClick={() => {
                  toast.success("Live availability checked! Scroll to slots below.");
                  handleScrollTo("live-slots");
                }}
                className="w-full bg-secondary-container text-on-secondary-container h-[50px] rounded-lg font-bold text-label-md flex items-center justify-center gap-2 hover:bg-secondary-fixed transition-colors"
              >
                <span className="material-symbols-outlined">search</span>
                Check Live Availability
              </button>
            </div>
          </div>
        </section>

        {/* Why Book With Us - Bento Grid */}
        <section className="py-section-gap px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-headline-lg text-headline-lg text-primary mb-4">Why Book With Us</h2>
            <div className="w-20 h-1 bg-secondary mx-auto"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-surface-container-lowest p-10 rounded-xl shadow-sm border border-outline-variant/10 group hover:shadow-md transition-shadow">
              <div className="bg-secondary-container w-16 h-16 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-on-secondary-container text-3xl">precision_manufacturing</span>
              </div>
              <h3 className="font-headline-md text-headline-md text-primary mb-4">Real-time Slot Monitoring</h3>
              <p className="font-body-md text-on-surface-variant leading-relaxed">
                Our proprietary AI systems provide real-time slot monitoring across embassy portals to catch cancellations and newly released slots instantly.
              </p>
            </div>

            <div className="bg-surface-container-lowest p-10 rounded-xl shadow-sm border border-outline-variant/10 group hover:shadow-md transition-shadow">
              <div className="bg-secondary-container w-16 h-16 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-on-secondary-container text-3xl">event_available</span>
              </div>
              <h3 className="font-headline-md text-headline-md text-primary mb-4">24/7 Availability Checks</h3>
              <p className="font-body-md text-on-surface-variant leading-relaxed">
                Never miss an opening. Our concierge team works across time zones to ensure your preferred date is secured.
              </p>
            </div>

            <div className="bg-surface-container-lowest p-10 rounded-xl shadow-sm border border-outline-variant/10 group hover:shadow-md transition-shadow">
              <div className="bg-secondary-container w-16 h-16 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-on-secondary-container text-3xl">verified_user</span>
              </div>
              <h3 className="font-headline-md text-headline-md text-primary mb-4">Expert Document Review</h3>
              <p className="font-body-md text-on-surface-variant leading-relaxed">
                Maximize your success rate. Every application undergoes a rigorous check by our legal consultants before submission.
              </p>
            </div>
          </div>
        </section>

        {/* Live Slots Table Section */}
        <section id="live-slots" className="bg-surface-container-low py-section-gap">
          <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
              <div>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success-green/10 text-success-green text-label-md font-bold mb-4">
                  <span className="w-2 h-2 rounded-full bg-success-green animate-pulse"></span>
                  Live Updates
                </span>
                <h2 className="font-headline-lg text-headline-lg text-primary">Latest Available Slots</h2>
              </div>
              <button 
                onClick={() => {
                  setSelectedDest("");
                  setSelectedCat("");
                  setSelectedCenter("");
                  toast.success("Showing all available slots!");
                }}
                className="text-primary font-bold flex items-center gap-2 hover:gap-4 transition-all group"
              >
                View All Destinations <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl bg-surface-container-lowest shadow-xl">
              <table className="w-full text-left border-collapse min-w-[650px]">
                <thead>
                  <tr className="bg-primary text-on-primary">
                    <th className="p-6 text-label-md font-label-md">Destination</th>
                    <th className="p-6 text-label-md font-label-md">Visa Type</th>
                    <th className="p-6 text-label-md font-label-md">Center</th>
                    <th className="p-6 text-label-md font-label-md">Next Available</th>
                    <th className="p-6 text-label-md font-label-md text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10 text-body-sm text-on-surface-variant">
                  {filteredSlots.map((slot, index) => (
                    <tr key={index} className="hover:bg-surface-variant transition-colors">
                      <td className="p-6 flex items-center gap-4">
                        <div className="w-10 h-6 bg-surface-container flex items-center justify-center overflow-hidden rounded-sm border border-outline-variant/10">
                          <img className="w-full h-full object-cover" alt={`${slot.country} flag`} src={slot.flagUrl} />
                        </div>
                        <span className="font-semibold text-primary">{slot.country}</span>
                      </td>
                      <td className="p-6">{slot.visaType}</td>
                      <td className="p-6">{slot.center}</td>
                      <td className="p-6">
                        <span className="px-3 py-1 rounded bg-secondary-container text-on-secondary-container font-bold text-xs">
                          {slot.date}
                        </span>
                      </td>
                      <td className="p-6 text-right">
                        <button 
                          onClick={() => handleBookSlot(slot)}
                          className="bg-primary text-on-primary px-4 py-2 rounded font-bold text-xs hover:opacity-85 transition-opacity"
                        >
                          Book VFS Appointment
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredSlots.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-on-surface-variant/50 italic">
                        No live slots matching search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-section-gap px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto text-center">
          <div className="bg-primary-container p-12 md:p-20 rounded-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent"></div>
            <div className="relative z-10 max-w-3xl mx-auto space-y-6">
              <h2 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-primary">
                Ready to Start Your Journey?
              </h2>
              <p className="font-body-lg text-on-primary-container">
                Our concierge specialists are ready to secure your appointment and guide you through the documentation process with precision.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
                <button 
                  onClick={() => handleScrollTo("live-slots")}
                  className="w-full sm:w-auto bg-secondary-container text-on-secondary-container px-10 py-4 rounded-lg font-bold text-label-md hover:bg-secondary-fixed transition-all flex items-center justify-center gap-3"
                >
                  Check Live Availability
                  <span className="material-symbols-outlined text-lg">rocket_launch</span>
                </button>
                <button 
                  onClick={() => setStep(1)}
                  className="w-full sm:w-auto border-2 border-on-primary text-on-primary px-10 py-4 rounded-lg font-bold text-label-md hover:bg-on-primary hover:text-primary-container transition-all"
                >
                  Speak to a Consultant
                </button>
              </div>
            </div>
          </div>
        </section>
        </div>
      </>
    );
  }

  // Stepper Header Calculations
  const renderStepper = () => {
    return (
      <div className="mb-16 max-w-3xl mx-auto">
        <div className="flex items-center justify-between relative">
          
          {/* Progress Line */}
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-surface-container-highest -translate-y-1/2 z-0"></div>
          <div 
            className="absolute top-1/2 left-0 h-0.5 bg-secondary -translate-y-1/2 z-0 transition-all duration-500"
            style={{
              width: step === 1 ? "0%" : step === 2 ? "50%" : "100%"
            }}
          ></div>

          {/* Step 1: Completed or Active */}
          <div className="relative z-10 flex flex-col items-center gap-3">
            {step > 1 ? (
              <div 
                className="w-10 h-10 rounded-full bg-secondary text-on-secondary flex items-center justify-center border-2 border-secondary cursor-pointer"
                onClick={() => setStep(1)}
              >
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-surface-container-lowest text-secondary border-2 border-secondary flex items-center justify-center ring-4 ring-secondary/10 font-bold">
                1
              </div>
            )}
            <span className={`text-label-md font-label-md ${step === 1 ? "text-secondary font-bold" : "text-on-surface"}`}>Service Selection</span>
          </div>

          {/* Step 2: Active or Completed */}
          <div className="relative z-10 flex flex-col items-center gap-3">
            {step > 2 ? (
              <div 
                className="w-10 h-10 rounded-full bg-secondary text-on-secondary flex items-center justify-center border-2 border-secondary cursor-pointer"
                onClick={() => setStep(2)}
              >
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
              </div>
            ) : step === 2 ? (
              <div className="w-12 h-12 rounded-full bg-surface-container-lowest text-secondary border-2 border-secondary flex items-center justify-center ring-4 ring-secondary/10 font-bold">
                2
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-surface-container-lowest text-outline-variant border-2 border-outline-variant flex items-center justify-center">
                2
              </div>
            )}
            <span className={`text-label-md font-label-md ${step === 2 ? "text-secondary font-bold" : "text-on-surface-variant"}`}>Applicant Details</span>
          </div>

          {/* Step 3: Upcoming or Active */}
          <div className="relative z-10 flex flex-col items-center gap-3">
            {step === 3 ? (
              <div className="w-12 h-12 rounded-full bg-surface-container-lowest text-secondary border-2 border-secondary flex items-center justify-center ring-4 ring-secondary/10 font-bold">
                3
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-surface-container-lowest text-outline-variant border-2 border-outline-variant flex items-center justify-center">
                3
              </div>
            )}
            <span className={`text-label-md font-label-md ${step === 3 ? "text-secondary font-bold" : "text-on-surface-variant"}`}>Review & Pay</span>
          </div>

        </div>
      </div>
    );
  };

  const bookingSummaryDestination = formData.destinationCountry 
    ? `${formData.destinationCountry} ${formData.visaType || "Tourist Visa"}`
    : "Schengen Tourist Visa";

  return (
    <>
      <Helmet>
        <title>Appointment Booking | Eshaare Tours Dubai</title>
        <meta name="description" content="Book your visa appointment and submit your documents for expert review." />
      </Helmet>
      <div className="bg-surface py-12 px-margin-mobile md:px-margin-desktop min-h-screen">
      <div className="max-w-container-max mx-auto space-y-8">
        
        {/* Breadcrumb */}
        <div className="text-body-sm text-on-surface-variant flex items-center gap-1">
          <button 
            onClick={() => setStep(0)} 
            className="hover:text-primary transition-colors focus:outline-none"
          >
            Home
          </button>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-primary font-medium">Appointment Booking</span>
        </div>

        {/* Progress Stepper */}
        {renderStepper()}

        {/* Step 3 Review Header */}
        {step === 3 && (
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
            <div>
              <h1 className="text-display-lg-mobile md:text-display-lg font-display-lg text-primary mb-2">Review & Confirm Your Visa Appointment Application</h1>
              <p className="text-on-surface-variant text-body-lg">Verify your details before submitting your visa appointment request.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Form Section */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* Step 1: Service Selection Form */}
            {step === 1 && (
              <section className="bg-surface-container-lowest p-8 md:p-12 rounded-xl shadow-sm border border-outline-variant/10 space-y-6">
                <div>
                  <h2 className="font-headline-lg text-headline-lg text-primary mb-2">Step 1: Service Selection</h2>
                  <p className="text-body-md text-on-surface-variant">Specify your visa requirements and nearest center locations.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-label-md font-label-md font-semibold text-primary">Destination Country *</label>
                    <select
                      value={formData.destinationCountry}
                      onChange={(e) => handleFieldChange("destinationCountry", e.target.value)}
                      className="bg-surface-container-low border-transparent border-b-outline-variant/30 rounded-lg p-4 font-body-md text-body-md form-focus transition-all focus:ring-2 focus:ring-secondary focus:border-secondary"
                    >
                      <option value="">Select country</option>
                      <option value="France">France</option>
                      <option value="Germany">Germany</option>
                      <option value="Switzerland">Switzerland</option>
                      <option value="Italy">Italy</option>
                      <option value="Spain">Spain</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="United States">United States</option>
                      <option value="Japan">Japan</option>
                      <option value="Saudi Arabia">Saudi Arabia</option>
                      <option value="Other">Other Country</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-label-md font-label-md font-semibold text-primary">Visa Type *</label>
                    <select
                      value={formData.visaType}
                      onChange={(e) => handleFieldChange("visaType", e.target.value)}
                      className="bg-surface-container-low border-transparent border-b-outline-variant/30 rounded-lg p-4 font-body-md text-body-md form-focus transition-all focus:ring-2 focus:ring-secondary focus:border-secondary"
                    >
                      <option value="">Select type</option>
                      <option value="Tourist Visa">Tourist Visa</option>
                      <option value="Business Visa">Business Visa</option>
                      <option value="Family Visit Visa">Family Visit Visa</option>
                      <option value="Student Visa">Student Visa</option>
                      <option value="Transit Visa">Transit Visa</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="text-label-md font-label-md font-semibold text-primary">Nearest VFS/Embassy Center *</label>
                    <select
                      value={formData.nearestVfsCenter}
                      onChange={(e) => handleFieldChange("nearestVfsCenter", e.target.value)}
                      className="bg-surface-container-low border-transparent border-b-outline-variant/30 rounded-lg p-4 font-body-md text-body-md form-focus transition-all focus:ring-2 focus:ring-secondary focus:border-secondary"
                    >
                      <option value="">Select center</option>
                      <option value="VFS Global Dubai (Wafi Mall)">VFS Global Dubai (Wafi Mall)</option>
                      <option value="VFS Global Abu Dhabi (The Mall, World Trade Center)">VFS Global Abu Dhabi (The Mall, World Trade Center)</option>
                      <option value="US Embassy Abu Dhabi">US Embassy Abu Dhabi</option>
                      <option value="US Consulate General Dubai">US Consulate General Dubai</option>
                      <option value="Consulate General of Japan, Dubai">Consulate General of Japan, Dubai</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-label-md font-label-md font-semibold text-primary">Earliest Preferred Date *</label>
                    <input
                      type="date"
                      value={formData.earliestDate}
                      onChange={(e) => handleFieldChange("earliestDate", e.target.value)}
                      className="bg-surface-container-low border-transparent border-b-outline-variant/30 rounded-lg p-4 font-body-md text-body-md form-focus transition-all focus:ring-2 focus:ring-secondary"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-label-md font-label-md font-semibold text-primary">Latest Preferred Date *</label>
                    <input
                      type="date"
                      value={formData.latestDate}
                      onChange={(e) => handleFieldChange("latestDate", e.target.value)}
                      className="bg-surface-container-low border-transparent border-b-outline-variant/30 rounded-lg p-4 font-body-md text-body-md form-focus transition-all focus:ring-2 focus:ring-secondary"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-8 border-t border-outline-variant/10">
                  <button 
                    onClick={() => setStep(0)}
                    className="flex items-center gap-2 text-primary font-label-md text-label-md hover:underline decoration-2 underline-offset-4 transition-all"
                  >
                    <span className="material-symbols-outlined">arrow_back</span>
                    Back to Slots
                  </button>
                  <button 
                    onClick={handleNext}
                    className="bg-secondary text-on-secondary px-10 py-4 rounded-xl font-headline-md text-headline-md shadow-lg shadow-secondary/20 hover:scale-105 active:scale-95 transition-all"
                  >
                    Continue to Applicant Details
                  </button>
                </div>
              </section>
            )}

            {/* Step 2: Applicant Details & Document Upload */}
            {step === 2 && (
              <>
                {/* Personal Info */}
                <section className="bg-surface-container-lowest p-8 md:p-12 rounded-xl shadow-sm border border-outline-variant/10">
                  <div className="mb-8">
                    <h2 className="font-headline-lg text-headline-lg text-primary mb-2">Applicant Information & Required Visa Documents</h2>
                    <p className="text-body-md text-on-surface-variant">Please provide accurate details as per your passport to avoid processing delays.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-label-md font-label-md font-semibold text-primary">Full Name (As per Passport)</label>
                      <input 
                        value={formData.fullName}
                        onChange={(e) => handleFieldChange("fullName", e.target.value)}
                        className="bg-surface-container-low border-transparent border-b-outline-variant/30 rounded-lg p-4 font-body-md text-body-md form-focus transition-all" 
                        placeholder="Johnathan Doe" 
                        type="text" 
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-label-md font-label-md font-semibold text-primary">Passport Number</label>
                      <input 
                        value={formData.passportNumber}
                        onChange={(e) => handleFieldChange("passportNumber", e.target.value)}
                        className="bg-surface-container-low border-transparent border-b-outline-variant/30 rounded-lg p-4 font-body-md text-body-md form-focus transition-all" 
                        placeholder="A12345678" 
                        type="text" 
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-label-md font-label-md font-semibold text-primary">Nationality</label>
                      <select 
                        value={formData.nationality}
                        onChange={(e) => handleFieldChange("nationality", e.target.value)}
                        className="bg-surface-container-low border-transparent border-b-outline-variant/30 rounded-lg p-4 font-body-md text-body-md form-focus transition-all"
                      >
                        <option value="">Select Country</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="United States">United States</option>
                        <option value="India">India</option>
                        <option value="Russia">Russia</option>
                        <option value="United Arab Emirates">United Arab Emirates</option>
                        <option value="Other">Other Country</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-label-md font-label-md font-semibold text-primary">Date of Birth</label>
                      <input 
                        value={formData.dob}
                        onChange={(e) => handleFieldChange("dob", e.target.value)}
                        className="bg-surface-container-low border-transparent border-b-outline-variant/30 rounded-lg p-4 font-body-md text-body-md form-focus transition-all" 
                        type="date" 
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-label-md font-label-md font-semibold text-primary">Phone / WhatsApp</label>
                      <input 
                        value={formData.whatsapp}
                        onChange={(e) => handleFieldChange("whatsapp", e.target.value)}
                        className="bg-surface-container-low border-transparent border-b-outline-variant/30 rounded-lg p-4 font-body-md text-body-md form-focus transition-all" 
                        placeholder="+971 50 000 0000" 
                        type="tel" 
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-label-md font-label-md font-semibold text-primary">Email Address</label>
                      <input 
                        value={formData.email}
                        onChange={(e) => handleFieldChange("email", e.target.value)}
                        className="bg-surface-container-low border-transparent border-b-outline-variant/30 rounded-lg p-4 font-body-md text-body-md form-focus transition-all" 
                        placeholder="john.doe@example.com" 
                        type="email" 
                      />
                    </div>
                  </div>
                </section>

                {/* Document Upload */}
                <section className="bg-surface-container-lowest p-8 md:p-12 rounded-xl shadow-sm border border-outline-variant/10">
                  <div className="mb-8">
                    <h2 className="font-headline-lg text-headline-lg text-primary mb-2">Required Visa Documents Checklist</h2>
                    <p className="text-body-md text-on-surface-variant">
                      Upload clear, High-Resolution Scans to speed up your verification. Providing legible documents is a critical Visa Approval Requirement. Max size 5MB per file (PDF, JPG, PNG).
                    </p>
                  </div>
                  <div className="space-y-6">
                    
                    {/* Passport Bio */}
                    <div 
                      onClick={() => uploads.passport === "idle" && handleUpload("passport")}
                      className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-xl border-2 border-dashed border-outline-variant/50 hover:border-secondary transition-colors group cursor-pointer"
                    >
                      <div className="w-16 h-16 rounded-full bg-secondary-container/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-secondary">description</span>
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <h3 className="font-label-md text-label-md text-primary font-semibold">Passport Copy (Bio page)</h3>
                        <p className="text-body-sm text-on-surface-variant">Ensure all four corners and the MRZ code are visible.</p>
                      </div>
                      {uploads.passport === "idle" && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleUpload("passport"); }}
                          className="bg-surface-container-high px-6 py-2 rounded-lg text-label-md font-label-md text-on-surface group-hover:bg-secondary group-hover:text-on-secondary transition-all"
                        >
                          Upload File
                        </button>
                      )}
                      {uploads.passport === "uploading" && (
                        <button 
                          disabled
                          className="bg-surface-container-high px-6 py-2 rounded-lg text-label-md font-label-md text-on-surface opacity-50 cursor-not-allowed"
                        >
                          Uploading...
                        </button>
                      )}
                      {uploads.passport === "done" && (
                        <button 
                          disabled
                          className="bg-success-green text-white px-6 py-2 rounded-lg text-label-md font-label-md cursor-default"
                        >
                          Uploaded ✓
                        </button>
                      )}
                    </div>

                    {/* UAE Visa */}
                    <div 
                      onClick={() => uploads.visa === "idle" && handleUpload("visa")}
                      className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-xl border-2 border-dashed border-outline-variant/50 hover:border-secondary transition-colors group cursor-pointer"
                    >
                      <div className="w-16 h-16 rounded-full bg-secondary-container/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-secondary">assignment_ind</span>
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <h3 className="font-label-md text-label-md text-primary font-semibold">UAE Residence Visa</h3>
                        <p className="text-body-sm text-on-surface-variant">Valid UAE residence permit scan.</p>
                      </div>
                      {uploads.visa === "idle" && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleUpload("visa"); }}
                          className="bg-surface-container-high px-6 py-2 rounded-lg text-label-md font-label-md text-on-surface group-hover:bg-secondary group-hover:text-on-secondary transition-all"
                        >
                          Upload File
                        </button>
                      )}
                      {uploads.visa === "uploading" && (
                        <button 
                          disabled
                          className="bg-surface-container-high px-6 py-2 rounded-lg text-label-md font-label-md text-on-surface opacity-50 cursor-not-allowed"
                        >
                          Uploading...
                        </button>
                      )}
                      {uploads.visa === "done" && (
                        <button 
                          disabled
                          className="bg-success-green text-white px-6 py-2 rounded-lg text-label-md font-label-md cursor-default"
                        >
                          Uploaded ✓
                        </button>
                      )}
                    </div>

                    {/* Emirates ID */}
                    <div 
                      onClick={() => uploads.emiratesId === "idle" && handleUpload("emiratesId")}
                      className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-xl border-2 border-dashed border-outline-variant/50 hover:border-secondary transition-colors group cursor-pointer"
                    >
                      <div className="w-16 h-16 rounded-full bg-secondary-container/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-secondary">id_card</span>
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <h3 className="font-label-md text-label-md text-primary font-semibold">Emirates ID (Front & Back)</h3>
                        <p className="text-body-sm text-on-surface-variant">Combine both sides into a single PDF or upload back-to-back.</p>
                      </div>
                      {uploads.emiratesId === "idle" && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleUpload("emiratesId"); }}
                          className="bg-surface-container-high px-6 py-2 rounded-lg text-label-md font-label-md text-on-surface group-hover:bg-secondary group-hover:text-on-secondary transition-all"
                        >
                          Upload File
                        </button>
                      )}
                      {uploads.emiratesId === "uploading" && (
                        <button 
                          disabled
                          className="bg-surface-container-high px-6 py-2 rounded-lg text-label-md font-label-md text-on-surface opacity-50 cursor-not-allowed"
                        >
                          Uploading...
                        </button>
                      )}
                      {uploads.emiratesId === "done" && (
                        <button 
                          disabled
                          className="bg-success-green text-white px-6 py-2 rounded-lg text-label-md font-label-md cursor-default"
                        >
                          Uploaded ✓
                        </button>
                      )}
                    </div>
                  </div>
                </section>

                {/* Actions */}
                <div className="flex items-center justify-between pt-8">
                  <button 
                    onClick={handleBack}
                    className="flex items-center gap-2 text-primary font-label-md text-label-md hover:underline decoration-2 underline-offset-4 transition-all focus:outline-none"
                  >
                    <span className="material-symbols-outlined">arrow_back</span>
                    Back to Service
                  </button>
                  <button 
                    onClick={handleNext}
                    className="bg-secondary text-on-secondary px-10 py-4 rounded-xl font-headline-md text-headline-md shadow-lg shadow-secondary/20 hover:scale-105 active:scale-95 transition-all"
                  >
                    Continue to Expert Review & Submission
                  </button>
                </div>
              </>
            )}

            {/* Step 3: Review & Submit (Left Side Content) */}
            {step === 3 && (
              <div className="space-y-8">
                {/* Main Summary Card */}
                <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-xl p-8 shadow-sm">
                  <div className="flex justify-between items-center mb-8 pb-4 border-b border-outline-variant/10">
                    <h2 className="text-headline-md font-headline-md text-primary">Appointment Summary</h2>
                    <button 
                      onClick={() => setStep(2)}
                      className="text-secondary font-semibold hover:underline flex items-center gap-1 focus:outline-none"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span> Edit Details
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12 text-left">
                    <div className="space-y-1">
                      <p className="text-label-md font-label-md text-on-surface-variant">FULL NAME</p>
                      <p className="text-body-lg font-semibold">{formData.fullName || "Jonathan Alistair Vickers"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-label-md font-label-md text-on-surface-variant">PASSPORT NUMBER</p>
                      <p className="text-body-lg font-semibold">{formData.passportNumber || "GZ78294021"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-label-md font-label-md text-on-surface-variant">VISA CATEGORY</p>
                      <p className="text-body-lg font-semibold">
                        {formData.destinationCountry 
                          ? `${formData.destinationCountry} ${formData.visaType}` 
                          : "UAE 60-Day Multi-Entry Tourist"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-label-md font-label-md text-on-surface-variant">ESTIMATED TRAVEL DATE</p>
                      <p className="text-body-lg font-semibold">
                        {formData.earliestDate 
                          ? new Date(formData.earliestDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) 
                          : "October 15, 2026"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-label-md font-label-md text-on-surface-variant">PHONE NUMBER</p>
                      <p className="text-body-lg font-semibold">{formData.whatsapp || "+971 55 733 8429"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-label-md font-label-md text-on-surface-variant">EMAIL ADDRESS</p>
                      <p className="text-body-lg font-semibold">{formData.email || "j.vickers@corporate-travel.com"}</p>
                    </div>
                  </div>

                  {/* Documents Status Bento */}
                  <div className="mt-12 text-left">
                    <h3 className="text-label-md font-label-md text-on-surface-variant mb-4 uppercase">Uploaded Documents</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      
                      <div className="bg-surface-container-low p-4 rounded-lg flex items-center gap-3">
                        <span className={`material-symbols-outlined ${uploads.passport === "done" ? "text-success-green" : "text-error"}`}>
                          {uploads.passport === "done" ? "check_circle" : "cancel"}
                        </span>
                        <span className="text-body-sm">Passport Scan</span>
                      </div>

                      <div className="bg-surface-container-low p-4 rounded-lg flex items-center gap-3">
                        <span className={`material-symbols-outlined ${uploads.visa === "done" ? "text-success-green" : "text-error"}`}>
                          {uploads.visa === "done" ? "check_circle" : "cancel"}
                        </span>
                        <span className="text-body-sm">Residency Permit</span>
                      </div>

                      <div className="bg-surface-container-low p-4 rounded-lg flex items-center gap-3">
                        <span className={`material-symbols-outlined ${uploads.emiratesId === "done" ? "text-success-green" : "text-error"}`}>
                          {uploads.emiratesId === "done" ? "check_circle" : "cancel"}
                        </span>
                        <span className="text-body-sm">Emirates ID</span>
                      </div>

                    </div>
                  </div>
                </div>

                {/* Premium Urgency Section */}
                <div className="bg-primary-container text-on-primary-container rounded-xl p-8 overflow-hidden relative">
                  <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="max-w-md text-left">
                      <h3 className="text-headline-md font-headline-md text-secondary-fixed mb-2">Emergency Visa Slot Tracking</h3>
                      <p className="text-on-primary-container opacity-80 text-body-md leading-relaxed">
                        Enable "Emergency Visa Slot Tracking" to secure premium slots and guarantee a 2-Hour Response Time for your application review by our senior consultants.
                      </p>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                      <label className="inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={emergencyTracking}
                          onChange={(e) => setEmergencyTracking(e.target.checked)}
                          className="sr-only peer" 
                        />
                        <div className="relative w-14 h-8 bg-on-primary-container/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-secondary"></div>
                      </label>
                      <span className={`text-label-md font-bold ${emergencyTracking ? "text-secondary-fixed" : "opacity-50 text-white"}`}>
                        {emergencyTracking ? "ENABLED" : "DISABLED"}
                      </span>
                    </div>
                  </div>
                  {/* Background aesthetic flare */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-secondary-fixed/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                </div>
              </div>
            )}

          </div>

          {/* Right Sidebar Section */}
          <aside className="lg:col-span-4 sticky top-28 space-y-6">
            
            {step === 3 ? (
              /* Step 3: Finalize Booking Card */
              <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-xl p-8 shadow-md">
                <h3 className="text-headline-md font-headline-md text-primary mb-6 text-left">Finalize Booking</h3>
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center text-body-md">
                    <span className="text-on-surface-variant">Standard Service Fee</span>
                    <span>$120.00</span>
                  </div>
                  <div className="flex justify-between items-center text-body-md text-secondary font-semibold">
                    <span>Priority Handling</span>
                    <span>{emergencyTracking ? "$45.00" : "$0.00"}</span>
                  </div>
                  <div className="pt-4 border-t border-outline-variant/10 flex justify-between items-center">
                    <span className="text-headline-md font-headline-md">Total Amount</span>
                    <span className="text-headline-md font-headline-md text-primary">
                      {emergencyTracking ? "$165.00" : "$120.00"}
                    </span>
                  </div>
                </div>
                
                <button 
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                  className="w-full bg-secondary-fixed-dim hover:bg-secondary-fixed text-primary font-bold py-4 rounded-lg text-body-lg transition-all transform active:scale-95 shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <span className="material-symbols-outlined animate-spin">progress_activity</span>
                      Processing...
                    </>
                  ) : (
                    <>
                      Confirm & Submit Visa Request 
                      <span className="material-symbols-outlined">send</span>
                    </>
                  )}
                </button>
                <p className="text-center text-body-sm text-on-surface-variant mt-6">
                  By clicking confirm, you agree to our{" "}
                  <a className="underline font-semibold" href="#">Terms of Service</a>.
                </p>
              </div>
            ) : (
              /* Step 1 & 2 Sidebar Summaries */
              <>
                <div className="bg-primary-container p-8 rounded-xl text-on-primary-container text-left">
                  <h3 className="text-white font-headline-md text-headline-md mb-6">Booking Summary</h3>
                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-label-md font-label-md text-on-primary font-semibold">{bookingSummaryDestination}</p>
                        <p className="text-body-sm opacity-70">Premium Concierge Service</p>
                      </div>
                      <span className="font-bold text-on-primary">AED 2,450</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-on-primary-container/20 pt-4">
                      <span className="text-label-md font-label-md">Total (inc. VAT)</span>
                      <span className="text-headline-md font-headline-md text-secondary-fixed">AED 2,572.50</span>
                    </div>
                  </div>
                  <div className="p-4 bg-on-primary-container/10 rounded-lg flex items-start gap-3 text-white">
                    <span className="material-symbols-outlined text-secondary-fixed text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                    <p className="text-body-sm">Your application will be reviewed within 24 business hours of submission.</p>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-xl shadow-sm border border-outline-variant/10 text-left">
                  <h4 className="font-label-md text-label-md text-primary mb-4 font-semibold">Need Help?</h4>
                  <div className="flex flex-col gap-4">
                    <a className="flex items-center gap-3 text-body-md hover:text-secondary transition-colors" href="tel:+971557338429">
                      <div className="p-2.5 rounded-full bg-secondary-container text-on-secondary-container">
                        <span className="material-symbols-outlined text-lg">call</span>
                      </div>
                      <span>+971 55 733 8429</span>
                    </a>
                    <a className="flex items-center gap-3 text-body-md hover:text-secondary transition-colors" href="mailto:support@eshaaretours.com">
                      <div className="w-10 h-10 rounded-full bg-secondary-container/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-secondary">mail</span>
                      </div>
                      <span>support@eshaaretours.com</span>
                    </a>
                  </div>
                </div>
              </>
            )}

          </aside>

        </div>
      </div>
      </div>
    </>
  );
};

export default AppointmentBookingPage;
