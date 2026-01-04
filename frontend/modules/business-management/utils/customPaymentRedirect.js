// Utility function to redirect to custom payment page
export const redirectToCustomPayment = (type, data) => {
  const params = new URLSearchParams();
  params.set("type", type);

  // Add all data as URL parameters
  Object.keys(data).forEach((key) => {
    if (data[key] !== null && data[key] !== undefined) {
      params.set(key, data[key].toString());
    }
  });

  window.location.href = `/payment/confirm?${params.toString()}`;
};

// Helper to truncate text to a specific word count
const truncateWords = (text, maxWords) => {
  if (!text) return "";
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ") + "...";
};

// Helper for course buy now
export const redirectToCustomCoursePayment = (course) => {
  // Extract numeric price value
  let numericAmount = 0;

  if (course.rawPrice !== undefined && course.rawPrice !== null) {
    // Use rawPrice if available (already numeric)
    numericAmount = parseFloat(course.rawPrice) || 0;
  } else if (typeof course.price === "number") {
    numericAmount = course.price;
  } else if (typeof course.price === "string") {
    // Extract number from string like "INR 500" or "500"
    const match = course.price.match(/[\d.]+/);
    numericAmount = match ? parseFloat(match[0]) : 0;
  } else if (course.amount) {
    numericAmount = parseFloat(course.amount) || 0;
  }

  redirectToCustomPayment("course", {
    itemId: course.id || course.slug || course.courseId,
    itemName: course.title || course.name,
    amount: numericAmount,
    currency: course.currency || "INR",
    quantity: 1,
    category: course.category || course.track,
    duration: course.duration,
    format: course.format || course.mode,
    level: course.level,
    description: truncateWords(
      course.shortDescription || course.description || course.summary || "",
      100
    ),
  });
};

// Helper for book buy now
export const redirectToCustomBookPayment = (book) => {
  // Extract numeric price value
  let numericAmount = 0;

  if (typeof book.price === "number") {
    numericAmount = book.price;
  } else if (typeof book.price === "string") {
    // Extract number from string like "INR 50" or "50"
    numericAmount = parseFloat(book.price.replace(/[^0-9.]/g, "")) || 0;
  }

  redirectToCustomPayment("book", {
    itemId: book.id || book._id,
    itemName: book.title,
    amount: numericAmount,
    currency: book.currency || "INR",
    quantity: 1,
    author: book.author,
    format: book.format,
    description: truncateWords(
      book.shortDescription || book.description || book.fullDescription || "",
      100
    ),
  });
};
