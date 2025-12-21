import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
    HiOutlineArrowLeft,
    HiOutlineShieldCheck,
    HiOutlineEnvelope,
    HiOutlineCalendar,
    HiOutlineDocumentText,
    HiOutlineArrowDownTray,
} from "react-icons/hi2";
import { HiPrinter } from "react-icons/hi";
import SEO from "../../src/components/SEO";
import TranslatedText from "../../src/components/TranslatedText";
import { getInvoice } from "../../src/services/api/payments";

const DownloadInvoice = () => {
    const { paymentId } = useParams();
    const navigate = useNavigate();
    const [invoice, setInvoice] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [invoiceUrl, setInvoiceUrl] = useState(null);

    useEffect(() => {
        loadInvoice();
    }, [paymentId]);

    const loadInvoice = async () => {
        setIsLoading(true);
        try {
            const response = await getInvoice(paymentId);
            setInvoice(response.invoice);
            setInvoiceUrl(response.invoiceUrl);
        } catch (error) {
            toast.error(error.message || "Failed to load invoice details");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadPDF = () => {
        const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
        window.open(`${backendUrl}/payments/${paymentId}/invoice?format=pdf`, "_blank");
    };

    const handlePrint = () => {
        window.print();
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400"><TranslatedText>Loading invoice details...</TranslatedText></p>
                </div>
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <div className="text-center p-8 bg-[#111] rounded-2xl border border-white/10 max-w-md w-full">
                    <HiOutlineDocumentText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2"><TranslatedText>Invoice Not Found</TranslatedText></h2>
                    <p className="text-gray-400 mb-6"><TranslatedText>We couldn't find the invoice details you're looking for.</TranslatedText></p>
                    <button
                        onClick={() => navigate(-1)}
                        className="w-full py-3 rounded-xl bg-[#D4AF37] text-black font-bold hover:bg-[#F5D26A] transition"
                    >
                        <TranslatedText>Go Back</TranslatedText>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black py-6 sm:py-12 px-4 print:bg-white print:py-0">
            <SEO title={`Invoice ${invoice.invoiceNumber} | Digital AELA`} description="Payment invoice" />

            <div className="max-w-4xl mx-auto">
                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8 print:hidden">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition group"
                    >
                        <HiOutlineArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <TranslatedText>Back to Payments</TranslatedText>
                    </button>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                            onClick={handlePrint}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition"
                        >
                            <HiPrinter className="w-5 h-5" />
                            <span className="hidden sm:inline"><TranslatedText>Print</TranslatedText></span>
                            <span className="sm:hidden"><TranslatedText>Print</TranslatedText></span>
                        </button>
                        <button
                            onClick={handleDownloadPDF}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#D4AF37] text-black font-bold hover:bg-[#F5D26A] transition shadow-lg shadow-[#D4AF37]/20"
                        >
                            <HiOutlineArrowDownTray className="w-5 h-5" />
                            <TranslatedText>Download PDF</TranslatedText>
                        </button>
                    </div>
                </div>

                {/* Invoice Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#111] rounded-[2rem] border border-[#D4AF37]/20 overflow-hidden shadow-2xl shadow-[#D4AF37]/5 print:border-none print:shadow-none print:bg-white print:text-black"
                >
                    {/* Top Bar */}
                    <div className="h-2 bg-gradient-to-r from-[#D4AF37] via-[#F5D26A] to-[#D4AF37]" />

                    <div className="p-6 sm:p-12">
                        {/* Invoice Header */}
                        <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12 sm:mb-16">
                            <div className="space-y-4 w-full md:w-auto">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-[#D4AF37] to-[#F5D26A] rounded-xl flex items-center justify-center shadow-lg shadow-[#D4AF37]/20">
                                        <span className="text-black font-bold text-xl">D</span>
                                    </div>
                                    <h1 className="text-2xl font-bold text-white print:text-black">Digital AELA</h1>
                                </div>
                                <div className="text-gray-400 space-y-1 print:text-gray-600 text-sm sm:text-base">
                                    <p>Certificate of Completion Platform</p>
                                    <p>Dubai, United Arab Emirates</p>
                                    <p>support@digitalaela.com</p>
                                </div>
                            </div>

                            <div className="md:text-right space-y-2 w-full md:w-auto">
                                <h2 className="text-3xl sm:text-4xl font-black text-[#D4AF37] tracking-tight"><TranslatedText>INVOICE</TranslatedText></h2>
                                <div className="text-gray-400 space-y-1 print:text-gray-600 text-sm sm:text-base">
                                    <p className="flex md:justify-end gap-2">
                                        <span className="font-semibold text-gray-500"><TranslatedText>Invoice #:</TranslatedText></span>
                                        <span className="text-white print:text-black font-mono">{invoice.invoiceNumber}</span>
                                    </p>
                                    <p className="flex md:justify-end gap-2">
                                        <span className="font-semibold text-gray-500"><TranslatedText>Date:</TranslatedText></span>
                                        <span className="text-white print:text-black">{formatDate(invoice.date)}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Bill To & Payment Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 mb-12 sm:mb-16 border-t border-white/5 pt-12 print:border-gray-100">
                            <div className="space-y-4">
                                <h3 className="text-xs sm:text-sm uppercase tracking-[0.2em] text-[#D4AF37] font-black"><TranslatedText>Bill To</TranslatedText></h3>
                                <div className="space-y-2">
                                    <p className="text-xl sm:text-2xl font-bold text-white print:text-black">{invoice.user.name}</p>
                                    <div className="flex items-center gap-2 text-gray-400 print:text-gray-600">
                                        <HiOutlineEnvelope className="w-4 h-4 text-[#D4AF37]" />
                                        <span className="text-sm sm:text-base">{invoice.user.email}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xs sm:text-sm uppercase tracking-[0.2em] text-[#D4AF37] font-black"><TranslatedText>Payment Summary</TranslatedText></h3>
                                <div className="bg-white/5 rounded-2xl p-5 border border-white/10 print:bg-gray-50 print:border-gray-200">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-gray-400 print:text-gray-600 text-sm"><TranslatedText>Status</TranslatedText></span>
                                        <span className={`px-3 py-1 rounded-lg text-[10px] sm:text-xs font-black tracking-widest border ${invoice.payment.status === 'completed'
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                            : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                            }`}>
                                            {invoice.payment.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-gray-400 print:text-gray-600 text-sm"><TranslatedText>Method</TranslatedText></span>
                                        <span className="text-white print:text-black font-bold uppercase text-sm">{invoice.payment.paymentMethod}</span>
                                    </div>
                                    {invoice.payment.gatewayTransactionId && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400 print:text-gray-600 text-sm"><TranslatedText>Trans ID</TranslatedText></span>
                                            <span className="text-[#D4AF37] print:text-black font-mono text-[10px] sm:text-xs break-all ml-4 text-right">{invoice.payment.gatewayTransactionId}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Itemized Table */}
                        <div className="mb-12 sm:mb-16 overflow-x-auto -mx-6 sm:mx-0 px-6 sm:px-0">
                            <table className="w-full min-w-[500px] sm:min-w-0">
                                <thead>
                                    <tr className="border-b border-white/10 print:border-gray-200">
                                        <th className="text-left py-4 text-[10px] sm:text-xs font-black text-gray-500 uppercase tracking-[0.2em] print:text-gray-600"><TranslatedText>Description</TranslatedText></th>
                                        <th className="text-right py-4 text-[10px] sm:text-xs font-black text-gray-500 uppercase tracking-[0.2em] print:text-gray-600"><TranslatedText>Amount</TranslatedText></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 print:divide-gray-100">
                                    <tr>
                                        <td className="py-8">
                                            <p className="text-base sm:text-lg font-bold text-white print:text-black">
                                                {invoice.course ? invoice.course.title : invoice.description}
                                            </p>
                                            {invoice.course && (
                                                <p className="text-xs sm:text-sm text-gray-500 mt-2 print:text-gray-600 line-clamp-2 max-w-md">
                                                    {invoice.course.description}
                                                </p>
                                            )}
                                        </td>
                                        <td className="py-8 text-right">
                                            <p className="text-base sm:text-lg font-black text-white print:text-black">
                                                {invoice.currency} {invoice.amount.toFixed(2)}
                                            </p>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Totals */}
                        <div className="flex justify-end mb-12 sm:mb-16">
                            <div className="w-full sm:w-80 space-y-4">
                                <div className="flex justify-between text-gray-400 print:text-gray-600 text-sm sm:text-base">
                                    <span className="font-medium text-gray-500"><TranslatedText>Subtotal</TranslatedText></span>
                                    <span className="font-bold text-white print:text-black">{invoice.currency} {invoice.amount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-400 print:text-gray-600 text-sm sm:text-base">
                                    <span className="font-medium text-gray-500"><TranslatedText>Tax (0%)</TranslatedText></span>
                                    <span className="font-bold text-white print:text-black">{invoice.currency} 0.00</span>
                                </div>
                                <div className="pt-6 border-t border-white/10 print:border-gray-200">
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg sm:text-xl font-black text-white print:text-black uppercase tracking-wider"><TranslatedText>Total Amout</TranslatedText></span>
                                        <span className="text-2xl sm:text-3xl font-black text-[#D4AF37]">{invoice.currency} {invoice.amount.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Note */}
                        <div className="border-t border-white/5 pt-12 text-center space-y-6 print:border-gray-100">
                            <div className="flex items-center justify-center gap-3 text-emerald-400 bg-emerald-400/5 py-3 px-6 rounded-2xl border border-emerald-400/10 w-fit mx-auto">
                                <HiOutlineShieldCheck className="w-5 h-5" />
                                <span className="text-[10px] sm:text-xs font-black tracking-[0.2em] uppercase"><TranslatedText>Securely Processed payment</TranslatedText></span>
                            </div>
                            <p className="text-gray-500 text-xs sm:text-sm max-w-md mx-auto print:text-gray-400 leading-relaxed">
                                <TranslatedText>Thank you for choosing Digital AELA. If you have any questions regarding this invoice, please contact our support team.</TranslatedText>
                            </p>
                            <div className="pt-4 flex items-center justify-center gap-6 grayscale opacity-30">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                                    <span className="text-[10px] font-black text-white uppercase tracking-[0.34em] print:text-black">Digital AELA</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default DownloadInvoice;
