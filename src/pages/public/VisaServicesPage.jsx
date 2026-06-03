import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { createLead } from "../../lib/firestore";
import { generateLeadNo } from "../../utils/helpers";

export const VisaServicesPage = () => {
  const navigate = useNavigate();

  // Hover effect state for journey steps
  const [hoveredStep, setHoveredStep] = useState(-1);

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState(null);

  // Enquiry form state
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    notes: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.email) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setIsSubmitting(true);
    try {
      const generatedNo = await generateLeadNo();
      const submission = {
        leadNo: generatedNo,
        contactName: formData.name,
        contactPhone: formData.phone.startsWith("+") ? formData.phone : `+971${formData.phone}`,
        contactEmail: formData.email,
        serviceType: "Visa",
        destinationCountry: "Schengen",
        source: "visa_services_form",
        stage: "New",
        priority: "Medium",
        ownerId: null,
        notes: `Travel Date & Purpose: ${formData.notes}`,
      };
      await createLead(submission);
      toast.success(`Enquiry submitted successfully! Ref: ${generatedNo}`);
      setFormData({
        name: "",
        phone: "",
        email: "",
        notes: ""
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit enquiry. Please try again.");
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

  const handleStartApplication = (packageType = "") => {
    navigate("/appointment", {
      state: {
        destinationCountry: "France", // Default Schengen destination
        visaType: "Schengen Visitor",
        nearestVfsCenter: "VFS Global Dubai",
        packageType
      }
    });
  };

  const steps = [
    { number: "01", title: "Evaluation", desc: "Profile risk assessment." },
    { number: "02", title: "Verification", desc: "Document audit by experts." },
    { number: "03", title: "Booking", desc: "VFS/BLS Slot assistance." },
    { number: "04", title: "Preparation", desc: "Form filling & cover letter." },
    { number: "05", title: "Interview", desc: "Briefing & dummy Q&A." },
    { number: "06", title: "Collection", desc: "Passport delivery tracking." }
  ];

  const faqs = [
    {
      q: "Which embassy should I apply to?",
      a: "You must apply to the embassy of the country that is your primary destination (where you stay the longest). If staying equal days, apply to your first point of entry."
    },
    {
      q: "What is the average processing time?",
      a: "Processing times typically range from 15 to 45 calendar days depending on the embassy and the time of year. We recommend applying at least 2 months before your trip."
    },
    {
      q: "Can I travel to other countries with one visa?",
      a: "Yes! A uniform Schengen visa allows you to travel freely between all 29 member countries as long as you do not exceed the number of days granted."
    }
  ];

  return (
    <div className="bg-surface text-on-surface font-body-md">
      
      {/* Breadcrumbs */}
      <div className="bg-surface-container-low py-4">
        <div className="max-w-container-max mx-auto px-margin-desktop flex items-center gap-2 text-body-sm text-on-surface-variant">
          <Link className="hover:text-secondary" to="/">Home</Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <Link className="hover:text-secondary" to="/visa-services">Visa Services</Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-primary font-semibold">Schengen Visa</span>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            alt="Paris Landmark" 
            className="w-full h-full object-cover" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuClZ4kJhnpqffnWGS8XFbXFd7KmyVbPhr09MyHlF7lZ7mdbVItIoCKrsuXMCjLBsTbXIQz192SE0SdsiETRPzCr6dYaXp0wCATFCu__n-ccAmRfxgthhEZ3mRxoZxVFGbXLFKBS3A73-7iuql5GSW6NJIKVmHN-3BSL4jNbbcoJuHT53nVcs0wowj8l5D1hjjmgpqXiv3fvKP8qFraaTqhX__e0LAinUSqsuqA5UvLYBYPnC7ljWxWF_-xFZpvsWQVE9dzteRyByVLd"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-container/90 via-primary-container/70 to-transparent"></div>
        </div>
        <div className="relative z-10 max-w-container-max mx-auto px-margin-desktop w-full">
          <div className="max-w-2xl">
            <h1 className="text-display-lg text-white mb-6 leading-tight">
              Schengen Visa Services: Fast-Track Your European Journey
            </h1>
            <p className="text-body-lg text-on-primary-container mb-8">
              Expert guidance for your European journey. We handle the complex documentation and elusive appointments while you focus on planning your dream trip.
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => handleStartApplication()}
                className="bg-secondary-container text-on-secondary-container px-8 py-4 rounded-xl font-bold text-lg hover:bg-secondary-fixed transition-all shadow-lg flex items-center gap-2"
              >
                Start Application <span className="material-symbols-outlined">arrow_forward</span>
              </button>
              <button 
                onClick={() => handleScrollTo("requirements")}
                className="border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/10 transition-all flex items-center gap-2"
              >
                View Requirements
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Overview Section */}
      <section className="py-section-gap bg-surface">
        <div className="max-w-container-max mx-auto px-margin-desktop">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-secondary font-bold tracking-widest uppercase text-label-md mb-4 block">Unified Travel</span>
              <h2 className="text-headline-lg font-headline-lg text-primary mb-6">Explore 29 European Countries with a Single Permit</h2>
              <p className="text-body-md text-on-surface-variant mb-6 leading-relaxed">
                The Schengen area represents a border-free zone of 29 European countries. Whether you're visiting the romantic streets of Paris, the historic ruins of Rome, or the modern vistas of Zurich, a Schengen visa is your golden ticket.
              </p>
              <p className="text-body-md text-on-surface-variant mb-8 leading-relaxed">
                At Eshaare Tours, we understand the stress of navigating VFS Global, BLS International, and embassy-specific requirements. Our consultancy ensures your application is "decision-ready," significantly increasing your approval chances for short-stay (Type C) visas.
              </p>
              <div className="flex items-center gap-4 p-4 bg-surface-container-low rounded-xl border border-outline-variant/10">
                <span className="material-symbols-outlined text-secondary-fixed-dim text-4xl">verified_user</span>
                <div>
                  <h4 class="font-bold text-primary">Certified Consultancy</h4>
                  <p className="text-body-sm">UAE-based experts with deep knowledge of Schengen protocols.</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-8 rounded-xl shadow-sm border border-outline-variant/10 flex flex-col items-center text-center">
                <span className="text-4xl font-bold text-secondary mb-2">98%</span>
                <span className="text-body-sm text-on-surface-variant">Success Rate</span>
              </div>
              <div className="bg-white p-8 rounded-xl shadow-sm border border-outline-variant/10 flex flex-col items-center text-center">
                <span className="text-4xl font-bold text-secondary mb-2">5k+</span>
                <span className="text-body-sm text-on-surface-variant">Successful Visa Applications</span>
              </div>
              <div className="bg-white p-8 rounded-xl shadow-sm border border-outline-variant/10 flex flex-col items-center text-center">
                <span className="text-4xl font-bold text-secondary mb-2">29</span>
                <span className="text-body-sm text-on-surface-variant">Countries Covered</span>
              </div>
              <div className="bg-white p-8 rounded-xl shadow-sm border border-outline-variant/10 flex flex-col items-center text-center">
                <span className="text-4xl font-bold text-secondary mb-2">24/7</span>
                <span className="text-body-sm text-on-surface-variant">Expert Support</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Document Checklist (Bento Grid Layout) */}
      <section id="requirements" className="py-section-gap bg-surface-container-low">
        <div className="max-w-container-max mx-auto px-margin-desktop">
          <div className="text-center mb-16">
            <h2 className="text-headline-lg font-headline-lg text-primary">Mandatory Documents & Visa Checklist</h2>
            <p className="text-body-md text-on-surface-variant mt-2">The blueprint for a successful visa approval.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-gutter">
            
            {/* Column 1: Personal */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-outline-variant/10">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-secondary text-3xl">person</span>
                <h3 className="text-headline-md font-bold">Personal</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-success-green">check_circle</span>
                  <span className="text-body-md">Original Passport (6 months validity)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-success-green">check_circle</span>
                  <span className="text-body-md">UAE Residence Visa (3 months validity)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-success-green">check_circle</span>
                  <span className="text-body-md">Emirates ID Copy</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-success-green">check_circle</span>
                  <span className="text-body-md">2 Photos (White background, 3.5x4.5cm)</span>
                </li>
              </ul>
            </div>

            {/* Column 2: Financial */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-outline-variant/10">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-secondary text-3xl">account_balance</span>
                <h3 className="text-headline-md font-bold">Financial</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-success-green">check_circle</span>
                  <span className="text-body-md">NOC from employer (stamped/signed)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-success-green">check_circle</span>
                  <span className="text-body-md">Trade License (for business owners)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-success-green">check_circle</span>
                  <span className="text-body-md">3-6 Months Original Bank Statement</span>
                </li>
              </ul>
            </div>

            {/* Column 3: Travel */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-outline-variant/10">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-secondary text-3xl">flight_takeoff</span>
                <h3 className="text-headline-md font-bold">Travel Proof</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-success-green">check_circle</span>
                  <span className="text-body-md">Flight Reservation (Round Trip)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-success-green">check_circle</span>
                  <span className="text-body-md">Confirmed Hotel Booking</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-success-green">check_circle</span>
                  <span className="text-body-md">Detailed Day-wise Itinerary</span>
                </li>
                <li className="flex items-start gap-3 p-3 bg-secondary-container/10 rounded-lg border border-secondary/20">
                  <span className="material-symbols-outlined text-secondary">info</span>
                  <span className="text-body-sm font-semibold">Travel Insurance: Min $30k coverage (Included in Premium)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Step-by-Step Process */}
      <section className="py-section-gap bg-surface">
        <div className="max-w-container-max mx-auto px-margin-desktop">
          <div className="text-center mb-16">
            <h2 className="text-headline-lg font-headline-lg text-primary">Your Journey to Europe</h2>
            <p className="text-body-md text-on-surface-variant mt-2">A streamlined 6-step process to secure your visa.</p>
          </div>
          <div className="relative">
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-outline-variant/30 -translate-y-1/2"></div>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-8">
              
              {steps.map((step, idx) => {
                const isPreviousOrHovered = hoveredStep !== -1 && idx < hoveredStep;
                return (
                  <div 
                    key={idx} 
                    className="relative group cursor-pointer"
                    onMouseEnter={() => setHoveredStep(idx)}
                    onMouseLeave={() => setHoveredStep(-1)}
                  >
                    <div className={`w-16 h-16 bg-white border-2 border-secondary rounded-full flex items-center justify-center mx-auto mb-4 relative z-10 transition-all duration-300 group-hover:bg-secondary group-hover:text-white ${
                      isPreviousOrHovered ? "bg-secondary text-white" : "text-primary"
                    }`}>
                      <span className="text-xl font-bold">{step.number}</span>
                    </div>
                    <div className="text-center">
                      <h4 className="font-bold text-primary mb-2">{step.title}</h4>
                      <p className="text-body-sm text-on-surface-variant">{step.desc}</p>
                    </div>
                  </div>
                );
              })}

            </div>
          </div>
        </div>
      </section>

      {/* Pricing/Packages */}
      <section className="py-section-gap bg-surface-container-low">
        <div className="max-w-container-max mx-auto px-margin-desktop">
          <div className="text-center mb-16">
            <h2 className="text-headline-lg font-headline-lg text-primary">Choose the Level of Support You Need</h2>
            <p className="text-body-md text-on-surface-variant mt-2">Select a plan tailored to your visa requirements.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            
            {/* Standard */}
            <div className="bg-white p-10 rounded-xl shadow-sm border border-outline-variant/10 flex flex-col">
              <h3 className="text-headline-md font-bold text-primary mb-4">Standard Schengen Support</h3>
              <p className="text-body-sm text-on-surface-variant mb-6">Ideal for travelers who already have an appointment slot.</p>
              <div className="mb-8">
                <span className="text-4xl font-bold text-primary">AED 299</span>
                <span className="text-body-sm text-on-surface-variant">/ applicant</span>
              </div>
              <ul className="space-y-4 mb-10 flex-grow text-on-surface-variant">
                <li className="flex items-center gap-3"><span className="material-symbols-outlined text-secondary">check</span> Document Checklist</li>
                <li className="flex items-center gap-3"><span className="material-symbols-outlined text-secondary">check</span> Form Filling (Online)</li>
                <li className="flex items-center gap-3"><span className="material-symbols-outlined text-secondary">check</span> Cover Letter Drafting</li>
                <li className="flex items-center gap-3 text-on-surface-variant/40"><span className="material-symbols-outlined">close</span> Slot Tracking</li>
              </ul>
              <button 
                onClick={() => handleStartApplication("Standard")}
                className="w-full py-4 rounded-lg font-bold border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all"
              >
                Select Standard
              </button>
            </div>

            {/* Premium */}
            <div className="bg-primary-container p-10 rounded-xl shadow-xl border-2 border-secondary relative overflow-hidden flex flex-col">
              <div className="absolute top-4 right-4 bg-secondary text-on-secondary text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">Most Popular</div>
              <h3 className="text-headline-md font-bold text-white mb-4">Premium Fast-Track Appointment Booking</h3>
              <p className="text-on-primary-container text-body-sm mb-6">Comprehensive end-to-end management with appointment tracking.</p>
              <div className="mb-8">
                <span className="text-4xl font-bold text-secondary">AED 549</span>
                <span className="text-on-primary-container text-body-sm">/ applicant</span>
              </div>
              <ul className="space-y-4 mb-10 flex-grow text-white">
                <li className="flex items-center gap-3"><span className="material-symbols-outlined text-secondary">check</span> All Standard Features</li>
                <li className="flex items-center gap-3 font-bold text-secondary"><span className="material-symbols-outlined">auto_awesome</span> Appointment Slot Tracking</li>
                <li className="flex items-center gap-3"><span className="material-symbols-outlined text-secondary">check</span> Schengen Travel Insurance</li>
                <li className="flex items-center gap-3"><span className="material-symbols-outlined text-secondary">check</span> Flight & Hotel Vouchers</li>
                <li className="flex items-center gap-3"><span className="material-symbols-outlined text-secondary">check</span> In-person Document Pickup</li>
              </ul>
              <button 
                onClick={() => handleStartApplication("Premium")}
                className="w-full py-4 rounded-lg font-bold bg-secondary text-on-secondary hover:bg-secondary-fixed transition-all"
              >
                Select Premium
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-section-gap bg-surface">
        <div className="max-w-container-max mx-auto px-margin-desktop">
          <div className="grid md:grid-cols-3 gap-16">
            <div className="md:col-span-1">
              <h2 className="text-headline-lg font-headline-lg text-primary mb-4">Frequently Asked Questions</h2>
              <p className="text-body-md text-on-surface-variant mb-6">
                Everything you need to know about the Schengen application process in the UAE.
              </p>
              <button 
                onClick={() => handleScrollTo("apply")}
                className="flex items-center gap-2 text-secondary font-bold group"
              >
                Contact Support <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_right_alt</span>
              </button>
            </div>
            <div className="md:col-span-2 space-y-4">
              
              {faqs.map((faq, idx) => (
                <details 
                  key={idx} 
                  open={openFaq === idx}
                  className="group bg-surface-container-low rounded-xl overflow-hidden border border-outline-variant/10"
                >
                  <summary 
                    onClick={(e) => {
                      e.preventDefault();
                      setOpenFaq(openFaq === idx ? null : idx);
                    }}
                    className="flex items-center justify-between p-6 cursor-pointer list-none font-bold text-primary focus:outline-none"
                  >
                    {faq.q}
                    <span className="material-symbols-outlined group-open:rotate-180 transition-transform">expand_more</span>
                  </summary>
                  <div className="p-6 pt-0 text-body-md text-on-surface-variant border-t border-outline-variant/10">
                    {faq.a}
                  </div>
                </details>
              ))}

            </div>
          </div>
        </div>
      </section>

      {/* Secondary CTA */}
      <section className="py-16 bg-primary-container">
        <div className="max-w-container-max mx-auto px-margin-desktop">
          <div className="bg-secondary-container rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <h2 className="text-headline-lg font-bold text-on-secondary-container mb-2">Need an Urgent VFS & BLS Appointment?</h2>
              <p className="text-on-secondary-container/80 text-body-lg">
                Our automated VFS & BLS Slot Tracker monitors centers 24/7 to catch cancellations instantly.
              </p>
            </div>
            <button 
              onClick={() => handleScrollTo("apply")}
              className="bg-primary text-white px-8 py-4 rounded-xl font-bold whitespace-nowrap hover:opacity-90 transition-opacity"
            >
              Request Emergency Slot
            </button>
          </div>
        </div>
      </section>

      {/* Enquiry Form */}
      <section className="py-section-gap bg-surface" id="apply">
        <div className="max-w-container-max mx-auto px-margin-desktop">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-outline-variant/10 flex flex-col md:flex-row">
            
            {/* Contact sidebar */}
            <div className="md:w-1/3 bg-primary-container p-12 text-white flex flex-col justify-between">
              <div>
                <h2 className="text-headline-lg font-bold mb-6">Expert Consultation</h2>
                <p className="text-on-primary-container mb-8">
                  Send us your details and a visa specialist will call you within 15 minutes to evaluate your profile.
                </p>
              </div>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-secondary">call</span>
                  <span>+971 4 123 4567</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-secondary">mail</span>
                  <span>visa@eshaaretours.com</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-secondary">location_on</span>
                  <span>Business Bay, Dubai, UAE</span>
                </li>
              </ul>
            </div>

            {/* Form inputs */}
            <div className="md:w-2/3 p-12">
              <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-2">
                  <label className="text-label-md font-semibold text-primary">Full Name</label>
                  <input 
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full bg-surface-container-low border-none rounded-lg p-4 focus:ring-2 focus:ring-secondary transition-all" 
                    placeholder="John Doe" 
                    type="text" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-label-md font-semibold text-primary">Phone Number</label>
                  <input 
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full bg-surface-container-low border-none rounded-lg p-4 focus:ring-2 focus:ring-secondary transition-all" 
                    placeholder="+971 50 000 0000" 
                    type="tel" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-label-md font-semibold text-primary">Email Address</label>
                  <input 
                    name="email"
                    required
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full bg-surface-container-low border-none rounded-lg p-4 focus:ring-2 focus:ring-secondary transition-all" 
                    placeholder="john@example.com" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-label-md font-semibold text-primary">Visa Type</label>
                  <input 
                    className="w-full bg-surface-container-low border-none rounded-lg p-4 focus:ring-2 focus:ring-secondary transition-all text-on-surface-variant cursor-not-allowed" 
                    readonly 
                    type="text" 
                    value="Schengen Visa" 
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-label-md font-semibold text-primary">Travel Date & Purpose</label>
                  <textarea 
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="w-full bg-surface-container-low border-none rounded-lg p-4 focus:ring-2 focus:ring-secondary transition-all h-32" 
                    placeholder="Tell us about your planned travel date and intended country..."
                  ></textarea>
                </div>

                <div className="md:col-span-2">
                  <button 
                    disabled={isSubmitting}
                    className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:bg-primary-container transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    type="submit"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Enquiry"}
                  </button>
                </div>

              </form>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
};

export default VisaServicesPage;
