import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineXMark,
  HiOutlineAdjustmentsHorizontal,
  HiOutlineSparkles,
} from "react-icons/hi2";
import { searchJobs } from "../../../src/services/api/jobs";

const employmentTypes = [
  { value: "full-time", label: "Full Time" },
  { value: "part-time", label: "Part Time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
];

const JobSearchFilters = ({ isOpen, onClose, filters, onFiltersChange, onApplyFilters }) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [availableFilters, setAvailableFilters] = useState({
    locations: [],
    companies: [],
  });
  const [loadingFilters, setLoadingFilters] = useState(false);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        setLoadingFilters(true);
        const response = await searchJobs({ pageSize: 1 });
        if (response?.filters) {
          setAvailableFilters({
            locations: response.filters.locations || [],
            companies: response.filters.companies || [],
          });
        }
      } catch (error) {
        console.error("Failed to load filter options:", error);
      } finally {
        setLoadingFilters(false);
      }
    };

    if (isOpen) {
      loadFilterOptions();
    }
  }, [isOpen]);

  const handleFilterChange = (key, value) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleToggleArrayFilter = (key, value) => {
    setLocalFilters((prev) => {
      const current = prev[key] || [];
      const newValue = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return {
        ...prev,
        [key]: newValue,
      };
    });
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    onApplyFilters?.(localFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters = {
      location: "",
      employmentType: [],
      isRemote: undefined,
      experience: "",
      company: "",
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
    onApplyFilters?.(resetFilters);
  };

  const activeFiltersCount = Object.values(localFilters).filter((v) => {
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === "boolean") return v !== undefined;
    return v && v !== "";
  }).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[110] flex justify-end bg-black/60 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ x: 420 }}
            animate={{ x: 0 }}
            exit={{ x: 420 }}
            transition={{ type: "spring", stiffness: 220, damping: 32 }}
            className="flex h-full w-full max-w-md flex-col gap-6 border-l border-white/10 bg-[#050505]/95 p-6 shadow-[0_32px_120px_rgba(0,0,0,0.65)] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-gray-500">
                  Job Filters
                </p>
                <h3 className="text-xl font-semibold text-white">
                  Refine your search
                </h3>
                {activeFiltersCount > 0 && (
                  <p className="text-sm text-gray-400 mt-1">
                    {activeFiltersCount} filter{activeFiltersCount !== 1 ? "s" : ""} active
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-black/70 text-white transition hover:border-white/30"
              >
                <HiOutlineXMark className="h-6 w-6" />
              </button>
            </header>

            <div className="space-y-6">
              {/* Location Filter */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-300">Location</p>
                <input
                  type="text"
                  value={localFilters.location || ""}
                  onChange={(e) => handleFilterChange("location", e.target.value)}
                  placeholder="Enter location..."
                  className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-sm text-white placeholder-gray-500 focus:border-white/30 focus:outline-none"
                />
                {availableFilters.locations.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {availableFilters.locations.slice(0, 10).map((location) => (
                      <button
                        key={location}
                        type="button"
                        onClick={() => handleFilterChange("location", location)}
                        className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                          localFilters.location === location
                            ? "border-[#D4AF37] bg-[#D4AF37]/20 text-[#D4AF37]"
                            : "border-white/10 bg-white/5 text-gray-200 hover:border-white/30"
                        }`}
                      >
                        {location}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Employment Type Filter */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-300">Employment Type</p>
                <div className="flex flex-wrap gap-2">
                  {employmentTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => handleToggleArrayFilter("employmentType", type.value)}
                      className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                        (localFilters.employmentType || []).includes(type.value)
                          ? "border-[#D4AF37] bg-[#D4AF37]/20 text-[#D4AF37]"
                          : "border-white/10 bg-white/5 text-gray-200 hover:border-white/30"
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Remote Filter */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-300">Work Mode</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleFilterChange("isRemote", true)}
                    className={`flex-1 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                      localFilters.isRemote === true
                        ? "border-[#D4AF37] bg-[#D4AF37]/20 text-[#D4AF37]"
                        : "border-white/10 bg-white/5 text-gray-200 hover:border-white/30"
                    }`}
                  >
                    Remote
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFilterChange("isRemote", false)}
                    className={`flex-1 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                      localFilters.isRemote === false
                        ? "border-[#D4AF37] bg-[#D4AF37]/20 text-[#D4AF37]"
                        : "border-white/10 bg-white/5 text-gray-200 hover:border-white/30"
                    }`}
                  >
                    On-site
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFilterChange("isRemote", undefined)}
                    className={`flex-1 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                      localFilters.isRemote === undefined
                        ? "border-[#D4AF37] bg-[#D4AF37]/20 text-[#D4AF37]"
                        : "border-white/10 bg-white/5 text-gray-200 hover:border-white/30"
                    }`}
                  >
                    Any
                  </button>
                </div>
              </div>

              {/* Experience Filter */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-300">Experience Level</p>
                <input
                  type="text"
                  value={localFilters.experience || ""}
                  onChange={(e) => handleFilterChange("experience", e.target.value)}
                  placeholder="e.g., Entry, Mid-level, Senior..."
                  className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-sm text-white placeholder-gray-500 focus:border-white/30 focus:outline-none"
                />
              </div>

              {/* Company Filter */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-300">Company</p>
                <input
                  type="text"
                  value={localFilters.company || ""}
                  onChange={(e) => handleFilterChange("company", e.target.value)}
                  placeholder="Search by company name..."
                  className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-sm text-white placeholder-gray-500 focus:border-white/30 focus:outline-none"
                />
                {availableFilters.companies.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {availableFilters.companies.slice(0, 10).map((company) => (
                      <button
                        key={company}
                        type="button"
                        onClick={() => handleFilterChange("company", company)}
                        className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                          localFilters.company === company
                            ? "border-[#D4AF37] bg-[#D4AF37]/20 text-[#D4AF37]"
                            : "border-white/10 bg-white/5 text-gray-200 hover:border-white/30"
                        }`}
                      >
                        {company}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-auto space-y-3">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-sm font-semibold text-gray-300 transition hover:border-white/30 hover:text-white"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-[#D4AF37] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#F5D26A]"
                >
                  <HiOutlineSparkles className="h-5 w-5" />
                  Apply Filters
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default JobSearchFilters;

