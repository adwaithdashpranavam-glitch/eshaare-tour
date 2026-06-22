import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, Link, useNavigate } from "react-router-dom";
import { doc, getDoc, serverTimestamp } from "firebase/firestore";
import { db, createLead } from "../../lib/firestore";
import { generateLeadNo, formatWhatsAppPhone } from "../../utils/helpers";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import toast from "react-hot-toast";

export const PackageDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [currentPkg, setCurrentPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    const fetchPackage = async () => {
      try {
        const docRef = doc(db, "packages", slug);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setCurrentPkg({ id: snap.id, ...snap.data() });
        } else {
          // Fallback to check if it's one of our mock slugs, otherwise redirect
          toast.error("Package not found");
          navigate("/packages");
        }
      } catch (err) {
        toast.error("Failed to load package details");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPackage();
  }, [slug, navigate]);

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    if (!currentPkg || !name || !phone) return;
    try {
      const generatedNo = await generateLeadNo();
      const submission = {
        leadNo: generatedNo,
        contactName: name,
        contactPhone: formatWhatsAppPhone(phone),
        contactEmail: "",
        nationality: "Unknown",
        destinationCountry: currentPkg.country || currentPkg.destination || "Global",
        serviceType: "Tour",
        source: "website_package_detail",
        stage: "New",
        priority: "Medium",
        ownerId: null,
        notes: `Booking Request for Package: ${currentPkg.title}\nPrice: ${currentPkg.price}\nDuration: ${currentPkg.duration}`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await createLead(submission);
      toast.success(`Booking request sent for ${currentPkg.title}! Ref: ${generatedNo}`);
      setName("");
      setPhone("");
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit booking request. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="bg-surface min-h-screen py-12 px-margin-mobile md:px-margin-desktop flex items-center justify-center">
        <LoadingSpinner message="Loading package details..." />
      </div>
    );
  }

  if (!currentPkg) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>{currentPkg.title ? `${currentPkg.title} | Eshaare Tours Dubai` : "Package Details | Eshaare Tours Dubai"}</title>
        <meta name="description" content={currentPkg.description ? currentPkg.description.substring(0, 155) : "Enjoy a hassle-free, premium travel experience with our curated tour packages."} />
      </Helmet>
      <div className="bg-surface min-h-screen py-12 px-margin-mobile md:px-margin-desktop">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Back Link */}
        <Link 
          to="/packages" 
          className="inline-flex items-center text-body-sm font-bold text-secondary hover:text-secondary-fixed transition-colors gap-1.5"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          <span>Back to Packages</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Details (2/3) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden premium-shadow">
              <div className="relative h-80">
                <img loading="lazy"
                  src={currentPkg.imageUrl || currentPkg.image || "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80"}
                  alt={currentPkg.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 bg-primary-container text-white px-3 py-1 rounded text-[11px] font-bold uppercase tracking-wider">
                  {currentPkg.duration}
                </div>
              </div>
              <div className="p-6 sm:p-8 space-y-4">
                <div className="flex items-center gap-1.5 text-body-sm text-on-surface-variant font-semibold">
                  <span className="material-symbols-outlined text-secondary text-lg">location_on</span>
                  <span>{currentPkg.country || currentPkg.destination}</span>
                </div>
                <h1 className="text-3xl font-headline-lg text-headline-lg text-primary tracking-tight leading-tight">
                  {currentPkg.title}
                </h1>
                <p className="text-on-surface-variant text-body-md leading-relaxed whitespace-pre-line">
                  {currentPkg.description || "Enjoy a hassle-free, premium travel experience. This package includes flights, luxury 4-star hotels, daily breakfasts, visa assistance guidance, and professional local guides."}
                </p>
              </div>
            </div>

            {/* Highlights */}
            <div className="bg-surface-container-lowest p-6 sm:p-8 border border-outline-variant/10 rounded-2xl premium-shadow space-y-4">
              <h3 className="font-headline-md text-headline-md text-primary">Package Highlights</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(currentPkg.highlights || ["Premium Hotels", "Airport Transfers", "Daily Breakfast", "Sightseeing Guides"]).map((hl, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-body-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-secondary text-lg">check_circle</span>
                    <span>{hl}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Itinerary */}
            <div className="bg-surface-container-lowest p-6 sm:p-8 border border-outline-variant/10 rounded-2xl premium-shadow space-y-6">
              <h3 className="font-headline-md text-headline-md text-primary">Standard Itinerary</h3>
              <div className="space-y-6">
                {[
                  { day: "Day 1", title: "Arrival & Hotel Check-in", desc: "Welcome transfer to your premium hotel. Free evening to relax or explore." },
                  { day: "Day 2", title: "Guided City Sightseeing", desc: "Full-day private guided tour of key historical monuments and cultural spots." },
                  { day: "Day 3", title: "Leisure Exploration", desc: "Day at leisure. Shopping recommendations and tickets for evening cruises available." },
                  { day: "Day 4", title: "Departure", desc: "Breakfast at the hotel, check-out and private transfer back to the airport." }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4 pl-3 border-l-2 border-outline-variant/35 relative">
                    <div className="absolute -left-[9px] top-0.5 h-4 w-4 rounded-full bg-surface border-2 border-secondary"></div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-secondary uppercase tracking-widest block">{item.day}</span>
                      <h4 className="font-bold text-body-md text-primary">{item.title}</h4>
                      <p className="text-body-sm text-on-surface-variant leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar form (1/3) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-surface-container-lowest p-6 border border-outline-variant/10 rounded-2xl premium-shadow sticky top-24 space-y-6">
              <div>
                <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block font-semibold">Price starts at</span>
                <span className="text-3xl font-bold text-primary font-display">
                  {typeof currentPkg.price === "number" ? `${currentPkg.price} AED` : currentPkg.price}
                </span>
                <span className="text-body-sm text-on-surface-variant block mt-1">per traveler (double occupancy)</span>
              </div>

              <div className="border-t border-outline-variant/15 pt-4 space-y-3 text-body-sm text-on-surface-variant">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-lg">schedule</span> 
                  <span>Duration: {currentPkg.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-lg">shield</span> 
                  <span>Includes standard Schengen/country visa support</span>
                </div>
              </div>

              <form onSubmit={handleBookSubmit} className="space-y-4 border-t border-outline-variant/15 pt-6">
                <h4 className="text-body-sm font-headline-md font-semibold text-primary uppercase tracking-wider">Book / Enquire</h4>
                
                <div className="flex flex-col gap-1.5">
                  <input
                    type="text"
                    required
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant/15 text-on-surface text-body-sm rounded-lg focus:outline-none"
                  />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <input
                    type="tel"
                    required
                    placeholder="WhatsApp Phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant/15 text-on-surface text-body-sm rounded-lg focus:outline-none"
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full py-3 bg-secondary-container text-on-secondary-container font-bold text-body-sm rounded-xl hover:opacity-95 transition-opacity"
                >
                  Send Booking Request
                </button>
              </form>
            </div>
          </div>
        </div>

      </div>
      </div>
    </>
  );
};

export default PackageDetailPage;
