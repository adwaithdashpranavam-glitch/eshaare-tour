import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getPackages } from "../../lib/firestore";
import LoadingSpinner from "../../components/ui/LoadingSpinner";

export const PackagesPage = () => {
  const [searchVal, setSearchVal] = useState("");
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = getPackages(
      (items) => {
        setPackages(items);
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const filteredPkgs = packages.filter(pkg =>
    pkg.title.toLowerCase().includes(searchVal.toLowerCase()) ||
    (pkg.country || "").toLowerCase().includes(searchVal.toLowerCase()) ||
    (pkg.category || "").toLowerCase().includes(searchVal.toLowerCase())
  );

  return (
    <div className="bg-surface min-h-screen pb-24">
      {/* Page Hero Banner */}
      <section className="relative min-h-[570px] py-12 md:py-16 overflow-hidden bg-[#1D503A] flex items-center justify-center">
        {/* Background Image with elegant overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=2560&q=80"
            alt="Tour Packages Background"
            className="w-full h-full object-cover opacity-100"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-[#2B2723]/95"></div>
          {/* Decorative accent light blur - matching the warm gold brand tone */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#C5A880] opacity-15 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto px-margin-mobile md:px-margin-desktop w-full text-center space-y-5">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-white/10 border border-white/10 rounded-full backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C5A880] animate-pulse" />
            <span className="text-[10px] font-bold text-[#EAE3D5] uppercase tracking-wider font-mono">Bespoke Holiday Planning</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold font-display text-white tracking-tight leading-tight">
            Curated Tour Packages
          </h1>
          <p className="text-sm md:text-base lg:text-lg text-[#EAE3D5]/90 leading-relaxed max-w-xl mx-auto">
            Premium international holiday tour packages designed specifically for UAE residents, with inclusive transfers, boutique hotels, and expert guides.
          </p>
        </div>
      </section>

      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop mt-12 space-y-12">
        {/* Filter / Search Bar */}
        <div className="max-w-md mx-auto relative">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-xl">
            search
          </span>
          <input
            type="text"
            className="w-full pl-11 pr-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-lg text-on-surface placeholder-on-surface-variant/50 text-body-sm focus:outline-none"
            placeholder="Search by country or package name..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
          />
        </div>

        {/* Packages Grid */}
        {loading ? (
          <LoadingSpinner message="Loading packages..." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {filteredPkgs.map((pkg) => (
              <Link
                key={pkg.id}
                to={`/packages/${pkg.id}`}
                className="bg-surface-container-lowest overflow-hidden rounded-2xl border border-outline-variant/10 premium-shadow group flex flex-col cursor-pointer transition-all hover:scale-[1.01]"
              >
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={pkg.imageUrl || pkg.image || "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80"}
                    alt={pkg.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 bg-primary-container text-white px-3 py-1 rounded text-[11px] font-bold uppercase tracking-wider">
                    {pkg.duration}
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <span className="text-body-sm text-on-surface-variant flex items-center gap-1 font-semibold">
                      <span className="material-symbols-outlined text-secondary text-lg">location_on</span>
                      {pkg.country || pkg.destination}
                    </span>

                    <h3 className="font-headline-md text-headline-md text-primary group-hover:text-secondary transition-colors leading-snug">
                      {pkg.title}
                    </h3>

                    <div className="pt-2 flex flex-wrap gap-1.5">
                      {(pkg.highlights || ["Premium Hotels", "Airport Transfers", "Daily Breakfast", "Sightseeing Guides"]).slice(0, 3).map((hl, hIdx) => (
                        <span key={hIdx} className="text-[10px] font-semibold text-on-surface-variant bg-surface-container px-2 py-1 rounded border border-outline-variant/5">
                          {hl}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-outline-variant/15 mt-6 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block font-semibold">Price From</span>
                      <span className="text-lg font-bold text-primary font-display">
                        {typeof pkg.price === "number" ? `${pkg.price} AED` : pkg.price}
                      </span>
                    </div>
                    <span className="h-10 w-10 rounded-full bg-surface-container border border-outline-variant/10 flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-on-secondary transition-all">
                      <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && filteredPkgs.length === 0 && (
          <div className="text-center text-on-surface-variant italic py-12">
            No packages match your search criteria. Try another keyword.
          </div>
        )}
      </div>
    </div>
  );
};

export default PackagesPage;
