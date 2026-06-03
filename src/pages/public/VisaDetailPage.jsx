import React from "react";
import { useParams, Link } from "react-router-dom";

export const VisaDetailPage = () => {
  const { slug } = useParams();

  // Requirements Data
  const requirementsData = [
    {
      title: "1. Passport & Residency Documents",
      content: "A passport valid for at least 6 months with two blank pages. A valid UAE residency visa (valid for at least 3 months from the date of return). Passport-sized photographs (white background, taken within 6 months)."
    },
    {
      title: "2. Proof of Employment & Financials",
      content: "NOC letter from your employer/sponsor showing salary, designation, and joining date. 3 to 6 months personal bank statement stamped by the bank showing sufficient funds."
    },
    {
      title: "3. Accommodation & Flight Details",
      content: "Confirmed round-trip flight booking showing flight numbers and dates. Hotel bookings matching your travel dates across the Schengen area."
    },
    {
      title: "4. Travel Medical Insurance",
      content: "A travel insurance policy covering medical expenses up to €30,000, valid for the entire duration of stay and all Schengen countries."
    }
  ];

  // FAQ Data
  const faqs = [
    {
      q: "How early can I apply for a Schengen Visa?",
      a: "You can apply up to 6 months before your intended travel date. We recommend applying at least 4-6 weeks before departure to secure biometrics slots."
    },
    {
      q: "Which embassy should I submit my Schengen application to?",
      a: "You must apply to the embassy of the country where you will spend the most nights. If spending equal nights in multiple countries, apply to the country of your first entry."
    },
    {
      q: "What happens if my visa gets rejected?",
      a: "Embassy fees are non-refundable. However, Eshaare Tours performs a 3-point compliance audit to minimize rejection risk. If rejected, you can appeal or reapply after addressing the rejection letter reasons."
    }
  ];

  return (
    <div className="bg-surface min-h-screen">
      
      {/* HERO GRADIENT (DARK) */}
      <section className="hero-gradient text-white py-24 px-margin-mobile md:px-margin-desktop relative">
        <div className="max-w-container-max mx-auto space-y-6 relative z-10">
          {/* Breadcrumbs */}
          <div className="text-body-sm text-white/70 flex items-center gap-1.5">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <Link to="/visa-services" className="hover:text-white transition-colors">Visa Services</Link>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-white font-medium">Schengen Visa</span>
          </div>

          <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-white max-w-xl leading-tight uppercase">
            Schengen Europe Visa Support
          </h1>
          
          <p className="text-white/80 text-body-lg max-w-2xl leading-relaxed">
            Apply for a Schengen visa to travel freely across 27 European member states. Our processing services ensure premium slot bookings, application audits, and custom itinerary drafts.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link
              to="/appointment"
              className="bg-secondary-container text-on-secondary-container px-8 py-4 rounded-xl font-bold hover:scale-105 transition-transform flex items-center justify-center gap-2"
            >
              <span>Start Application</span>
              <span className="material-symbols-outlined text-lg">edit_note</span>
            </Link>
            <a
              href="#requirements"
              className="border border-white/40 hover:border-white text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center transition-colors"
            >
              View Requirements
            </a>
          </div>
        </div>
      </section>

      {/* QUICK STATS BAR */}
      <section className="border-b border-outline-variant/15 bg-surface-container-lowest">
        <div className="max-w-container-max mx-auto grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-outline-variant/15 text-center">
          <div className="py-6 px-4">
            <div className="font-headline-md text-secondary font-bold text-2xl md:text-3xl">5 - 10 Days</div>
            <div className="text-body-sm text-on-surface-variant mt-1">Processing Time</div>
          </div>
          <div className="py-6 px-4">
            <div className="font-headline-md text-secondary font-bold text-2xl md:text-3xl">98.2%</div>
            <div className="text-body-sm text-on-surface-variant mt-1">Success Rate</div>
          </div>
          <div className="py-6 px-4">
            <div className="font-headline-md text-secondary font-bold text-2xl md:text-3xl">4 Core Docs</div>
            <div className="text-body-sm text-on-surface-variant mt-1">Required Documents</div>
          </div>
          <div className="py-6 px-4">
            <div className="font-headline-md text-secondary font-bold text-2xl md:text-3xl">Express Slots</div>
            <div className="text-body-sm text-on-surface-variant mt-1">Embassy Appointments</div>
          </div>
        </div>
      </section>

      {/* DETAILED CONTENT SECTION */}
      <section id="requirements" className="py-[120px] px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Side: Accordion, Timeline, Fees (8 cols) */}
        <div className="lg:col-span-8 space-y-12">
          
          {/* Overview Rich Text */}
          <div className="space-y-4">
            <h2 className="font-headline-lg text-headline-lg text-primary">Overview</h2>
            <p className="text-on-surface-variant text-body-md leading-relaxed">
              The Schengen Visa allows short-term stays in any of the 27 member states for up to 90 days within any 180-day period. Navigating biometrics slots and document compliance at VFS Global in Dubai or Abu Dhabi can be challenging. Eshaare Tours takes care of your entire application flow, ensuring you get compliant flight bookings, hotel vouchers, NOC evaluation check-sheets, and an early biometrics appointment.
            </p>
          </div>

          {/* Requirements Accordion */}
          <div className="space-y-4">
            <h3 className="font-headline-md text-headline-md text-primary">Required Documents Checklist</h3>
            <div className="border border-outline-variant/15 rounded-xl divide-y divide-outline-variant/15 bg-surface-container-lowest premium-shadow overflow-hidden">
              {requirementsData.map((item, idx) => (
                <details key={idx} className="group" open={idx === 0}>
                  <summary className="flex justify-between items-center p-5 cursor-pointer font-semibold text-body-md text-primary select-none hover:bg-surface transition-colors">
                    <span>{item.title}</span>
                    <span className="material-symbols-outlined transition-transform duration-300 group-open:rotate-180 text-secondary">
                      expand_more
                    </span>
                  </summary>
                  <div className="px-5 pb-5 text-body-sm text-on-surface-variant leading-relaxed animate-[fadeIn_0.2s_ease-out]">
                    {item.content}
                  </div>
                </details>
              ))}
            </div>
          </div>

          {/* Process Timeline */}
          <div className="space-y-6">
            <h3 className="font-headline-md text-headline-md text-primary">How Eshaare Processes Your Visa</h3>
            
            <div className="relative border-l border-outline-variant/35 pl-6 ml-4 space-y-8">
              <div className="relative">
                <span className="absolute -left-10 top-0.5 w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-body-sm border border-secondary">
                  1
                </span>
                <h4 className="font-bold text-body-md text-primary">Submit Details & NOC Checklist</h4>
                <p className="text-on-surface-variant text-body-sm mt-1">
                  Fill in your travel information on our site. We generate custom NOC templates matching your specific UAE employer.
                </p>
              </div>

              <div className="relative">
                <span className="absolute -left-10 top-0.5 w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-body-sm border border-secondary">
                  2
                </span>
                <h4 className="font-bold text-body-md text-primary">Compliance Audit Check</h4>
                <p className="text-on-surface-variant text-body-sm mt-1">
                  Our senior visa executives verify bank statement transactions, passport validity, photo dimensions, and itinerary matches.
                </p>
              </div>

              <div className="relative">
                <span className="absolute -left-10 top-0.5 w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-body-sm border border-secondary">
                  3
                </span>
                <h4 className="font-bold text-body-md text-primary">VFS Slot Booking & Submission</h4>
                <p className="text-on-surface-variant text-body-sm mt-1">
                  We secure and schedule an appointment slot at VFS Dubai/Abu Dhabi, compile your complete document dossier, and accompany you through submission.
                </p>
              </div>

              <div className="relative">
                <span className="absolute -left-10 top-0.5 w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-body-sm border border-secondary">
                  4
                </span>
                <h4 className="font-bold text-body-md text-primary">Visa Approved & Delivery</h4>
                <p className="text-on-surface-variant text-body-sm mt-1">
                  Track passport return in real-time inside our portal. Receive your passport back with your approved Schengen sticker.
                </p>
              </div>
            </div>
          </div>

          {/* Fee Table */}
          <div className="space-y-4">
            <h3 className="font-headline-md text-headline-md text-primary">Schengen Visa Fee Structure</h3>
            
            <div className="overflow-x-auto border border-outline-variant/15 rounded-xl premium-shadow bg-surface-container-lowest">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface border-b border-outline-variant/15 text-body-sm text-on-surface font-semibold">
                    <th className="p-4">Applicant Type</th>
                    <th className="p-4">Embassy Fee</th>
                    <th className="p-4">Service Fee</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="text-body-sm text-on-surface-variant divide-y divide-outline-variant/15">
                  <tr>
                    <td className="p-4 font-semibold text-primary">Adult (12+ years)</td>
                    <td className="p-4">320 AED (€80)</td>
                    <td className="p-4">280 AED</td>
                    <td className="p-4 text-right">
                      <Link to="/appointment" className="text-secondary font-bold hover:underline">
                        Apply Now
                      </Link>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-primary">Child (6 - 12 years)</td>
                    <td className="p-4">160 AED (€40)</td>
                    <td className="p-4">280 AED</td>
                    <td className="p-4 text-right">
                      <Link to="/appointment" className="text-secondary font-bold hover:underline">
                        Apply Now
                      </Link>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-primary">Infant (under 6 years)</td>
                    <td className="p-4">Free</td>
                    <td className="p-4">200 AED</td>
                    <td className="p-4 text-right">
                      <Link to="/appointment" className="text-secondary font-bold hover:underline">
                        Apply Now
                      </Link>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* FAQ Accordion */}
          <div className="space-y-4">
            <h3 className="font-headline-md text-headline-md text-primary">Frequently Asked Questions</h3>
            
            <div className="border border-outline-variant/15 rounded-xl divide-y divide-outline-variant/15 bg-surface-container-lowest premium-shadow overflow-hidden">
              {faqs.map((faq, idx) => (
                <details key={idx} className="group">
                  <summary className="flex justify-between items-center p-5 cursor-pointer font-semibold text-body-md text-primary select-none hover:bg-surface transition-colors">
                    <span>{faq.q}</span>
                    <span className="material-symbols-outlined transition-transform duration-300 group-open:rotate-180 text-secondary">
                      expand_more
                    </span>
                  </summary>
                  <div className="px-5 pb-5 text-body-sm text-on-surface-variant leading-relaxed animate-[fadeIn_0.2s_ease-out]">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </div>

        </div>

        {/* Right Side Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface-container-lowest p-6 rounded-xl premium-shadow border border-outline-variant/10 sticky top-24 space-y-6">
            <h3 className="font-headline-md text-headline-md text-primary border-b border-outline-variant/15 pb-2">Embassy Locations</h3>
            
            <div className="space-y-4 text-body-sm text-on-surface-variant">
              <div>
                <h4 className="font-bold text-primary">VFS Dubai (Wafi Mall)</h4>
                <p className="mt-0.5">3rd Floor, Falcon Phase 2, Wafi Mall, Business Bay Bypass, Dubai, UAE</p>
              </div>
              
              <div className="border-t border-outline-variant/15 pt-4">
                <h4 className="font-bold text-primary">VFS Abu Dhabi (The Mall WTC)</h4>
                <p className="mt-0.5">Level B2, The Mall, World Trade Center, Khalifa Bin Zayed Street, Abu Dhabi, UAE</p>
              </div>
            </div>

            <div className="border-t border-outline-variant/15 pt-6">
              <Link
                to="/appointment"
                className="bg-primary text-on-primary w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                <span>Book Biometrics Slot</span>
                <span className="material-symbols-outlined text-lg">calendar_today</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default VisaDetailPage;
