import PDFDocument from "pdfkit";
import { Readable } from "stream";

/**
 * Generate Certificate PDF
 * @param {Object} certificateData - Certificate data
 * @returns {Promise<Buffer>} PDF buffer
 */
export const generateCertificatePDF = async (certificateData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        layout: "landscape",
        margins: {
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
        },
      });

      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Certificate dimensions (A4 landscape: 842 x 595 points)
      const width = 842;
      const height = 595;

      // Get template design or use defaults
      const template = certificateData.template || {};
      const design = template.design || {};
      const backgroundColor = design.backgroundColor || "#FFFFFF";
      const textColor = design.textColor || "#000000";
      const borderColor = design.borderColor || "#D4AF37";
      const fontFamily = design.fontFamily || "Helvetica";

      // Draw background
      doc.rect(0, 0, width, height).fill(backgroundColor);

      // Draw decorative border
      const borderWidth = 20;
      doc
        .rect(borderWidth, borderWidth, width - borderWidth * 2, height - borderWidth * 2)
        .lineWidth(3)
        .strokeColor(borderColor)
        .stroke();

      // Draw inner border
      const innerBorderWidth = 30;
      doc
        .rect(innerBorderWidth, innerBorderWidth, width - innerBorderWidth * 2, height - innerBorderWidth * 2)
        .lineWidth(1)
        .strokeColor(borderColor)
        .stroke();

      // Header text
      const headerText = design.headerText || "Certificate of Completion";
      doc
        .fontSize(36)
        .font(`${fontFamily}-Bold`)
        .fillColor(borderColor)
        .text(headerText, width / 2, 120, {
          align: "center",
          width: width - 100,
        });

      // Main content area
      const contentY = 220;

      // Student name
      if (certificateData.studentName) {
        doc
          .fontSize(32)
          .font(`${fontFamily}-Bold`)
          .fillColor(textColor)
          .text(certificateData.studentName, width / 2, contentY, {
            align: "center",
            width: width - 100,
          });
      }

      // "has successfully completed" text
      doc
        .fontSize(18)
        .font(fontFamily)
        .fillColor(textColor)
        .text("has successfully completed", width / 2, contentY + 60, {
          align: "center",
          width: width - 100,
        });

      // Course title
      if (certificateData.courseTitle) {
        doc
          .fontSize(24)
          .font(`${fontFamily}-Bold`)
          .fillColor(borderColor)
          .text(certificateData.courseTitle, width / 2, contentY + 100, {
            align: "center",
            width: width - 100,
          });
      }

      // Completion date
      if (certificateData.completionDate) {
        const date = new Date(certificateData.completionDate);
        const formattedDate = date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        doc
          .fontSize(14)
          .font(fontFamily)
          .fillColor(textColor)
          .text(`Completed on ${formattedDate}`, width / 2, contentY + 160, {
            align: "center",
            width: width - 100,
          });
      }

      // Grade (if available)
      if (certificateData.grade) {
        doc
          .fontSize(16)
          .font(fontFamily)
          .fillColor(textColor)
          .text(`Grade: ${certificateData.grade}`, width / 2, contentY + 190, {
            align: "center",
            width: width - 100,
          });
      }

      // Footer text
      const footerText = design.footerText || "This certificate verifies the successful completion of the course.";
      doc
        .fontSize(10)
        .font(fontFamily)
        .fillColor("#666666")
        .text(footerText, width / 2, height - 100, {
          align: "center",
          width: width - 100,
        });

      // Certificate number
      if (certificateData.certificateNumber) {
        doc
          .fontSize(10)
          .font(fontFamily)
          .fillColor("#666666")
          .text(`Certificate Number: ${certificateData.certificateNumber}`, width / 2, height - 80, {
            align: "center",
            width: width - 100,
          });
      }

      // Verification code
      if (certificateData.verificationCode) {
        doc
          .fontSize(9)
          .font(fontFamily)
          .fillColor("#999999")
          .text(`Verification Code: ${certificateData.verificationCode}`, width / 2, height - 60, {
            align: "center",
            width: width - 100,
          });
      }

      // Verification URL
      const verificationUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/certificates/verify/${certificateData.verificationCode}`;
      doc
        .fontSize(8)
        .font(fontFamily)
        .fillColor("#999999")
        .text(`Verify at: ${verificationUrl}`, width / 2, height - 40, {
          align: "center",
          width: width - 100,
        });

      // Signature line (optional)
      const signatureY = height - 150;
      doc
        .moveTo(width / 2 - 100, signatureY)
        .lineTo(width / 2 + 100, signatureY)
        .strokeColor(borderColor)
        .lineWidth(1)
        .stroke();

      doc
        .fontSize(12)
        .font(fontFamily)
        .fillColor(textColor)
        .text("Authorized Signature", width / 2, signatureY + 5, {
          align: "center",
          width: width - 100,
        });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate Invoice PDF
 * @param {Object} invoiceData - Invoice data
 * @returns {Promise<Buffer>} PDF buffer
 */
export const generateInvoicePDF = async (invoiceData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        layout: "portrait",
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50,
        },
      });

      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const pageWidth = doc.page.width - 100; // Account for margins
      const startY = 50;

      // Company/Platform header
      doc
        .fontSize(24)
        .font("Helvetica-Bold")
        .fillColor("#000000")
        .text("Digital AELA", 50, startY);

      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#666666")
        .text("Certificate of Completion Platform", 50, startY + 30);

      // Invoice title
      doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .fillColor("#000000")
        .text("INVOICE", pageWidth - 100, startY, {
          align: "right",
        });

      // Invoice number and date
      let currentY = startY + 80;
      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#666666")
        .text("Invoice Number:", 50, currentY);

      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .fillColor("#000000")
        .text(invoiceData.invoiceNumber || "N/A", 150, currentY);

      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#666666")
        .text("Date:", pageWidth - 150, currentY, { align: "right" });

      const invoiceDate = invoiceData.date
        ? new Date(invoiceData.date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });

      doc
        .fontSize(12)
        .font("Helvetica")
        .fillColor("#000000")
        .text(invoiceDate, pageWidth - 50, currentY, { align: "right" });

      // Bill To section
      currentY += 50;
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .fillColor("#000000")
        .text("Bill To:", 50, currentY);

      currentY += 20;
      if (invoiceData.user) {
        doc
          .fontSize(10)
          .font("Helvetica")
          .fillColor("#000000")
          .text(invoiceData.user.name || "N/A", 50, currentY);

        currentY += 15;
        doc
          .fontSize(10)
          .font("Helvetica")
          .fillColor("#666666")
          .text(invoiceData.user.email || "N/A", 50, currentY);
      }

      // Items table header
      currentY += 40;
      doc
        .rect(50, currentY, pageWidth, 30)
        .fill("#F5F5F5")
        .stroke();

      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor("#000000")
        .text("Description", 60, currentY + 10);

      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor("#000000")
        .text("Amount", pageWidth - 50, currentY + 10, { align: "right" });

      // Item row
      currentY += 30;
      const itemDescription = invoiceData.course
        ? `Course: ${invoiceData.course.title}`
        : invoiceData.description || "Payment";

      doc
        .rect(50, currentY, pageWidth, 30)
        .stroke();

      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#000000")
        .text(itemDescription, 60, currentY + 10, {
          width: pageWidth - 120,
        });

      const amount = invoiceData.payment?.amount || invoiceData.amount || 0;
      const currency = invoiceData.payment?.currency || invoiceData.currency || "INR";
      const formattedAmount = `${currency} ${amount.toFixed(2)}`;

      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#000000")
        .text(formattedAmount, pageWidth - 50, currentY + 10, { align: "right" });

      // Total section
      currentY += 50;
      doc
        .rect(50, currentY, pageWidth, 40)
        .fill("#F9F9F9")
        .stroke();

      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .fillColor("#000000")
        .text("Total:", pageWidth - 150, currentY + 10, { align: "right" });

      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .fillColor("#000000")
        .text(formattedAmount, pageWidth - 50, currentY + 10, { align: "right" });

      // Payment details
      currentY += 60;
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor("#000000")
        .text("Payment Details:", 50, currentY);

      currentY += 20;
      if (invoiceData.payment) {
        const payment = invoiceData.payment;
        doc
          .fontSize(9)
          .font("Helvetica")
          .fillColor("#666666")
          .text(`Payment Method: ${payment.paymentMethod || "N/A"}`, 50, currentY);

        currentY += 15;
        doc
          .fontSize(9)
          .font("Helvetica")
          .fillColor("#666666")
          .text(`Status: ${payment.status || "N/A"}`, 50, currentY);

        if (payment.gatewayTransactionId) {
          currentY += 15;
          doc
            .fontSize(9)
            .font("Helvetica")
            .fillColor("#666666")
            .text(`Transaction ID: ${payment.gatewayTransactionId}`, 50, currentY);
        }
      }

      // Footer
      let footerY = doc.page.height - 100;
      doc
        .fontSize(8)
        .font("Helvetica")
        .fillColor("#999999")
        .text("Thank you for your business!", 50, footerY, {
          align: "center",
          width: pageWidth,
        });

      footerY += 20;
      doc
        .fontSize(8)
        .font("Helvetica")
        .fillColor("#999999")
        .text("Digital AELA - Certificate of Completion Platform", 50, footerY, {
          align: "center",
          width: pageWidth,
        });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Convert PDF buffer to stream for Cloudinary upload
 * @param {Buffer} pdfBuffer - PDF buffer
 * @returns {Readable} Stream
 */
export const pdfBufferToStream = (pdfBuffer) => {
  return Readable.from(pdfBuffer);
};

