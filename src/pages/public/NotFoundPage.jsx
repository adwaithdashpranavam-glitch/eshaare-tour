import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

export const NotFoundPage = () => {
  return (
    <div className="bg-surface min-h-[70vh] flex items-center justify-center px-6 py-12 text-center">
      <Helmet>
        <title>Page Not Found | Eshaare Tours & Visas</title>
        <link rel="canonical" href="https://www.eshaareuae.com/" />
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <div className="max-w-md w-full space-y-6">
        <div className="flex justify-center">
          <span className="material-symbols-outlined text-8xl text-secondary animate-pulse">
            travel_explore
          </span>
        </div>
        
        <h1 className="text-4xl font-headline-lg text-[#1D503A] tracking-tight font-extrabold">
          404 - Destination Lost
        </h1>
        
        <p className="text-on-surface-variant text-body-md leading-relaxed">
          The travel route you requested doesn't exist or has been moved. Let's redirect you back to safety.
        </p>

        <div className="pt-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#1D503A] hover:bg-[#143d2c] text-white font-bold rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">home</span>
            <span>Return to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
