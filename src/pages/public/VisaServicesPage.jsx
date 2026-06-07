import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getVisaTypes, createLead } from "../../lib/firestore";
import { generateLeadNo } from "../../utils/helpers";
import { serverTimestamp } from "../../lib/firebase";
import Modal from "../../components/ui/Modal";
import { Clock, TrendingUp, FileText, Calendar, AlertCircle, Phone } from "lucide-react";
import toast from "react-hot-toast";

// Icon mapping helper
const StatIcon = ({ name, className }) => {
  const icons = {
    Clock: Clock,
    TrendingUp: TrendingUp,
    FileText: FileText,
    Calendar: Calendar
  };
  const IconComponent = icons[name] || FileText;
  return <IconComponent className={className} />;
};

export const VisaServicesPage = () => {
  const navigate = useNavigate();
  const [visaTypes, setVisaTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryTrigger, setRetryTrigger] = useState(0);

  // Modal Enquiry State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVisa, setSelectedVisa] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    nationality: "",
    travelDate: "",
    message: ""
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch published visa types in real-time
  useEffect(() => {
    setLoading(true);
    setError(false);
    const unsubscribe = getVisaTypes(
      (data) => {
        setVisaTypes(data);
        setLoading(false);
      },
      true, // onlyPublished = true
      (err) => {
        setError(true);
        setLoading(false);
        console.error("Failed to load visa services:", err);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [retryTrigger]);

  const handleApplyClick = (visa) => {
    setSelectedVisa(visa);
    setFormData({
      name: "",
      phone: "",
      email: "",
      nationality: "",
      travelDate: "",
      message: ""
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.email) {
      toast.error("Please complete all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      const generatedNo = await generateLeadNo();
      const submission = {
        leadNo: generatedNo,
        contactName: formData.name,
        contactPhone: formData.phone.startsWith("+") ? formData.phone : `+971${formData.phone}`,
        contactEmail: formData.email,
        nationality: formData.nationality,
        destinationCountry: selectedVisa?.name || "Global Visa",
        serviceType: "Visa",
        travelStart: formData.travelDate,
        source: "website_cms_listing",
        stage: "New",
        priority: "Medium",
        ownerId: null,
        notes: formData.message,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await createLead(submission);
      toast.success(`Inquiry submitted! Reference: ${generatedNo}`);
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit inquiry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#3F3A34] min-h-screen text-[#F5F1E8] font-sans pb-24">
      {/* Page Hero Banner */}
      <section className="relative py-28 overflow-hidden bg-[#2B2723] border-b border-[#4D4740] text-center">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1600&q=80"
            alt="Travel Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-[#3F3A34]/85 backdrop-blur-[2px]"></div>
        </div>

        <div className="relative z-10 max-w-container-max mx-auto px-4 space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold font-display text-white tracking-wide">
            Global Visa Assistance Services
          </h1>
          <p className="text-sm md:text-base text-[#F5F1E8]/80 max-w-xl mx-auto leading-relaxed">
            Fast, transparent document auditing & appointment booking assistance for Schengen Europe, United Kingdom, USA, UAE & Saudi Arabia.
          </p>
        </div>
      </section>

      {/* Main Visa Grid Listings */}
      <section className="max-w-container-max mx-auto px-4 py-16">
        {loading ? (
          /* 6 Skeleton Cards Loading State */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-[#2B2723] border border-[#4D4740] rounded-[16px] h-72 animate-pulse flex flex-col p-6 space-y-6"
              >
                <div className="h-6 bg-[#4D4740] rounded w-2/3"></div>
                <div className="h-4 bg-[#4D4740] rounded w-5/6"></div>
                <div className="h-0.5 bg-[#4D4740] w-10"></div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <div className="h-5 bg-[#4D4740] rounded w-1/2"></div>
                    <div className="h-3.5 bg-[#4D4740] rounded w-3/4"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-5 bg-[#4D4740] rounded w-1/2"></div>
                    <div className="h-3.5 bg-[#4D4740] rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          /* Error State */
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-[#E24B4A]" />
            <h3 className="text-xl font-bold text-white">System Error</h3>
            <p className="text-sm text-[#F5F1E8]/60">Unable to load visa services. Please refresh the page.</p>
            <button
              onClick={() => setRetryTrigger((prev) => prev + 1)}
              className="px-6 py-2.5 bg-gradient-to-r from-[#7A8F6B] to-[#627555] text-[#3F3A34] font-bold rounded-lg hover:opacity-95 transition-all text-xs uppercase tracking-wider"
            >
              Retry Loading
            </button>
          </div>
        ) : visaTypes.length === 0 ? (
          /* Empty State */
          <div className="glass-card bg-[#2B2723] border border-[#4D4740] rounded-[16px] p-12 max-w-lg mx-auto text-center space-y-6">
            <div className="mx-auto h-16 w-16 bg-[#4D4740] text-[#7A8F6B] rounded-full flex items-center justify-center">
              <AlertCircle className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">No visa services available yet</h3>
              <p className="text-xs text-[#F5F1E8]/60 leading-relaxed">
                Please check back soon or contact our Dubai support specialists directly for assistance.
              </p>
            </div>
            <a
              href="https://wa.me/971501234567?text=Hi%2C%20I'm%20inquiring%20about%20visa%20services."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-all"
            >
              <Phone className="h-4 w-4" />
              <span>Contact via WhatsApp</span>
            </a>
          </div>
        ) : (
          /* Grid of Visa Cards */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {visaTypes.map((visa) => {
              // Extract first 2 stats safely
              const firstStat = visa.heroStats?.[0] || { label: "Processing Time", value: "Standard", icon: "Clock" };
              const secondStat = visa.heroStats?.[1] || { label: "Success Rate", value: "High", icon: "TrendingUp" };

              return (
                <div
                  key={visa.id}
                  className="bg-[#2B2723] border border-[#4D4740] rounded-[16px] overflow-hidden hover:border-[#7A8F6B] hover:shadow-[0_0_20px_rgba(201,168,76,0.15)] transition-all duration-300 flex flex-col justify-between group animate-[fadeIn_0.3s_ease-out]"
                >
                  {/* Card Cover Image */}
                  <div className="h-48 w-full overflow-hidden bg-[#4D4740]/20 relative flex-shrink-0">
                    {visa.imageUrl ? (
                      <img
                        src={visa.imageUrl}
                        alt={visa.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#F5F1E8]/30 uppercase tracking-widest text-[9px] font-bold">
                        Eshaare Tours & Visas
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#2B2723] via-transparent to-transparent"></div>
                  </div>

                  {/* Card Text Content */}
                  <div className="p-6 pt-4 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold font-display text-white group-hover:text-[#7A8F6B] transition-colors leading-snug">
                        {visa.name}
                      </h3>
                      <p className="text-xs text-[#F5F1E8]/60 line-clamp-2 leading-relaxed">
                        {visa.tagline}
                      </p>

                      {/* Gold Divider */}
                      <div className="h-[1px] bg-[#7A8F6B] w-10"></div>

                      {/* First 2 Stats badged side-by-side */}
                      <div className="grid grid-cols-2 gap-4 py-2 border-b border-[#4D4740]/60 pb-2">
                        <div className="flex items-start gap-2">
                          <StatIcon name={firstStat.icon} className="h-4.5 w-4.5 text-[#7A8F6B] mt-0.5" />
                          <div>
                            <div className="text-base font-bold text-white font-mono leading-none">{firstStat.value}</div>
                            <span className="text-[9px] text-[#F5F1E8]/45 font-bold uppercase tracking-wider">{firstStat.label}</span>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <StatIcon name={secondStat.icon} className="h-4.5 w-4.5 text-[#7A8F6B] mt-0.5" />
                          <div>
                            <div className="text-base font-bold text-white font-mono leading-none">{secondStat.value}</div>
                            <span className="text-[9px] text-[#F5F1E8]/45 font-bold uppercase tracking-wider">{secondStat.label}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-4">
                      <Link
                        to={`/visa/${visa.slug}`}
                        className="w-full text-center py-2.5 border border-[#4D4740] text-white hover:border-[#7A8F6B] hover:text-[#7A8F6B] rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
                      >
                        Learn More
                      </Link>
                      <Link
                        to={`/visa-services/${visa.slug}`}
                        className="w-full text-center py-2.5 bg-gradient-to-r from-[#7A8F6B] to-[#627555] text-[#3F3A34] font-bold rounded-lg text-xs uppercase tracking-wider hover:opacity-95 transition-all shadow-sm flex items-center justify-center"
                      >
                        Apply Now
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Enquiry Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Apply for: ${selectedVisa?.name || "Visa Assistance"}`}
        size="md"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 font-sans text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] font-bold text-[#F5F1E8]/40 uppercase tracking-wider">Full Name *</label>
              <input
                type="text"
                required
                className="px-3.5 py-2.5 bg-[#2B2723] border border-[#4D4740] text-white placeholder-[#F5F1E8]/20 rounded focus:outline-none focus:border-[#7A8F6B] text-xs"
                placeholder="Jane Doe"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] font-bold text-[#F5F1E8]/40 uppercase tracking-wider">WhatsApp Phone *</label>
              <input
                type="tel"
                required
                className="px-3.5 py-2.5 bg-[#2B2723] border border-[#4D4740] text-white placeholder-[#F5F1E8]/20 rounded focus:outline-none focus:border-[#7A8F6B] text-xs"
                placeholder="e.g. 501234567"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] font-bold text-[#F5F1E8]/40 uppercase tracking-wider">Email Address *</label>
              <input
                type="email"
                required
                className="px-3.5 py-2.5 bg-[#2B2723] border border-[#4D4740] text-white placeholder-[#F5F1E8]/20 rounded focus:outline-none focus:border-[#7A8F6B] text-xs"
                placeholder="jane@example.com"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] font-bold text-[#F5F1E8]/40 uppercase tracking-wider">Nationality</label>
              <input
                type="text"
                className="px-3.5 py-2.5 bg-[#2B2723] border border-[#4D4740] text-white placeholder-[#F5F1E8]/20 rounded focus:outline-none focus:border-[#7A8F6B] text-xs"
                placeholder="e.g. Indian, Jordanian"
                name="nationality"
                value={formData.nationality}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="text-[10px] font-bold text-[#F5F1E8]/40 uppercase tracking-wider">Travel Start Date</label>
            <input
              type="date"
              className="px-3.5 py-2.5 bg-[#2B2723] border border-[#4D4740] text-white rounded focus:outline-none focus:border-[#7A8F6B] text-xs"
              name="travelDate"
              value={formData.travelDate}
              onChange={handleInputChange}
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="text-[10px] font-bold text-[#F5F1E8]/40 uppercase tracking-wider">Message</label>
            <textarea
              rows={3}
              className="px-3.5 py-2.5 bg-[#2B2723] border border-[#4D4740] text-white placeholder-[#F5F1E8]/20 rounded focus:outline-none focus:border-[#7A8F6B] text-xs"
              placeholder="Provide details about your travel history or urgent timing..."
              name="message"
              value={formData.message}
              onChange={handleInputChange}
            />
          </div>

          <div className="flex space-x-3 pt-4 border-t border-[#4D4740]">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 py-2.5 bg-[#4D4740] border border-[#4D4740] text-white font-bold rounded text-xs uppercase tracking-wider"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-gradient-to-r from-[#7A8F6B] to-[#627555] text-[#3F3A34] font-bold rounded text-xs uppercase tracking-wider shadow-sm disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Enquiry"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default VisaServicesPage;
