import { useState, useEffect } from "react";
import { motion as Motion } from "framer-motion";
import SEO from "../../../src/components/SEO";
import { getGalleryImages } from "../../../src/services/api/gallery";
import { getMediaUrl } from "../../../src/utils/mediaUrl";

const Gallery = () => {
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGalleryImages = async () => {
      try {
        setLoading(true);
        const response = await getGalleryImages();

        if (!response || !response.data) {
          console.warn("No gallery images data received from API");
          setGalleryItems([]);
          return;
        }

        // Transform backend images to match expected format
        const transformedImages = (response.data || []).map((img) => ({
          id: img.id,
          image: img.image,
        }));

        setGalleryItems(transformedImages);
      } catch (error) {
        console.error("Failed to load gallery images:", error);
        setGalleryItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadGalleryImages();
  }, []);
  return (
    <div className="min-h-screen bg-linear-to-b from-black via-[#050505] to-black pt-[124px] text-white">
      <SEO
        title="AELA Gallery - Community & Partners"
        description="Browse the AELA gallery and see highlights from workshops, events, community celebrations, and partner collaborations."
        keywords="AELA gallery, Digital AELA events, workshops, community photos, partners"
        type="website"
      />

      <section className="layout-container pb-16">
        <Motion.div
          className="mb-10 text-center">
          <p className="text-[#D4AF37] text-xs sm:text-sm md:text-base font-semibold uppercase tracking-[0.35em] mb-3 font-display">
            • AELA GALLERY •
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
            <p className="text-gray-400 text-lg">No gallery images available</p>
          </div>
        ) : (
          <Motion.div
            className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {galleryItems.map((item, index) => (
            <Motion.figure
              key={item.id}
              className="group overflow-hidden rounded-2xl border border-white/10 bg-[#060606] shadow-[0_22px_60px_rgba(0,0,0,0.7)]">
              <div className="relative h-40 sm:h-48 md:h-52 w-full overflow-hidden">
                <img
                  src={getMediaUrl(item.image)}
                  alt="AELA community gallery"
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />
              </div>
            </Motion.figure>
            ))}
          </Motion.div>
        )}
      </section>
    </div>
  );
};

export default Gallery;


