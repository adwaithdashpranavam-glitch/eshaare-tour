import React, { useState } from "react";
import { Link } from "react-router-dom";
import { MOCK_PACKAGES } from "../../utils/constants";

export const PackagesPage = () => {
  const [searchVal, setSearchVal] = useState("");

  const filteredPkgs = MOCK_PACKAGES.filter(pkg => 
    pkg.title.toLowerCase().includes(searchVal.toLowerCase()) ||
    pkg.destination.toLowerCase().includes(searchVal.toLowerCase())
  );

  return (
    <div className="bg-surface min-h-screen py-16 px-margin-mobile md:px-margin-desktop">
      <div className="max-w-container-max mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4 max-w-xl mx-auto">
          <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-primary">Curated Tour Packages</h1>
          <p className="text-on-surface-variant text-body-md">
            Premium international holiday tour packages designed specifically for UAE residents, with inclusive transfers & hotels.
          </p>
        </div>

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {filteredPkgs.map((pkg, idx) => (
            <Link 
              key={idx}
              to={`/packages/${pkg.slug}`}
              className="bg-surface-container-lowest overflow-hidden rounded-2xl border border-outline-variant/10 premium-shadow group flex flex-col cursor-pointer transition-all hover:scale-[1.01]"
            >
              <div className="relative h-56 overflow-hidden">
                <img
                  src={pkg.image}
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
                    {pkg.destination}
                  </span>
                  
                  <h3 className="font-headline-md text-headline-md text-primary group-hover:text-secondary transition-colors leading-snug">
                    {pkg.title}
                  </h3>
                  
                  <div className="pt-2 flex flex-wrap gap-1.5">
                    {pkg.highlights.slice(0, 3).map((hl, hIdx) => (
                      <span key={hIdx} className="text-[10px] font-semibold text-on-surface-variant bg-surface-container px-2 py-1 rounded border border-outline-variant/5">
                        {hl}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="pt-6 border-t border-outline-variant/15 mt-6 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block font-semibold">Price From</span>
                    <span className="text-lg font-bold text-primary font-display">{pkg.price} AED</span>
                  </div>
                  <span className="h-10 w-10 rounded-full bg-surface-container border border-outline-variant/10 flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-on-secondary transition-all">
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredPkgs.length === 0 && (
          <div className="text-center text-on-surface-variant italic py-12">
            No packages match your search criteria. Try another keyword.
          </div>
        )}
      </div>
    </div>
  );
};

export default PackagesPage;
