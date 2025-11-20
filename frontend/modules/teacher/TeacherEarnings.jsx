import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  HiOutlineCurrencyDollar,
  HiOutlineCalendar,
  HiOutlineChartBar,
  HiOutlineDocumentText,
} from "react-icons/hi2";
import SEO from "../../src/components/SEO";
import { useAuth } from "../../src/contexts/AuthContext";
import { getTeacherEarnings } from "../../src/services/api/payments";
import { getTeacherCourses } from "../../src/services/teacherCourses";

const TeacherEarnings = () => {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    courseId: "",
  });
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    loadCourses();
    loadEarnings();
  }, [filters.startDate, filters.endDate, filters.courseId]);

  const loadCourses = async () => {
    try {
      const coursesData = await getTeacherCourses();
      setCourses(Array.isArray(coursesData) ? coursesData : []);
    } catch (error) {
      console.error("Failed to load courses:", error);
    }
  };

  const loadEarnings = async () => {
    setIsLoading(true);
    try {
      const response = await getTeacherEarnings({
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        courseId: filters.courseId || undefined,
      });
      setEarnings(response.earnings || []);
      setSummary(response.summary || null);
    } catch (error) {
      toast.error(error.message || "Failed to load earnings");
      setEarnings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-[#03040B] text-white">
      <SEO title="Earnings | Digital AELA" description="View your course earnings" />

      <div className="layout-container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">Earnings</h1>
          <p className="text-slate-400">Track your course revenue and earnings</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-6">
            <div className="flex items-center gap-3 mb-2">
              <HiOutlineCurrencyDollar className="h-6 w-6 text-[#F5D26A]" />
              <p className="text-sm text-slate-400">Total Earnings</p>
            </div>
            <p className="text-3xl font-semibold text-white">
              {summary?.currency || "AED"}{" "}
              {summary?.totalEarnings?.toFixed(2) || "0.00"}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-6">
            <div className="flex items-center gap-3 mb-2">
              <HiOutlineChartBar className="h-6 w-6 text-emerald-400" />
              <p className="text-sm text-slate-400">Total Payments</p>
            </div>
            <p className="text-3xl font-semibold text-white">{summary?.totalPayments || 0}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-6">
            <div className="flex items-center gap-3 mb-2">
              <HiOutlineDocumentText className="h-6 w-6 text-sky-400" />
              <p className="text-sm text-slate-400">Active Courses</p>
            </div>
            <p className="text-3xl font-semibold text-white">{earnings.length}</p>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2 text-white focus:border-sky-400/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2 text-white focus:border-sky-400/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Course</label>
            <select
              value={filters.courseId}
              onChange={(e) => setFilters({ ...filters, courseId: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2 text-white focus:border-sky-400/50 focus:outline-none">
              <option value="">All Courses</option>
              {courses.map((course) => (
                <option key={course._id || course.id} value={course._id || course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-slate-400">Loading earnings...</p>
          </div>
        ) : earnings.length === 0 ? (
          <div className="text-center py-12 rounded-3xl border border-white/10 bg-[#060A17]/90">
            <p className="text-slate-400">No earnings data found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {earnings.map((earning) => (
              <motion.div
                key={earning.courseId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {earning.courseTitle}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
                      <div>
                        <span className="text-slate-500">Payments: </span>
                        <span className="text-white font-semibold">{earning.paymentCount}</span>
                      </div>
                    </div>
                  </div>
                  <div className="ml-6 text-right">
                    <p className="text-2xl font-semibold text-[#F5D26A]">
                      AED {earning.totalEarnings.toFixed(2)}
                    </p>
                    <p className="text-sm text-slate-400 mt-1">Total Revenue</p>
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

export default TeacherEarnings;

