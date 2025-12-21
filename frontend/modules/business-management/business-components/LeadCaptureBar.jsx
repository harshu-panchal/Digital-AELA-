import React, { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import TranslatedText from "../../../src/components/TranslatedText";
import { FaUser, FaEnvelope, FaPhone, FaArrowRight } from "react-icons/fa";

const LeadCaptureBar = () => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic validation
        if (!formData.name || !formData.email || !formData.phone) {
            toast.error("Please fill in all fields.");
            return;
        }

        setIsSubmitting(true);
        try {
            // Mock API call - in a real app, this would send data to the backend
            // await submitLead(formData);

            // Artificial delay to simulate network request
            await new Promise(resolve => setTimeout(resolve, 1500));

            toast.success("Thank you! We will contact you soon.");
            setFormData({ name: "", email: "", phone: "" });
        } catch (error) {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="bg-black py-4 border-t border-[#D4AF37]/20">
            <div className="layout-container">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-12">
                    <div className="text-center lg:text-left">
                        <h3 className="text-[#D4AF37] font-display font-bold text-lg md:text-xl leading-tight">
                            <TranslatedText>Stay Connected with Digital AELA</TranslatedText>
                        </h3>
                        <p className="text-gray-400 text-xs md:text-sm mt-1">
                            <TranslatedText>Get the latest updates and exclusive offers delivered to you.</TranslatedText>
                        </p>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="flex-1 w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4"
                    >
                        <div className="relative flex-1">
                            <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-[#D4AF37]/60 text-sm" />
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Your Name"
                                className="w-full bg-white/5 border border-[#D4AF37]/20 rounded-lg py-2.5 pl-9 pr-4 text-white text-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
                                required
                            />
                        </div>

                        <div className="relative flex-1">
                            <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-[#D4AF37]/60 text-sm" />
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Email Address"
                                className="w-full bg-white/5 border border-[#D4AF37]/20 rounded-lg py-2.5 pl-9 pr-4 text-white text-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
                                required
                            />
                        </div>

                        <div className="relative flex-1">
                            <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-[#D4AF37]/60 text-sm" />
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="Phone Number"
                                className="w-full bg-white/5 border border-[#D4AF37]/20 rounded-lg py-2.5 pl-9 pr-4 text-white text-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
                                required
                            />
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-[#D4AF37] hover:bg-[#E5C158] text-black font-bold py-2.5 px-6 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                            ) : (
                                <>
                                    <TranslatedText>Join Now</TranslatedText>
                                    <FaArrowRight className="text-xs" />
                                </>
                            )}
                        </motion.button>
                    </form>
                </div>
            </div>
        </section>
    );
};

export default LeadCaptureBar;
