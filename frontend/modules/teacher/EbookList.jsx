import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { HiOutlinePlus, HiOutlineEye, HiOutlinePencil } from "react-icons/hi2";
import SEO from "../../src/components/SEO";
import { useAuth } from "../../src/contexts/AuthContext";
import { getTeacherEbooks } from "../../src/services/teacherEbooks";

const EbookList = () => {
  const { user } = useAuth();
  const [ebooks, setEbooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, published, draft

  useEffect(() => {
    loadEbooks();
  }, [filter]);

  const loadEbooks = async () => {
    setIsLoading(true);
    try {
      const ebooksData = await getTeacherEbooks();
      let filtered = Array.isArray(ebooksData) ? ebooksData : [];
      
      if (filter === "published") {
        filtered = filtered.filter((e) => e.isPublic === true);
      } else if (filter === "draft") {
        filtered = filtered.filter((e) => e.isPublic === false);
      }
      
      setEbooks(filtered);
    } catch (error) {
      toast.error(error.message || "Failed to load ebooks");
      setEbooks([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-white">
      <SEO
        title="My Ebooks | Digital AELA"
        description="Manage your ebooks"
        keywords="teacher ebooks, ebook management"
        url="https://digitalaela.com/teacher/ebooks"
      />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white">My Ebooks</h1>
            <p className="text-sm text-gray-400 mt-1">Manage and organize your ebooks</p>
          </div>
          <Link
            to="/teacher/ebooks/upload"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F5D26A]/20 text-[#F5D26A] hover:bg-[#F5D26A]/30 transition">
            <HiOutlinePlus className="h-5 w-5" />
            Upload Ebook
          </Link>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg text-sm transition ${
              filter === "all"
                ? "bg-[#F5D26A]/20 text-[#F5D26A]"
                : "bg-white/5 text-gray-300 hover:bg-white/10"
            }`}>
            All
          </button>
          <button
            onClick={() => setFilter("published")}
            className={`px-4 py-2 rounded-lg text-sm transition ${
              filter === "published"
                ? "bg-[#F5D26A]/20 text-[#F5D26A]"
                : "bg-white/5 text-gray-300 hover:bg-white/10"
            }`}>
            Published
          </button>
          <button
            onClick={() => setFilter("draft")}
            className={`px-4 py-2 rounded-lg text-sm transition ${
              filter === "draft"
                ? "bg-[#F5D26A]/20 text-[#F5D26A]"
                : "bg-white/5 text-gray-300 hover:bg-white/10"
            }`}>
            Draft
          </button>
        </div>

        {/* Ebooks List */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Loading ebooks...</div>
        ) : ebooks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">No ebooks found</p>
            <Link
              to="/teacher/ebooks/upload"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F5D26A]/20 text-[#F5D26A] hover:bg-[#F5D26A]/30 transition">
              <HiOutlinePlus className="h-5 w-5" />
              Upload Your First Ebook
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {ebooks.map((ebook) => (
              <motion.div
                key={ebook._id || ebook.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-white/10 bg-[#060A17]/90 p-6 hover:border-[#F5D26A]/40 transition">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">{ebook.title}</h3>
                    <p className="text-sm text-gray-400 line-clamp-2">{ebook.description}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span
                      className={`px-2 py-1 rounded ${
                        ebook.isPublic
                          ? "bg-green-500/20 text-green-400"
                          : "bg-yellow-500/20 text-yellow-400"
                      }`}>
                      {ebook.isPublic ? "Published" : "Draft"}
                    </span>
                    <span className="text-gray-400">{ebook.pages || 0} pages</span>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                    <Link
                      to={`/teacher/ebooks/${ebook._id || ebook.id}`}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-sm">
                      <HiOutlineEye className="h-4 w-4" />
                      View
                    </Link>
                    <Link
                      to={`/teacher/ebooks/${ebook._id || ebook.id}`}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-sm">
                      <HiOutlinePencil className="h-4 w-4" />
                      Edit
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EbookList;

