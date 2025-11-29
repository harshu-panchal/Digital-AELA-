import { useState } from "react";
import { HiOutlineMagnifyingGlass, HiOutlineXMark } from "react-icons/hi2";
import TranslatedText from "../../../src/components/TranslatedText";

const JobSearchBar = ({ onSearch, initialQuery = "" }) => {
  const [query, setQuery] = useState(initialQuery);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleClear = () => {
    setQuery("");
    onSearch("");
  };

  return (
    <form onSubmit={handleSubmit} className="relative flex-1">
      <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search jobs by title, company, location, or skills..." // Placeholder
        className="w-full rounded-2xl border border-white/10 bg-black/60 py-3 pl-12 pr-12 text-sm text-gray-100 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/10"
      />
      {query && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
        >
          <HiOutlineXMark className="h-5 w-5" />
        </button>
      )}
    </form>
  );
};

export default JobSearchBar;

