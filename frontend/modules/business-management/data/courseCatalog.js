import { englishCourses } from "./englishCourses";
import { digitalMarketingCourses } from "./digitalMarketingCourses";
import { corporateTrainingCourses } from "./corporateTrainingCourses";

export const courseCatalog = [
  ...englishCourses,
  ...digitalMarketingCourses,
  ...corporateTrainingCourses,
];

export const getCourseBySlug = (slug) =>
  courseCatalog.find((course) => course.slug === slug);

export const getCoursesByCategory = (category) =>
  courseCatalog.filter(
    (course) =>
      course.category.toLowerCase() === category.toLowerCase()
  );

