import React from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

export const AboutPage = () => {
  return (
    <>
      <Helmet>
        <title>About Us | Eshaare Tours Dubai</title>
        <meta name="description" content="Learn about Eshaare Tours Dubai. We simplify global travel and visa processing for UAE residents with premium, transparent, and accurate assistance." />
      </Helmet>
      <div className="bg-surface min-h-screen py-16 px-margin-mobile md:px-margin-desktop">
      <div className="max-w-container-max mx-auto space-y-16">
        
        {/* Main Header */}
        <div className="text-center space-y-4 max-w-xl mx-auto">
          <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-primary">About Eshaare Tours</h1>
          <p className="text-on-surface-variant text-body-md leading-relaxed">
            Our mission is to simplify global travel and visa processing for UAE residents by delivering premium, transparent, and accurate assistance.
          </p>
        </div>

        {/* Narrative Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="font-headline-md text-headline-md text-primary">Our Story</h2>
            <p className="text-on-surface-variant text-body-md leading-relaxed">
              Founded in Dubai, Eshaare Tours was created to address the complexity and lack of transparency in visa applications for expatriates. Over the years, we have built strong relationships with travel associations, consulates, and flight providers to deliver top-tier travel experiences.
            </p>
            <p className="text-on-surface-variant text-body-md leading-relaxed">
              Whether you are planning a holiday trip with your family to Schengen, or traveling on short notice for a crucial business conference in London, our team of dedicated immigration executives manages the details for you.
            </p>
          </div>
          <div className="bg-surface-container-lowest p-12 flex items-center justify-center border border-outline-variant/10 rounded-2xl premium-shadow">
            <span className="material-symbols-outlined text-secondary text-9xl animate-[spin_60s_linear_infinite]">
              explore
            </span>
          </div>
        </div>

        {/* Values Pillars */}
        <div className="space-y-8">
          <h2 className="font-headline-md text-headline-md text-primary text-center">Our Core Pillars</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="bg-surface-container-lowest p-8 border border-outline-variant/10 rounded-2xl text-center space-y-4 premium-shadow">
              <div className="mx-auto h-12 w-12 bg-secondary-container text-on-secondary-container rounded-full flex items-center justify-center border border-secondary">
                <span className="material-symbols-outlined text-2xl">verified_user</span>
              </div>
              <h3 className="font-headline-md text-body-lg font-bold text-primary">Uncompromised Accuracy</h3>
              <p className="text-on-surface-variant text-body-sm leading-relaxed">
                Every application undergoes a rigorous 3-point audit check before submission to guarantee visa approvals.
              </p>
            </div>
            <div className="bg-surface-container-lowest p-8 border border-outline-variant/10 rounded-2xl text-center space-y-4 premium-shadow">
              <div className="mx-auto h-12 w-12 bg-secondary-container text-on-secondary-container rounded-full flex items-center justify-center border border-secondary">
                <span className="material-symbols-outlined text-2xl">workspace_premium</span>
              </div>
              <h3 className="font-headline-md text-body-lg font-bold text-primary">Elite Service</h3>
              <p className="text-on-surface-variant text-body-sm leading-relaxed">
                From premium VFS appointments to luxury transfers, we handle your trip details with boutique care.
              </p>
            </div>
            <div className="bg-surface-container-lowest p-8 border border-outline-variant/10 rounded-2xl text-center space-y-4 premium-shadow">
              <div className="mx-auto h-12 w-12 bg-secondary-container text-on-secondary-container rounded-full flex items-center justify-center border border-secondary">
                <span className="material-symbols-outlined text-2xl">support_agent</span>
              </div>
              <h3 className="font-headline-md text-body-lg font-bold text-primary">Client-First Care</h3>
              <p className="text-on-surface-variant text-body-sm leading-relaxed">
                Our secure client portal keeps you updated on your passport's status in real-time.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
    </>
  );
};

export default AboutPage;
