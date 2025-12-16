import React, { lazy, Suspense, useState, useEffect } from "react";

// Lazy load Chart.js components to reduce initial bundle size
const ChartComponents = {
  Line: lazy(() =>
    import("react-chartjs-2").then((module) => ({
      default: module.Line,
    }))
  ),
  Bar: lazy(() =>
    import("react-chartjs-2").then((module) => ({
      default: module.Bar,
    }))
  ),
  Pie: lazy(() =>
    import("react-chartjs-2").then((module) => ({
      default: module.Pie,
    }))
  ),
  Doughnut: lazy(() =>
    import("react-chartjs-2").then((module) => ({
      default: module.Doughnut,
    }))
  ),
};

// Chart.js registration - only load when needed
let chartRegistered = false;
const registerChart = async () => {
  if (chartRegistered) return;
  
  const ChartJS = (await import("chart.js")).Chart;
  const {
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
  } = await import("chart.js");

  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
  );
  
  chartRegistered = true;
};

const ChartLoadingFallback = () => (
  <div className="flex items-center justify-center h-64 w-full">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F5D26A]"></div>
  </div>
);

export const LazyLine = (props) => {
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    registerChart().then(() => setIsRegistered(true));
  }, []);

  if (!isRegistered) {
    return <ChartLoadingFallback />;
  }

  return (
    <Suspense fallback={<ChartLoadingFallback />}>
      <ChartComponents.Line {...props} />
    </Suspense>
  );
};

export const LazyBar = (props) => {
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    registerChart().then(() => setIsRegistered(true));
  }, []);

  if (!isRegistered) {
    return <ChartLoadingFallback />;
  }

  return (
    <Suspense fallback={<ChartLoadingFallback />}>
      <ChartComponents.Bar {...props} />
    </Suspense>
  );
};

export const LazyPie = (props) => {
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    registerChart().then(() => setIsRegistered(true));
  }, []);

  if (!isRegistered) {
    return <ChartLoadingFallback />;
  }

  return (
    <Suspense fallback={<ChartLoadingFallback />}>
      <ChartComponents.Pie {...props} />
    </Suspense>
  );
};

export const LazyDoughnut = (props) => {
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    registerChart().then(() => setIsRegistered(true));
  }, []);

  if (!isRegistered) {
    return <ChartLoadingFallback />;
  }

  return (
    <Suspense fallback={<ChartLoadingFallback />}>
      <ChartComponents.Doughnut {...props} />
    </Suspense>
  );
};

