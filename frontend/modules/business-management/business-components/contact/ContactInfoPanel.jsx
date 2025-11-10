import { motion } from "framer-motion";

const ContactInfoPanel = ({
  title,
  subtitle,
  items = [],
  highlights = [],
  note,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, ease: "easeOut", delay: 0.1 }}
      className="bg-[#0b0b0b] border border-[#D4AF37]/20 rounded-2xl p-5 md:p-6 shadow-[0_0_20px_rgba(212,175,55,0.06)] space-y-5">
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-white font-display">{title}</h3>
        {subtitle && (
          <p className="text-xs md:text-sm text-gray-300 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      <div className="space-y-4">
        {items.map((item, index) => {
          const { icon, title: itemTitle, description, href, subtext } = item;
          const content = (
            <div className="flex items-start gap-3">
              {icon && (
                <span className="text-xl md:text-2xl leading-none">{icon}</span>
              )}
              <div className="space-y-1">
                <p className="text-xs md:text-sm font-semibold text-white">
                  {itemTitle}
                </p>
                <p className="text-xs md:text-sm text-gray-300 leading-relaxed">
                  {description}
                </p>
                {subtext && (
                  <p className="text-[11px] text-gray-500">{subtext}</p>
                )}
              </div>
            </div>
          );

          return href ? (
            <a
              key={`${itemTitle}-${index}`}
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noreferrer" : undefined}
              className="block bg-[#111111] border border-[#D4AF37]/10 hover:border-[#D4AF37]/35 rounded-xl px-3.5 py-2.5 transition-colors duration-200">
              {content}
            </a>
          ) : (
            <div
              key={`${itemTitle}-${index}`}
              className="bg-[#111111] border border-[#D4AF37]/10 rounded-xl px-3.5 py-2.5">
              {content}
            </div>
          );
        })}
      </div>

      {highlights.length > 0 && (
        <div className="pt-4 border-t border-[#D4AF37]/10 space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
            What happens next
          </p>
          <ul className="space-y-2">
            {highlights.map((highlight, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-xs md:text-sm text-gray-300 leading-relaxed">
                <span className="text-[#D4AF37] mt-0.5">•</span>
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {note && (
        <p className="text-[11px] text-gray-500 leading-relaxed">{note}</p>
      )}
    </motion.div>
  );
};

export default ContactInfoPanel;
