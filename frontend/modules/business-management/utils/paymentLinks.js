export const extractNumericPrice = (priceInput) => {
  if (typeof priceInput === "number" && Number.isFinite(priceInput)) {
    return priceInput;
  }

  if (typeof priceInput === "string") {
    const cleaned = priceInput.replace(/[^0-9.]/g, "");
    const parsed = parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

export const buildCoursePaymentLink = (course = {}) => {
  const params = new URLSearchParams();

  if (course.id || course.courseId) {
    params.set("id", String(course.id ?? course.courseId));
  }
  if (course.slug) {
    params.set("slug", course.slug);
  }
  if (course.title) {
    params.set("title", course.title);
  }

  const price = extractNumericPrice(
    course.price ?? course.amount ?? course.fee ?? course.investment
  );
  if (price > 0) {
    params.set("price", price.toString());
  }

  if (course.category) params.set("category", course.category);
  if (course.subcategory) params.set("subcategory", course.subcategory);
  if (course.track) params.set("track", course.track);
  if (course.level) params.set("level", course.level);
  if (course.duration) params.set("duration", course.duration);
  if (course.format) params.set("format", course.format);

  return params.toString()
    ? `/courses/payment?${params.toString()}`
    : "/courses/payment";
};

