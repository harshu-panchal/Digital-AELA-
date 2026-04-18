import { useEffect, useState } from "react";
import { motion as Motion } from "framer-motion";
import { FaImage, FaPlay, FaVideo } from "react-icons/fa";
import SEO from "../../../src/components/SEO";
import { getGalleryImages } from "../../../src/services/api/gallery";
import { getMediaUrl } from "../../../src/utils/mediaUrl";
import LazyImage from "../../../src/components/LazyImage";

const getVideoEmbedUrl = (url = "") => {
  const youtubeMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/
  );
  if (youtubeMatch?.[1]) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  }

  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch?.[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  return "";
};

const Gallery = () => {
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadGalleryImages = async () => {
    try {
      setLoading(true);
      const response = await getGalleryImages();

      if (!response || !response.data) {
        console.warn("No gallery images data received from API");
        setGalleryItems([]);
        return;
      }

      const transformedItems = (response.data || []).map((item) => ({
        id: item.id,
        image: item.image || item.mediaUrl,
        mediaUrl: item.mediaUrl || item.image,
        title: item.title || "AELA Moment",
        description: item.description || "",
        mediaType: item.mediaType || "image",
        sourceType: item.sourceType || "upload",
        mediaItems:
          Array.isArray(item.mediaItems) && item.mediaItems.length > 0
            ? item.mediaItems
            : [
                {
                  url: item.mediaUrl || item.image,
                  mediaType: item.mediaType || "image",
                  sourceType: item.sourceType || "upload",
                },
              ],
      }));

      setGalleryItems(transformedItems);
    } catch (error) {
      console.error("Failed to load gallery images:", error);
      setGalleryItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGalleryImages();
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-b from-black via-[#050505] to-black pt-[94px] md:pt-[104px] text-white">
      <SEO
        title="AELA Gallery - Community & Partners"
        description="Browse the AELA gallery and see highlights from workshops, events, community celebrations, and partner collaborations."
        keywords="AELA gallery, Digital AELA events, workshops, community photos, partners"
        type="website"
      />

      <section className="layout-container pb-16">
        <Motion.div className="mb-10 text-center">
          <p className="text-[#D4AF37] text-xs sm:text-sm md:text-base font-semibold uppercase tracking-[0.35em] mb-3 font-display">
            AELA GALLERY
          </p>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 font-display tracking-tight leading-tight">
            Moments from Our{" "}
            <span className="text-[#D4AF37]">Community & Partners</span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
            A visual journey of events, workshops, learners, and partners who
            are building the Digital AELA movement across cities and countries.
          </p>
        </Motion.div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#D4AF37]/30 border-t-[#D4AF37]" />
          </div>
        ) : galleryItems.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">
              No gallery media available
            </p>
          </div>
        ) : (
          <Motion.div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {galleryItems.map((item) => {
              const mediaItems =
                Array.isArray(item.mediaItems) && item.mediaItems.length > 0
                  ? item.mediaItems
                  : [
                      {
                        url: item.mediaUrl || item.image,
                        mediaType: item.mediaType || "image",
                      },
                    ];
              const firstMedia = mediaItems[0] || {};

              return (
                <Motion.figure
                  key={item.id}
                  className="group overflow-hidden rounded-2xl border border-white/10 bg-[#060606] shadow-[0_22px_60px_rgba(0,0,0,0.7)]">
                  <div className="relative grid h-64 w-full grid-cols-2 gap-1 overflow-hidden bg-black p-1">
                    {mediaItems.slice(0, 4).map((mediaItem, mediaIndex) => {
                      const mediaUrl = getMediaUrl(
                        mediaItem.url || mediaItem.mediaUrl || mediaItem.image
                      );
                      const embedUrl =
                        mediaItem.mediaType === "video"
                          ? getVideoEmbedUrl(mediaUrl)
                          : "";

                      return (
                        <div
                          key={`${mediaUrl}-${mediaIndex}`}
                          className={`relative overflow-hidden rounded-lg bg-black ${
                            mediaItems.length === 1 ? "col-span-2 row-span-2" : ""
                          }`}>
                          {mediaItem.mediaType === "video" ? (
                            embedUrl ? (
                              <iframe
                                src={embedUrl}
                                title={item.title}
                                className="h-full w-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            ) : (
                              <video
                                src={mediaUrl}
                                controls
                                className="h-full w-full object-cover"
                              />
                            )
                          ) : (
                            <LazyImage
                              src={mediaUrl}
                              alt={item.title || "AELA community gallery"}
                              className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                              fallbackSrc="https://via.placeholder.com/400x300?text=Gallery"
                            />
                          )}
                          {mediaItem.mediaType === "video" && !embedUrl && (
                            <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/70 p-2 text-[#D4AF37]">
                              <FaPlay className="h-3 w-3" />
                            </div>
                          )}
                          {mediaIndex === 3 && mediaItems.length > 4 && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-xl font-bold text-white">
                              +{mediaItems.length - 4}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />
                  </div>
                  <figcaption className="space-y-2 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
                      {firstMedia.mediaType === "video" ? (
                        <FaVideo />
                      ) : (
                        <FaImage />
                      )}
                      {mediaItems.length} media item
                      {mediaItems.length > 1 ? "s" : ""}
                    </div>
                    <h3 className="text-base font-bold text-white">
                      {item.title || "AELA Moment"}
                    </h3>
                    {item.description && (
                      <p className="text-sm leading-relaxed text-gray-400">
                        {item.description}
                      </p>
                    )}
                  </figcaption>
                </Motion.figure>
              );
            })}
          </Motion.div>
        )}
      </section>
    </div>
  );
};

export default Gallery;
