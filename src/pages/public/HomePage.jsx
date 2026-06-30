import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import toast from "react-hot-toast";
import { AnimatedStatsBar } from "../../components/ui/AnimatedStatsBar";
import { db } from "../../lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";


// ─── Service images (one per service, matched by index) ────────────────────
const SERVICE_IMAGES = [
  "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=900&q=80&fm=webp", // Schengen – Paris/Europe
  "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=900&q=80&fm=webp", // UK – London
  "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=900&q=80&fm=webp", // USA – New York
  "https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?auto=format&fit=crop&w=900&q=80&fm=webp", // Saudi – Riyadh
  "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=900&q=80&fm=webp", // UAE – Dubai
  "https://images.unsplash.com/photo-1621680696874-edd80ce57b72?auto=format&fit=crop&w=900&q=80&fm=webp", // Oman – Muscat
  "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=900&q=80&fm=webp", // Japan – Kyoto
  "https://images.unsplash.com/photo-1556740772-1a741367b93e?auto=format&fit=crop&w=900&q=80&fm=webp", // Business – corporate
  "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=900&q=80&fm=webp", // VFS – airport
  "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=900&q=80&fm=webp", // Insurance – health/travel
];

export const HomePage = () => {
  const navigate = useNavigate();

  const [dbPackages, setDbPackages] = useState([]);
  const [isPackagesLoading, setIsPackagesLoading] = useState(true);

  // Form State
  const [visaStep, setVisaStep] = useState(1);
  const [isSubmittingVisa, setIsSubmittingVisa] = useState(false);
  const [isFormFocused, setIsFormFocused] = useState(false);
  const [visaFormData, setVisaFormData] = useState({
    name: "",
    email: "",
    phone: "",
    nationality: "",
    travelDate: "",
    travelers: "",
    lookingFor: ""
  });

  const handleVisaSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingVisa(true);
    try {
      await addDoc(collection(db, "leads"), {
        contactName: visaFormData.name,
        contactEmail: visaFormData.email,
        contactPhone: visaFormData.phone,
        nationality: visaFormData.nationality,
        travelDate: visaFormData.travelDate,
        travelers: visaFormData.travelers,
        visaType: visaFormData.lookingFor,
        destination: "General", // Default for Kanban flag icon
        source: "Website Hero Form",
        stage: "New", // Kanban uses 'stage'
        leadNo: "L-" + Math.floor(100000 + Math.random() * 900000).toString(),
        isDeleted: false,
        isActive: true,
        assignedTo: "Unassigned",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setVisaStep(3);
    } catch (err) {
      console.error("Error submitting lead: ", err);
      toast.error("Failed to submit request.");
    } finally {
      setIsSubmittingVisa(false);
    }
  };

  useEffect(() => {
    let unsubscribe;
    let isMounted = true;

    const loadPackages = async () => {
      try {
        const { getPackages } = await import("../../lib/firestore");
        if (isMounted) {
          unsubscribe = getPackages((items) => {
            setDbPackages(items);
            setIsPackagesLoading(false);
          });
        }
      } catch (err) {
        console.error("Failed to load packages", err);
        if (isMounted) setIsPackagesLoading(false);
      }
    };

    const id = window.requestIdleCallback
      ? window.requestIdleCallback(() => loadPackages())
      : setTimeout(loadPackages, 1000);

    return () => {
      isMounted = false;
      if (window.cancelIdleCallback && window.requestIdleCallback) {
        window.cancelIdleCallback(id);
      } else {
        clearTimeout(id);
      }
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // ─── Hero Slider ────────────────────────────────────────────────────────
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    if (slides && slides[activeSlide]) {
      const event = new CustomEvent("heroThemeChange", { detail: slides[activeSlide].theme });
      window.dispatchEvent(event);
    }
  }, [activeSlide]);

  const slides = [
    {
      image: "/hero_aurora_cabin.jpg",
      headline: <>Eshaare Tours & Visas<br /><span className="text-[#a0d2b4] italic font-serif text-3xl md:text-[40px] leading-tight block mt-2">Dubai UAE Visa Processing and Travel Packages</span></>,
      subtext: "From document verification to application submission, our experts make your visa process faster, simpler, and stress-free.",
      theme: "dark",
    },
    {
      image: "/hero_sunset_pool.jpg",
      headline: <>Tired of <br /><span className="text-[#1a4a38] italic font-serif">slot booking?</span></>,
      subtext: (
        <div className="space-y-4">
          <p className="font-bold text-lg text-[#1a4a38]"><span className="italic">AI</span> assisted slot bookings, document guidance and visa support – all in one place.</p>
          <p className="text-gray-600">We simplify your visa journey with smart assistance, expert support, and seamless travel planning.</p>
        </div>
      ),
      theme: "split",
    },
    {
      image: "/hero_japan_sunset.jpg",
      headline: <>Your Journey <br />Starts <span className="text-[#1a4a38] italic font-serif">Here.</span></>,
      subtext: "Premium travel agency in Dubai providing custom travel and visa services. We manage flights, luxury hotels, express VFS slot bookings, and custom holiday planning worldwide.",
      theme: "light",
    }

  ];

  const hasFormData = visaFormData.name !== '' || visaFormData.email !== '' || visaFormData.phone !== '';

  useEffect(() => {
    if (isFormFocused || visaStep > 1 || hasFormData) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isFormFocused, visaStep, slides.length, hasFormData]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        if (visaStep !== 1 || hasFormData || isFormFocused) {
          setVisaStep(1);
          setVisaFormData({
            name: "",
            email: "",
            phone: "",
            nationality: "",
            travelDate: "",
            travelers: "",
            lookingFor: ""
          });
          setIsFormFocused(false);
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [visaStep, hasFormData, isFormFocused]);


  // ─── Continents ──────────────────────────────────────────────────────────
  const [activeContinent, setActiveContinent] = useState("Europe");
  const continentCountries = {
    Europe: [
      { name: "France", flag: "🇫🇷", type: "Schengen Visa", image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=600&q=80&fm=webp" },
      { name: "Germany", flag: "🇩🇪", type: "Schengen Visa", image: "https://images.unsplash.com/photo-1599946347371-68eb71b16afc?auto=format&fit=crop&w=600&q=80&fm=webp" },
      { name: "Switzerland", flag: "🇨🇭", type: "Schengen Visa", image: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=600&q=80&fm=webp" },
      { name: "United Kingdom", flag: "🇬🇧", type: "Standard Visitor", image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=600&q=80&fm=webp" }
    ],
    Asia: [
      { name: "Japan", flag: "🇯🇵", type: "Tourist Visa", image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80&fm=webp" },
      { name: "Saudi Arabia", flag: "🇸🇦", type: "eVisa / Tourist", image: "https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?auto=format&fit=crop&w=600&q=80&fm=webp" },
      { name: "Singapore", flag: "🇸🇬", type: "Tourist Visa", image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=600&q=80&fm=webp" },
      { name: "Thailand", flag: "🇹🇭", type: "Visa on Arrival / Tourist", image: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=600&q=80&fm=webp" }
    ],
    Africa: [
      { name: "South Africa", flag: "🇿🇦", type: "Tourist Visa", image: "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?auto=format&fit=crop&w=600&q=80&fm=webp" },
      { name: "Egypt", flag: "🇪🇬", type: "Tourist Visa / eVisa", image: "https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=600&q=80&fm=webp" },
      { name: "Kenya", flag: "🇰🇪", type: "ETA / eVisa", image: "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=600&q=80&fm=webp" },
      { name: "Morocco", flag: "🇲🇦", type: "Tourist Visa", image: "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?auto=format&fit=crop&w=600&q=80&fm=webp" }
    ],
    "North America": [
      { name: "United States", flag: "🇺🇸", type: "B1/B2 Tourist", image: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=600&q=80&fm=webp" },
      { name: "Canada", flag: "🇨🇦", type: "Visitor Visa", image: "https://images.unsplash.com/photo-1503614472-8c93d56e92ce?auto=format&fit=crop&w=600&q=80&fm=webp" },
      { name: "Mexico", flag: "🇲🇽", type: "Tourist Visa", image: "https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=600&q=80&fm=webp" }
    ],
    "South America": [
      { name: "Brazil", flag: "🇧🇷", type: "Tourist Visa", image: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=600&q=80&fm=webp" },
      { name: "Argentina", flag: "🇦🇷", type: "Tourist Visa", image: "https://images.unsplash.com/photo-1589909202802-8f4aadce1849?auto=format&fit=crop&w=600&q=80&fm=webp" },
      { name: "Peru", flag: "🇵🇪", type: "Visa Free / Tourist", image: "https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=600&q=80&fm=webp" }
    ],
    Oceania: [
      { name: "Australia", flag: "🇦🇺", type: "Visitor Visa (Subclass 600)", image: "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?auto=format&fit=crop&w=600&q=80&fm=webp" },
      { name: "New Zealand", flag: "🇳🇿", type: "Visitor Visa", image: "https://images.unsplash.com/photo-1469521669194-babb45599def?auto=format&fit=crop&w=600&q=80&fm=webp" }
    ],
    Antarctica: [
      { name: "Expedition Permit", flag: "❄️", type: "Special Permit Support", image: "https://images.unsplash.com/photo-1517783999520-f068d7431a60?auto=format&fit=crop&w=600&q=80&fm=webp" }
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
      const { createLead } = await import("../../lib/firestore");
      const { generateLeadNo, formatWhatsAppPhone } = await import("../../utils/helpers");
      const { serverTimestamp } = await import("firebase/firestore");

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
      img: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80&fm=webp",
      link: "/packages/kerala-backwater-escape"
    }),
    getFeaturedPackageData(1, {
      title: "Interlaken Holu",
      location: "Gentrisch, Switzerland",
      price: "$224",
      priceSub: "/ Person",
      img: "https://images.unsplash.com/photo-1502784444187-359ac186c5bb?q=80&w=800&auto=format&fit=crop&fm=webp",
      link: "/packages"
    }),
    getFeaturedPackageData(2, {
      title: "Bespoke Honeymoon",
      location: "Maldives Escape",
      price: "$399",
      priceSub: "/ Person",
      img: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=800&q=80&fm=webp",
      link: "/packages/customise"
    }),
    getFeaturedPackageData(3, {
      title: "Custom Package",
      location: "Tailor-made Journeys",
      price: "Bespoke",
      priceSub: "Pricing",
      img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop&fm=webp",
      link: "/packages/customise"
    })
  ];

  const fallbackSpecialists = [
    {
      id: "fallback-Your Name",
      name: "Your Nmae",
      designation: "Managing Director",
      intro: "Coordinating premium custom holiday designs and ensuring absolute file compliance for high-net-worth travelers.",
      img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80&fm=webp",
      visasFiled: 2400,
      experienceYears: 12,
      successRate: 99
    },
    {
      id: "fallback-suresh",
      name: "Suresh Kumar",
      designation: "Senior Visa Specialist",
      intro: "Expert in Schengen, UK, and USA document audits with deep knowledge of VFS visa operations and embassy protocols.",
      img: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=80&fm=webp",
      visasFiled: 1850,
      experienceYears: 9,
      successRate: 98
    },
    {
      id: "fallback-aisha",
      name: "Aisha Al-Mansoori",
      designation: "Luxury Tour Consultant",
      intro: "Crafting bespoke global itineraries for European tours, Japan escapes, and exotic destination getaways.",
      img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80&fm=webp",
      visasFiled: 950,
      experienceYears: 6,
      successRate: 100
    },
    {
      id: "fallback-hassan",
      name: "Hassan Ali",
      designation: "VFS Operations Lead",
      intro: "Managing slot bookings, biometric appointments, and rapid document dispatch for all Eshaare clients.",
      img: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80&fm=webp",
      visasFiled: 3200,
      experienceYears: 11,
      successRate: 98
    }
  ];

  // Specialists are sourced from the Firestore experts collection (active status).
  // Safe fallback to curated static list is kept if the collection is empty.
  const [specialists, setSpecialists] = useState(fallbackSpecialists);
  const [activeSpecIndex, setActiveSpecIndex] = useState(0);

  useEffect(() => {
    let unsubscribe;
    let isMounted = true;

    const loadExperts = async () => {
      try {
        const { getActiveExperts } = await import("../../lib/firestore");
        if (isMounted) {
          unsubscribe = getActiveExperts((experts) => {
            if (experts && experts.length > 0) {
              setSpecialists(experts);
            } else {
              setSpecialists(fallbackSpecialists);
            }
          }, (error) => {
            console.warn("Firestore active experts load failed, using fallback:", error);
            setSpecialists(fallbackSpecialists);
          });
        }
      } catch (err) {
        console.error("Failed to load experts", err);
      }
    };

    const id = window.requestIdleCallback
      ? window.requestIdleCallback(() => loadExperts())
      : setTimeout(loadExperts, 1000);

    return () => {
      isMounted = false;
      if (window.cancelIdleCallback && window.requestIdleCallback) {
        window.cancelIdleCallback(id);
      } else {
        clearTimeout(id);
      }
      if (unsubscribe) unsubscribe();
    };
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

  const getSpecialistTags = (member) => {
    if (member && member.tags && Array.isArray(member.tags) && member.tags.length > 0) {
      return {
        highlighted: member.department || member.tags[0],
        secondary: member.tags.slice(1).length > 0 ? member.tags.slice(1) : [member.tags[0]]
      };
    }
    const des = (member?.designation || "").toLowerCase();
    if (des.includes("managing") || des.includes("director") || des.includes("John Doe")) {
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

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;

    const handleTouchMove = (e) => {
      if (dragStartY.current === null) return;
      const diff = dragStartY.current - e.touches[0].clientY;
      const goingDown = diff > 0;
      const goingUp = diff < 0;
      const atEnd = activeSvc >= TOTAL_SVC - 1;
      const atStart = activeSvc <= 0;

      const shouldTrap =
        (goingDown && !atEnd) ||
        (goingUp && !atStart) ||
        (activeSvc > 0 && activeSvc < TOTAL_SVC - 1);

      if (shouldTrap) {
        e.preventDefault();
      }
    };

    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => el.removeEventListener("touchmove", handleTouchMove);
  }, [activeSvc]);


  // ─────────────────────────────────────────────────────────────────────────

  const currentTheme = slides[activeSlide].theme;

  let bottomBarBgClass = "";
  let bottomBarTextClass = "";
  let bottomBarSubtextClass = "";
  let bottomBarIconBgClass = "";
  let bottomBarIconTextClass = "";
  let bottomBarBorderClass = "";

  if (currentTheme === "dark") {
    bottomBarBgClass = "bg-[#162721]/80 backdrop-blur-xl border-white/10";
    bottomBarTextClass = "text-white";
    bottomBarSubtextClass = "text-gray-300";
    bottomBarIconBgClass = "bg-[#1a4a38]/80 border-white/20";
    bottomBarIconTextClass = "text-white";
    bottomBarBorderClass = "border-white/10";
  } else if (currentTheme === "split") {
    bottomBarBgClass = "bg-[#fdfaf2]/95 backdrop-blur-xl border-[#e8dac1]";
    bottomBarTextClass = "text-[#3a2f26]";
    bottomBarSubtextClass = "text-[#7a6b5c]";
    bottomBarIconBgClass = "bg-[#f4e7d3] border-[#e8dac1]";
    bottomBarIconTextClass = "text-[#5c4d3c]";
    bottomBarBorderClass = "border-[#e8dac1]";
  } else {
    bottomBarBgClass = "bg-[#fff0f3]/95 backdrop-blur-xl border-[#ffccd5]";
    bottomBarTextClass = "text-[#5c2438]";
    bottomBarSubtextClass = "text-[#9c5f74]";
    bottomBarIconBgClass = "bg-[#ffe0e6] border-[#ffccd5]";
    bottomBarIconTextClass = "text-[#7a3b51]";
    bottomBarBorderClass = "border-[#ffccd5]";
  }

  return (
    <div className="relative min-h-screen">
      <Helmet>
        <title>ESHAARE | Visa Consultant & Travel Agency in Dubai</title>
        <meta name="description" content="Book custom holiday packages from Dubai with Eshaare Tours UAE. Premium travel agency in Dubai providing Schengen Visa UAE, UK, US, and Canada visa consultancy." />
      </Helmet>

      {/* HERO SLIDER SECTION */}
      <section className="relative z-10 w-full min-h-[60vh] md:min-h-[650px] flex items-center bg-gray-50 overflow-hidden">
        {/* 1. BACKGROUNDS & OVERLAYS */}
        <div className="absolute inset-0">
          {slides.map((slide, index) => {
            const isActive = index === activeSlide;
            const isDark = slide.theme === "dark";
            const isSplit = slide.theme === "split";
            const isLight = slide.theme === "light";

            return (
              <div
                key={index}
                className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${isActive ? "opacity-100 z-10" : "opacity-0 z-0"}`}
              >
                <img
                  src={slide.image}
                  srcSet={slide.imageSrcSet || undefined}
                  sizes={slide.imageSrcSet ? "100vw" : undefined}
                  alt="Eshaare Tours Hero Background"
                  fetchPriority={index === 0 ? "high" : "auto"}
                  loading={index === 0 ? "eager" : "lazy"}
                  width="1920"
                  height="1080"
                  className="w-full h-full object-cover"
                />
                {isDark && <div className="absolute inset-0 bg-black/40"></div>}
                {isSplit && <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent w-full md:w-[60%]"></div>}
                {isLight && <div className="absolute inset-0 bg-gradient-to-r from-[#fdfbf6]/90 via-[#fdfbf6]/70 to-transparent w-full md:w-[60%]"></div>}
              </div>
            );
          })}
        </div>

        {/* 2. FOREGROUND CONTENT (Rendered Once) */}
        {(() => {
          const activeTheme = slides[activeSlide].theme;
          const isDarkActive = activeTheme === "dark";
          const isSplitActive = activeTheme === "split";

          let cardBgClass, cardTextClass, cardSubTextClass, tabDefaultClass, tabHoverClass, statBgClass, statTextClass, statSubtextClass, searchBarBgClass, searchBarInputClass, searchBarBtnClass;
          if (isDarkActive) {
            cardBgClass = "bg-[#162721]/80 backdrop-blur-xl border border-white/10";
            cardTextClass = "text-white";
            cardSubTextClass = "text-gray-300";
            tabDefaultClass = "text-gray-300 border border-white/20";
            tabHoverClass = "hover:bg-[#1a4a38] hover:border-[#1a4a38] hover:text-white";
            statBgClass = "bg-black/20";
            statTextClass = "text-white";
            statSubtextClass = "text-gray-400";
            searchBarBgClass = "bg-[#1a4a38]";
            searchBarInputClass = "text-white placeholder-white/80";
            searchBarBtnClass = "bg-[#225c46] hover:bg-[#2b7257] text-white";
          } else if (isSplitActive) {
            cardBgClass = "bg-[#fdfaf2]/95 backdrop-blur-xl border border-[#e8dac1]";
            cardTextClass = "text-[#3a2f26]";
            cardSubTextClass = "text-[#7a6b5c]";
            tabDefaultClass = "text-[#5c4d3c] border border-[#e8dac1]";
            tabHoverClass = "hover:bg-[#d8c3a5] hover:border-[#d8c3a5] hover:text-white";
            statBgClass = "bg-[#f4e7d3]/50";
            statTextClass = "text-[#3a2f26]";
            statSubtextClass = "text-[#7a6b5c]";
            searchBarBgClass = "bg-[#f0e3cc]";
            searchBarInputClass = "text-[#3a2f26] placeholder-[#8a7b6b]";
            searchBarBtnClass = "bg-[#d8c3a5] hover:bg-[#c9b18f] text-white";
          } else {
            cardBgClass = "bg-[#fff0f3]/95 backdrop-blur-xl border border-[#ffccd5]";
            cardTextClass = "text-[#5c2438]";
            cardSubTextClass = "text-[#9c5f74]";
            tabDefaultClass = "text-[#7a3b51] border border-[#ffccd5]";
            tabHoverClass = "hover:bg-[#ff8fa3] hover:border-[#ff8fa3] hover:text-white";
            statBgClass = "bg-[#ffe0e6]/60";
            statTextClass = "text-[#5c2438]";
            statSubtextClass = "text-[#9c5f74]";
            searchBarBgClass = "bg-[#ffe6eb]";
            searchBarInputClass = "text-[#5c2438] placeholder-[#a67184]";
            searchBarBtnClass = "bg-[#ff8fa3] hover:bg-[#ff758f] text-white";
          }

          return (
            <div className="relative z-10 w-full flex flex-col justify-center min-h-[100dvh] pt-16 lg:pt-8 pb-48 lg:pb-32 -translate-y-6 lg:-translate-y-10 px-margin-mobile md:px-margin-desktop">
              <div className="max-w-container-max mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-8 items-center flex-1 my-auto">

                {/* Left Column (Text transitions) */}
                <div className="grid max-w-xl w-full">
                  {slides.map((slide, index) => {
                    const isActive = index === activeSlide;
                    const isDark = slide.theme === "dark";
                    return (
                      <div key={index} className={`col-start-1 row-start-1 flex flex-col transition-all duration-700 delay-300 transform ${isActive ? "translate-y-0 opacity-100 z-10" : "translate-y-8 opacity-0 z-0 pointer-events-none"} ${isDark ? "text-white" : "text-gray-900"}`}>
                        {index === 0 ? (
                          <h1 className="font-display-lg text-4xl md:text-[48px] font-bold leading-[1.1] mb-5 tracking-tight">
                            {slide.headline}
                          </h1>
                        ) : (
                          <h2 className="font-display-lg text-4xl md:text-[58px] font-bold leading-[1.1] mb-5 tracking-tight">
                            {slide.headline}
                          </h2>
                        )}
                        <div className={`text-base md:text-[17px] mb-8 leading-relaxed max-w-lg ${isDark ? "text-gray-200" : "text-gray-600"}`}>
                          {slide.subtext}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
                          <a href="https://wa.me/971557338429" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm bg-[#1a4a38] hover:bg-[#133829] text-white rounded-full font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" /></svg>
                            Chat on WhatsApp
                            <span className="material-symbols-outlined ml-1 text-lg">arrow_forward</span>
                          </a>
                          <Link to="/contact" className={`inline-flex items-center justify-center gap-2 px-6 py-3 text-sm rounded-full font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 ${isDark ? "bg-white text-gray-900 hover:bg-gray-50" : "bg-white text-gray-900 border border-gray-200 hover:bg-gray-50"}`}>
                            <span className="material-symbols-outlined text-xl text-gray-600">call</span>
                            Get a Free Consultation
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right Column: Stats Card with Multi-step form */}
                <div className="block transition-all duration-700 delay-500 transform translate-y-0 opacity-100">
                  <div
                    className={`mx-auto lg:ml-0 lg:mr-auto max-w-[360px] w-full p-5 sm:p-6 rounded-[24px] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.18)] ${cardBgClass} relative overflow-hidden flex flex-col justify-between`}
                    style={{ minHeight: "410px" }}
                    onFocus={() => setIsFormFocused(true)}
                    onBlur={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget)) {
                        setIsFormFocused(false);
                      }
                    }}
                  >
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]"></div>

                    {visaStep === 1 && (
                      <div className="mb-4 mt-1 relative z-10 flex-1">
                        <h2 className={`text-center text-[20px] font-bold mb-1 ${cardTextClass}`}>
                          Where do you want to go?
                        </h2>
                        <p className={`text-center mb-4 text-[12px] ${cardSubTextClass}`}>
                          Start your travel Visa application
                        </p>

                        <form className="space-y-2.5" onSubmit={(e) => { e.preventDefault(); setVisaStep(2); }}>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div>
                              <label className={`block text-[10px] font-bold tracking-wide mb-1 ${cardTextClass}`}>NAME</label>
                              <input required type="text" placeholder="Your Name" className={`w-full h-[40px] rounded-xl px-3 bg-white/20 border outline-none text-[12px] placeholder:opacity-60 transition-colors ${isDarkActive ? "border-white/20 text-white" : "border-black/10 text-black placeholder:text-black/60 focus:border-black/30"}`} value={visaFormData.name} onChange={e => setVisaFormData({ ...visaFormData, name: e.target.value })} />
                            </div>
                            <div>
                              <label className={`block text-[10px] font-bold tracking-wide mb-1 ${cardTextClass}`}>EMAIL</label>
                              <input required type="email" placeholder="Your Email" className={`w-full h-[40px] rounded-xl px-3 bg-white/20 border outline-none text-[12px] placeholder:opacity-60 transition-colors ${isDarkActive ? "border-white/20 text-white" : "border-black/10 text-black placeholder:text-black/60 focus:border-black/30"}`} value={visaFormData.email} onChange={e => setVisaFormData({ ...visaFormData, email: e.target.value })} />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div>
                              <label className={`block text-[10px] font-bold tracking-wide mb-1 ${cardTextClass}`}>PHONE NUMBER</label>
                              <input required type="tel" placeholder="Your Ph No" className={`w-full h-[40px] rounded-xl px-3 bg-white/20 border outline-none text-[12px] placeholder:opacity-60 transition-colors ${isDarkActive ? "border-white/20 text-white" : "border-black/10 text-black placeholder:text-black/60 focus:border-black/30"}`} value={visaFormData.phone} onChange={e => setVisaFormData({ ...visaFormData, phone: e.target.value })} />
                            </div>
                            <div>
                              <label className={`block text-[10px] font-bold tracking-wide mb-1 ${cardTextClass}`}>NATIONALITY</label>
                              <input required type="text" placeholder="Your Nationality" className={`w-full h-[40px] rounded-xl px-3 bg-white/20 border outline-none text-[12px] placeholder:opacity-60 transition-colors ${isDarkActive ? "border-white/20 text-white" : "border-black/10 text-black placeholder:text-black/60 focus:border-black/30"}`} value={visaFormData.nationality} onChange={e => setVisaFormData({ ...visaFormData, nationality: e.target.value })} />
                            </div>
                          </div>
                          <button type="submit" className={`w-full h-[40px] mt-3 rounded-full font-semibold flex items-center justify-center gap-2 transition hover:scale-[1.02] text-[14px] shadow-sm ${searchBarBtnClass}`}>
                            Continue <span className="text-lg leading-none">→</span>
                          </button>
                        </form>
                      </div>
                    )}

                    {visaStep === 2 && (
                      <div className="mb-4 mt-1 relative z-10 flex-1">
                        <button onClick={() => setVisaStep(1)} className={`text-lg mb-1 hover:opacity-70 transition ${cardTextClass}`}>←</button>
                        <h2 className={`text-center text-[20px] font-bold mb-1 ${cardTextClass}`}>Tell us more</h2>

                        <form className="space-y-3 mt-4" onSubmit={handleVisaSubmit}>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div>
                              <label className={`block text-[10px] font-bold tracking-wide mb-1 ${cardTextClass}`}>TRAVEL DATE *</label>
                              <input required type="date" className={`w-full h-[40px] rounded-xl px-3 bg-white/20 border outline-none text-[12px] transition-colors ${isDarkActive ? "border-white/20 text-white [color-scheme:dark]" : "border-black/10 text-black focus:border-black/30 [color-scheme:light]"}`} value={visaFormData.travelDate} onChange={e => setVisaFormData({ ...visaFormData, travelDate: e.target.value })} />
                            </div>
                            <div>
                              <label className={`block text-[10px] font-bold tracking-wide mb-1 ${cardTextClass}`}>NO. OF TRAVELERS *</label>
                              <input required type="number" min="1" placeholder="2" className={`w-full h-[40px] rounded-xl px-3 bg-white/20 border outline-none text-[12px] placeholder:opacity-60 transition-colors ${isDarkActive ? "border-white/20 text-white" : "border-black/10 text-black placeholder:text-black/60 focus:border-black/30"}`} value={visaFormData.travelers} onChange={e => setVisaFormData({ ...visaFormData, travelers: e.target.value })} />
                            </div>
                          </div>
                          <div>
                            <label className={`block text-[10px] font-bold tracking-wide mb-1 ${cardTextClass}`}>WHAT ARE YOU LOOKING FOR? *</label>
                            <input required type="text" placeholder="e.g., Schengen Visa, Tour Package" className={`w-full h-[40px] rounded-xl px-3 bg-white/20 border outline-none text-[12px] placeholder:opacity-60 transition-colors ${isDarkActive ? "border-white/20 text-white" : "border-black/10 text-black placeholder:text-black/60 focus:border-black/30"}`} value={visaFormData.lookingFor} onChange={e => setVisaFormData({ ...visaFormData, lookingFor: e.target.value })} />
                          </div>
                          <button type="submit" disabled={isSubmittingVisa} className={`w-full h-[40px] mt-3 rounded-full font-semibold flex items-center justify-center gap-2 transition hover:scale-[1.02] text-[14px] shadow-sm disabled:opacity-70 ${searchBarBtnClass}`}>
                            {isSubmittingVisa ? "Submitting..." : "Submit Request"} <span className="text-lg leading-none">→</span>
                          </button>
                        </form>
                      </div>
                    )}

                    {visaStep === 3 && (
                      <div className="mb-4 mt-2 relative z-10 text-center py-2 flex-1 flex flex-col justify-center">
                        <div className="mx-auto w-[60px] h-[60px] rounded-full bg-[#ecfff8] flex items-center justify-center mb-4">
                          <div className="w-[30px] h-[30px] rounded-full border-[3px] border-[#00b878] flex items-center justify-center">
                            <span className="text-[#00b878] text-lg font-bold">✓</span>
                          </div>
                        </div>
                        <h2 className={`text-[20px] font-bold leading-tight mb-3 ${cardTextClass}`}>Success! Request received.</h2>
                        <p className={`text-[12px] leading-relaxed max-w-[260px] mx-auto mb-6 ${cardSubTextClass}`}>
                          Thank you! One of our specialized consultants will contact you within 24 hours.
                        </p>
                      </div>
                    )}

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-2 relative z-10 mt-2">
                      <div className={`p-3 rounded-[1rem] text-center flex flex-col items-center justify-center transition-colors duration-700 ${statBgClass}`}>
                        <div className="flex items-center gap-1.5 text-[#d4af37] mb-1">
                          <span className="material-symbols-outlined text-[18px]">public</span>
                          <span className={`font-bold text-[14px] transition-colors duration-700 ${statTextClass}`}>120+</span>
                        </div>
                        <span className={`text-[11px] transition-colors duration-700 ${statSubtextClass}`}>Countries</span>
                      </div>
                      <div className={`p-3 rounded-[1rem] text-center flex flex-col items-center justify-center transition-colors duration-700 ${statBgClass}`}>
                        <div className="flex items-center gap-1.5 text-[#d4af37] mb-1">
                          <span className="material-symbols-outlined text-[18px]">verified</span>
                          <span className={`font-bold text-[14px] transition-colors duration-700 ${statTextClass}`}>98%</span>
                        </div>
                        <span className={`text-[11px] transition-colors duration-700 ${statSubtextClass}`}>Success Rate</span>
                      </div>
                      <div className={`p-3 rounded-[1rem] text-center flex flex-col items-center justify-center transition-colors duration-700 ${statBgClass}`}>
                        <div className="flex items-center gap-1.5 text-[#d4af37] mb-1">
                          <span className="material-symbols-outlined text-[18px]">support_agent</span>
                          <span className={`font-bold text-[14px] transition-colors duration-700 ${statTextClass}`}>24/7</span>
                        </div>
                        <span className={`text-[11px] transition-colors duration-700 ${statSubtextClass}`}>Support</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          );
        })()}

        {/* Slider Controls (Hidden on small mobile if needed, but keeping for functionality) */}
        <div className="absolute bottom-32 md:bottom-28 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveSlide(index)}
              className="group py-2 px-1"
              aria-label={`Go to slide ${index + 1}`}
            >
              <div className={`h-1.5 rounded-full transition-all duration-500 ease-out ${activeSlide === index ? "w-10 bg-white shadow-sm" : "w-2 bg-white/40 group-hover:bg-white/60"}`} />
            </button>
          ))}
        </div>
      </section>

      {/* FLOATING BOTTOM BAR (SERVICE COLUMNS) */}
      <div className="relative z-20 -mt-2 lg:-mt-36 max-w-7xl mx-auto px-4 mb-10">
        <div className={`rounded-[1.5rem] shadow-[0_15px_40px_-10px_rgba(0,0,0,0.18)] p-4 lg:p-5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lg:gap-3 border transition-colors duration-700 ${bottomBarBgClass}`}>

          <div className={`flex items-center gap-4 flex-1 w-full border-b lg:border-b-0 lg:border-r pb-6 lg:pb-0 lg:pr-4 transition-colors duration-700 ${bottomBarBorderClass}`}>
            <div className={`w-10 h-10 flex items-center justify-center rounded-[12px] border shrink-0 transition-colors duration-700 ${bottomBarIconBgClass} ${bottomBarIconTextClass}`}>
              <span className="material-symbols-outlined text-[20px]">book</span>
            </div>
            <div>
              <h3 className={`font-bold text-[13px] mb-0.5 leading-tight transition-colors duration-700 ${bottomBarTextClass}`}>Visa Assistance</h3>
              <p className={`text-[11px] leading-snug transition-colors duration-700 ${bottomBarSubtextClass}`}>Fast & reliable visa<br className="hidden lg:block" />processing</p>
            </div>
          </div>

          <div className={`flex items-center gap-4 flex-1 w-full border-b lg:border-b-0 lg:border-r pb-6 lg:pb-0 lg:px-4 transition-colors duration-700 ${bottomBarBorderClass}`}>
            <div className={`w-10 h-10 flex items-center justify-center rounded-[12px] border shrink-0 transition-colors duration-700 ${bottomBarIconBgClass} ${bottomBarIconTextClass}`}>
              <span className="material-symbols-outlined text-[20px]">flight_takeoff</span>
            </div>
            <div>
              <h3 className={`font-bold text-[13px] mb-0.5 leading-tight transition-colors duration-700 ${bottomBarTextClass}`}>Flight Bookings</h3>
              <p className={`text-[11px] leading-snug transition-colors duration-700 ${bottomBarSubtextClass}`}>Best deals on<br className="hidden lg:block" />domestic & international</p>
            </div>
          </div>

          <div className={`flex items-center gap-4 flex-1 w-full border-b lg:border-b-0 lg:border-r pb-6 lg:pb-0 lg:px-4 transition-colors duration-700 ${bottomBarBorderClass}`}>
            <div className={`w-10 h-10 flex items-center justify-center rounded-[12px] border shrink-0 transition-colors duration-700 ${bottomBarIconBgClass} ${bottomBarIconTextClass}`}>
              <span className="material-symbols-outlined text-[20px]">room_service</span>
            </div>
            <div>
              <h3 className={`font-bold text-[13px] mb-0.5 leading-tight transition-colors duration-700 ${bottomBarTextClass}`}>Luxury Stays</h3>
              <p className={`text-[11px] leading-snug transition-colors duration-700 ${bottomBarSubtextClass}`}>Handpicked hotels<br className="hidden lg:block" />for your comfort</p>
            </div>
          </div>

          <div className={`flex items-center gap-4 flex-1 w-full border-b lg:border-b-0 lg:border-r pb-6 lg:pb-0 lg:px-4 transition-colors duration-700 ${bottomBarBorderClass}`}>
            <div className={`w-10 h-10 flex items-center justify-center rounded-[12px] border shrink-0 transition-colors duration-700 ${bottomBarIconBgClass} ${bottomBarIconTextClass}`}>
              <span className="material-symbols-outlined text-[20px]">park</span>
            </div>
            <div>
              <h3 className={`font-bold text-[13px] mb-0.5 leading-tight transition-colors duration-700 ${bottomBarTextClass}`}>Holiday Packages</h3>
              <p className={`text-[11px] leading-snug transition-colors duration-700 ${bottomBarSubtextClass}`}>Customized holidays<br className="hidden lg:block" />worldwide</p>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-1 w-full lg:pl-4">
            <div className={`w-10 h-10 flex items-center justify-center rounded-[12px] border shrink-0 transition-colors duration-700 ${bottomBarIconBgClass} ${bottomBarIconTextClass}`}>
              <span className="material-symbols-outlined text-[20px]">event_available</span>
            </div>
            <div>
              <h3 className={`font-bold text-[13px] mb-0.5 leading-tight transition-colors duration-700 ${bottomBarTextClass}`}>VFS Slot Booking</h3>
              <p className={`text-[11px] leading-snug transition-colors duration-700 ${bottomBarSubtextClass}`}>Express slot booking<br className="hidden lg:block" />& support</p>
            </div>
          </div>

        </div>
      </div>

      {/* TRUST / STATS BAR (Hidden as per request) */}
      {/* <AnimatedStatsBar /> */}

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
                        decoding="async"
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
                        decoding="async"
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
                    decoding="async"
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
                Featured Holiday Packages
                <br className="sm:hidden" />
                <span className="hidden sm:inline"> </span>
                from Dubai
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
                {isPackagesLoading && <div className="absolute inset-0 z-20 bg-surface-variant animate-pulse" />}
                <img
                  src={featuredPackages[0].img}
                  alt={featuredPackages[0].title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                  decoding="async"
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
                {isPackagesLoading && <div className="absolute inset-0 z-20 bg-surface-variant animate-pulse" />}
                <img
                  src={featuredPackages[1].img}
                  alt={featuredPackages[1].title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                  decoding="async"
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
                {isPackagesLoading && <div className="absolute inset-0 z-20 bg-surface-variant animate-pulse" />}
                <img
                  src={featuredPackages[2].img}
                  alt={featuredPackages[2].title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                  decoding="async"
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
                  src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80&fm=webp"
                  alt="Customise Package"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                  decoding="async"
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
      <section className="relative z-10 overflow-hidden py-[90px] px-margin-mobile md:px-margin-desktop bg-transparent">
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
              <div key={idx} className="relative group overflow-hidden rounded-xl premium-shadow border border-outline-variant/10 h-48 flex flex-col justify-end p-6">
                <img loading="lazy" decoding="async" src={country.image} alt={country.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 group-hover:from-black/80 transition-colors duration-300"></div>

                <div className="relative z-10 flex flex-col justify-end h-full">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl drop-shadow-md">{country.flag}</span>
                    <h3 className="font-bold text-headline-md text-white drop-shadow-md">{country.name}</h3>
                  </div>
                  <span className="text-body-sm text-white/90 drop-shadow-sm mb-3">{country.type}</span>

                  <Link to="/visa-services" className="text-secondary-fixed font-bold text-body-sm flex items-center gap-1 hover:text-white transition-colors w-fit">
                    <span>View Requirements</span>
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section className="relative z-10 overflow-hidden py-[20px] px-margin-mobile md:px-margin-desktop bg-transparent">
        <div className="max-w-container-max mx-auto grid grid-cols-1 md:grid-cols-2 gap-[64px] items-center relative z-10">
          <div
            data-animate="about-eshaare"
            className={`space-y-6 transition-opacity duration-1000 ${visibleSections["about-eshaare"] ? "opacity-100" : "opacity-0"}`}
          >
            <h2 className={`font-headline-lg text-[20px] sm:text-2xl md:text-headline-lg text-primary ${typewriterClass("about-eshaare")}`}>
              About Eshaare
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
                  <h3 className="font-bold text-primary text-body-sm">Certified Experts</h3>
                  <p className="text-on-surface-variant text-body-sm">UAE visa processing coordinators.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-3xl">hourglass_empty</span>
                <div>
                  <h3 className="font-bold text-primary text-body-sm">Express Timelines</h3>
                  <p className="text-on-surface-variant text-body-sm">Priority embassy bookings.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative rounded-2xl overflow-hidden shadow-2xl h-[400px]">
            <img src="/about_eshaare_korea.jpg" alt="About Eshaare Tours" className="w-full h-full object-cover" loading="lazy" decoding="async" />
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

              const tags = getSpecialistTags(member);

              return (
                <div
                  key={member.id || idx}
                  onClick={() => {
                    if (!isActive) {
                      setActiveSpecIndex(idx);
                    }
                  }}
                  className={`absolute w-[280px] sm:w-[320px] md:w-[740px] lg:w-[780px] h-[500px] sm:h-[480px] md:h-[340px] rounded-[24px] sm:rounded-[32px] overflow-hidden flex flex-col md:flex-row transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] cursor-pointer select-none bg-[#1e1e1e]/95 border border-white/10 shadow-[0_15px_35px_rgba(0,0,0,0.4)] ${isActive ? "ring-2 ring-secondary/50 shadow-[0_20px_45px_rgba(29,80,58,0.3)]" : "hover:border-white/20"
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
                  <div className="w-full md:w-2/5 relative h-[220px] sm:h-[240px] md:h-auto overflow-hidden">
                    <img decoding="async"
                      src={member.img}
                      alt={member.name}
                      className="w-full h-full object-cover object-[50%_20%] transition-transform duration-700 hover:scale-105"
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
      <section id="enquire" className="relative z-10 -mt-10 w-full bg-[#FCFBF8]/45 backdrop-blur-[2px] py-10 md:py-14 font-['Assistant',ui-sans-serif,system-ui]">
        <div className="max-w-5xl mx-auto px-4">
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
            <div className="relative min-h-[150px] md:min-h-full">
              <img decoding="async"
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
              className="p-4 md:p-5 flex flex-col gap-3 bg-[#FCFBF8]"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Field label="Your Name *">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Your Name"
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    className="contact-input"
                  />
                </Field>
                <Field label="WhatsApp Phone *">
                  <input
                    type="tel"
                    required
                    placeholder="e.g. Your Ph No"
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
                  placeholder="e.g. Your Email"
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
                  rows={1}
                  placeholder="We'd love to mail you or text you..."
                  value={form.message}
                  onChange={(e) => update("message", e.target.value)}
                  className="contact-input resize-none pt-2"
                />
              </Field>
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative mt-2 inline-flex items-center justify-center gap-2 bg-[#1D503A] text-white px-6 py-2.5 rounded-[2px] text-sm uppercase tracking-[0.25em] font-semibold hover:bg-[#143d2c] transition-colors disabled:opacity-50"
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
            padding: 4px 0;
            font-size: 13px;
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
      <section className="relative z-10 overflow-hidden py-[80px] px-margin-mobile md:px-margin-desktop bg-gray-50 font-sans border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          {/* Header */}
          <div className="text-center mb-10">
            <h2 className="font-headline-lg text-[28px] md:text-[32px] text-gray-900 font-bold tracking-tight">
              What Our Travellers Say
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-3 text-[14px] text-gray-600">
              <span className="font-semibold text-gray-800">Excellent</span>
              <div className="flex text-[#FFB400]">
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              </div>
              <span className="text-gray-500">Based on 2,400+ reviews</span>
            </div>
          </div>

          {/* Google Review Style Card */}
          <div className="relative mx-auto w-full max-w-3xl">
            <div className="bg-white rounded-[16px] shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-gray-100 p-6 md:p-8">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#1D503A] flex items-center justify-center text-white text-lg font-semibold shrink-0">
                    {testimonials[activeTestimonial].initials}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-[15px] leading-tight">
                      {testimonials[activeTestimonial].name}
                    </h3>
                    <p className="text-gray-500 text-[12px] mt-0.5 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px] text-green-600">verified</span>
                      Verified • {testimonials[activeTestimonial].trip}
                    </p>
                  </div>
                </div>
                {/* Google Icon */}
                <svg width="24" height="24" viewBox="0 0 24 24" className="shrink-0">
                  <path fill="#4285F4" d="M23.7449 12.2727C23.7449 11.4818 23.674 10.7318 23.5432 10H12V14.5091H18.5771C18.2936 15.9636 17.4764 17.1818 16.2449 18.0182V20.9364H20.1983C22.5126 18.8 23.7449 15.8091 23.7449 12.2727Z" />
                  <path fill="#34A853" d="M12 24C15.3055 24 18.0938 22.9091 20.1983 20.9364L16.2449 18.0182C15.1058 18.7818 13.6762 19.2364 12 19.2364C8.7562 19.2364 5.99946 17.0455 5.02146 14.0818H0.95752V17.2364C2.99346 21.2818 7.15146 24 12 24Z" />
                  <path fill="#FBBC05" d="M5.02146 14.0818C4.77055 13.3273 4.62883 12.5273 4.62883 11.7091C4.62883 10.8909 4.77055 10.0909 5.02146 9.33636V6.18182H0.95752C0.117818 7.84545 -0.354004 9.72727 -0.354004 11.7091C-0.354004 13.6909 0.117818 15.5727 0.95752 17.2364L5.02146 14.0818Z" />
                  <path fill="#EA4335" d="M12 4.18182C13.8005 4.18182 15.4053 4.8 16.6805 6.01818L20.2855 2.41364C18.083 0.363636 15.3055 -0.545455 12 -0.545455C7.15146 -0.545455 2.99346 2.17273 0.95752 6.18182L5.02146 9.33636C5.99946 6.37273 8.7562 4.18182 12 4.18182Z" />
                </svg>
              </div>

              {/* Stars */}
              <div className="flex gap-0.5 mb-3 text-[#FFB400]">
                {Array.from({ length: testimonials[activeTestimonial].rating }).map((_, i) => (
                  <span key={i} className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                ))}
                {Array.from({ length: 5 - testimonials[activeTestimonial].rating }).map((_, i) => (
                  <span key={i} className="material-symbols-outlined text-[16px] text-gray-300" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                ))}
              </div>

              {/* Quote */}
              <p
                key={activeTestimonial}
                className="text-[#3c4043] text-[15px] md:text-[16px] leading-relaxed animate-[fade-in_400ms_ease-out_both] min-h-[80px]"
              >
                {testimonials[activeTestimonial].quote}
              </p>
            </div>

            {/* Selector / pagination */}
            <div className="mt-8 flex items-center justify-center gap-2.5">
              {testimonials.map((item, i) => {
                const isActive = i === activeTestimonial;
                return (
                  <button
                    key={item.name}
                    onClick={() => setActiveTestimonial(i)}
                    className={`h-2.5 rounded-full transition-all duration-300 ${isActive ? "bg-primary w-8" : "bg-gray-300 hover:bg-gray-400 w-2.5"}`}
                    aria-label={`Read testimonial from ${item.name}`}
                  />
                );
              })}
            </div>
          </div>
        </div>
        <style>{`
          @keyframes fade-in {
            0% { opacity: 0; transform: translateY(4px); }
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