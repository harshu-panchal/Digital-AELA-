const LoadingFallback = ({ message = "Loading..." }) => (
  <div className="min-h-screen bg-[#020409] text-white flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5D26A] mx-auto"></div>
      <p className="mt-4 text-gray-400">{message}</p>
    </div>
  </div>
);

export default LoadingFallback;

