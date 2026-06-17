import React, { useState } from "react";
import { createLead } from "../../lib/firestore";
import { generateLeadNo } from "../../utils/helpers";
import toast from "react-hot-toast";

export const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "General Inquiry",
    message: "",
    honeypot: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const generatedNo = await generateLeadNo();
      const submission = {
        leadNo: generatedNo,
        contactName: formData.name,
        contactEmail: formData.email,
        contactPhone: formData.phone.startsWith("+") ? formData.phone : `+971${formData.phone}`,
        destination: formData.subject, // Store subject in destination/notes
        message: formData.message,
        source: "contact_form",
        stage: "New",
        assignedTo: "All",
        honeypot: formData.honeypot
      };

      await createLead(submission);
      toast.success("Message sent! We'll reply within 2 hours!");
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "General Inquiry",
        message: "",
        honeypot: ""
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to send message. Please contact us via phone or email directly.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactCards = [
    { title: "Phone", info: "+971 4 123 4567", sub: "Call our Dubai office", action: "tel:+97141234567", icon: "call" },
    { title: "WhatsApp", info: "+971 50 123 4567", sub: "Instant chat support", action: "https://wa.me/971501234567", icon: "chat" },
    { title: "Email", info: "info@eshaaretours.com", sub: "General & corporate enquiries", action: "mailto:info@eshaaretours.com", icon: "mail" },
    { title: "Location", info: "Business Bay, Dubai", sub: "Executive Business Center, 14th Floor", action: "https://maps.google.com", icon: "pin_drop" }
  ];

  return (
    <div className="bg-surface text-on-surface min-h-screen py-16 px-margin-mobile md:px-margin-desktop">
      <div className="max-w-container-max mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4 max-w-xl mx-auto">
          <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-primary">Contact Our Experts</h1>
          <p className="text-on-surface-variant text-body-md">
            Have questions about Schengen slots or custom itineraries? Send a message or visit our Dubai executive center.
          </p>
        </div>

        {/* Quick Contact Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {contactCards.map((card, idx) => (
            <a
              key={idx}
              href={card.action}
              target={card.action.startsWith("http") ? "_blank" : "_self"}
              rel="noopener noreferrer"
              className="bg-surface-container-lowest p-6 border border-outline-variant/10 rounded-2xl text-center flex flex-col items-center space-y-3 cursor-pointer premium-shadow hover:scale-[1.02] transition-transform"
            >
              <div className="p-3 rounded-full bg-secondary-container text-on-secondary-container border border-secondary">
                <span className="material-symbols-outlined text-2xl">{card.icon}</span>
              </div>
              <h4 className="font-headline-md text-body-lg font-bold text-primary">{card.title}</h4>
              <p className="text-body-sm font-semibold text-secondary">{card.info}</p>
              <p className="text-body-sm text-on-surface-variant">{card.sub}</p>
            </a>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Form */}
          <div className="lg:col-span-7 bg-surface-container-lowest p-8 border border-outline-variant/10 rounded-2xl premium-shadow">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Honeypot field for bot spam protection */}
              <input
                type="text"
                name="honeypot"
                style={{ display: "none" }}
                tabIndex="-1"
                autoComplete="off"
                value={formData.honeypot || ""}
                onChange={handleInputChange}
              />
              <h3 className="font-headline-md text-headline-md text-primary mb-4">Send a Message</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-body-sm font-semibold text-secondary">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="px-4 py-2.5 bg-surface-container border border-outline-variant/15 text-on-surface text-body-sm rounded-lg focus:outline-none"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-body-sm font-semibold text-secondary">WhatsApp Phone *</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    className="px-4 py-2.5 bg-surface-container border border-outline-variant/15 text-on-surface text-body-sm rounded-lg focus:outline-none"
                    placeholder="e.g. 501234567"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-body-sm font-semibold text-secondary">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="px-4 py-2.5 bg-surface-container border border-outline-variant/15 text-on-surface text-body-sm rounded-lg focus:outline-none"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-body-sm font-semibold text-secondary">Subject *</label>
                  <select
                    name="subject"
                    required
                    className="px-4 py-2.5 bg-surface-container border border-outline-variant/15 text-on-surface text-body-sm rounded-lg focus:outline-none"
                    value={formData.subject}
                    onChange={handleInputChange}
                  >
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Schengen Visa">Schengen Visa</option>
                    <option value="UK Visa">UK Visa</option>
                    <option value="USA Visa">USA Visa</option>
                    <option value="Tour Packages">Tour Packages</option>
                    <option value="Corporate Accounts">Corporate Accounts</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-body-sm font-semibold text-secondary">Message *</label>
                <textarea
                  name="message"
                  required
                  rows={4}
                  className="px-4 py-2.5 bg-surface-container border border-outline-variant/15 text-on-surface text-body-sm rounded-lg focus:outline-none"
                  placeholder="How can we assist you with your visa or itinerary..."
                  value={formData.message}
                  onChange={handleInputChange}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-primary text-on-primary font-bold text-body-sm rounded-xl uppercase tracking-wider transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {isSubmitting ? "Sending..." : "Submit Message"}
              </button>
            </form>
          </div>

          {/* Map and Hours */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-6">
            {/* Map Placeholder */}
            <div className="bg-surface-container-lowest p-8 border border-outline-variant/10 rounded-2xl premium-shadow flex-grow flex flex-col justify-center items-center text-center">
              <span className="material-symbols-outlined text-secondary text-5xl mb-2">pin_drop</span>
              <h4 className="font-headline-md text-headline-md text-primary">Executive Center, Dubai</h4>
              <p className="text-body-sm text-on-surface-variant max-w-xs mt-1">
                Business Bay, Sheikh Zayed Road, Dubai, UAE
              </p>
              
              <div className="w-full h-24 bg-surface-container border border-outline-variant/15 rounded-lg mt-4 flex items-center justify-center text-on-surface-variant/40 font-mono text-[10px] uppercase tracking-widest">
                [ Interactive Map Simulation ]
              </div>
            </div>

            {/* Business Hours */}
            <div className="bg-surface-container-lowest p-6 border border-outline-variant/10 rounded-2xl premium-shadow space-y-4">
              <h4 className="font-headline-md text-body-lg font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">schedule</span>
                <span>Business Hours</span>
              </h4>
              <div className="divide-y divide-outline-variant/15 text-body-sm text-on-surface-variant">
                <div className="flex justify-between py-2">
                  <span>Monday - Friday</span> 
                  <span className="font-semibold text-primary">09:00 AM - 06:00 PM</span>
                </div>
                <div className="flex justify-between py-2">
                  <span>Saturday</span> 
                  <span className="font-semibold text-primary">10:00 AM - 04:00 PM</span>
                </div>
                <div className="flex justify-between py-2">
                  <span>Sunday</span> 
                  <span className="text-error font-semibold">Closed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
