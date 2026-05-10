import Course from "../models/Course.js";
import EbookResource from "../models/EbookResource.js";
import Gallery from "../models/Gallery.js";
import Testimonial from "../models/Testimonial.js";

/**
 * Get all home page data in one request
 * Returns courses, books, gallery, and testimonials
 * GET /api/v1/home/data
 */
export const getHomePageData = async (req, res, next) => {
  try {
    // Fetch all data in parallel
    const [courses, books, gallery, testimonials] = await Promise.all([
      // Get premium courses (limit to 6 for home page)
      Course.find({
        status: "published",
        isPremium: true
      })
        .populate("instructor", "fullName email")
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),

      // Get featured books (limit to 6 for home page)
      EbookResource.find({
        isPublic: true,
        "metadata.isFeatured": true
      })
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),

      // Get gallery images
      Gallery.find({ isActive: true })
        .sort({ createdAt: -1 })
        .lean(),

      // Get testimonials
      Testimonial.find({ status: "published" })
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    // Normalize URLs in courses
    const { normalizeCoursesUrls, normalizeGalleryUrls } = await import("../utils/urlNormalizer.js");
    const normalizedCourses = await normalizeCoursesUrls(courses);
    const normalizedGallery = await normalizeGalleryUrls(gallery);

    return res.status(200).json({
      courses: normalizedCourses,
      books,
      gallery: normalizedGallery,
      testimonials,
    });
  } catch (error) {
    return next(error);
  }
};

