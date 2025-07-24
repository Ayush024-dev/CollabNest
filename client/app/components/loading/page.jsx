import React from "react";

const LoadingPage = ({ message = "Loading..." }) => (
  <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 bg-opacity-90 backdrop-blur-sm">
    <div className="flex flex-col items-center gap-6">
      {/* Brand/Logo Spinner */}
      <div className="relative flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 border-opacity-60"></div>
        <span className="absolute text-3xl font-bold text-blue-600 select-none">CN</span>
      </div>
      <div className="text-lg sm:text-xl font-semibold text-slate-700 animate-pulse">{message}</div>
    </div>
  </div>
);

export default LoadingPage;
