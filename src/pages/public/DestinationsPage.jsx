import React from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

export const DestinationsPage = () => {
  const destinations = [
    { name: "France", region: "Europe", visas: "Schengen Visa required", image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=500&q=80&fm=webp" },
    { name: "Italy", region: "Europe", visas: "Schengen Visa required", image: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=500&q=80&fm=webp" },
    { name: "United Kingdom", region: "Europe", visas: "UK Standard Visitor Visa", image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=500&q=80&fm=webp" },
    { name: "Japan", region: "Asia", visas: "Japan Short-stay Visa", image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=500&q=80&fm=webp" },
    { name: "Switzerland", region: "Europe", visas: "Schengen Visa required", image: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=500&q=80&fm=webp" },
    { name: "United States", region: "Americas", visas: "US B1/B2 Visa", image: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=500&q=80&fm=webp" }
  ];

  return (
    <>
      <Helmet>
        <title>Visa Destinations | Eshaare Tours Dubai</title>
        <meta name="description" content="Explore popular visa destinations including Schengen, UK, USA, Japan, and more. Let Eshaare Tours simplify your global travel requirements." />
      </Helmet>
      <div className="bg-surface min-h-screen py-16 px-margin-mobile md:px-margin-desktop">
      <div className="max-w-container-max mx-auto space-y-12">
        <div className="text-center space-y-4 max-w-xl mx-auto">
          <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-primary">Explore Destinations</h1>
          <p className="text-on-surface-variant text-body-md">
            Plan your next journey with our detailed requirements checking and visa guide maps.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {destinations.map((dest, idx) => (
            <div key={idx} className="bg-surface-container-lowest overflow-hidden rounded-2xl premium-shadow border border-outline-variant/10 group relative h-72 flex flex-col justify-end">
              <img decoding="async" loading="lazy"
                src={dest.image}
                alt={dest.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent"></div>
              
              <div className="p-6 relative z-10 space-y-2 text-white">
                <span className="text-[11px] font-bold text-secondary-container uppercase tracking-widest flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">location_on</span>
                  {dest.region}
                </span>
                <h3 className="font-headline-md text-headline-md text-white leading-tight">{dest.name}</h3>
                <p className="text-white/80 text-body-sm">{dest.visas}</p>
                
                <div className="pt-4 flex space-x-3 text-body-sm font-semibold">
                  <Link
                    to={`/visa-services/${dest.name.toLowerCase().includes("kingdom") ? "uk" : dest.name.toLowerCase().includes("united states") ? "usa" : "schengen"}`}
                    className="text-secondary-container hover:text-secondary-fixed underline transition-colors"
                  >
                    Visa Guide
                  </Link>
                  <span className="text-white/30">|</span>
                  <Link
                    to="/packages"
                    className="text-white hover:text-secondary-container transition-colors"
                  >
                    View Packages
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>
    </>
  );
};

export default DestinationsPage;
