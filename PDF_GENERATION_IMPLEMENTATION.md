# PDF Generation Implementation

## Overview

PDF generation has been successfully implemented for both **Certificates** and **Invoices** using the `pdfkit` library. PDFs are generated on-demand and can also be uploaded to Cloudinary for storage.

## Implementation Details

### 1. Certificate PDF Generation

**Location:** `backend/src/utils/pdfGenerator.js`

**Features:**
- Professional certificate design in landscape A4 format
- Customizable template support (uses certificate template design if available)
- Includes:
  - Student name
  - Course title
  - Completion date
  - Certificate number
  - Verification code
  - Verification URL
  - Grade (if available)
  - Signature line

**Endpoints:**
- `GET /api/v1/certificates/:certificateId/pdf` - Downloads certificate PDF directly
- PDF is also automatically generated and uploaded to Cloudinary when certificate is issued

**Usage:**
```javascript
// Certificate PDF is automatically generated when certificate status is set to "issued"
// To download, make a GET request to the PDF endpoint
```

### 2. Invoice PDF Generation

**Location:** `backend/src/utils/pdfGenerator.js`

**Features:**
- Professional invoice design in portrait A4 format
- Includes:
  - Invoice number
  - Date
  - Bill to (user details)
  - Itemized billing
  - Payment details
  - Total amount
  - Transaction ID (if available)

**Endpoints:**
- `GET /api/v1/payments/:paymentId/invoice` - Returns JSON with invoice data and URL
- `GET /api/v1/payments/:paymentId/invoice?format=pdf` - Downloads invoice PDF directly
- Invoice PDF is automatically generated when payment status becomes "completed"

**Usage:**
```javascript
// Get invoice JSON
GET /api/v1/payments/:paymentId/invoice

// Download invoice PDF
GET /api/v1/payments/:paymentId/invoice?format=pdf
```

## Files Modified/Created

### Created Files:
1. **`backend/src/utils/pdfGenerator.js`** - PDF generation utility
   - `generateCertificatePDF()` - Generates certificate PDF
   - `generateInvoicePDF()` - Generates invoice PDF
   - `pdfBufferToStream()` - Converts PDF buffer to stream

### Modified Files:
1. **`backend/src/controllers/certificateController.js`**
   - Updated `generateCertificate()` to generate and upload PDF to Cloudinary
   - Updated `downloadCertificatePDF()` to generate PDF on-demand

2. **`backend/src/controllers/paymentController.js`**
   - Updated `getInvoice()` to generate PDF on-demand
   - Updated `updatePayment()` to auto-generate invoice PDF when payment is completed

3. **`backend/package.json`**
   - Added `pdfkit` dependency

## Dependencies

- **pdfkit** - PDF generation library
- **Cloudinary** - PDF storage (already configured)

## Environment Variables

Optional:
- `FRONTEND_URL` - Used for certificate verification URL (defaults to `http://localhost:5173`)

## How It Works

### Certificate PDF Flow:
1. When a certificate is issued (status set to "issued"):
   - Certificate number is generated via pre-save hook
   - PDF is generated with all certificate data
   - PDF is uploaded to Cloudinary
   - PDF URL is stored in certificate document

2. When downloading certificate:
   - If PDF exists in Cloudinary, it can be accessed via `pdfUrl`
   - PDF can also be generated on-demand via the endpoint
   - PDF is streamed directly to the client

### Invoice PDF Flow:
1. When payment status becomes "completed":
   - Invoice PDF is automatically generated
   - PDF is uploaded to Cloudinary
   - PDF URL is stored in payment document

2. When accessing invoice:
   - Default: Returns JSON with invoice data and URL
   - With `?format=pdf`: Returns PDF file directly
   - PDF can be generated on-demand if not already created

## PDF Design Features

### Certificate:
- Landscape A4 format (842 x 595 points)
- Decorative borders
- Customizable colors and fonts via template
- Professional layout with centered content
- Verification code and URL included

### Invoice:
- Portrait A4 format
- Company header
- Itemized billing table
- Payment details section
- Professional footer

## Error Handling

- PDF generation errors are caught and logged
- Certificate/Invoice creation continues even if PDF generation fails
- Fallback to on-demand generation if upload fails
- User-friendly error messages returned to client

## Testing

To test PDF generation:

1. **Certificate:**
   ```bash
   # Generate a certificate (via API or admin panel)
   # Then download PDF:
   GET /api/v1/certificates/:certificateId/pdf
   ```

2. **Invoice:**
   ```bash
   # Complete a payment
   # Then get invoice:
   GET /api/v1/payments/:paymentId/invoice?format=pdf
   ```

## Future Enhancements

Potential improvements:
- Add QR codes to certificates
- Support for custom logos in certificates
- Multiple invoice templates
- Batch PDF generation
- PDF caching for better performance
- Watermark support

## Notes

- PDFs are stored in Cloudinary with the following folder structure:
  - Certificates: `digital-aela/certificates/:certificateId`
  - Invoices: `digital-aela/invoices/:paymentId`
- PDF generation is asynchronous and doesn't block the main flow
- PDFs can be regenerated on-demand if needed
- All PDFs include verification/transaction information for authenticity

---

**Implementation Date:** January 2025  
**Status:** ✅ Complete and Ready for Use

