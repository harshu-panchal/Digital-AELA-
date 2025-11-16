import { motion as Motion } from "framer-motion";
import SEO from "../../../src/components/SEO";
import img1 from "../../../src/assets/images/gallery/IMG_20220805_210225.jpg";
import img2 from "../../../src/assets/images/gallery/IMG_20220805_210308.jpg";
import img3 from "../../../src/assets/images/gallery/IMG_20220805_210546.jpg";
import img4 from "../../../src/assets/images/gallery/IMG_20221010_173754.jpg";
import img5 from "../../../src/assets/images/gallery/IMG_20221024_175307.jpg";
import img6 from "../../../src/assets/images/gallery/IMG_20221025_203619.jpg";
import img7 from "../../../src/assets/images/gallery/IMG_20230225_170804.jpg";
import img8 from "../../../src/assets/images/gallery/IMG_20230225_170827.jpg";
import img9 from "../../../src/assets/images/gallery/IMG_20230603_093034.jpg";
import img10 from "../../../src/assets/images/gallery/IMG_20240728_191118676_HDR_AE.jpg";

const galleryItems = [
  { id: "gallery-1", image: img1 },
  { id: "gallery-2", image: img2 },
  { id: "gallery-3", image: img3 },
  { id: "gallery-4", image: img4 },
  { id: "gallery-5", image: img5 },
  { id: "gallery-6", image: img6 },
  { id: "gallery-7", image: img7 },
  { id: "gallery-8", image: img8 },
  { id: "gallery-9", image: img9 },
  { id: "gallery-10", image: img10 },
];

const Gallery = () => {
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
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
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

        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {galleryItems.map((item, index) => (
            <Motion.figure
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.35,
                delay: index * 0.05,
                ease: "easeOut",
              }}
              whileHover={{ y: -6, scale: 1.01 }}
              className="group overflow-hidden rounded-2xl border border-white/10 bg-[#060606] shadow-[0_22px_60px_rgba(0,0,0,0.7)]">
              <div className="relative h-40 sm:h-48 md:h-52 w-full overflow-hidden">
                <img
                  src={item.image}
                  alt="AELA community gallery"
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />
              </div>
            </Motion.figure>
          ))}
        </Motion.div>
      </section>
    </div>
  );
};

export default Gallery;


