const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialize();
  }

  initialize() {
    try {
      // Create transporter with SMTP configuration
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'mail.wapromo.site',
        port: parseInt(process.env.EMAIL_PORT) || 465,
        secure: process.env.EMAIL_SECURE === 'true', // true for port 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
        tls: {
          rejectUnauthorized: false // Accept self-signed certificates
        }
      });

      console.log('✅ Email service initialized');
    } catch (error) {
      console.error('❌ Email service initialization failed:', error);
    }
  }

  /**
   * Send an invoice via email
   * @param {Object} invoice - Invoice object
   * @param {Object} companyProfile - Company profile with logo
   * @param {string} recipientEmail - Recipient email address
   * @param {string} recipientName - Recipient name
   * @param {Object} externalAttachment - External attachment object (optional)
   */
  async sendInvoice(invoice, companyProfile, recipientEmail, recipientName, externalAttachment) {
    try {
      if (!this.transporter) {
        throw new Error('Email service not initialized');
      }
      const emailHtml = this.generateInvoiceEmailTemplate(invoice, companyProfile, recipientName);
      let pdfAttachment = null;
      if (externalAttachment) {
        pdfAttachment = externalAttachment; // use provided
      } else {
        pdfAttachment = await this.generateInvoicePDF(invoice, companyProfile);
      }
      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'Invoice System'}" <${process.env.EMAIL_FROM}>`,
        to: recipientEmail,
        subject: `Invoice #${invoice.invoice_number || invoice.invoiceNumber} from ${companyProfile.company_name || companyProfile.name || 'Your Company'}`,
        html: emailHtml,
        attachments: pdfAttachment ? [pdfAttachment] : []
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully:', info.messageId);
      
      // Clean up if internally generated
      if (!externalAttachment && pdfAttachment && pdfAttachment.path && fs.existsSync(pdfAttachment.path)) {
        try {
          fs.unlinkSync(pdfAttachment.path);
          console.log('✅ Temporary PDF file cleaned up');
        } catch (cleanupError) {
          console.warn('⚠️ Failed to cleanup PDF file:', cleanupError.message);
        }
      }
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      throw error;
    }
  }

  /**
   * Generate HTML email template for invoice
   */
  generateInvoiceEmailTemplate(invoice, companyProfile, recipientName) {
    const logoUrl = companyProfile.logo_url || companyProfile.logoUrl || '';
    const companyName = companyProfile.company_name || companyProfile.name || 'Your Company';
    const invoiceNumber = invoice.invoice_number || invoice.invoiceNumber || 'N/A';
    const total = parseFloat(invoice.total_amount || invoice.total || 0);
    const issueDate = invoice.issue_date || invoice.issueDate || '';
    const dueDate = invoice.due_date || invoice.dueDate || '';

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            padding: 20px 0;
            border-bottom: 2px solid #4F46E5;
            margin-bottom: 30px;
        }
        .logo {
            max-width: 150px;
            margin-bottom: 15px;
        }
        .invoice-details {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .invoice-details table {
            width: 100%;
            border-collapse: collapse;
        }
        .invoice-details td {
            padding: 8px 0;
        }
        .invoice-details td:first-child {
            font-weight: bold;
            width: 40%;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #4F46E5;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="header">
        ${logoUrl ? `<img src="${logoUrl.startsWith('http') ? logoUrl : 'cid:company-logo'}" alt="${companyName}" class="logo">` : ''}
        <h1 style="color: #4F46E5; margin: 0;">${companyName}</h1>
    </div>

    <p>Dear ${recipientName},</p>

    <p>Thank you for your business! Please find attached your invoice.</p>

    <div class="invoice-details">
        <table>
            <tr>
                <td>Invoice Number:</td>
                <td>${invoiceNumber}</td>
            </tr>
            <tr>
                <td>Issue Date:</td>
                <td>${issueDate}</td>
            </tr>
            <tr>
                <td>Due Date:</td>
                <td>${dueDate}</td>
            </tr>
            <tr>
                <td>Total Amount:</td>
                <td style="font-size: 18px; font-weight: bold; color: #4F46E5;">AED ${total.toFixed(2)}</td>
            </tr>
        </table>
    </div>

    <p>Please review the attached invoice and make payment by the due date.</p>

    <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>

    <div class="footer">
        <p><strong>${companyName}</strong></p>
        ${companyProfile.address ? `<p>${companyProfile.address}</p>` : ''}
        ${companyProfile.phone ? `<p>Phone: ${companyProfile.phone}</p>` : ''}
        ${companyProfile.email ? `<p>Email: ${companyProfile.email}</p>` : ''}
        <p style="margin-top: 20px; font-size: 12px; color: #999;">
            This is an automated message. Please do not reply to this email.
        </p>
    </div>
</body>
</html>
    `;
  }

  /**
   * Generate PDF attachment for invoice
   */
  async generateInvoicePDF(invoice, companyProfile) {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const filename = `Invoice-${invoice.invoice_number || invoice.invoiceNumber || Date.now()}.pdf`;
      const filePath = path.join(process.cwd(), 'uploads', filename);
      
      // Ensure uploads directory exists
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      // Pipe the PDF to a file
      doc.pipe(fs.createWriteStream(filePath));
      
      // Company header
      const companyName = companyProfile.company_name || companyProfile.name || 'Your Company';
      doc.fontSize(20).text(companyName, 50, 50);
      doc.fontSize(12)
         .text(companyProfile.address || '', 50, 80)
         .text(companyProfile.phone || '', 50, 95)
         .text(companyProfile.email || '', 50, 110);
      
      // Invoice title and details
      doc.fontSize(24).text('INVOICE', 400, 50);
      doc.fontSize(12)
         .text(`Invoice #: ${invoice.invoice_number || invoice.invoiceNumber || 'N/A'}`, 400, 80)
         .text(`Issue Date: ${invoice.issue_date || invoice.issueDate || ''}`, 400, 95)
         .text(`Due Date: ${invoice.due_date || invoice.dueDate || ''}`, 400, 110);
      
      // Customer details
      const contact = invoice.contact;
      if (contact) {
        doc.text('Bill To:', 50, 150);
        doc.text(contact.name || '', 50, 165);
        doc.text(contact.email || '', 50, 180);
        doc.text(contact.phone || '', 50, 195);
        if (contact.trn) {
          doc.text(`TRN: ${contact.trn}`, 50, 210);
        }
      }
      
      // Items table header
      let y = 250;
      doc.text('Description', 50, y)
         .text('Qty', 300, y)
         .text('Unit Price', 350, y)
         .text('Total', 450, y);
      
      // Draw line under header
      doc.moveTo(50, y + 15).lineTo(550, y + 15).stroke();
      y += 25;
      
      // Items
      const items = invoice.items || [];
      let subtotal = 0;
      
      items.forEach(item => {
        const total = (item.quantity || 0) * (item.unit_price || item.unitPrice || 0);
        subtotal += total;
        
        doc.text(item.description || '', 50, y, { width: 240, ellipsis: true })
           .text((item.quantity || 0).toString(), 300, y)
           .text(`AED ${(item.unit_price || item.unitPrice || 0).toFixed(2)}`, 350, y)
           .text(`AED ${total.toFixed(2)}`, 450, y);
        y += 20;
      });
      
      // Totals
      y += 20;
      doc.moveTo(350, y).lineTo(550, y).stroke();
      y += 10;
      
      const vatRate = invoice.vat_rate || 0.05; // 5% default
      const vatAmount = subtotal * vatRate;
      const total = subtotal + vatAmount;
      
      doc.text('Subtotal:', 350, y).text(`AED ${subtotal.toFixed(2)}`, 450, y);
      y += 15;
      doc.text(`VAT (${(vatRate * 100)}%):`, 350, y).text(`AED ${vatAmount.toFixed(2)}`, 450, y);
      y += 15;
      doc.fontSize(14).text('Total:', 350, y).text(`AED ${total.toFixed(2)}`, 450, y);
      
      // Footer
      doc.fontSize(10).text('Thank you for your business!', 50, 700);
      
      // Finalize the PDF
      doc.end();
      
      // Wait for file to be written
      await new Promise((resolve) => {
        doc.on('end', resolve);
      });
      
      return {
        filename: filename,
        path: filePath,
        contentType: 'application/pdf'
      };
    } catch (error) {
      console.error('❌ Failed to generate PDF:', error);
      return null;
    }
  }

  /**
   * Send a test email
   */
  async sendTestEmail(recipientEmail) {
    try {
      if (!this.transporter) {
        throw new Error('Email service not initialized');
      }

      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'Test'}" <${process.env.EMAIL_FROM}>`,
        to: recipientEmail,
        subject: 'Test Email from Invoice CRM',
        html: `
          <h1>Test Email</h1>
          <p>This is a test email from your Invoice CRM system.</p>
          <p>If you received this, your email configuration is working correctly!</p>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Test email sent successfully:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Failed to send test email:', error);
      throw error;
    }
  }

  /**
   * Verify email connection
   */
  async verifyConnection() {
    try {
      if (!this.transporter) {
        throw new Error('Email service not initialized');
      }
      
      await this.transporter.verify();
      console.log('✅ Email server connection verified');
      return { success: true, message: 'Email server is ready' };
    } catch (error) {
      console.error('❌ Email server connection failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
const emailService = new EmailService();
module.exports = emailService;
