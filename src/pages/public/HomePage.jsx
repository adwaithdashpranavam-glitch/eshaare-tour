import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createLead, getPackages } from "../../lib/firestore";
import { generateLeadNo, formatWhatsAppPhone } from "../../utils/helpers";
import { db, serverTimestamp } from "../../lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import toast from "react-hot-toast";
import InteractiveCanvas from "../../components/ui/InteractiveCanvas";

// ─── Service images (one per service, matched by index) ────────────────────
const SERVICE_IMAGES = [
  "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=900&q=80", // Schengen – Paris/Europe
  "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=900&q=80", // UK – London
  "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=900&q=80", // USA – New York
  "https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?auto=format&fit=crop&w=900&q=80", // Saudi – Riyadh
  "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=900&q=80", // UAE – Dubai
  "https://images.unsplash.com/photo-1621680696874-edd80ce57b72?auto=format&fit=crop&w=900&q=80", // Oman – Muscat
  "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=900&q=80", // Japan – Kyoto
  "https://images.unsplash.com/photo-1556740772-1a741367b93e?auto=format&fit=crop&w=900&q=80", // Business – corporate
  "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=900&q=80", // VFS – airport
  "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=900&q=80", // Insurance – health/travel
];

export const HomePage = () => {
  const navigate = useNavigate();

  const [dbPackages, setDbPackages] = useState([]);
  useEffect(() => {
    const unsubscribe = getPackages((items) => {
      setDbPackages(items);
    });
    return () => unsubscribe();
  }, []);

  // ─── Hero Slider ────────────────────────────────────────────────────────
  const [activeSlide, setActiveSlide] = useState(0);
  const slides = [
    {
      image: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1600&q=80",
      headline: "Holiday Packages from Dubai | Eshaare Tours",
      subtext: "Book the best custom holiday packages from Dubai with Eshaare Tours UAE. Enjoy tailor-made vacations, family holidays, honeymoon trips, and premium international tours.",
      animated: true,
      ctaText: "Plan Your Trip Today",
      ctaLink: "/packages"
    },
    {
      image: "https://plus.unsplash.com/premium_photo-1684407617181-275e50374e95?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      headline: "Visa Services & Visa Consultant in Dubai",
      subtext: "Get expert visa assistance from Dubai for Schengen Visa UAE, UK, USA, Canada, and Australia. Fast VFS appointment booking support and complete document compliance audits.",
      animated: false,
      ctaText: "Start Your Visa Process",
      ctaLink: "/contact"
    },

    {
      image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1600&q=80",
      headline: "Best Travel Agency in Dubai | Eshaare UAE",
      subtext: "Premium travel agency in Dubai providing custom travel and visa services. We manage flights, luxury hotels, express VFS slot bookings, and custom holiday planning worldwide.",
      animated: false,
      ctaText: "Chat on WhatsApp",
      ctaLink: "https://wa.me/971557338429"
    }
  ];

  useEffect(() => {
    document.title = "ESHAARE | Visa Consultant & Travel Agency in Dubai";
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

  // ─── Contact Us Form ─────────────────────────────────────────────────────
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    date: "",
    destination: "",
    adults: 1,
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.email) {
      toast.error("Please fill in Name, Phone, and Email.");
      return;
    }
    setIsSubmitting(true);
    try {
      const generatedNo = await generateLeadNo();
      const submission = {
        leadNo: generatedNo,
        contactName: form.name,
        contactPhone: formatWhatsAppPhone(form.phone),
        contactEmail: form.email,
        nationality: "Unknown",
        destinationCountry: form.destination,
        serviceType: "Visa",
        travelStart: form.date,
        source: "website",
        stage: "New",
        priority: "Medium",
        ownerId: null,
        notes: `Adults: ${form.adults}\nMessage: ${form.message}`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await createLead(submission);
      toast.success(`Request sent! reference number: ${generatedNo}`);
      setForm({
        name: "",
        phone: "",
        email: "",
        date: "",
        destination: "",
        adults: 1,
        message: ""
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit enquiry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const services = [
    { name: "Schengen Visa from Dubai", desc: "Full document audit for all 27 Schengen countries — itinerary, financials, travel history, and cover letters checked before your embassy appointment.", slug: "schengen", icon: "euro" },
    { name: "UK Visa from Dubai", desc: "Expert guidance for Standard Visitor and family visas. We prepare your financial evidence, invitation letters, and biometric appointment booking.", slug: "uk", icon: "home" },
    { name: "USA Visa from Dubai", desc: "B1/B2 tourist and business visa application support with DS-160 assistance, interview preparation, and embassy appointment scheduling.", slug: "usa", icon: "map" },
    { name: "Saudi Visa from Dubai", desc: "Tourist eVisa and business visa arrangements. We manage the online application, sponsor documentation, and health declaration forms.", slug: "saudi", icon: "mosque" },
    { name: "UAE Visa from Dubai", desc: "Entry permits, tourist visas and residency setup for all nationalities. Fast processing with full document compliance checks.", slug: "uae", icon: "location_city" },
    { name: "Oman Visa from Dubai", desc: "Tourist and transit visa assistance for road and air travel. Expert check on insurance compliance, vehicle permissions, and instant eVisa approval.", slug: "oman", icon: "explore" },
    { name: "Japan Visa from Dubai", desc: "Tourist and transit visa assistance for UAE residents. Itinerary planning, hotel bookings, and bank statement guidance included.", slug: "japan", icon: "filter_hdr" },
    { name: "Business Visa from Dubai", desc: "Corporate immigration and business visas worldwide. NOC templates, employer letters, and trade licence submissions handled for you.", slug: "business", icon: "business_center" },
    { name: "VFS Booking", desc: "Priority slot booking and document preparation for VFS Global centres across the UAE. Express appointments for urgent travellers.", slug: "vfs-booking", icon: "event_available" },
    { name: "Travel Insurance", desc: "Schengen-compliant global travel insurance plans with same-day policy issuance and minimum coverage guarantees.", slug: "insurance", icon: "health_and_safety" }
  ];

  const testimonials = [
    {
      name: "Aarav & Priya Mehta",
      trip: "Honeymoon in Santorini",
      location: "Greece · 2025",
      quote:
        "Every detail was thought of before we even asked. From the sunset cruise to the private villa transfer — it felt less like a trip and more like a love letter.",
      rating: 5,
      initials: "AM",
    },
    {
      name: "Rohan Kapoor",
      trip: "Schengen Business Tour",
      location: "Paris · Zürich · Milan",
      quote:
        "Visa in 9 days. Lounge access, hotels, the lot — handled. I just packed a bag and showed up. Genuinely the smoothest travel experience I've had.",
      rating: 5,
      initials: "RK",
    },
    {
      name: "The Sharma Family",
      trip: "Japan in Cherry Blossom",
      location: "Tokyo · Kyoto · Osaka",
      quote:
        "Our kids still talk about the bullet train and the ryokan in Kyoto. The itinerary balanced wonder for them and calm for us. We'll be back.",
      rating: 5,
      initials: "SF",
    },
  ];

  const getFeaturedPackageData = (index, defaultData) => {
    const idsGroup = [
      ["d24", "kerala-backwater-escape"],
      ["d2", "interlaken-holu"],
      ["d4", "d5", "bespoke-honeymoon"],
      ["custom-package"]
    ];
    const ids = idsGroup[index];
    const dbPkg = dbPackages.find(p => ids.includes(p.id));
    if (dbPkg) {
      return {
        title: dbPkg.title || defaultData.title,
        location: dbPkg.country || dbPkg.location || defaultData.location,
        price: typeof dbPkg.price === "number" ? `${dbPkg.price} AED` : dbPkg.price || defaultData.price,
        priceSub: defaultData.priceSub || "/ Person",
        img: dbPkg.imageUrl || dbPkg.image || defaultData.img,
        link: `/packages/${dbPkg.id}`
      };
    }
    return defaultData;
  };

  const featuredPackages = [
    getFeaturedPackageData(0, {
      title: "Kerala Backwaters",
      location: "Kerala, India",
      price: "$224",
      priceSub: "/ Person",
      img: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80",
      link: "/packages/kerala-backwater-escape"
    }),
    getFeaturedPackageData(1, {
      title: "Interlaken Holu",
      location: "Gentrisch, Switzerland",
      price: "$224",
      priceSub: "/ Person",
      img: "https://images.unsplash.com/photo-1502784444187-359ac186c5bb?q=80&w=800&auto=format&fit=crop",
      link: "/packages"
    }),
    getFeaturedPackageData(2, {
      title: "Bespoke Honeymoon",
      location: "Maldives Escape",
      price: "$399",
      priceSub: "/ Person",
      img: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=800&q=80",
      link: "/packages/customise"
    }),
    getFeaturedPackageData(3, {
      title: "Custom Package",
      location: "Tailor-made Journeys",
      price: "Bespoke",
      priceSub: "Pricing",
      img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop",
      link: "/packages/customise"
    })
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
        const staffOnly = list.filter(u => u.role && !["client", "customer"].includes(u.role.toLowerCase()));

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

  // ─── Testimonials Carousel State ─────────────────────────────────────────
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  // Auto-skip rotation timer for testimonials (every 5 seconds)
  useEffect(() => {
    if (testimonials.length <= 1) return;
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  // ─── Services Vertical Carousel ──────────────────────────────────────────
  const [activeSvc, setActiveSvc] = useState(0);
  const [svcAnimating, setSvcAnimating] = useState(false);
  const SLIDE_HEIGHT = 400;
  const TOTAL_SVC = services.length;
  const carouselRef = useRef(null);
  const sectionRef = useRef(null);
  const dragStartY = useRef(null);
  const isHovered = useRef(false);
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
    if (!isHovered.current) return;

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
    dragStartY.current = e.touches[0].clientY;
  }
  function handleCarouselTouchEnd(e) {
    if (dragStartY.current === null) return;
    const diff = dragStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(diff) > 40) stepSvc(diff > 0 ? 1 : -1);
    dragStartY.current = null;
  }


  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-screen">
      <InteractiveCanvas />

      {/* HERO SLIDER SECTION */}
      <section className="relative z-10 overflow-hidden h-[91vh] min-h-[500px]">
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
              {slide.ctaLink.startsWith("http") ? (
                <a
                  href={slide.ctaLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group inline-flex items-center gap-2 w-fit px-8 py-4 rounded-xl font-bold text-white
                    bg-white/15 backdrop-blur-xl ring-1 ring-white/30
                    shadow-[0_10px_30px_-10px_rgba(0,0,0,0.35)]
                    hover:bg-white/25 hover:ring-white/50
                    hover:shadow-[0_16px_40px_-12px_rgba(255,255,255,0.25)]
                    transition-all duration-700 delay-700 hover:scale-105
                    ${activeSlide === index ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
                >
                  <span>{slide.ctaText}</span>
                  <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
                </a>
              ) : (
                <Link
                  to={slide.ctaLink}
                  className={`group inline-flex items-center gap-2 w-fit px-8 py-4 rounded-xl font-bold text-white
                    bg-white/15 backdrop-blur-xl ring-1 ring-white/30
                    shadow-[0_10px_30px_-10px_rgba(0,0,0,0.35)]
                    hover:bg-white/25 hover:ring-white/50
                    hover:shadow-[0_16px_40px_-12px_rgba(255,255,255,0.25)]
                    transition-all duration-700 delay-700 hover:scale-105
                    ${activeSlide === index ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
                >
                  <span>{slide.ctaText}</span>
                  <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
                </Link>
              )}
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
        className="relative z-10 overflow-hidden py-[60px] px-margin-mobile md:px-margin-desktop bg-transparent"
      >
        <div className="max-w-container-max mx-auto space-y-12 relative z-10">

          {/* Section header */}
          <div
            data-animate="visa-services"
            className={`text-center max-w-3xl mx-auto space-y-3 transition-opacity duration-1000 ${visibleSections["visa-services"] ? "opacity-100" : "opacity-0"}`}
          >
            <h2 className="font-headline-lg text-[26px] sm:text-[32px] md:text-[40px] text-primary leading-tight whitespace-normal break-words">
              Visa Services & Assistance in Dubai
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
              onMouseEnter={() => {
                isHovered.current = true;
              }}
              onMouseLeave={() => {
                dragStartY.current = null;
                isHovered.current = false;
              }}
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
                      className="absolute right-8 top-1/2 -translate-y-1/2 w-[200px] h-[260px]
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
                      className="relative z-10 flex flex-col justify-between p-6 md:p-10 w-full md:max-w-[calc(100%-260px)] bg-surface/20 md:bg-transparent"
                      style={{ minHeight: SLIDE_HEIGHT }}
                    >
                      {/* Slide counter */}
                      <span className="text-xs font-medium text-on-surface-variant tracking-[0.15em] uppercase mb-4 block">
                        {String(idx + 1).padStart(2, "0")} / {String(TOTAL_SVC).padStart(2, "0")}
                      </span>

                      <div className="flex-1">
                        <span className="material-symbols-outlined text-4xl text-secondary mb-3 block">
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
                        to={srv.slug === "insurance" ? "/contact" : `/visa-services/${srv.slug}`}
                        className="inline-flex items-center gap-2 hover:gap-4 transition-all w-fit mt-4
                          text-secondary font-bold text-body-sm
                          border border-secondary/30 px-6 py-3 rounded-xl
                          hover:bg-secondary-container hover:text-on-secondary-container
                          hover:border-secondary-container"
                      >
                        <span>
                          {!["vfs-booking", "insurance"].includes(srv.slug)
                            ? "Start Your Visa Process"
                            : "Enquire Now"}
                        </span>
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
            <div className="hidden md:flex flex-col gap-1 pt-1">
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
                  style={{ height: 34 }}
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
              <div className="flex gap-1 mt-1">
                <button
                  onClick={() => stepSvc(-1)}
                  disabled={activeSvc === 0}
                  aria-label="Previous service"
                  className="flex-1 h-[26px] rounded-lg border border-outline-variant/20 flex items-center justify-center text-primary
                    hover:bg-surface-container-low disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">arrow_upward</span>
                </button>
                <button
                  onClick={() => stepSvc(1)}
                  disabled={activeSvc === TOTAL_SVC - 1}
                  aria-label="Next service"
                  className="flex-1 h-[26px] rounded-lg border border-outline-variant/20 flex items-center justify-center text-primary
                    hover:bg-surface-container-low disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">arrow_downward</span>
                </button>
              </div>
            </div>

          </div>

        </div>
      </section>
      {/* ──────────────────────────────────────────────────────────────────── */}

      {/* FEATURED TOUR PACKAGES (BENTO GRID) */}
      <section className="relative z-10 overflow-hidden py-[60px] px-margin-mobile md:px-margin-desktop bg-transparent">
        <div className="max-w-container-max mx-auto space-y-12 relative z-10">

          {/* Section header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 w-full">
            <div
              data-animate="holiday-packages"
              className={`space-y-2 transition-opacity duration-1000 ${visibleSections["holiday-packages"] ? "opacity-100" : "opacity-0"}`}
            >
              <h2 className={`font-headline-lg text-[30px] sm:text-2xl md:text-headline-lg text-primary ${typewriterClass("holiday-packages")}`}>
                Featured Holiday Packages from Dubai
              </h2>
              <p className="text-on-surface-variant text-body-md">Explore curated luxury tours designed for UAE travellers.</p>
            </div>
            <Link
              to="/packages"
              className="text-secondary font-bold inline-flex items-center gap-2 hover:gap-4 transition-all text-body-sm whitespace-nowrap"
            >
              <span>View All Packages</span>
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </Link>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">

            {/* Left side column: Card 1, Card 2 and bottom banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

              {/* Card 1: Kerala Backwaters */}
              <Link
                to={featuredPackages[0].link}
                className="relative group rounded-[24px] overflow-hidden h-[300px] shadow-lg border border-outline-variant/10 block cursor-pointer"
              >
                <img
                  src={featuredPackages[0].img}
                  alt={featuredPackages[0].title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 bg-white/15 backdrop-blur-md border border-white/20 rounded-[18px] p-4 text-white">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-base sm:text-lg leading-tight tracking-wide">{featuredPackages[0].title}</h3>
                    <div className="text-right flex-shrink-0">
                      <div className="font-extrabold text-base sm:text-lg">{featuredPackages[0].price}</div>
                      <div className="text-[10px] text-white/70 font-medium leading-none">{featuredPackages[0].priceSub}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-white/80 mt-2 font-medium">
                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                    <span>{featuredPackages[0].location}</span>
                  </div>
                </div>
              </Link>

              {/* Card 2: Interlaken Holu */}
              <Link
                to={featuredPackages[1].link}
                className="relative group rounded-[24px] overflow-hidden h-[300px] shadow-lg border border-outline-variant/10 block cursor-pointer"
              >
                <img
                  src={featuredPackages[1].img}
                  alt={featuredPackages[1].title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 bg-white/15 backdrop-blur-md border border-white/20 rounded-[18px] p-4 text-white">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-base sm:text-lg leading-tight tracking-wide">{featuredPackages[1].title}</h3>
                    <div className="text-right flex-shrink-0">
                      <div className="font-extrabold text-base sm:text-lg">{featuredPackages[1].price}</div>
                      <div className="text-[10px] text-white/70 font-medium leading-none">{featuredPackages[1].priceSub}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-white/80 mt-2 font-medium">
                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                    <span>{featuredPackages[1].location}</span>
                  </div>
                </div>
              </Link>

              {/* Bottom Banner */}
              <div className="sm:col-span-2 bg-[#1D503A] rounded-[24px] p-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-white shadow-lg">
                <div className="flex items-center gap-4">
                  <span className="text-4xl font-black leading-none">120+</span>
                  <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-white/95 leading-tight">
                    <div>Top Destination</div>
                    <div>In Global</div>
                  </div>
                </div>
                <Link
                  to="/packages"
                  className="bg-white text-[#1D503A] font-bold px-6 py-2.5 rounded-full text-xs uppercase tracking-wider hover:scale-[1.02] transition-transform flex items-center gap-2 shadow-sm"
                >
                  <span>Explore Destination</span>
                  <span className="material-symbols-outlined text-[14px] font-bold">arrow_forward</span>
                </Link>
              </div>

            </div>

            {/* Right side column: Card 3 and Card 4 stacked vertically */}
            <div className="flex flex-col gap-6">

              {/* Card 3: Bespoke Honeymoon */}
              <Link
                to={featuredPackages[2].link}
                className="relative group rounded-[24px] overflow-hidden flex-1 min-h-[180px] lg:min-h-0 shadow-lg border border-outline-variant/10 block cursor-pointer"
              >
                <img
                  src={featuredPackages[2].img}
                  alt={featuredPackages[2].title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 bg-white/15 backdrop-blur-md border border-white/20 rounded-[18px] p-4 text-white">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-base sm:text-lg leading-tight tracking-wide">{featuredPackages[2].title}</h3>
                    <div className="text-right flex-shrink-0">
                      <div className="font-extrabold text-base sm:text-lg">{featuredPackages[2].price}</div>
                      <div className="text-[10px] text-white/70 font-medium leading-none">{featuredPackages[2].priceSub}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-white/80 mt-2 font-medium">
                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                    <span>{featuredPackages[2].location}</span>
                  </div>
                </div>
              </Link>

              {/* Card 4: Custom Package */}
              <Link
                to="/packages/customise"
                className="relative group rounded-[24px] overflow-hidden flex-1 min-h-[180px] lg:min-h-0 text-white border border-outline-variant/10 block cursor-pointer transition-transform hover:scale-[1.01]"
              >
                <img
                  src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80"
                  alt="Customise Package"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-[#0A231C]/90 group-hover:bg-[#0A231C]/85 transition-colors duration-300" />
                <div className="relative z-10 flex flex-col justify-between h-full p-5">
                  <div>
                    <span className="material-symbols-outlined text-[#D4AF37] text-2xl mb-1.5">public_off</span>
                    <h3 className="font-bold text-lg text-white mb-2">Plan your trip your way.</h3>
                    <p className="text-white/80 text-[11px] leading-normal max-w-sm">
                      Get a Customized Travel Package from Dubai
                    </p>
                  </div>
                  <div className="bg-[#e6ebe8] text-[#1D503A] font-bold px-4 py-1.5 rounded-full text-[11px] w-fit flex items-center gap-1.5 mt-2 shadow-sm transition-colors hover:bg-white">
                    <span>Request Custom Package</span>
                    <span className="material-symbols-outlined text-sm font-bold">edit_note</span>
                  </div>
                </div>
              </Link>

            </div>

          </div>

        </div>
      </section>

      {/* CONTINENTS BAR TAB FILTER */}
      <section className="relative z-10 overflow-hidden py-[120px] px-margin-mobile md:px-margin-desktop bg-transparent">
        <div className="max-w-container-max mx-auto space-y-12 relative z-10">
          <div
            data-animate="global-coverage"
            className={`text-center max-w-4xl mx-auto space-y-3 transition-opacity duration-1000 ${visibleSections["global-coverage"] ? "opacity-100" : "opacity-0"}`}
          >
            <h2 className="font-headline-lg text-[24px] sm:text-[30px] md:text-[38px] text-primary leading-tight whitespace-normal break-words">
              7 Continents Visa Services From Dubai
            </h2>
            <p className="text-on-surface-variant text-body-md text-center mb-10">
              At Eshaare Tours UAE, we provide visa assistance for destinations across all seven continents, helping UAE residents travel worldwide with confidence.
            </p>
          </div>
          <div className="flex justify-start lg:justify-center gap-8 border-b border-outline-variant/20 overflow-x-auto pb-3 scrollbar-thin">
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
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section className="relative z-10 overflow-hidden py-[90px] px-margin-mobile md:px-margin-desktop bg-transparent">
        <div className="max-w-container-max mx-auto grid grid-cols-1 md:grid-cols-2 gap-[64px] items-center relative z-10">
          <div
            data-animate="about-eshaare"
            className={`space-y-6 transition-opacity duration-1000 ${visibleSections["about-eshaare"] ? "opacity-100" : "opacity-0"}`}
          >
            <h2 className={`font-headline-lg text-[20px] sm:text-2xl md:text-headline-lg text-primary ${typewriterClass("about-eshaare")}`}>
              About Eshaare Travel Agency & Visa Consultant
            </h2>
            <p className="text-on-surface-variant text-body-md leading-relaxed">
              Eshaare Tours UAE is a Dubai-based travel agency and visa consultancy offering complete travel solutions for UAE residents, families, couples, tourists, students, and corporate travelers. </p>
            <p className="text-on-surface-variant text-body-md leading-relaxed">
              We provide visa assistance, Schengen visa support, holiday packages, flight and hotel bookings, travel insurance, honeymoon packages, corporate travel, cruises, airport transfers, and customized tour plans.</p>
            <p className="text-on-surface-variant text-body-md leading-relaxed">
              Our mission is to make travel simple, transparent, and stress-free by providing reliable guidance and personalized travel services. Eshaare Tours UAE helps you plan every journey with confidence and trust.
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
      <section className="relative z-10 overflow-hidden py-[90px] px-margin-mobile md:px-margin-desktop bg-transparent">
        <div className="max-w-container-max mx-auto space-y-12 relative z-10">
          <div
            data-animate="specialists"
            className={`text-center max-w-3xl mx-auto space-y-3 transition-opacity duration-1000 ${visibleSections["specialists"] ? "opacity-100" : "opacity-0"}`}
          >
            <h2 className={`font-headline-lg text-[20px] sm:text-2xl md:text-headline-lg text-primary ${typewriterClass("specialists")}`}>
              Get Expert Travel Guidance
            </h2>
            <p className="text-on-surface-variant text-body-md text-center">
              Connect with our experienced travel consultants and visa specialists in Dubai. From visa assistance and holiday planning to flight bookings and luxury travel experiences, our experts are here to help you travel with confidence.
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
      <section id="enquire" className="relative z-10 w-full bg-[#FCFBF8]/45 backdrop-blur-[2px] py-20 md:py-28 font-['Assistant',ui-sans-serif,system-ui]">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-14">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-10 bg-[#D4AF37]/40" />
              <span className="size-1.5 rotate-45 bg-[#D4AF37]" />
              <div className="h-px w-10 bg-[#D4AF37]/40" />
            </div>
            <h2 className="font-['Cormorant_Garamond',ui-serif,Georgia] italic text-4xl md:text-5xl text-[#1D503A]">
              We'd Love to Hear From You
            </h2>
            <p className="mt-3 text-[11px] uppercase tracking-[0.3em] text-[#1D503A]/60">
              Tell us your dream — we'll plan the journey
            </p>
          </div>
          {/* Card */}
          <div className="grid md:grid-cols-2 rounded-[4px] overflow-hidden ring-1 ring-[#D4AF37]/20 shadow-[0_30px_80px_-30px_rgba(29,80,58,0.25)] bg-white">
            {/* Image side */}
            <div className="relative min-h-[340px] md:min-h-full">
              <img
                src="/stamps-collage.jpg"
                alt="Vintage travel postage stamps from around the world"
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-[#1D503A]/30 via-transparent to-transparent" />
              <div className="absolute top-5 left-5 size-3 border-t border-l border-white/70" />
              <div className="absolute bottom-5 right-5 size-3 border-b border-r border-white/70" />
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <p className="font-['Cormorant_Garamond',ui-serif,Georgia] italic text-2xl leading-tight drop-shadow-lg">
                  Collect passports,<br />not regrets.
                </p>
              </div>
            </div>
            {/* Form side */}
            <form
              onSubmit={onSubmit}
              className="p-8 md:p-12 flex flex-col gap-6 bg-[#FCFBF8]"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Field label="Your Name *">
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    className="contact-input"
                  />
                </Field>
                <Field label="WhatsApp Phone *">
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 501234567"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    className="contact-input"
                  />
                </Field>
              </div>
              <Field label="Email Address *">
                <input
                  type="email"
                  required
                  placeholder="e.g. john@example.com"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  className="contact-input"
                />
              </Field>
              <Field label="When do you need it?">
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => update("date", e.target.value)}
                  className="contact-input"
                />
              </Field>
              <Field label="Where you want to go?">
                <input
                  type="text"
                  required
                  placeholder="e.g. Paris, Tokyo, Bali..."
                  value={form.destination}
                  onChange={(e) => update("destination", e.target.value)}
                  className="contact-input"
                />
              </Field>
              <Field label="Count here (no of adults)">
                <input
                  type="number"
                  min={1}
                  max={20}
                  required
                  value={form.adults}
                  onChange={(e) => update("adults", Number(e.target.value))}
                  className="contact-input"
                />
              </Field>
              <Field label="Write here">
                <textarea
                  rows={3}
                  placeholder="We'd love to mail you or text you..."
                  value={form.message}
                  onChange={(e) => update("message", e.target.value)}
                  className="contact-input resize-none pt-2"
                />
              </Field>
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative mt-2 inline-flex items-center justify-center gap-2 bg-[#1D503A] text-white px-8 py-4 rounded-[2px] text-sm uppercase tracking-[0.25em] font-semibold hover:bg-[#143d2c] transition-colors disabled:opacity-50"
              >
                <span>{isSubmitting ? "Sending..." : "Send Enquiry"}</span>
                <span className="size-1.5 rotate-45 bg-[#D4AF37] transition-transform group-hover:translate-x-1" />
              </button>
            </form>
          </div>
        </div>
        <style>{`
          .contact-input {
            width: 100%;
            background: transparent;
            border: none;
            border-bottom: 1px solid rgba(29,80,58,0.2);
            padding: 8px 0;
            font-size: 15px;
            color: #1D503A;
            outline: none;
            transition: border-color 200ms;
          }
          .contact-input:focus {
            border-bottom-color: #D4AF37;
          }
          .contact-input::placeholder {
            color: rgba(29,80,58,0.4);
          }
        `}</style>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section className="relative z-10 overflow-hidden py-[120px] px-margin-mobile md:px-margin-desktop bg-transparent font-['Assistant',ui-sans-serif,system-ui]">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-14">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-10 bg-[#D4AF37]/40" />
              <span className="size-1.5 rotate-45 bg-[#D4AF37]" />
              <div className="h-px w-10 bg-[#D4AF37]/40" />
            </div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-[#1D503A]/60 mb-3 text-center">
              Postcards from our travellers
            </p>
            <h2 className="font-['Cormorant_Garamond',ui-serif,Georgia] italic text-4xl md:text-5xl text-[#1D503A] text-center">
              What Our Travellers Say
            </h2>
          </div>
          {/* Featured testimonial card */}
          <div className="relative max-w-4xl mx-auto">
            {/* Stamp-style corner ticks */}
            <div className="absolute -top-3 -left-3 size-6 border-t-2 border-l-2 border-[#D4AF37]/60 z-10" />
            <div className="absolute -top-3 -right-3 size-6 border-t-2 border-r-2 border-[#D4AF37]/60 z-10" />
            <div className="absolute -bottom-3 -left-3 size-6 border-b-2 border-l-2 border-[#D4AF37]/60 z-10" />
            <div className="absolute -bottom-3 -right-3 size-6 border-b-2 border-r-2 border-[#D4AF37]/60 z-10" />

            <div className="relative bg-white/95 backdrop-blur-md ring-1 ring-[#D4AF37]/20 shadow-[0_30px_80px_-30px_rgba(29,80,58,0.25)] px-8 md:px-16 py-12 md:py-16 rounded-[4px] overflow-hidden">
              {/* Elegant luxury gold inner dashed frame */}
              <div className="absolute inset-3 border border-dashed border-[#D4AF37]/25 pointer-events-none rounded-[2px]" />

              {/* Circular Postmark Ink Watermark */}
              <div className="pointer-events-none absolute -top-8 -right-8 w-48 h-48 rounded-full border border-dashed border-[#1D503A]/10 flex items-center justify-center rotate-[-15deg] select-none">
                <div className="w-[88%] h-[88%] rounded-full border border-double border-[#1D503A]/10 flex flex-col items-center justify-center p-4 text-center">
                  <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#1D503A]/10">Eshaare Tours</span>
                  <span className="my-1 text-xs uppercase font-serif italic tracking-[0.1em] font-semibold text-[#1D503A]/15 border-y border-[#1D503A]/10 py-0.5 px-2">Verified</span>
                  <span className="text-[8px] uppercase tracking-[0.15em] font-medium text-[#1D503A]/10">Dubai Expat</span>
                </div>
              </div>

              {/* Giant quote mark */}
              <div className="absolute top-6 left-6 font-['Cormorant_Garamond',ui-serif,Georgia] text-[120px] leading-none text-[#D4AF37]/15 select-none pointer-events-none">
                &ldquo;
              </div>

              <div className="relative z-10">
                {/* Stars */}
                <div className="flex gap-1.5 mb-6">
                  {Array.from({ length: testimonials[activeTestimonial].rating }).map((_, i) => (
                    <span
                      key={i}
                      className="size-2 rotate-45 bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.4)] inline-block"
                    />
                  ))}
                </div>
                {/* Quote */}
                <blockquote
                  key={activeTestimonial}
                  className="font-['Cormorant_Garamond',ui-serif,Georgia] italic text-2xl md:text-[28px] leading-[1.45] text-[#1D503A] mb-10 animate-[fade-in_500ms_ease-out_both]"
                >
                  {testimonials[activeTestimonial].quote}
                </blockquote>
                {/* Author */}
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <div className="size-14 rotate-45 bg-[#1D503A] p-0.5 shadow-md flex items-center justify-center">
                      <div className="w-full h-full border border-[#D4AF37]/40 flex items-center justify-center">
                        <span className="-rotate-45 text-[#D4AF37] font-semibold tracking-wider text-sm">
                          {testimonials[activeTestimonial].initials}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold text-[#1D503A] text-base">
                      {testimonials[activeTestimonial].name}
                    </div>
                    <div className="text-[11px] uppercase tracking-[0.22em] text-[#1D503A]/60 mt-1 flex items-center gap-1.5">
                      <span>{testimonials[activeTestimonial].trip}</span>
                      <span className="text-[#D4AF37]">•</span>
                      <span>{testimonials[activeTestimonial].location}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Selector / pagination */}
            <div className="mt-10 flex items-center justify-center gap-6">
              {testimonials.map((item, i) => {
                const isActive = i === activeTestimonial;
                return (
                  <button
                    key={item.name}
                    onClick={() => setActiveTestimonial(i)}
                    className="group flex items-center gap-3 transition-opacity"
                    aria-label={`Read testimonial from ${item.name}`}
                  >
                    <span
                      className={`size-2 rotate-45 transition-all ${isActive
                          ? "bg-[#D4AF37] scale-125"
                          : "bg-[#1D503A]/20 group-hover:bg-[#1D503A]/40"
                        }`}
                    />
                    <span
                      className={`text-[10px] uppercase tracking-[0.22em] transition-colors hidden sm:inline ${isActive ? "text-[#1D503A]" : "text-[#1D503A]/40 group-hover:text-[#1D503A]/70"
                        }`}
                    >
                      {item.name.split(" ")[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          {/* Trust footer */}
          <div className="mt-16 flex flex-col items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="h-px w-12 bg-[#D4AF37]/30" />
              <div className="size-1.5 rotate-45 bg-[#D4AF37]" />
              <div className="h-px w-12 bg-[#D4AF37]/30" />
            </div>
            {/* <p className="text-[11px] uppercase tracking-[0.3em] text-[#1D503A]/60 text-center">
              4.9 / 5 · Over 2,400 journeys curated
            </p> */}
          </div>
        </div>
        <style>{`
          @keyframes fade-in {
            0% { opacity: 0; transform: translateY(8px); }
            100% { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </section>

    </div>
  );
};

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-[0.22em] text-[#1D503A]/60 mb-2">
        {label}
      </span>
      {children}
    </label>
  );
}

export default HomePage;