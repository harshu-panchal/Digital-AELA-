import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import SEO from "../../../src/components/SEO";
import { fetchCategoryBySlug } from "../../../src/services/api/categories";
import { fetchPublishedCourses } from "../../../src/services/api/courses";
import TranslatedText from "../../../src/components/TranslatedText";
import { redirectToCustomCoursePayment } from "../utils/customPaymentRedirect";
import { useAuth } from "../../../src/contexts/AuthContext";
import GiftButton from "../common/GiftButton";
import { formatCurrency } from "../../../src/utils/currencyUtils";

const GenericCategoryPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [category, setCategory] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [categoryData, coursesData] = await Promise.all([
          fetchCategoryBySlug(slug),
          fetchPublishedCourses(),
        ]);

        if (!categoryData) {
          toast.error("Category not found");
          navigate("/home");
          return;
        }

        setCategory(categoryData);

        // Filter courses by category name
        const filteredCourses = (coursesData.courses || [])
          .filter(
            (c) => c.category?.toLowerCase() === categoryData.name.toLowerCase()
          )
          .map((c) => ({
            ...c,
            id: c._id,
            price: c.price === 0 ? "Free" : formatCurrency(c.price),
            rawPrice: c.price,
          }));

        setCourses(filteredCourses);
      } catch (error) {
        console.error("Failed to load category data:", error);
        toast.error("Failed to load page data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [slug, navigate]);

  const handleBuyCourse = (course) => {
    redirectToCustomCoursePayment(course);
  };

  const handleViewCourse = (course) => {
    navigate(`/courses/id/${course._id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="h-12 w-12 border-4 border-[#F5D26A]/20 border-t-[#F5D26A] rounded-full animate-spin" />
      </div>
    );
  }

  if (!category) return null;

  return (
    <div className="min-h-screen bg-black text-white">
      <SEO
        title={`${category.name} | Digital AELA`}
        description={category.description}
      />

      {/* Hero Section */}
      <motion.section className="relative overflow-hidden bg-black pt-[90px] pb-20 md:pt-[140px] md:pb-28">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-[10%] h-104 w-104 rounded-full bg-[#D4AF37]/15 blur-[180px]" />
          <div className="absolute bottom-[-25%] right-[12%] h-112 w-md rounded-full bg-[#6A8BFF]/12 blur-[200px]" />
        </div>

        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1 space-y-6 text-left">
            {category.topHeading && (
              <motion.span className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-black shadow-[0_12px_30px_rgba(212,175,55,0.25)]">
                <TranslatedText>{category.topHeading}</TranslatedText>
              </motion.span>
            )}
            <motion.h1 className="font-display text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
              <TranslatedText>
                {category.mainHeading || category.name}
              </TranslatedText>
            </motion.h1>
            {category.subHeading && (
              <motion.h2 className="bg-linear-to-r from-[#D4AF37] via-[#E5C158] to-[#D4AF37] bg-clip-text text-2xl font-semibold text-transparent sm:text-3xl">
                <TranslatedText>{category.subHeading}</TranslatedText>
              </motion.h2>
            )}
            <motion.p className="max-w-xl text-sm text-gray-300 sm:text-base lg:text-lg">
              <TranslatedText>{category.description}</TranslatedText>
            </motion.p>
          </div>

          {category.bannerUrl && (
            <motion.div className="relative mx-auto flex-1 max-w-[420px]">
              <div className="absolute inset-0 -translate-y-6 rounded-[36px] bg-gradient-to-br from-[#D4AF37]/35 via-transparent to-[#6A8BFF]/25 blur-2xl" />
              <img
                src={category.bannerUrl}
                alt={category.name}
                className="relative z-10 w-full rounded-[32px] border border-white/10 object-cover shadow-[0_28px_60px_rgba(0,0,0,0.55)]"
                loading="lazy"
              />
            </motion.div>
          )}
        </div>
      </motion.section>

      {/* Course List Section */}
      <section className="layout-container py-20" id="courses">
        <div className="mb-12">
          <h2 className="text-3xl font-bold">Available Courses</h2>
          <div className="h-1 w-20 bg-[#F5D26A] mt-4" />
        </div>

        {courses.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
            <p className="text-slate-400">
              No courses available in this category yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => (
              <motion.div
                key={course._id}
                whileHover={{ y: -10 }}
                className="group relative bg-[#090D19] border border-white/10 rounded-[32px] overflow-hidden flex flex-col">
                <div className="aspect-video relative overflow-hidden">
                  <img
                    src={
                      course.coverImage ||
                      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800"
                    }
                    alt={course.title}
                    className="w-full h-full object-cover transition duration-500 group-hover:scale-110"
                  />
                  <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-[#F5D26A]">
                    {course.difficulty}
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col gap-4">
                  <h3 className="text-xl font-bold line-clamp-2 group-hover:text-[#F5D26A] transition">
                    {course.title}
                  </h3>
                  <p className="text-sm text-slate-400 line-clamp-2">
                    {course.subtitle || course.description}
                  </p>

                  <div className="mt-auto pt-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      {/* <span className="text-2xl font-bold text-[#F5D26A]">{course.price}</span> */}
                      <span className="text-xs text-slate-500 uppercase tracking-widest">
                        {course.duration}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleBuyCourse(course)}
                        className="bg-[#F5D26A] text-black py-3 rounded-2xl font-bold text-sm hover:brightness-110 transition">
                        Enroll Now
                      </button>
                      <button
                        onClick={() => handleViewCourse(course)}
                        className="bg-white/5 border border-white/10 py-3 rounded-2xl font-bold text-sm hover:bg-white/10 transition">
                        View Details
                      </button>
                    </div>
                    <GiftButton item={course} type="course" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default GenericCategoryPage;

