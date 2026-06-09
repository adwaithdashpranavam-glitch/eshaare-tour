import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createLead } from "../../lib/firestore";
import { generateLeadNo } from "../../utils/helpers";
import { serverTimestamp } from "../../lib/firebase";
import toast from "react-hot-toast";
import InteractiveCanvas from "../../components/ui/InteractiveCanvas";

export const HomePage = () => {
  const navigate = useNavigate();

  // Hero Slider State
  const [activeSlide, setActiveSlide] = useState(0);
  const slides = [
    {
      image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1600&q=80",
      headline: "Explore The World Without Boundaries",
      subtext: "Premium visa processing assistance & bespoke international holiday packages. Curated specifically for UAE residents seeking seamless global travel."
    },
    {
      image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80",
      headline: "Seamless Schengen & Global Visa Support",
      subtext: "99% document audit accuracy, express VFS slot allocations, and tailor-made NOC employer templates for rapid embassy approvals."
    },
    {
      image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1600&q=80",
      headline: "Curated Luxury Holiday Experiences",
      subtext: "Unlock handcrafted tour itineraries, priority entry passes, and boutique stays in Paris, Kyoto, London, and beyond."
    }
  ];

  // Auto advance slides
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  // Animated counters state
  const [counts, setCounts] = useState({ visas: 0, countries: 0, rate: 0, support: 0 });
  useEffect(() => {
    const interval = setInterval(() => {
      setCounts((prev) => {
        const next = { ...prev };
        if (next.visas < 1500) next.visas += 30;
        else next.visas = 1500;

        if (next.countries < 120) next.countries += 3;
        else next.countries = 120;

        if (next.rate < 98) next.rate += 2;
        else next.rate = 98;

        if (next.support < 24) next.support += 1;
        else next.support = 24;

        if (next.visas === 1500 && next.countries === 120 && next.rate === 98 && next.support === 24) {
          clearInterval(interval);
        }
        return next;
      });
    }, 30);
    return () => clearInterval(interval);
  }, []);

  // Continents Bar State
  const [activeContinent, setActiveContinent] = useState("Europe");
  const continentCountries = {
    Europe: [
      { name: "France", flag: "🇫🇷", type: "Schengen Visa" },
      { name: "Germany", flag: "🇩🇪", type: "Schengen Visa" },
      { name: "Switzerland", flag: "🇨🇭", type: "Schengen Visa" },
      { name: "United Kingdom", flag: "🇬🇧", type: "Standard Visitor" }
    ],
    Asia: [
      { name: "Japan", flag: "🇯🇵", type: "Tourist Visa" },
      { name: "Saudi Arabia", flag: "🇸🇦", type: "eVisa / Tourist" },
      { name: "Singapore", flag: "🇸🇬", type: "Tourist Visa" },
      { name: "Thailand", flag: "🇹🇭", type: "Visa on Arrival / Tourist" }
    ],
    Africa: [
      { name: "South Africa", flag: "🇿🇦", type: "Tourist Visa" },
      { name: "Egypt", flag: "🇪🇬", type: "Tourist Visa / eVisa" },
      { name: "Kenya", flag: "🇰🇪", type: "ETA / eVisa" },
      { name: "Morocco", flag: "🇲🇦", type: "Tourist Visa" }
    ],
    "North America": [
      { name: "United States", flag: "🇺🇸", type: "B1/B2 Tourist" },
      { name: "Canada", flag: "🇨🇦", type: "Visitor Visa" },
      { name: "Mexico", flag: "🇲🇽", type: "Tourist Visa" }
    ],
    "South America": [
      { name: "Brazil", flag: "🇧🇷", type: "Tourist Visa" },
      { name: "Argentina", flag: "🇦🇷", type: "Tourist Visa" },
      { name: "Peru", flag: "🇵🇪", type: "Visa Free / Tourist" }
    ],
    Oceania: [
      { name: "Australia", flag: "🇦🇺", type: "Visitor Visa (Subclass 600)" },
      { name: "New Zealand", flag: "🇳🇿", type: "Visitor Visa" }
    ],
    Antarctica: [
      { name: "Expedition Permit", flag: "❄️", type: "Special Permit Support" }
    ]
  };

  // Inquiry Form State
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    nationality: "",
    destination: "Schengen",
    travelDate: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const generatedNo = await generateLeadNo();
      const submission = {
        leadNo: generatedNo,
        contactName: formData.name,
        contactPhone: formData.phone.startsWith("+") ? formData.phone : `+971${formData.phone}`,
        contactEmail: formData.email,
        nationality: formData.nationality,
        destinationCountry: formData.destination,
        serviceType: "Visa",
        travelStart: formData.travelDate,
        source: "website",
        stage: "New",
        priority: "Medium",
        ownerId: null,
        notes: formData.message,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await createLead(submission);
      toast.success(`Request sent! reference number: ${generatedNo}`);
      setFormData({
        name: "",
        phone: "",
        email: "",
        nationality: "",
        destination: "Schengen",
        travelDate: "",
        message: ""
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit inquiry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const services = [
    { name: "Schengen Visa", desc: "Short stay visa assistance for 27 European countries.", slug: "schengen", icon: "euro" },
    { name: "UK Visa", desc: "Expert guidance for Standard Visitor and family visas.", slug: "uk", icon: "home" },
    { name: "USA Visa", desc: "B1/B2 tourist and business visa application support.", slug: "usa", icon: "map" },
    { name: "UAE Visa", desc: "Entry permits, tourist visas and residency setup.", slug: "uae", icon: "location_city" },
    { name: "Saudi Visa", desc: "Tourist eVisa and business visa arrangements.", slug: "saudi", icon: "mosque" },
    { name: "Japan Visa", desc: "Tourist and transit visa assistance for UAE residents.", slug: "japan", icon: "filter_hdr" },
    { name: "Business Visa", desc: "Corporate immigration and business visas worldwide.", slug: "business", icon: "business_center" },
    { name: "VFS Booking", desc: "Priority slot booking and document preparation.", slug: "vfs-booking", icon: "event_available" },
    { name: "Travel Insurance", desc: "Schengen-compliant global travel insurance plans.", slug: "insurance", icon: "health_and_safety" }
  ];

  const packages = [
    {
      title: "Classic Paris & Rome Explorer",
      dest: "France & Italy",
      duration: "7 Nights / 8 Days",
      price: "4,999",
      img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80",
      slug: "classic-paris-rome",
      featured: true
    },
    {
      title: "Tokyo & Kyoto Cultural Escape",
      dest: "Japan",
      duration: "6 Nights / 7 Days",
      price: "6,999",
      img: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80",
      slug: "tokyo-kyoto-cultural",
      featured: false
    },
    {
      title: "Magical London & Edinburgh",
      dest: "United Kingdom",
      duration: "8 Nights / 9 Days",
      price: "5,499",
      img: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80",
      slug: "magical-london-scotland",
      featured: false
    }
  ];

  return (
    <div className="bg-surface min-h-screen">
      <InteractiveCanvas />

      {/* HERO SLIDER SECTION */}
      <section className="relative overflow-hidden h-[70vh] min-h-[500px]">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${activeSlide === index ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
          >
            {/* Background Image */}
            <img
              src={slide.image}
              alt={slide.headline}
              className="w-full h-full object-cover"
            />
            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-black/40"></div>

            {/* Content Container */}
            <div className="absolute inset-0 flex flex-col justify-center max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop text-white">
              <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-white mb-4 max-w-2xl leading-tight">
                {slide.headline}
              </h1>
              <p className="font-body-lg text-body-lg text-white/90 max-w-lg mb-8 leading-relaxed">
                {slide.subtext}
              </p>
              <Link
                to="/appointment"
                className="bg-secondary-container text-on-secondary-container px-8 py-4 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-transform w-fit"
              >
                <span>Apply Now</span>
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
            </div>
          </div>
        ))}

        {/* Slider Dots */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${activeSlide === index ? "bg-white scale-125" : "bg-white/50 hover:bg-white"
                }`}
              title={`Go to slide ${index + 1}`}
            ></button>
          ))}
        </div>
      </section>

      {/* TRUST/STATS BAR */}
      <section className="relative overflow-hidden bg-primary-container py-6 px-margin-mobile md:px-margin-desktop">
        <div className="max-w-container-max mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center relative z-10">
          <div>
            <div className="font-display-lg text-secondary-fixed text-4xl md:text-4xl mb-1">{counts.visas}+</div>
            <div className="text-on-primary-container/80 font-label-md text-label-md">Visas Approved</div>
          </div>
          <div>
            <div className="font-display-lg text-secondary-fixed text-4xl md:text-4xl mb-1">{counts.countries}+</div>
            <div className="text-on-primary-container/80 font-label-md text-label-md">Countries Supported</div>
          </div>
          <div>
            <div className="font-display-lg text-secondary-fixed text-4xl md:text-4xl mb-1">{counts.rate}%</div>
            <div className="text-on-primary-container/80 font-label-md text-label-md">Success Rate</div>
          </div>
          <div>
            <div className="font-display-lg text-secondary-fixed text-4xl md:text-4xl mb-1">{counts.support}/7</div>
            <div className="text-on-primary-container/80 font-label-md text-label-md">Support Hours</div>
          </div>
        </div>
      </section>

      {/* SERVICE CARDS GRID */}
      <section className="relative overflow-hidden py-[120px] px-margin-mobile md:px-margin-desktop bg-surface">
        <div className="max-w-container-max mx-auto space-y-12 relative z-10">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <h2 className="font-headline-lg text-headline-lg text-primary">Comprehensive Visa Services</h2>
            <p className="text-on-surface-variant text-body-md">
              From Schengen visa audits to business slots, we manage the complete document checking lists for UAE residents.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.map((srv, idx) => (
              <div
                key={idx}
                className="relative bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/10 hover:border-secondary transition-all premium-shadow group flex flex-col justify-between"
              >
                <div>
                  <span className="material-symbols-outlined text-4xl text-secondary mb-6 block">
                    {srv.icon}
                  </span>
                  <h3 className="font-headline-md text-headline-md text-primary mb-3">
                    {srv.name}
                  </h3>
                  <p className="text-on-surface-variant text-body-sm mb-6 leading-relaxed">
                    {srv.desc}
                  </p>
                </div>

                <Link
                  to={`/visa-services/${srv.slug}`}
                  className="text-secondary font-bold flex items-center gap-2 group-hover:gap-4 transition-all w-fit mt-auto text-body-sm"
                >
                  <span>Enquire Now</span>
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED TOUR PACKAGES (BENTO GRID) */}
      <section className="relative overflow-hidden py-[120px] px-margin-mobile md:px-margin-desktop bg-surface-container-low">
        <div className="max-w-container-max mx-auto space-y-12 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div className="space-y-2">
              <h2 className="font-headline-lg text-headline-lg text-primary">Featured Holiday Packages</h2>
              <p className="text-on-surface-variant text-body-md">Explore curated luxury tours designed for UAE travellers.</p>
            </div>
            <Link
              to="/packages"
              className="text-secondary font-bold flex items-center gap-2 hover:gap-4 transition-all text-body-sm"
            >
              <span>View All Packages</span>
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </Link>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 h-[800px] md:h-[600px]">
            {/* France & Italy (Featured Large Card) */}
            <div className="relative group md:col-span-2 md:row-span-2">
              <div className="absolute inset-0 overflow-hidden rounded-2xl">
                <img
                  src={packages[0].img}
                  alt={packages[0].title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
              </div>
              <div className="absolute inset-0 flex flex-col justify-end p-8 text-white z-10">
                <span className="bg-secondary-container text-on-secondary-container text-[11px] font-bold px-3 py-1 rounded-full w-fit mb-3">
                  {packages[0].duration}
                </span>
                <h3 className="font-headline-lg text-headline-lg text-white mb-2">{packages[0].title}</h3>
                <p className="text-white/80 text-body-sm mb-4">Discover the romantic streets of Paris and the historic ruins of Rome with priority entry passes.</p>
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold font-display">{packages[0].price} AED</span>
                  <Link
                    to={`/packages/${packages[0].slug}`}
                    className="bg-white text-primary px-6 py-2.5 rounded-lg font-bold text-body-sm hover:bg-secondary-container hover:text-on-secondary-container transition-colors flex items-center gap-1"
                  >
                    <span>View Tour</span>
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Japan (Small Card) */}
            <div className="relative group md:col-span-1 md:row-span-1">
              <div className="absolute inset-0 overflow-hidden rounded-2xl">
                <img
                  src={packages[1].img}
                  alt={packages[1].title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
              </div>
              <div className="absolute inset-0 flex flex-col justify-end p-6 text-white z-10">
                <span className="text-[10px] text-white/85 font-medium mb-1">{packages[1].duration}</span>
                <h4 className="font-bold text-body-lg text-white mb-2">{packages[1].title}</h4>
                <div className="flex justify-between items-center">
                  <span className="font-bold">{packages[1].price} AED</span>
                  <Link
                    to={`/packages/${packages[1].slug}`}
                    className="text-secondary-container font-bold flex items-center gap-1 text-body-sm hover:underline"
                  >
                    <span>Details</span>
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* United Kingdom (Small Card) */}
            <div className="relative group md:col-span-1 md:row-span-1">
              <div className="absolute inset-0 overflow-hidden rounded-2xl">
                <img
                  src={packages[2].img}
                  alt={packages[2].title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
              </div>
              <div className="absolute inset-0 flex flex-col justify-end p-6 text-white z-10">
                <span className="text-[10px] text-white/85 font-medium mb-1">{packages[2].duration}</span>
                <h4 className="font-bold text-body-lg text-white mb-2">{packages[2].title}</h4>
                <div className="flex justify-between items-center">
                  <span className="font-bold">{packages[2].price} AED</span>
                  <Link
                    to={`/packages/${packages[2].slug}`}
                    className="text-secondary-container font-bold flex items-center gap-1 text-body-sm hover:underline"
                  >
                    <span>Details</span>
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Extra Bento Card (Call out / Stats highlight) */}
            <div className="relative group bg-primary-container p-8 rounded-2xl text-on-primary-container flex flex-col justify-between md:col-span-2 md:row-span-1 overflow-visible">
              <div className="relative z-10 flex flex-col justify-between h-full">
                <div>
                  <span className="material-symbols-outlined text-secondary-fixed text-4xl mb-4">public_off</span>
                  <h4 className="font-headline-md text-headline-md text-white mb-2">Can't Find Your Package?</h4>
                  <p className="text-on-primary-container/80 text-body-sm leading-relaxed">
                    We build customized boutique itineraries catering to your budget, travel group, and dates. Let us coordinate flight logistics, hotels, transfers, and visas.
                  </p>
                </div>
                <a
                  href="#enquire"
                  className="bg-secondary-container text-on-secondary-container px-6 py-3 rounded-xl font-bold text-body-sm hover:scale-[1.02] transition-transform w-fit flex items-center gap-2 mt-4"
                >
                  <span>Request Custom Package</span>
                  <span className="material-symbols-outlined text-lg">edit_note</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTINENTS BAR TAB FILTER */}
      <section className="relative overflow-hidden py-[120px] px-margin-mobile md:px-margin-desktop bg-surface">
        <div className="max-w-container-max mx-auto space-y-12 relative z-10">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <h2 className="font-headline-lg text-headline-lg text-primary">Global Visa Coverage</h2>
            <p className="text-on-surface-variant text-body-md">Check countries and requirements across all seven continents.</p>
          </div>

          {/* Continents Tabs */}
          <div className="flex gap-4 border-b border-outline-variant/20 overflow-x-auto pb-2 scrollbar-thin">
            {Object.keys(continentCountries).map((continent) => (
              <button
                key={continent}
                onClick={() => setActiveContinent(continent)}
                className={`pb-3 text-label-md font-label-md whitespace-nowrap cursor-pointer transition-colors ${activeContinent === continent
                    ? "text-secondary border-b-2 border-secondary font-semibold"
                    : "text-on-surface-variant hover:text-primary"
                  }`}
              >
                {continent}
              </button>
            ))}
          </div>

          {/* Countries Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {continentCountries[activeContinent].map((country, idx) => (
              <div
                key={idx}
                className="relative group bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 premium-shadow flex flex-col justify-between gap-4"
              >
                <div className="flex items-center gap-3 relative z-10">
                  <span className="text-3xl">{country.flag}</span>
                  <div>
                    <h4 className="font-bold text-body-md text-primary">{country.name}</h4>
                    <span className="text-body-sm text-on-surface-variant">{country.type}</span>
                  </div>
                </div>
                <Link
                  to="/visa-services"
                  className="text-secondary font-bold text-body-sm flex items-center gap-1 hover:underline w-fit mt-2 relative z-10"
                >
                  <span>View Visa Requirements</span>
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section className="relative overflow-hidden py-[120px] px-margin-mobile md:px-margin-desktop bg-surface-container-low">
        <div className="max-w-container-max mx-auto grid grid-cols-1 md:grid-cols-2 gap-[64px] items-center relative z-10">
          <div className="space-y-6">
            <h2 className="font-headline-lg text-headline-lg text-primary">About Eshaare Tours</h2>
            <p className="text-on-surface-variant text-body-md leading-relaxed">
              Based in the heart of Dubai, Eshaare Tours simplifies global travel planning and visa assistance for UAE residents. We combine boutique custom holiday design with absolute document audit accuracy to deliver seamless, worry-free getaways.
            </p>
            <p className="text-on-surface-variant text-body-md leading-relaxed">
              Whether you are applying for a Schengen visa for family holidays or need travel planning support for business conferences in the US, our dedicated coordinators provide customized checklists and NOC templates to guarantee visa approval.
            </p>
            <div className="pt-4 flex gap-6">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-3xl">verified</span>
                <div>
                  <h4 className="font-bold text-primary text-body-sm">Certified Experts</h4>
                  <p className="text-on-surface-variant text-body-sm">UAE visa processing coordinators.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-3xl">hourglass_empty</span>
                <div>
                  <h4 className="font-bold text-primary text-body-sm">Express Timelines</h4>
                  <p className="text-on-surface-variant text-body-sm">Priority embassy bookings.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative rounded-2xl overflow-hidden shadow-2xl h-[400px]">
            <img
              src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80"
              alt="About Eshaare Tours"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-primary-container/20"></div>
          </div>
        </div>
      </section>

      {/* TEAM GRID (4 MEMBERS) */}
      <section className="relative overflow-hidden py-[120px] px-margin-mobile md:px-margin-desktop bg-surface">
        <div className="max-w-container-max mx-auto space-y-12 relative z-10">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <h2 className="font-headline-lg text-headline-lg text-primary">Meet Our Specialists</h2>
            <p className="text-on-surface-variant text-body-md">Our team manages travel itineraries, embassy bookings, and file compliance audits.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { name: "Rakhi G Hari", role: "Managing Director", img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80" },
              { name: "Suresh Kumar", role: "Senior Visa Specialist", img: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80" },
              { name: "Aisha Al-Mansoori", role: "Luxury Tour Consultant", img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80" },
              { name: "Hassan Ali", role: "VFS Operations Lead", img: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80" }
            ].map((member, idx) => (
              <div key={idx} className="relative group bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 premium-shadow text-center space-y-4">
                <div className="relative z-10 space-y-4">
                  <div className="w-24 h-24 rounded-full overflow-hidden mx-auto shadow-md">
                    <img src={member.img} alt={member.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-bold text-body-lg text-primary">{member.name}</h4>
                    <p className="text-body-sm text-on-surface-variant">{member.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LEAD INQUIRY SECTION (2-COL) */}
      <section id="enquire" className="relative overflow-hidden py-[120px] px-margin-mobile md:px-margin-desktop bg-surface-container-low">
        <div className="max-w-container-max mx-auto bg-surface-container-lowest rounded-3xl overflow-hidden premium-shadow border border-outline-variant/10 grid grid-cols-1 md:grid-cols-3 relative z-10">

          {/* Left Column (Dark Navy) */}
          <div className="bg-primary-container p-12 text-on-primary-container flex flex-col justify-between gap-8">
            <div className="space-y-4">
              <h2 className="font-headline-lg text-headline-lg text-white">Contact Us</h2>
              <p className="text-on-primary-container text-body-sm leading-relaxed">
                Submit your travel inquiry and one of our visa consultants will contact you within 2 hours.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary-fixed text-2xl">call</span>
                <div>
                  <p className="text-white/60 text-xs">Call or WhatsApp</p>
                  <p className="text-white font-bold text-body-md">+971 50 123 4567</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary-fixed text-2xl">mail</span>
                <div>
                  <p className="text-white/60 text-xs">Email Support</p>
                  <p className="text-white font-bold text-body-md">support@eshaaretours.com</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary-fixed text-2xl">pin_drop</span>
                <div>
                  <p className="text-white/60 text-xs">Location</p>
                  <p className="text-white font-bold text-body-md">Business Bay, Dubai, UAE</p>
                </div>
              </div>
            </div>

            <p className="text-on-primary-container/70 text-body-sm">
              Operational Hours: Monday - Saturday, 9:00 AM - 6:00 PM GST
            </p>
          </div>

          {/* Right Column (Form) */}
          <div className="md:col-span-2 p-12 space-y-6">
            <h3 className="font-headline-md text-headline-md text-primary">Request an Eligibility Assessment</h3>
            <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div className="flex flex-col gap-2">
                <label className="font-label-md text-label-md text-on-surface-variant">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Jane Doe"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full bg-surface-container border border-outline-variant/15 rounded-lg px-4 py-3 text-body-sm focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-label-md text-label-md text-on-surface-variant">WhatsApp Number *</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder="e.g. 501234567"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full bg-surface-container border border-outline-variant/15 rounded-lg px-4 py-3 text-body-sm focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-label-md text-label-md text-on-surface-variant">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="e.g. jane.doe@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full bg-surface-container border border-outline-variant/15 rounded-lg px-4 py-3 text-body-sm focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-label-md text-label-md text-on-surface-variant">Your Nationality *</label>
                <input
                  type="text"
                  name="nationality"
                  required
                  placeholder="e.g. Indian, Jordanian"
                  value={formData.nationality}
                  onChange={handleInputChange}
                  className="w-full bg-surface-container border border-outline-variant/15 rounded-lg px-4 py-3 text-body-sm focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-label-md text-label-md text-on-surface-variant">Destination Country *</label>
                <select
                  name="destination"
                  required
                  value={formData.destination}
                  onChange={handleInputChange}
                  className="w-full bg-surface-container border border-outline-variant/15 rounded-lg px-4 py-3 text-body-sm focus:outline-none"
                >
                  <option value="Schengen">Schengen Europe</option>
                  <option value="UK">United Kingdom</option>
                  <option value="USA">United States</option>
                  <option value="UAE">United Arab Emirates</option>
                  <option value="Saudi">Saudi Arabia</option>
                  <option value="Japan">Japan</option>
                  <option value="Other">Other Country</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-label-md text-label-md text-on-surface-variant">Travel Start Date</label>
                <input
                  type="date"
                  name="travelDate"
                  value={formData.travelDate}
                  onChange={handleInputChange}
                  className="w-full bg-surface-container border border-outline-variant/15 rounded-lg px-4 py-3 text-body-sm focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="font-label-md text-label-md text-on-surface-variant">Additional Message</label>
                <textarea
                  name="message"
                  rows={3}
                  placeholder="Tell us about your visa history, travel companion counts, or urgent requirements..."
                  value={formData.message}
                  onChange={handleInputChange}
                  className="w-full bg-surface-container border border-outline-variant/15 rounded-lg px-4 py-3 text-body-sm focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold hover:opacity-90 transition-opacity md:col-span-2 disabled:opacity-50"
              >
                {isSubmitting ? "Submitting Inquiry..." : "Submit Inquiry"}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section className="relative overflow-hidden py-[120px] px-margin-mobile md:px-margin-desktop bg-surface">
        <div className="max-w-container-max mx-auto bg-primary-container p-12 rounded-3xl relative overflow-hidden space-y-12 z-10">
          {/* Decorative Blobs */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-secondary/10 rounded-full blur-3xl"></div>

          <div className="text-center space-y-3 max-w-xl mx-auto relative z-10">
            <h2 className="font-headline-lg text-headline-lg text-white">What Our Travellers Say</h2>
            <p className="text-on-primary-container text-body-md">Read positive reviews from satisfied clients who booked their visa assistance through Eshaare Tours.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            <div className="relative group bg-white/5 p-8 rounded-xl border border-white/10 flex flex-col justify-between gap-6 overflow-visible">
              <div className="relative z-10 flex flex-col justify-between gap-6 h-full">
                <p className="text-white italic text-body-md">
                  "Got my French Schengen visa in record time!Rakhi and Hassan made the NOC reviews and slot booking effortless. The client portal is completely state-of-the-art for tracing documents."
                </p>
                <div>
                  <h4 className="text-secondary-fixed font-bold text-body-md">Sarah Al-Kamali</h4>
                  <p className="text-white/60 text-xs uppercase tracking-widest">Abu Dhabi resident</p>
                </div>
              </div>
            </div>

            <div className="relative group bg-white/5 p-8 rounded-xl border border-white/10 flex flex-col justify-between gap-6 overflow-visible">
              <div className="relative z-10 flex flex-col justify-between gap-6 h-full">
                <p className="text-white italic text-body-md">
                  "We booked a 7-day Rome & Paris tour package through Eshaare. They coordinate all flight transfers and secured Schengen appointments in Waﬁ mall Dubai. Exceptional service!"
                </p>
                <div>
                  <h4 className="text-secondary-fixed font-bold text-body-md">Michael Richardson</h4>
                  <p className="text-white/60 text-xs uppercase tracking-widest">UK Expat in Dubai</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
