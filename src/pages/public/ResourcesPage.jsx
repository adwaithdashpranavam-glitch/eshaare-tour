import React from "react";
import toast from "react-hot-toast";

export const ResourcesPage = () => {
  const resources = [
    { title: "Schengen Visa Checklist", desc: "Detailed PDF document showing the standard checklist items for Schengen visas.", type: "PDF Document", size: "1.2 MB" },
    { title: "NOC Employer Template", desc: "A customizable MS Word document containing the standard embassy-approved NOC template.", type: "Word Document", size: "45 KB" },
    { title: "DS-160 Filling Guide", desc: "Complete walkthrough guide showing how to fill out the US visa application form DS-160.", type: "PDF Guide", size: "2.4 MB" },
    { title: "UK Sponsor Declaration", desc: "Standard template for family sponsorships and UK visitation invitation declarations.", type: "Word Template", size: "62 KB" }
  ];

  const handleDownload = (title) => {
    toast.success(`Started download for: ${title}`);
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen py-16 px-margin-mobile md:px-margin-desktop">
      <div className="max-w-container-max mx-auto space-y-12">
        <div className="text-center space-y-4 max-w-xl mx-auto">
          <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-primary">Documentation Resource Center</h1>
          <p className="text-on-surface-variant text-body-md">
            Download standard templates, guidelines, and checklist documentations to prepare your visa dossier.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {resources.map((res, idx) => (
            <div key={idx} className="bg-surface-container-lowest p-6 border border-outline-variant/10 rounded-2xl premium-shadow flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-secondary-container text-on-secondary-container border border-secondary flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">description</span>
                  </div>
                  <div>
                    <h4 className="font-headline-md text-body-lg font-bold text-primary leading-snug">{res.title}</h4>
                    <span className="text-[10px] text-on-surface-variant/60 font-mono uppercase tracking-wider">{res.type}</span>
                  </div>
                </div>
                <p className="text-body-sm text-on-surface-variant leading-relaxed">{res.desc}</p>
              </div>
              
              <div className="pt-6 border-t border-outline-variant/15 mt-6 flex items-center justify-between">
                <span className="text-body-sm text-on-surface-variant font-mono">Size: {res.size}</span>
                <button
                  onClick={() => handleDownload(res.title)}
                  className="px-4 py-2 bg-secondary-container text-on-secondary-container text-body-sm font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-lg">download</span>
                  <span>Download</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResourcesPage;
