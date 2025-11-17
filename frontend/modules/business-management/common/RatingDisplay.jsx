import { FaStar } from "react-icons/fa";

const RatingDisplay = ({ rating, showNumber = true, size = "md" }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg",
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <FaStar
            key={`full-${i}`}
            className={`${sizeClasses[size]} text-[#D4AF37]`}
          />
        ))}
        {hasHalfStar && (
          <div className="relative">
            <FaStar
              className={`${sizeClasses[size]} text-gray-400`}
            />
            <FaStar
              className={`${sizeClasses[size]} text-[#D4AF37] absolute top-0 left-0 overflow-hidden`}
              style={{ width: "50%" }}
            />
          </div>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <FaStar
            key={`empty-${i}`}
            className={`${sizeClasses[size]} text-gray-400`}
          />
        ))}
      </div>
      {showNumber && (
        <span className={`${sizeClasses[size]} text-gray-300 font-semibold`}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default RatingDisplay;

