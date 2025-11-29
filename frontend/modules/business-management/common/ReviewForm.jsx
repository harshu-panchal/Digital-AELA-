import { useState } from "react";
import { FaStar, FaSpinner } from "react-icons/fa";
import { toast } from "react-toastify";
import { submitReview, updateReview } from "../../../src/services/api/reviews";
import TranslatedText from "../../../src/components/TranslatedText";

const ReviewForm = ({ courseId, existingReview, onSuccess, onCancel }) => {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState(existingReview?.review || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    if (review.trim().length < 10) {
      toast.error("Review must be at least 10 characters long");
      return;
    }

    setIsSubmitting(true);
    try {
      if (existingReview) {
        await updateReview(existingReview._id, { rating, review });
        toast.success("Review updated successfully");
      } else {
        await submitReview(courseId, { rating, review });
        toast.success("Review submitted successfully. It will be visible after approval.");
      }
      onSuccess?.();
    } catch (error) {
      toast.error(error.message || "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-white mb-2">
          <TranslatedText>Rating</TranslatedText> *
        </label>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="transition-transform hover:scale-110"
            >
              <FaStar
                className={`text-2xl ${
                  star <= (hoveredRating || rating)
                    ? "text-[#D4AF37]"
                    : "text-gray-400"
                }`}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="text-sm text-gray-300 ml-2">
              {rating} {rating === 1 ? <TranslatedText>star</TranslatedText> : <TranslatedText>stars</TranslatedText>}
            </span>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-white mb-2">
          <TranslatedText>Review (optional but recommended)</TranslatedText>
        </label>
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Share your experience with this course..."
          rows={5}
          maxLength={2000}
          className="w-full rounded-lg border border-white/10 bg-[#090D19]/95 px-4 py-3 text-white placeholder-gray-500 focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20"
        />
        <div className="text-xs text-gray-400 mt-1">
          {review.length}/2000 <TranslatedText>characters</TranslatedText>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting || rating === 0}
          className="flex-1 rounded-lg bg-[#D4AF37] px-4 py-2 font-semibold text-black transition-colors hover:bg-[#F5D26A] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <FaSpinner className="animate-spin" />
              <TranslatedText>Submitting...</TranslatedText>
            </>
          ) : existingReview ? (
            <TranslatedText>Update Review</TranslatedText>
          ) : (
            <TranslatedText>Submit Review</TranslatedText>
          )}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-white/10 bg-transparent text-white hover:bg-white/5 transition-colors"
          >
            <TranslatedText>Cancel</TranslatedText>
          </button>
        )}
      </div>
    </form>
  );
};

export default ReviewForm;

