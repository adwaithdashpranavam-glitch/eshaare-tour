import React from "react";
import { Inbox } from "lucide-react";

export const EmptyState = ({ 
  illustration, 
  title = "No Data Available", 
  subtitle = "We couldn't find any items matching your criteria.", 
  ctaText, 
  onCta 
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-on-primary-fixed-variant rounded-card bg-primary-container/10 max-w-md mx-auto my-8">
      <div className="p-4 rounded-full bg-primary-container/40 text-secondary/80 mb-4 border border-secondary/10">
        {illustration || <Inbox className="h-8 w-8" />}
      </div>
      <h3 className="text-lg font-display font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-on-primary-container/60 font-sans max-w-xs mb-6">{subtitle}</p>
      
      {ctaText && onCta && (
        <button
          onClick={onCta}
          className="px-5 py-2 bg-gradient-to-r from-secondary-container to-secondary-container hover:from-secondary-container hover:to-secondary-fixed text-on-primary-fixed font-semibold text-sm rounded-button transition-all duration-200 shadow-sm"
        >
          {ctaText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
