import { useState, useEffect } from "react";

const LoadingFallback = ({ message = "Loading...", timeout = 15000 }) => {
  const [isTimedOut, setIsTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTimedOut(true);
    }, timeout);

    return () => clearTimeout(timer);
  }, [timeout]);

  if (isTimedOut) {
    return (
      <div className="min-h-screen bg-[#020409] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="text-red-400 text-5xl mb-6">⚠️</div>
          <h2 className="text-2xl font-bold mb-4">Loading is taking longer than expected</h2>
          <p className="text-gray-400 mb-8">
            This might be due to a slow connection or a temporary issue.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 px-6 bg-[#F5D26A] text-black font-bold rounded-lg hover:bg-[#e5c25a] transition-colors"
            >
              Reload Page
            </button>
            <button
              onClick={() => (window.location.href = "/")}
              className="w-full py-3 px-6 bg-transparent border border-gray-700 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020409] text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5D26A] mx-auto"></div>
        <p className="mt-4 text-gray-400">{message}</p>
      </div>
    </div>
  );
};

export default LoadingFallback;

