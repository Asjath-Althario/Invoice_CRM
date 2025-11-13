require('dotenv').config();
const emailService = require('./src/services/emailService');

async function testEmailWithPDF() {
    console.log('Testing email with PDF attachment...');
    
    // Sample invoice data
    const sampleInvoice = {
        invoice_number: 'INV-TEST-001',
        invoiceNumber: 'INV-TEST-001',
        issue_date: '2025-11-13',
        issueDate: '2025-11-13',
        due_date: '2025-12-13',
        dueDate: '2025-12-13',
        contact: {
            name: 'Test Customer',
            email: 'asjathchatgpt@gmail.com', // Sending to same email for testing
            phone: '+971501234567',
            trn: 'TRN123456789'
        },
        items: [
            {
                description: 'Test Product 1',
                quantity: 2,
                unit_price: 100.00,
                unitPrice: 100.00
            },
            {
                description: 'Test Service 1',
                quantity: 1,
                unit_price: 250.00,
                unitPrice: 250.00
            }
        ],
        total_amount: 450.00,
        total: 450.00,
        vat_rate: 0.05
    };
    
    // Sample company profile
    const sampleCompanyProfile = {
        company_name: 'Al Thario FZE',
        name: 'Al Thario FZE',
        address: '123 Business Bay, Dubai, UAE',
        phone: '+971-4-1234567',
        email: 'info@althario.ae',
        logo_url: ''
    };
    
    try {
        console.log('Generating PDF...');
        const pdfResult = await emailService.generateInvoicePDF(sampleInvoice, sampleCompanyProfile);
        
        if (pdfResult) {
            console.log('✅ PDF generated successfully:', pdfResult.filename);
            console.log('📁 PDF path:', pdfResult.path);
        } else {
            console.log('❌ PDF generation failed');
            return;
        }
        
        console.log('Sending email with PDF attachment...');
        const result = await emailService.sendInvoice(
            sampleInvoice,
            sampleCompanyProfile,
            'asjathchatgpt@gmail.com', // Same email for testing
            'Test Customer'
        );
        
        console.log('✅ Email sent successfully:', result);
        console.log('📧 Check your email inbox for the invoice with PDF attachment!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('Stack:', error.stack);
    }
}

testEmailWithPDF();
