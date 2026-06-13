import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createLead } from "../../lib/firestore";
import { generateLeadNo } from "../../utils/helpers";
import { db, serverTimestamp } from "../../lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import toast from "react-hot-toast";
import InteractiveCanvas from "../../components/ui/InteractiveCanvas";

// ─── Service images (one per service, matched by index) ────────────────────
const SERVICE_IMAGES = [
  "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=900&q=80", // Schengen – Paris/Europe
  "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=900&q=80", // UK – London
  "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=900&q=80", // USA – New York
  "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=900&q=80", // UAE – Dubai
  "https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?auto=format&fit=crop&w=900&q=80", // Saudi – Riyadh
  "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=900&q=80", // Japan – Kyoto
  "https://images.unsplash.com/photo-1556740772-1a741367b93e?auto=format&fit=crop&w=900&q=80", // Business – corporate
  "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=900&q=80", // VFS – airport
  "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=900&q=80", // Insurance – health/travel
];

export const HomePage = () => {
  const navigate = useNavigate();

  // ─── Hero Slider ────────────────────────────────────────────────────────
  const [activeSlide, setActiveSlide] = useState(0);
  const slides = [
    {
      image: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1600&q=80",
      headline: "Explore The World Without Boundaries",
      subtext: "Premium visa processing assistance & bespoke international holiday packages. Curated specifically for UAE residents seeking seamless global travel.",
      animated: true
    },
    {
      image: "https://plus.unsplash.com/premium_photo-1684407617181-275e50374e95?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      headline: "Seamless Schengen & Global Visa Support",
      subtext: "99% document audit accuracy, express VFS slot allocations, and tailor-made NOC employer templates for rapid embassy approvals.",
      animated: false
    },
    {
      image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1600&q=80",
      headline: "Curated Luxury Holiday Experiences",
      subtext: "Unlock handcrafted tour itineraries, priority entry passes, and boutique stays in Paris, Kyoto, London, and beyond.",
      animated: false
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  // ─── Animated counters ───────────────────────────────────────────────────
  const [counts, setCounts] = useState({ visas: 0, countries: 0, rate: 0, support: 0 });
  useEffect(() => {
    const interval = setInterval(() => {
      setCounts((prev) => {
        const next = { ...prev };
        if (next.visas < 1500) next.visas += 30; else next.visas = 1500;
        if (next.countries < 120) next.countries += 3; else next.countries = 120;
        if (next.rate < 98) next.rate += 2; else next.rate = 98;
        if (next.support < 24) next.support += 1; else next.support = 24;
        if (next.visas === 1500 && next.countries === 120 && next.rate === 98 && next.support === 24) {
          clearInterval(interval);
        }
        return next;
      });
    }, 30);
    return () => clearInterval(interval);
  }, []);

  // ─── Continents ──────────────────────────────────────────────────────────
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

  // ─── Inquiry Form ────────────────────────────────────────────────────────
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
        name: "", phone: "", email: "", nationality: "",
        destination: "Schengen", travelDate: "", message: ""
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit inquiry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const services = [
    { name: "Schengen Visa", desc: "Full document audit for all 27 Schengen countries — itinerary, financials, travel history, and cover letters checked before your embassy appointment.", slug: "schengen", icon: "euro" },
    { name: "UK Visa", desc: "Expert guidance for Standard Visitor and family visas. We prepare your financial evidence, invitation letters, and biometric appointment booking.", slug: "uk", icon: "home" },
    { name: "USA Visa", desc: "B1/B2 tourist and business visa application support with DS-160 assistance, interview preparation, and embassy appointment scheduling.", slug: "usa", icon: "map" },
    { name: "UAE Visa", desc: "Entry permits, tourist visas and residency setup for all nationalities. Fast processing with full document compliance checks.", slug: "uae", icon: "location_city" },
    { name: "Saudi Visa", desc: "Tourist eVisa and business visa arrangements. We manage the online application, sponsor documentation, and health declaration forms.", slug: "saudi", icon: "mosque" },
    { name: "Japan Visa", desc: "Tourist and transit visa assistance for UAE residents. Itinerary planning, hotel bookings, and bank statement guidance included.", slug: "japan", icon: "filter_hdr" },
    { name: "Business Visa", desc: "Corporate immigration and business visas worldwide. NOC templates, employer letters, and trade licence submissions handled for you.", slug: "business", icon: "business_center" },
    { name: "VFS Booking", desc: "Priority slot booking and document preparation for VFS Global centres across the UAE. Express appointments for urgent travellers.", slug: "vfs-booking", icon: "event_available" },
    { name: "Travel Insurance", desc: "Schengen-compliant global travel insurance plans with same-day policy issuance and minimum coverage guarantees.", slug: "insurance", icon: "health_and_safety" }
  ];

  const packages = [
    {
      title: "Magical Kerala Backwater Escape",
      dest: "Kerala, India",
      duration: "6 Nights / 7 Days",
      price: "3,999",
      img: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80",
      slug: "kerala-backwater-escape",
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

  const fallbackSpecialists = [
    {
      id: "fallback-rakhi",
      name: "Rakhi G Hari",
      designation: "Managing Director",
      intro: "Coordinating premium custom holiday designs and ensuring absolute file compliance for high-net-worth travelers.",
      img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80",
      visasFiled: 2400,
      experienceYears: 12,
      successRate: 99
    },
    {
      id: "fallback-suresh",
      name: "Suresh Kumar",
      designation: "Senior Visa Specialist",
      intro: "Expert in Schengen, UK, and USA document audits with deep knowledge of VFS visa operations and embassy protocols.",
      img: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=80",
      visasFiled: 1850,
      experienceYears: 9,
      successRate: 98
    },
    {
      id: "fallback-aisha",
      name: "Aisha Al-Mansoori",
      designation: "Luxury Tour Consultant",
      intro: "Crafting bespoke global itineraries for European tours, Japan escapes, and exotic destination getaways.",
      img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80",
      visasFiled: 950,
      experienceYears: 6,
      successRate: 100
    },
    {
      id: "fallback-hassan",
      name: "Hassan Ali",
      designation: "VFS Operations Lead",
      intro: "Managing slot bookings, biometric appointments, and rapid document dispatch for all Eshaare clients.",
      img: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80",
      visasFiled: 3200,
      experienceYears: 11,
      successRate: 98
    }
  ];

  const [specialists, setSpecialists] = useState([]);
  const [activeSpecIndex, setActiveSpecIndex] = useState(0);

  // Firestore sync for specialists
  useEffect(() => {
    const sRef = collection(db, "users");
    const unsubscribe = onSnapshot(sRef, (snapshot) => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Filter: role exists, is not client/customer
        const staffOnly = list.filter(u => u.role && !["client", "customer"].includes(u.role));

        const mapped = staffOnly.map(member => ({
          id: member.id,
          name: member.name || "Specialist",
          designation: member.designation || member.role || "Visa Expert",
          intro: member.intro || "Expert document auditor and travel coordinator at Eshaare.",
          img: member.img || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
          visasFiled: Number(member.visasFiled) || 1200,
          experienceYears: Number(member.experienceYears) || 8,
          successRate: Number(member.successRate) || 98
        }));

        if (mapped.length > 0) {
          setSpecialists(mapped);
        } else {
          setSpecialists(fallbackSpecialists);
        }
      } else {
        setSpecialists(fallbackSpecialists);
      }
    }, (error) => {
      console.warn("Error loading specialists:", error);
      setSpecialists(fallbackSpecialists);
    });

    return () => unsubscribe();
  }, []);

  // Auto-skip rotation timer for specialists (every 5 seconds)
  useEffect(() => {
    if (specialists.length <= 1) return;
    const interval = setInterval(() => {
      setActiveSpecIndex((prev) => (prev + 1) % specialists.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [specialists.length]);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getSpecialistTags = (designation) => {
    const des = (designation || "").toLowerCase();
    if (des.includes("managing") || des.includes("director") || des.includes("rakhi")) {
      return {
        highlighted: "Leadership",
        secondary: ["Schengen", "UK Visas"]
      };
    }
    if (des.includes("senior") || des.includes("suresh") || des.includes("visa specialist")) {
      return {
        highlighted: "Business Visas",
        secondary: ["USA B1/B2", "NOC Templates"]
      };
    }
    if (des.includes("vfs") || des.includes("operations") || des.includes("hassan")) {
      return {
        highlighted: "VFS Slots",
        secondary: ["Biometrics", "Express Booking"]
      };
    }
    if (des.includes("luxury") || des.includes("consultant") || des.includes("aisha") || des.includes("tour")) {
      return {
        highlighted: "Bespoke Tours",
        secondary: ["Europe Packages", "Japan Itinerary"]
      };
    }
    return {
      highlighted: "Visa Audit",
      secondary: ["Compliance", "Documentation"]
    };
  };

  const getRelativeIndex = (idx) => {
    const N = specialists.length;
    if (N === 0) return 0;
    const diff = idx - activeSpecIndex;
    let rel = diff;
    while (rel < -N / 2) rel += N;
    while (rel > N / 2) rel -= N;
    return rel;
  };

  const [visibleSections, setVisibleSections] = useState({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.dataset.animate;
            setVisibleSections((prev) => ({
              ...prev,
              [id]: true,
            }));
          }
        });
      },
      {
        threshold: 0.2,
      }
    );

    const elements = document.querySelectorAll("[data-animate]");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const typewriterClass = (id) =>
    `typewriter-animate ${visibleSections[id] ? "active" : ""}`;

  // ─── Services Vertical Carousel ──────────────────────────────────────────
  const [activeSvc, setActiveSvc] = useState(0);
  const [svcAnimating, setSvcAnimating] = useState(false);
  const SLIDE_HEIGHT = 520;
  const TOTAL_SVC = services.length;
  const carouselRef = useRef(null);
  const sectionRef = useRef(null);
  const dragStartY = useRef(null);
  // Tracks whether the section's scroll trap is "active" (in viewport)
  const scrollTrapActive = useRef(false);
  // Accumulated wheel delta to avoid hyper-sensitive misfires
  const wheelAccum = useRef(0);
  const wheelTimer = useRef(null);

  function goToSvc(idx) {
    if (svcAnimating || idx === activeSvc) return;
    setSvcAnimating(true);
    setActiveSvc(Math.max(0, Math.min(TOTAL_SVC - 1, idx)));
    setTimeout(() => setSvcAnimating(false), 520);
  }

  function stepSvc(dir) { goToSvc(activeSvc + dir); }

  // ─── Scroll Trap Logic ───────────────────────────────────────────────────
  // We attach a non-passive wheel listener to the window so we can
  // preventDefault() when the carousel section is in view and slides remain.
  // After the last slide (scrolling down) or before the first slide
  // (scrolling up), we release the page scroll normally.

  const handleWindowWheel = useCallback((e) => {
    if (!scrollTrapActive.current) return;

    const el = sectionRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const header = document.querySelector("header");
    const navHeight = header ? header.getBoundingClientRect().bottom : 64;

    const goingDown = e.deltaY > 0;
    const goingUp = e.deltaY < 0;
    const atEnd = activeSvc >= TOTAL_SVC - 1;
    const atStart = activeSvc <= 0;

    // Detect if the section top has crossed or aligned with the header bottom
    const isPastHeaderBottom = rect.top <= navHeight + 20;
    const isBelowHeaderBottom = rect.top >= navHeight - 20;

    // Trap conditions:
    // 1. Scrolling down, and section top is aligned or already scrolled past the navbar bottom, and there are slides remaining down
    // 2. Scrolling up, and section top is aligned or already below the navbar bottom, and there are slides remaining up
    // 3. Or we are currently in a middle slide (meaning the user is in the middle of our carousel)
    const shouldTrap =
      (goingDown && !atEnd && isPastHeaderBottom) ||
      (goingUp && !atStart && isBelowHeaderBottom && rect.top < window.innerHeight) ||
      (activeSvc > 0 && activeSvc < TOTAL_SVC - 1);

    if (shouldTrap) {
      // Capture the wheel event and advance the carousel
      e.preventDefault();

      // Smoothly scroll the container to align its top with the sticky header's bottom
      const offset = rect.top - navHeight;
      if (Math.abs(offset) > 2) {
        window.scrollTo({
          top: window.scrollY + offset,
          behavior: "smooth"
        });
      }

      // Debounce/accumulate so rapid small deltas don't fire too fast
      wheelAccum.current += Math.abs(e.deltaY);
      if (wheelTimer.current) clearTimeout(wheelTimer.current);
      wheelTimer.current = setTimeout(() => { wheelAccum.current = 0; }, 150);

      if (wheelAccum.current >= 60) {
        wheelAccum.current = 0;
        stepSvc(goingDown ? 1 : -1);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSvc, svcAnimating]);

  // Attach/detach the wheel listener
  useEffect(() => {
    window.addEventListener("wheel", handleWindowWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWindowWheel);
  }, [handleWindowWheel]);

  // IntersectionObserver: flip scrollTrapActive when section enters/leaves viewport
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { scrollTrapActive.current = entry.isIntersecting; },
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Touch scroll trap for the carousel window itself
  function handleCarouselTouchStart(e) {
    dragStartY.current = e.touches[1].clientY;
  }
  function handleCarouselTouchEnd(e) {
    if (dragStartY.current === null) return;
    const diff = dragStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(diff) > 40) stepSvc(diff > 0 ? 1 : -1);
    dragStartY.current = null;
  }


  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="bg-surface min-h-screen">
      <InteractiveCanvas />

      {/* HERO SLIDER SECTION */}
      <section className="relative overflow-hidden h-[91vh] min-h-[500px]">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${activeSlide === index ? "opacity-100 z-10" : "opacity-0 z-0"}`}
          >
            <img
              src={slide.image}
              alt={slide.headline}
              className={`w-full h-full object-cover ${slide.animated ? "animate-aurora-pan" : ""}`}
            />
            <div className="absolute inset-0 bg-black/40"></div>
            <div className="absolute inset-0 flex flex-col justify-center max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop text-white">
              <h1
                className={`font-display-lg text-display-lg-mobile md:text-display-lg text-white mb-4 max-w-2xl leading-tight
                  transition-all duration-700 delay-300
                  ${activeSlide === index ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
              >
                {slide.headline}
              </h1>
              <p
                className={`font-body-lg text-body-lg text-white/90 max-w-lg mb-8 leading-relaxed
                  transition-all duration-700 delay-500
                  ${activeSlide === index ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
              >
                {slide.subtext}
              </p>
              <Link
                to="/appointment"
                className={`group inline-flex items-center gap-2 w-fit px-8 py-4 rounded-xl font-bold text-white
                  bg-white/15 backdrop-blur-xl ring-1 ring-white/30
                  shadow-[0_10px_30px_-10px_rgba(0,0,0,0.35)]
                  hover:bg-white/25 hover:ring-white/50
                  hover:shadow-[0_16px_40px_-12px_rgba(255,255,255,0.25)]
                  transition-all duration-700 delay-700 hover:scale-105
                  ${activeSlide === index ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
              >
                <span>Apply Now</span>
                <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
              </Link>
            </div>
          </div>
        ))}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${activeSlide === index ? "bg-white scale-125" : "bg-white/50 hover:bg-white"}`}
              title={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* TRUST / STATS BAR */}
      <section className="relative -mt-8 md:-mt-5 z-30 px-margin-mobile md:px-margin-desktop">
        <div className="max-w-container-max mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">

            <div className="group relative flex items-center gap-4 bg-white/30 backdrop-blur-xl ring-1 ring-white/40 rounded-2xl px-5 py-4 md:px-6 md:py-5 shadow-[0_8px_30px_-10px_rgba(29,80,58,0.15)] hover:shadow-[0_16px_40px_-12px_rgba(212,175,55,0.25)] hover:bg-white/40 transition-all duration-500">
              <div className="relative shrink-0">
                <div className="size-10 rotate-45 border border-[#D4AF37]/50 flex items-center justify-center transition-transform duration-700 group-hover:rotate-[135deg]">
                  <span className="material-symbols-outlined -rotate-45 group-hover:rotate-[-135deg] transition-transform duration-700 text-[#1D503A] text-[18px]">verified</span>
                </div>
                <div className="absolute -top-1 -left-1 size-1.5 border-t border-l border-[#D4AF37]/70" />
                <div className="absolute -bottom-1 -right-1 size-1.5 border-b border-r border-[#D4AF37]/70" />
              </div>
              <div className="flex flex-col text-left min-w-0">
                <div className="font-serif italic text-xl md:text-3xl text-[#1D503A] leading-tight">{counts.visas}+</div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#1D503A]/80 mt-0.5">Visas Approved</p>
              </div>
            </div>

            <div className="group relative flex items-center gap-4 bg-white/30 backdrop-blur-xl ring-1 ring-white/40 rounded-2xl px-5 py-4 md:px-6 md:py-5 shadow-[0_8px_30px_-10px_rgba(29,80,58,0.15)] hover:shadow-[0_16px_40px_-12px_rgba(212,175,55,0.25)] hover:bg-white/40 transition-all duration-500">
              <div className="relative shrink-0">
                <div className="size-10 rotate-45 border border-[#D4AF37]/50 flex items-center justify-center transition-transform duration-700 group-hover:rotate-[135deg]">
                  <span className="material-symbols-outlined -rotate-45 group-hover:rotate-[-135deg] transition-transform duration-700 text-[#1D503A] text-[18px]">public</span>
                </div>
                <div className="absolute -top-1 -left-1 size-1.5 border-t border-l border-[#D4AF37]/70" />
                <div className="absolute -bottom-1 -right-1 size-1.5 border-b border-r border-[#D4AF37]/70" />
              </div>
              <div className="flex flex-col text-left min-w-0">
                <div className="font-serif italic text-xl md:text-3xl text-[#1D503A] leading-tight">{counts.countries}+</div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#1D503A]/80 mt-0.5">Countries</p>
              </div>
            </div>

            <div className="group relative flex items-center gap-4 bg-white/30 backdrop-blur-xl ring-1 ring-white/40 rounded-2xl px-5 py-4 md:px-6 md:py-5 shadow-[0_8px_30px_-10px_rgba(29,80,58,0.15)] hover:shadow-[0_16px_40px_-12px_rgba(212,175,55,0.25)] hover:bg-white/40 transition-all duration-500">
              <div className="relative shrink-0">
                <div className="size-10 rotate-45 bg-[#1D503A] flex items-center justify-center transition-transform duration-700 group-hover:rotate-[225deg]">
                  <span className="material-symbols-outlined -rotate-45 group-hover:rotate-[-225deg] transition-transform duration-700 text-[#D4AF37] text-[18px]">trending_up</span>
                </div>
                <div className="absolute -top-1 -left-1 size-1.5 border-t border-l border-[#D4AF37]/70" />
                <div className="absolute -bottom-1 -right-1 size-1.5 border-b border-r border-[#D4AF37]/70" />
              </div>
              <div className="flex flex-col text-left min-w-0">
                <div className="font-serif italic text-xl md:text-3xl text-[#1D503A] leading-tight">{counts.rate}%</div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#1D503A]/80 mt-0.5">Success Rate</p>
              </div>
            </div>

            <div className="group relative flex items-center gap-4 bg-white/30 backdrop-blur-xl ring-1 ring-white/40 rounded-2xl px-5 py-4 md:px-6 md:py-5 shadow-[0_8px_30px_-10px_rgba(29,80,58,0.15)] hover:shadow-[0_16px_40px_-12px_rgba(212,175,55,0.25)] hover:bg-white/40 transition-all duration-500">
              <div className="relative shrink-0">
                <div className="size-10 rotate-45 border border-[#D4AF37]/50 flex items-center justify-center transition-transform duration-700 group-hover:rotate-[135deg]">
                  <span className="material-symbols-outlined -rotate-45 group-hover:rotate-[-135deg] transition-transform duration-700 text-[#1D503A] text-[18px]">support_agent</span>
                </div>
                <div className="absolute -top-1 -left-1 size-1.5 border-t border-l border-[#D4AF37]/70" />
                <div className="absolute -bottom-1 -right-1 size-1.5 border-b border-r border-[#D4AF37]/70" />
              </div>
              <div className="flex flex-col text-left min-w-0">
                <div className="font-serif italic text-xl md:text-3xl text-[#1D503A] leading-tight">{counts.support}/7</div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#1D503A]/80 mt-0.5">Support</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── SERVICE CARDS — VERTICAL SCROLL CAROUSEL ──────────────────────── */}
      <section
        ref={sectionRef}
        className="relative overflow-hidden py-[90px] px-margin-mobile md:px-margin-desktop bg-surface"
      >
        <div className="max-w-container-max mx-auto space-y-12 relative z-10">

          {/* Section header */}
          <div
            data-animate="visa-services"
            className={`text-center max-w-xl mx-auto space-y-3 transition-opacity duration-1000 ${visibleSections["visa-services"] ? "opacity-100" : "opacity-0"}`}
          >
            <h2 className={`font-headline-lg text-[30px] sm:text-2xl md:text-headline-lg text-primary ${typewriterClass("visa-services")}`}>
              Visa Services
            </h2>
            <p className="text-on-surface-variant text-body-md">
              From Schengen visa audits to business slots, we manage the complete document checking lists for UAE residents.
            </p>
          </div>

          {/* Carousel layout — main window + right sidebar */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_160px] gap-6 items-start">

            {/* ── Slide window ── */}
            <div
              ref={carouselRef}
              className="relative overflow-hidden rounded-2xl border border-outline-variant/10 bg-surface-container-lowest cursor-grab active:cursor-grabbing select-none"
              style={{ height: SLIDE_HEIGHT }}
              onMouseDown={(e) => { dragStartY.current = e.clientY; }}
              onMouseUp={(e) => {
                if (dragStartY.current === null) return;
                const diff = dragStartY.current - e.clientY;
                if (Math.abs(diff) > 50) stepSvc(diff > 0 ? 1 : -1);
                dragStartY.current = null;
              }}
              onMouseLeave={() => { dragStartY.current = null; }}
              onTouchStart={handleCarouselTouchStart}
              onTouchEnd={handleCarouselTouchEnd}
            >
              {/* Track */}
              <div
                className="flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-transform"
                style={{ transform: `translateY(-${activeSvc * SLIDE_HEIGHT}px)` }}
              >
                {services.map((srv, idx) => (
                  <div
                    key={idx}
                    className="relative flex flex-col justify-between border-b border-outline-variant/10 overflow-hidden"
                    style={{ minHeight: SLIDE_HEIGHT }}
                  >
                    {/* ── Background image with glassmorphism overlay ── */}
                    <div className="absolute inset-0">
                      <img
                        src={SERVICE_IMAGES[idx]}
                        alt={srv.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {/* Glassmorphism base: blurred image tint (reduced on mobile) */}
                      <div className="absolute inset-0 bg-surface/20 md:bg-surface/35 backdrop-blur-[1px] md:backdrop-blur-[2px]" />
                      {/* Subtle frosted vignette from left */}
                      <div className="absolute inset-0 bg-gradient-to-r from-surface/80 via-surface/40 to-transparent md:from-surface/90 md:via-surface/60 md:to-surface/30" />
                    </div>

                    {/* ── Glassmorphism image card (right side, desktop) ── */}
                    <div
                      className="absolute right-8 top-1/2 -translate-y-1/2 w-[220px] h-[340px]
                        rounded-2xl overflow-hidden hidden md:block
                        ring-1 ring-white/20
                        shadow-[0_8px_32px_-8px_rgba(0,0,0,0.25)]"
                    >
                      <img
                        src={SERVICE_IMAGES[idx]}
                        alt={srv.name}
                        className="w-full h-full object-cover scale-105"
                        loading="lazy"
                      />
                      {/* glass caption bar */}
                      <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-white/10 backdrop-blur-md border-t border-white/20">
                        <span className="text-xs font-semibold text-white tracking-wide drop-shadow">
                          {srv.name}
                        </span>
                      </div>
                    </div>

                    {/* ── Slide content (left side) ── */}
                    <div
                      className="relative z-10 flex flex-col justify-between p-6 md:p-14 w-full md:max-w-[calc(100%-260px)] bg-surface/20 md:bg-transparent"
                      style={{ minHeight: SLIDE_HEIGHT }}
                    >
                      {/* Slide counter */}
                      <span className="text-xs font-medium text-on-surface-variant tracking-[0.15em] uppercase mb-8 block">
                        {String(idx + 1).padStart(2, "0")} / {String(TOTAL_SVC).padStart(2, "0")}
                      </span>

                      <div className="flex-1">
                        <span className="material-symbols-outlined text-4xl text-secondary mb-6 block">
                          {srv.icon}
                        </span>
                        <h3 className="font-headline-lg text-headline-lg text-primary mb-4 leading-tight">
                          {srv.name}
                        </h3>
                        <p className="text-on-surface-variant text-body-md leading-relaxed max-w-lg">
                          {srv.desc}
                        </p>
                      </div>

                      <Link
                        to={`/visa-services/${srv.slug}`}
                        className="inline-flex items-center gap-2 hover:gap-4 transition-all w-fit mt-10
                          text-secondary font-bold text-body-sm
                          border border-secondary/30 px-6 py-3 rounded-xl
                          hover:bg-secondary-container hover:text-on-secondary-container
                          hover:border-secondary-container"
                      >
                        <span>Enquire Now</span>
                        <span className="material-symbols-outlined text-lg">arrow_forward</span>
                      </Link>
                    </div>

                    {/* Ghost background number */}
                    <span
                      aria-hidden="true"
                      className="absolute right-4 bottom-[-16px] text-[160px] font-bold leading-none text-outline-variant/[0.06] pointer-events-none select-none z-0"
                    >
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div
                className="absolute bottom-0 left-0 h-[2px] bg-secondary transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
                style={{ width: `${(activeSvc / (TOTAL_SVC - 1)) * 100}%` }}
              />
            </div>

            {/* ── RIGHT SIDEBAR: Preview thumbnails ── */}
            <div className="hidden md:flex flex-col gap-2 pt-1">
              {services.map((srv, i) => (
                <button
                  key={i}
                  onClick={() => goToSvc(i)}
                  aria-label={`Go to ${srv.name}`}
                  className={`
                    group relative overflow-hidden rounded-xl transition-all duration-300
                    ring-1
                    ${i === activeSvc
                      ? "ring-secondary shadow-[0_4px_16px_-4px_rgba(29,80,58,0.35)] scale-[1.03]"
                      : "ring-outline-variant/20 opacity-60 hover:opacity-90 hover:scale-[1.02]"
                    }
                  `}
                  style={{ height: 46 }}
                >
                  {/* Thumbnail image */}
                  <img
                    src={SERVICE_IMAGES[i]}
                    alt={srv.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {/* Glass label */}
                  <div className={`
                    absolute inset-0 flex items-center px-2 gap-1.5
                    transition-all duration-300
                    ${i === activeSvc
                      ? "bg-black/40 backdrop-blur-sm"
                      : "bg-black/50 backdrop-blur-[1px] group-hover:bg-black/40"
                    }
                  `}>
                    <span className={`
                      material-symbols-outlined text-[13px] flex-shrink-0 transition-colors duration-300
                      ${i === activeSvc ? "text-[#D4AF37]" : "text-white/70"}
                    `}>
                      {srv.icon}
                    </span>
                    <span className={`
                      text-[10px] font-semibold leading-tight truncate transition-colors duration-300
                      ${i === activeSvc ? "text-white" : "text-white/70"}
                    `}>
                      {srv.name}
                    </span>
                    {/* Active indicator bar */}
                    {i === activeSvc && (
                      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-secondary rounded-r-sm" />
                    )}
                  </div>
                </button>
              ))}

              {/* Minimal up/down arrows below thumbnails */}
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => stepSvc(-1)}
                  disabled={activeSvc === 0}
                  aria-label="Previous service"
                  className="flex-1 h-8 rounded-lg border border-outline-variant/20 flex items-center justify-center text-primary
                    hover:bg-surface-container-low disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="material-symbols-outlined text-base">arrow_upward</span>
                </button>
                <button
                  onClick={() => stepSvc(1)}
                  disabled={activeSvc === TOTAL_SVC - 1}
                  aria-label="Next service"
                  className="flex-1 h-8 rounded-lg border border-outline-variant/20 flex items-center justify-center text-primary
                    hover:bg-surface-container-low disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="material-symbols-outlined text-base">arrow_downward</span>
                </button>
              </div>
            </div>

          </div>

        </div>
      </section>
      {/* ──────────────────────────────────────────────────────────────────── */}

      {/* FEATURED TOUR PACKAGES (BENTO GRID) */}
      <section className="relative overflow-hidden py-[90px] px-margin-mobile md:px-margin-desktop bg-surface-container-low">
        <div className="max-w-container-max mx-auto space-y-12 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-[140px_1fr_140px] items-center md:items-end gap-4 w-full">
            <div className="hidden md:block w-[140px]" /> {/* Left spacer to center the header text */}
            <div
              data-animate="holiday-packages"
              className={`text-center space-y-2 tranasition-opacity duration-1000 ${visibleSections["holiday-packages"] ? "opacity-100" : "opacity-0"}`}
            >
              <h2 className={`font-headline-lg text-[20px] sm:text-2xl md:text-headline-lg text-primary ${typewriterClass("holiday-packages")}`}>
                Featured Holiday Packages
              </h2>
              <p className="text-on-surface-variant text-body-md">Explore curated luxury tours designed for UAE travellers.</p>
            </div>
            <div className="flex md:justify-end md:w-[140px] justify-center w-full">
              <Link
                to="/packages"
                className="text-secondary font-bold inline-flex items-center gap-2 hover:gap-4 transition-all text-body-sm whitespace-nowrap"
              >
                <span>View All Packages</span>
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 md:grid-rows-2 gap-4 md:h-[600px]">
            <div className="relative group sm:col-span-2 md:col-span-2 md:row-span-2 min-h-[420px] md:min-h-0">
              <div className="absolute inset-0 overflow-hidden rounded-2xl">
                <img src={packages[0].img} alt={packages[0].title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
              </div>
              <div className="absolute inset-0 flex flex-col justify-end p-8 text-white z-10">
                <span className="bg-secondary-container text-on-secondary-container text-[11px] font-bold px-3 py-1 rounded-full w-fit mb-3">{packages[0].duration}</span>
                <h3 className="font-headline-lg text-headline-lg text-white mb-2">{packages[0].title}</h3>
                <p className="text-white/80 text-body-sm mb-4">
                  Experience Kerala's peaceful backwaters, luxury resorts, traditional cuisine,
                  hill stations, and curated local experiences.
                </p>
                <span className="text-xl font-bold font-display">{packages[0].price} AED</span>
                <Link
                  to={`/packages/${packages[0].slug}`}
                  className="
    bg-white text-primary 
    px-6 py-2 
    rounded-lg 
    font-bold text-body-sm 
    hover:bg-secondary-container 
    hover:text-on-secondary-container 
    transition-colors 
    flex items-center gap-1
    w-fit
    mt-2
  "
                >
                  <span>View Tour</span>
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </Link>
              </div>
            </div>

            <div className="relative group min-h-[320px] md:min-h-0">
              <div className="absolute inset-0 overflow-hidden rounded-2xl">
                <img src={packages[1].img} alt={packages[1].title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
              </div>
              <div className="absolute inset-0 flex flex-col justify-end p-6 text-white z-10">
                <span className="text-[10px] text-white/85 font-medium mb-1">{packages[1].duration}</span>
                <h4 className="font-bold text-body-lg text-white mb-2">{packages[1].title}</h4>
                <div className="flex justify-between items-center">
                  <span className="font-bold">{packages[1].price} AED</span>
                  <Link to={`/packages/${packages[1].slug}`} className="text-secondary-container font-bold flex items-center gap-1 text-body-sm hover:underline">
                    <span>Details</span>
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </Link>
                </div>
              </div>
            </div>

            <div className="relative group md:col-span-1 md:row-span-1 min-h-[320px] md:min-h-0">
              <div className="absolute inset-0 overflow-hidden rounded-2xl">
                <img src={packages[2].img} alt={packages[2].title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
              </div>
              <div className="absolute inset-0 flex flex-col justify-end p-6 text-white z-10">
                <span className="text-[10px] text-white/85 font-medium mb-1">{packages[2].duration}</span>
                <h4 className="font-bold text-body-lg text-white mb-2">{packages[2].title}</h4>
                <div className="flex justify-between items-center">
                  <span className="font-bold">{packages[2].price} AED</span>
                  <Link to={`/packages/${packages[2].slug}`} className="text-secondary-container font-bold flex items-center gap-1 text-body-sm hover:underline">
                    <span>Details</span>
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </Link>
                </div>
              </div>
            </div>

            <div className="relative group bg-primary-container p-6 md:p-8 rounded-2xl text-on-primary-container flex flex-col justify-between sm:col-span-2 md:col-span-2 overflow-visible min-h-[320px] md:min-h-0">
              <div className="relative z-10 flex flex-col justify-between h-full">
                <div>
                  <span className="material-symbols-outlined text-secondary-fixed text-4xl mb-4">public_off</span>
                  <h4 className="font-headline-md text-headline-md text-white mb-2">Can't Find Your Package?</h4>
                  <p className="text-on-primary-container/80 text-body-sm leading-relaxed">
                    We build customized boutique itineraries catering to your budget, travel group, and dates. Let us coordinate flight logistics, hotels, transfers, and visas.
                  </p>
                </div>
                <Link to="/packages/customise" className="bg-secondary-container text-on-secondary-container px-6 py-3 rounded-xl font-bold text-body-sm hover:scale-[1.02] transition-transform w-fit flex items-center gap-2 mt-4">
                  <span>Request Custom Package</span>
                  <span className="material-symbols-outlined text-lg">edit_note</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTINENTS BAR TAB FILTER */}
      <section className="relative overflow-hidden py-[120px] px-margin-mobile md:px-margin-desktop bg-surface">
        <div className="max-w-container-max mx-auto space-y-12 relative z-10">
          <div
            data-animate="global-coverage"
            className={`text-center max-w-xl mx-auto space-y-3 transition-opacity duration-1000 ${visibleSections["global-coverage"] ? "opacity-100" : "opacity-0"}`}
          >
            <h2 className={`font-headline-lg text-[20px] sm:text-2xl md:text-headline-lg text-primary ${typewriterClass("global-coverage")}`}>
              Global Visa Coverage
            </h2>
            <p className="text-on-surface-variant text-body-md text-center mb-10">
              Check countries and requirements across all seven continents.
            </p>
          </div>
        </div>
        <div className="flex justify-center gap-8 border-b border-outline-variant/20 overflow-x-auto pb-3 mt-10 scrollbar-thin">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {continentCountries[activeContinent].map((country, idx) => (
            <div key={idx} className="relative group bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 premium-shadow flex flex-col justify-between gap-4">
              <div className="flex items-center gap-3 relative z-10">
                <span className="text-3xl">{country.flag}</span>
                <div>
                  <h4 className="font-bold text-body-md text-primary">{country.name}</h4>
                  <span className="text-body-sm text-on-surface-variant">{country.type}</span>
                </div>
              </div>
              <Link to="/visa-services" className="text-secondary font-bold text-body-sm flex items-center gap-1 hover:underline w-fit mt-2 relative z-10">
                <span>View Visa Requirements</span>
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section className="relative overflow-hidden py-[90px] px-margin-mobile md:px-margin-desktop bg-surface-container-low">
        <div className="max-w-container-max mx-auto grid grid-cols-1 md:grid-cols-2 gap-[64px] items-center relative z-10">
          <div
            data-animate="about-eshaare"
            className={`space-y-6 transition-opacity duration-1000 ${visibleSections["about-eshaare"] ? "opacity-100" : "opacity-0"}`}
          >
            <h2 className={`font-headline-lg text-[20px] sm:text-2xl md:text-headline-lg text-primary ${typewriterClass("about-eshaare")}`}>
              About Eshaare Tours
            </h2>
            <p className="text-on-surface-variant text-body-md leading-relaxed">
              Eshaare Tours UAE is a Dubai-based travel agency and visa consultancy helping UAE residents experience seamless international travel. We provide visa services, holiday packages, flight bookings, hotels, insurance, honeymoon trips, corporate travel, cruises, and complete travel assistance.            </p>
            <p className="text-on-surface-variant text-body-md leading-relaxed">
              With a focus on trust, transparency, and personal support, we handle everything from visa guidance to itinerary planning — making every journey simple, smooth, and memorable. </p>
              <p className="text-on-surface-variant text-body-md leading-relaxed">
                At Eshaare Tours UAE, we help turn travel dreams into destinations.
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
            <img src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80" alt="About Eshaare Tours" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-primary-container/20"></div>
          </div>
        </div>
      </section>

      {/* ─── MEET OUR SPECIALISTS — PREMIUM CAROUSEL ─── */}
      <section className="relative overflow-hidden py-[90px] px-margin-mobile md:px-margin-desktop bg-surface">
        <div className="max-w-container-max mx-auto space-y-12 relative z-10">
          <div
            data-animate="specialists"
            className={`text-center max-w-xl mx-auto space-y-3 transition-opacity duration-1000 ${visibleSections["specialists"] ? "opacity-100" : "opacity-0"}`}
          >
            <h2 className={`font-headline-lg text-[20px] sm:text-2xl md:text-headline-lg text-primary ${typewriterClass("specialists")}`}>
              Meet Our Experts
            </h2>
            <p className="text-on-surface-variant text-body-md">
              Our expert consultants verify bank statements, prepare travel documents, and manage your embassy submissions.
            </p>
          </div>

          {/* 3D Perspective Stack of Wide Details Cards */}
          <div className="relative w-full overflow-visible py-8 flex items-center justify-center min-h-[500px] sm:min-h-[460px] md:min-h-[400px] card-stack-container" style={{ perspective: "1200px" }}>
            {specialists.map((member, idx) => {
              const rel = getRelativeIndex(idx);
              const isActive = rel === 0;
              const isLeft = rel === -1;
              const isRight = rel === 1;
              const isVisible = Math.abs(rel) <= 1;

              if (!isVisible && specialists.length > 3) {
                return null;
              }

              let transformStyle = "";
              let opacityStyle = 0;
              let zIndexStyle = 0;
              let pointerEvents = "none";

              if (isActive) {
                transformStyle = "translateX(0) scale(1) translateZ(0)";
                opacityStyle = 1;
                zIndexStyle = 30;
                pointerEvents = "auto";
              } else if (isLeft) {
                transformStyle = isMobile
                  ? "translateX(-70px) scale(0.7) rotateY(15deg) translateZ(-150px)"
                  : "translateX(-240px) scale(0.75) rotateY(18deg) translateZ(-150px)";
                opacityStyle = 0.5;
                zIndexStyle = 10;
                pointerEvents = "auto";
              } else if (isRight) {
                transformStyle = isMobile
                  ? "translateX(70px) scale(0.7) rotateY(-15deg) translateZ(-150px)"
                  : "translateX(240px) scale(0.75) rotateY(-18deg) translateZ(-150px)";
                opacityStyle = 0.5;
                zIndexStyle = 10;
                pointerEvents = "auto";
              } else {
                transformStyle = "translateX(0) scale(0.5) translateZ(-200px)";
                opacityStyle = 0;
                zIndexStyle = 0;
              }

              const tags = getSpecialistTags(member.designation);

              return (
                <div
                  key={member.id || idx}
                  onClick={() => {
                    if (!isActive) {
                      setActiveSpecIndex(idx);
                    }
                  }}
                  className={`absolute w-[280px] sm:w-[320px] md:w-[740px] lg:w-[780px] h-[460px] sm:h-[430px] md:h-[340px] rounded-[24px] sm:rounded-[32px] overflow-hidden flex flex-col md:flex-row transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] cursor-pointer select-none bg-[#1e1e1e]/95 border border-white/10 shadow-[0_15px_35px_rgba(0,0,0,0.4)] ${isActive ? "ring-2 ring-secondary/50 shadow-[0_20px_45px_rgba(29,80,58,0.3)]" : "hover:border-white/20"
                    }`}
                  style={{
                    transform: transformStyle,
                    opacity: opacityStyle,
                    zIndex: zIndexStyle,
                    pointerEvents: pointerEvents,
                    transformStyle: "preserve-3d",
                  }}
                >
                  {/* Left Column: Image */}
                  <div className="w-full md:w-2/5 relative h-[180px] sm:h-[200px] md:h-auto overflow-hidden">
                    <img
                      src={member.img}
                      alt={member.name}
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                      draggable="false"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-transparent to-[#1e1e1e]/90 pointer-events-none" />
                  </div>

                  {/* Right Column: Details */}
                  <div className="w-full md:w-3/5 p-6 md:p-10 flex flex-col justify-between space-y-4 text-left">
                    <div className="space-y-3">
                      {/* Designation Badges */}
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-[#D1FAE5] text-[#065F46] uppercase tracking-wide leading-normal">
                          {tags.highlighted}
                        </span>
                        {tags.secondary.slice(0, 1).map((tag, tIdx) => (
                          <span key={tIdx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-semibold bg-[#2d2d2d] text-white/80 border border-white/5 uppercase tracking-wide leading-normal">
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Name & Designation Title */}
                      <div>
                        <span className="block text-[8px] sm:text-[9px] font-bold text-white/40 tracking-[0.15em] uppercase leading-none mb-1">
                          {member.designation}
                        </span>
                        <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-tight">
                          {member.name}
                        </h3>
                      </div>

                      {/* Intro / Bio */}
                      <p className="text-white/70 text-body-sm leading-relaxed min-h-[54px] line-clamp-3">
                        {member.intro}
                      </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 border-t border-white/10 pt-4">
                      <div>
                        <span className="block font-serif italic text-lg md:text-xl text-secondary font-bold">
                          {Number(member.visasFiled).toLocaleString()}+
                        </span>
                        <span className="block text-[8px] uppercase tracking-wider text-white/50 mt-0.5">
                          Visas Filed
                        </span>
                      </div>

                      <div>
                        <span className="block font-serif italic text-lg md:text-xl text-[#D4AF37] font-bold">
                          {member.experienceYears}+ Yrs
                        </span>
                        <span className="block text-[8px] uppercase tracking-wider text-white/50 mt-0.5">
                          Experience
                        </span>
                      </div>

                      <div>
                        <span className="block font-serif italic text-lg md:text-xl text-white font-bold">
                          {member.successRate}%
                        </span>
                        <span className="block text-[8px] uppercase tracking-wider text-white/50 mt-0.5">
                          Success Rate
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation Indicators & Buttons */}
          {specialists.length > 1 && (
            <div className="flex items-center justify-between mt-8 max-w-4xl mx-auto px-4">
              {/* Left/Right Buttons */}
              <div className="flex gap-3">
                {/* <button
                  onClick={() => setActiveSpecIndex((prev) => (prev - 1 + specialists.length) % specialists.length)}
                  className="size-10 rounded-full border border-outline-variant/20 flex items-center justify-center text-primary hover:bg-secondary-container hover:text-on-secondary-container transition-all hover:scale-105"
                  title="Previous Specialist"
                >
                  <span className="material-symbols-outlined text-lg">arrow_back</span>
                </button> */}

                {/* <button
                  onClick={() => setActiveSpecIndex((prev) => (prev + 1) % specialists.length)}
                  className="size-10 rounded-full border border-outline-variant/20 flex items-center justify-center text-primary hover:bg-secondary-container hover:text-on-secondary-container transition-all hover:scale-105"
                  title="Next Specialist"
                >
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </button> */}
              </div>

              {/* Dot Navigation */}
              <div className="flex gap-2">
                {specialists.map((_, idx) => {
                  const isActive = idx === activeSpecIndex;
                  return (
                    <button
                      key={idx}
                      onClick={() => setActiveSpecIndex(idx)}
                      className={`h-2 rounded-full transition-all duration-300 ${isActive
                        ? "w-8 bg-secondary"
                        : "w-2 bg-on-surface-variant/40 hover:bg-on-surface-variant/70"
                        }`}
                      title={`Go to specialist ${idx + 1}`}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* LEAD INQUIRY SECTION */}
      <section id="enquire" className="relative overflow-hidden py-[120px] px-margin-mobile md:px-margin-desktop bg-surface-container-low">
        <div className="max-w-container-max mx-auto bg-surface-container-lowest rounded-3xl overflow-hidden premium-shadow border border-outline-variant/10 grid grid-cols-1 md:grid-cols-3 relative z-10">

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
            <p className="text-on-primary-container/70 text-body-sm">Operational Hours: Monday - Saturday, 9:00 AM - 6:00 PM GST</p>
          </div>

          <div className="md:col-span-2 p-12 space-y-6">
            <h3 className="font-headline-md text-headline-md text-primary">Request an Eligibility Assessment</h3>
            <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="font-label-md text-label-md text-on-surface-variant">Full Name *</label>
                <input type="text" name="name" required placeholder="e.g. Jane Doe" value={formData.name} onChange={handleInputChange} className="w-full bg-surface-container border border-outline-variant/15 rounded-lg px-4 py-3 text-body-sm focus:outline-none" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-md text-label-md text-on-surface-variant">WhatsApp Number *</label>
                <input type="tel" name="phone" required placeholder="e.g. 501234567" value={formData.phone} onChange={handleInputChange} className="w-full bg-surface-container border border-outline-variant/15 rounded-lg px-4 py-3 text-body-sm focus:outline-none" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-md text-label-md text-on-surface-variant">Email Address *</label>
                <input type="email" name="email" required placeholder="e.g. jane.doe@example.com" value={formData.email} onChange={handleInputChange} className="w-full bg-surface-container border border-outline-variant/15 rounded-lg px-4 py-3 text-body-sm focus:outline-none" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-md text-label-md text-on-surface-variant">Your Nationality *</label>
                <input type="text" name="nationality" required placeholder="e.g. Indian, Jordanian" value={formData.nationality} onChange={handleInputChange} className="w-full bg-surface-container border border-outline-variant/15 rounded-lg px-4 py-3 text-body-sm focus:outline-none" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-md text-label-md text-on-surface-variant">Destination Country *</label>
                <select name="destination" required value={formData.destination} onChange={handleInputChange} className="w-full bg-surface-container border border-outline-variant/15 rounded-lg px-4 py-3 text-body-sm focus:outline-none">
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
                <input type="date" name="travelDate" value={formData.travelDate} onChange={handleInputChange} className="w-full bg-surface-container border border-outline-variant/15 rounded-lg px-4 py-3 text-body-sm focus:outline-none" />
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="font-label-md text-label-md text-on-surface-variant">Additional Message</label>
                <textarea name="message" rows={3} placeholder="Tell us about your visa history, travel companion counts, or urgent requirements..." value={formData.message} onChange={handleInputChange} className="w-full bg-surface-container border border-outline-variant/15 rounded-lg px-4 py-3 text-body-sm focus:outline-none" />
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold hover:opacity-90 transition-opacity md:col-span-2 disabled:opacity-50">
                {isSubmitting ? "Submitting Inquiry..." : "Submit Inquiry"}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section className="relative overflow-hidden py-[120px] px-margin-mobile md:px-margin-desktop bg-surface">
        <div className="max-w-container-max mx-auto bg-primary-container p-12 rounded-3xl relative overflow-hidden space-y-12 z-10">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-secondary/10 rounded-full blur-3xl"></div>
          <div className="text-center space-y-3 max-w-xl mx-auto relative z-10">
            <h2 className="font-headline-lg text-headline-lg text-white">What Our Travellers Say</h2>
            <p className="text-on-primary-container text-body-md">Read positive reviews from satisfied clients who booked their visa assistance through Eshaare Tours.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            <div className="relative group bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/15 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] hover:bg-white/15 hover:border-white/25 transition-all duration-300 flex flex-col justify-between gap-6 overflow-visible">
              <div className="relative z-10 flex flex-col justify-between gap-6 h-full">
                <p className="text-white italic text-body-md">
                  "Got my French Schengen visa in record time! Rakhi and Hassan made the NOC reviews and slot booking effortless. The client portal is completely state-of-the-art for tracing documents."
                </p>
                <div>
                  <h4 className="text-secondary-fixed font-bold text-body-md">Sarah Al-Kamali</h4>
                  <p className="text-white/60 text-xs uppercase tracking-widest">Abu Dhabi resident</p>
                </div>
              </div>
            </div>
            <div className="relative group bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/15 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] hover:bg-white/15 hover:border-white/25 transition-all duration-300 flex flex-col justify-between gap-6 overflow-visible">
              <div className="relative z-10 flex flex-col justify-between gap-6 h-full">
                <p className="text-white italic text-body-md">
                  "We booked a 7-day Rome & Paris tour package through Eshaare. They coordinated all flight transfers and secured Schengen appointments in Wafi mall Dubai. Exceptional service!"
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