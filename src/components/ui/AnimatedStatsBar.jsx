import React, { useState, useEffect } from "react";

export const AnimatedStatsBar = () => {
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

  return (
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
  );
};
