import React from "react";
import { Compass } from "lucide-react";

export const LoadingSpinner = ({ message = "Loading...", fullScreen = false }) => {
  const spinnerContent = (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="relative flex h-16 w-16 items-center justify-center">
        {/* Glow/Ping effect */}
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#EDB868] opacity-20" />
        {/* Middle stationary circle */}
        <span className="absolute h-10 w-10 rounded-full border-2 border-[#EDB868]/30" />
        {/* Spinning indicator */}
        <span
          className="h-16 w-16 rounded-full border-2 border-t-[#EAC784] border-r-transparent border-b-transparent border-l-transparent animate-spin"
          style={{ animationDuration: "1.1s" }}
        />
        {/* Central compass icon */}
        <Compass className="absolute h-5 w-5 text-[#EAC784]" />
      </div>
      {message && (
        <span className="mt-5 text-sm text-[#EAC784] font-sans font-semibold tracking-[0.2em] uppercase text-center animate-pulse">
          {message}
        </span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#2C2712] font-sans">
        {spinnerContent}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center w-full min-h-[200px] font-sans">
      {spinnerContent}
    </div>
  );
};

export default LoadingSpinner;

