import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  FaBook,
  FaGraduationCap,
  FaEye,
  FaEyeSlash,
  FaTrash,
  FaSearch,
  FaFilter,
  FaEdit,
} from "react-icons/fa";
import { apiRequest } from "../../../src/services/api/baseClient";
import { useAuth } from "../../../src/contexts/AuthContext";
import { formatCurrency } from "../../../src/utils/currencyUtils";

const ContentManagement = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalBooks: 0,
    booksByAdmin: 0,
    totalCourses: 0,
    coursesByAdmin: 0,
  });
  const [courses, setCourses] = useState([]);
  const [allCourses, setAllCourses] = useState([]); // Store all courses before filtering
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("courses"); // "courses" or "books"
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all", "published", "archived"
  const [visibilityFilter, setVisibilityFilter] = useState("all"); // "all", "visible", "hidden"
  const [courseTypeFilter, setCourseTypeFilter] = useState("all"); // "all", "my-courses", "teacher-courses"

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await apiRequest("/admin/content/stats", {
        method: "GET",
      });
      setStats(response.stats || {});
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  // Fetch courses
  const fetchCourses = async () => {
    try {
      const params = new URLSearchParams({
        page: "1",
        pageSize: "50",
      });
      if (searchQuery) params.append("search", searchQuery);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const response = await apiRequest(`/admin/content/courses?${params}`, {
        method: "GET",
      });
      const allCoursesData = response.courses || [];
      setAllCourses(allCoursesData);

      // Filter courses based on courseTypeFilter
      let filtered = allCoursesData;
      if (courseTypeFilter === "my-courses" && user?.id) {
        // Show only courses created by current admin
        filtered = allCoursesData.filter((course) => {
          const instructorId = course.instructor?._id || course.instructor?.id;
          const instructorIdStr = instructorId?.toString();
          const userIdStr = user.id?.toString();
          // Match by ID (handles both ObjectId and string formats)
          return instructorIdStr === userIdStr || instructorId === user.id;
        });
      } else if (courseTypeFilter === "teacher-courses") {
        // Show only courses created by teachers
        filtered = allCoursesData.filter(
          (course) => course.instructor?.role === "teacher"
        );
      }
      // If "all", show all courses
      setCourses(filtered);
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast.error("Failed to load courses");
    }
  };

  // Fetch books
  const fetchBooks = async () => {
    try {
      const params = new URLSearchParams({
        page: "1",
        pageSize: "50",
      });
      if (searchQuery) params.append("search", searchQuery);
      if (visibilityFilter !== "all") {
        params.append(
          "isPublic",
          visibilityFilter === "visible" ? "true" : "false"
        );
      }

      const response = await apiRequest(`/admin/content/books?${params}`, {
        method: "GET",
      });
      setBooks(response.books || []);
    } catch (error) {
      console.error("Error fetching books:", error);
      toast.error("Failed to load books");
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchCourses(), fetchBooks()]);
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (activeTab === "courses") {
        await fetchCourses();
      } else {
        await fetchBooks();
      }
    };
    loadData();
  }, [
    activeTab,
    searchQuery,
    statusFilter,
    visibilityFilter,
    courseTypeFilter,
    user,
  ]);

  // Delete course
  const handleDeleteCourse = async (courseId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this course? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await apiRequest(`/admin/content/courses/${courseId}`, {
        method: "DELETE",
      });
      toast.success("Course deleted successfully");
      fetchCourses();
      fetchStats();
    } catch (error) {
      toast.error("Failed to delete course");
    }
  };

  // Delete book
  const handleDeleteBook = async (bookId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this book? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await apiRequest(`/admin/content/books/${bookId}`, {
        method: "DELETE",
      });
      toast.success("Book deleted successfully");
      fetchBooks();
      fetchStats();
    } catch (error) {
      toast.error("Failed to delete book");
    }
  };

  // Toggle course visibility
  const handleToggleCourseVisibility = async (courseId, currentStatus) => {
    const isVisible = currentStatus === "published";
    const newVisibility = !isVisible;

    try {
      await apiRequest(`/admin/content/courses/${courseId}/visibility`, {
        method: "PATCH",
        body: { isVisible: newVisibility },
      });
      toast.success(
        `Course ${newVisibility ? "shown" : "hidden"} successfully`
      );
      fetchCourses();
    } catch (error) {
      toast.error("Failed to update course visibility");
    }
  };

  // Toggle book visibility
  const handleToggleBookVisibility = async (bookId, currentVisibility) => {
    const newVisibility = !currentVisibility;

    try {
      await apiRequest(`/admin/content/books/${bookId}/visibility`, {
        method: "PATCH",
        body: { isVisible: newVisibility },
      });
      toast.success(`Book ${newVisibility ? "shown" : "hidden"} successfully`);
      fetchBooks();
    } catch (error) {
      toast.error("Failed to update book visibility");
    }
  };

  const statCards = [
    {
      label: "Total Books",
      value: stats.totalBooks,
      icon: FaBook,
      color: "from-blue-500 to-blue-600",
    },
    {
      label: "Books by Admin",
      value: stats.booksByAdmin,
      icon: FaBook,
      color: "from-purple-500 to-purple-600",
    },
    {
      label: "Total Courses",
      value: stats.totalCourses,
      icon: FaGraduationCap,
      color: "from-green-500 to-green-600",
    },
    {
      label: "Courses by Admin",
      value: stats.coursesByAdmin,
      icon: FaGraduationCap,
      color: "from-orange-500 to-orange-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Content Management</h1>
          <p className="text-gray-400 mt-2">
            Manage courses and books on the website
          </p>
        </div>
      </div>

      {/* Statistics Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-gradient-to-br ${stat.color} rounded-xl p-6 shadow-lg`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium">
                  {stat.label}
                </p>
                <p className="text-white text-3xl font-bold mt-2">
                  {stat.value}
                </p>
              </div>
              <stat.icon className="text-white/20 text-4xl" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs and Filters */}
      <div className="bg-[#0B0F1E]/95 backdrop-blur-xl rounded-xl border border-white/10 p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Tabs */}
          <div className="flex gap-2 border-b border-white/10 pb-4 md:pb-0 md:border-b-0">
            <button
              onClick={() => setActiveTab("courses")}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                activeTab === "courses"
                  ? "bg-[#F5D26A]/20 text-[#F5D26A]"
                  : "text-gray-400 hover:text-white"
              }`}>
              Courses (
              {courseTypeFilter === "all" ? allCourses.length : courses.length})
            </button>
            <button
              onClick={() => setActiveTab("books")}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                activeTab === "books"
                  ? "bg-[#F5D26A]/20 text-[#F5D26A]"
                  : "text-gray-400 hover:text-white"
              }`}>
              Books ({books.length})
            </button>
          </div>

          {/* Search */}
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#F5D26A]/50"
            />
          </div>

          {/* Filters */}
          {activeTab === "courses" ? (
            <div className="flex gap-2">
              <select
                value={courseTypeFilter}
                onChange={(e) => setCourseTypeFilter(e.target.value)}
                className="px-4 py-2 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#F5D26A]/50"
                style={{ backgroundColor: "#000000" }}>
                <option value="all" style={{ backgroundColor: "#000000" }}>
                  All Courses
                </option>
                <option
                  value="my-courses"
                  style={{ backgroundColor: "#000000" }}>
                  My Courses (Editable)
                </option>
                <option
                  value="teacher-courses"
                  style={{ backgroundColor: "#000000" }}>
                  Teacher Courses
                </option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#F5D26A]/50"
                style={{ backgroundColor: "#000000" }}>
                <option value="all" style={{ backgroundColor: "#000000" }}>
                  All Status
                </option>
                <option
                  value="published"
                  style={{ backgroundColor: "#000000" }}>
                  Published
                </option>
                <option value="archived" style={{ backgroundColor: "#000000" }}>
                  Archived
                </option>
              </select>
            </div>
          ) : (
            <select
              value={visibilityFilter}
              onChange={(e) => setVisibilityFilter(e.target.value)}
              className="px-4 py-2 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#F5D26A]/50"
              style={{ backgroundColor: "#000000" }}>
              <option value="all" style={{ backgroundColor: "#000000" }}>
                All Visibility
              </option>
              <option value="visible" style={{ backgroundColor: "#000000" }}>
                Visible
              </option>
              <option value="hidden" style={{ backgroundColor: "#000000" }}>
                Hidden
              </option>
            </select>
          )}
        </div>

        {/* Content List */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#F5D26A]/30 border-t-[#F5D26A]" />
          </div>
        ) : activeTab === "courses" ? (
          <div className="space-y-4">
            {courses.length === 0 ? (
              <p className="text-center text-gray-400 py-10">
                No courses found
              </p>
            ) : (
              courses.map((course) => (
                <motion.div
                  key={course._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-white font-semibold">
                        {course.title}
                      </h3>
                      <p className="text-gray-400 text-sm mt-1">
                        By: {course.instructor?.fullName || "Unknown"} (
                        {course.instructor?.role || "N/A"})
                      </p>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            course.status === "published"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-gray-500/20 text-gray-400"
                          }`}>
                          {course.status}
                        </span>
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-500/20 text-blue-400">
                          {formatCurrency(course.price || 0)}
                        </span>
                        {/* Show editable badge for admin's own courses */}
                        {(() => {
                          const instructorId =
                            course.instructor?._id || course.instructor?.id;
                          const instructorIdStr = instructorId?.toString();
                          const userIdStr = user?.id?.toString();
                          const isMyCourse =
                            instructorIdStr === userIdStr ||
                            instructorId === user?.id;
                          return isMyCourse ? (
                            <span className="px-2 py-1 rounded text-xs font-semibold bg-[#F5D26A]/20 text-[#F5D26A]">
                              Editable
                            </span>
                          ) : null;
                        })()}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {/* Show Edit button only for courses created by current admin */}
                      {(() => {
                        const instructorId =
                          course.instructor?._id || course.instructor?.id;
                        const instructorIdStr = instructorId?.toString();
                        const userIdStr = user?.id?.toString();
                        const isMyCourse =
                          instructorIdStr === userIdStr ||
                          instructorId === user?.id;
                        return isMyCourse ? (
                          <Link
                            to={`/super-admin/courses/${course._id}`}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition"
                            title="Edit Course">
                            <FaEdit className="text-[#F5D26A]" />
                          </Link>
                        ) : null;
                      })()}
                      <button
                        onClick={() =>
                          handleToggleCourseVisibility(
                            course._id,
                            course.status
                          )
                        }
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition"
                        title={course.status === "published" ? "Hide" : "Show"}>
                        {course.status === "published" ? (
                          <FaEye className="text-green-400" />
                        ) : (
                          <FaEyeSlash className="text-gray-400" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteCourse(course._id)}
                        className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition">
                        <FaTrash className="text-red-400" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {books.length === 0 ? (
              <p className="text-center text-gray-400 py-10">No books found</p>
            ) : (
              books.map((book) => (
                <motion.div
                  key={book._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-white font-semibold">{book.title}</h3>
                      <p className="text-gray-400 text-sm mt-1">
                        Author: {book.metadata?.author || "Digital AELA"} |
                        Pages: {book.pages || 0}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            book.isPublic
                              ? "bg-green-500/20 text-green-400"
                              : "bg-gray-500/20 text-gray-400"
                          }`}>
                          {book.isPublic ? "Visible" : "Hidden"}
                        </span>
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-500/20 text-blue-400">
                          {formatCurrency(book.metadata?.price || 0)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() =>
                          handleToggleBookVisibility(book._id, book.isPublic)
                        }
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition"
                        title={book.isPublic ? "Hide" : "Show"}>
                        {book.isPublic ? (
                          <FaEye className="text-green-400" />
                        ) : (
                          <FaEyeSlash className="text-gray-400" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteBook(book._id)}
                        className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition">
                        <FaTrash className="text-red-400" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentManagement;

