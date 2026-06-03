import React from "react";

export const LoadingSpinner = ({ message = "Loading..." }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 w-full min-h-[200px]">
      <div className="relative flex items-center justify-center">
        {/* Spinner outer */}
        <div className="h-12 w-12 rounded-full border-4 border-secondary/20 border-t-secondary animate-spin"></div>
        {/* Spinner inner glow */}
        <div className="absolute h-12 w-12 rounded-full bg-secondary-container/5 blur-md"></div>
      </div>
      {message && (
        <span className="mt-4 text-sm text-on-primary-container/60 font-sans tracking-wide animate-pulse">
          {message}
        </span>
      )}
    </div>
  );
};

export default LoadingSpinner;
