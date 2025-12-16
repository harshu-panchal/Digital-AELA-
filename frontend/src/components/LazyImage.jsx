import { useState, useEffect } from 'react';

/**
 * LazyImage Component
 * Implements native lazy loading with loading states and error handling
 */
export function LazyImage({
    src,
    alt,
    className = '',
    fallbackSrc = '/placeholder.png',
    onLoad,
    onError,
    ...props
}) {
    const [imageSrc, setImageSrc] = useState(fallbackSrc);
    const [imageError, setImageError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!src) {
            setImageError(true);
            setIsLoading(false);
            return;
        }

        setImageSrc(src);
        setIsLoading(true);
        setImageError(false);
    }, [src]);

    const handleLoad = (e) => {
        setIsLoading(false);
        if (onLoad) onLoad(e);
    };

    const handleError = (e) => {
        setImageError(true);
        setIsLoading(false);
        setImageSrc(fallbackSrc);
        if (onError) onError(e);
    };

    return (
        <div className={`lazy-image-wrapper ${className}`} style={{ position: 'relative' }}>
            {isLoading && !imageError && (
                <div className="lazy-image-skeleton" style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s infinite',
                }} />
            )}
            <img
                src={imageSrc}
                alt={alt}
                className={className}
                loading="lazy" // Native lazy loading
                decoding="async" // Async image decoding
                onLoad={handleLoad}
                onError={handleError}
                style={{
                    opacity: isLoading ? 0 : 1,
                    transition: 'opacity 0.3s ease-in-out',
                }}
                {...props}
            />
            <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
        </div>
    );
}

export default LazyImage;
