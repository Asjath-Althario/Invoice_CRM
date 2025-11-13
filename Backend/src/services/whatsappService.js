const axios = require('axios');

class WhatsAppService {
  constructor() {
    // You can use Twilio, WhatsApp Business API, or other WhatsApp services
    // This example uses Twilio WhatsApp
    this.twilioAccountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.twilioAuthToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
    
    // Alternatively, you can use WhatsApp Business API
    this.whatsappBusinessApiUrl = process.env.WHATSAPP_API_URL || '';
    this.whatsappBusinessToken = process.env.WHATSAPP_API_TOKEN || '';
  }

  /**
   * Format phone number for WhatsApp
   */
  formatPhoneNumber(phone) {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Add country code if not present (assuming +1 for US/Canada, change as needed)
    if (!cleaned.startsWith('1') && cleaned.length === 10) {
      cleaned = '1' + cleaned;
    }
    
    return `whatsapp:+${cleaned}`;
  }

  /**
   * Send invoice alert via Twilio WhatsApp
   */
  async sendInvoiceAlert(toPhone, customerName, invoice) {
    try {
      const formattedPhone = this.formatPhoneNumber(toPhone);
      
      const message = `
🧾 *New Invoice Generated*

Hello ${customerName}!

A new invoice has been created for your subscription:

📋 Invoice: ${invoice.invoice_number}
📅 Issue Date: ${invoice.issue_date}
⏰ Due Date: ${invoice.due_date}
💰 Amount: $${parseFloat(invoice.total).toFixed(2)}

Please make the payment before the due date.

View invoice: ${process.env.APP_URL || 'http://localhost:5173'}/invoice/${invoice.id}

Thank you for your business!
      `.trim();

      // Using Twilio WhatsApp API
      if (this.twilioAccountSid && this.twilioAuthToken) {
        const response = await axios.post(
          `https://api.twilio.com/2010-04-01/Accounts/${this.twilioAccountSid}/Messages.json`,
          new URLSearchParams({
            From: this.twilioWhatsAppNumber,
            To: formattedPhone,
            Body: message
          }),
          {
            auth: {
              username: this.twilioAccountSid,
              password: this.twilioAuthToken
            }
          }
        );
        
        console.log('WhatsApp message sent via Twilio:', response.data.sid);
        return response.data;
      }
      
      // Using WhatsApp Business API (alternative method)
      if (this.whatsappBusinessApiUrl && this.whatsappBusinessToken) {
        const response = await axios.post(
          this.whatsappBusinessApiUrl,
          {
            messaging_product: 'whatsapp',
            to: toPhone.replace(/\D/g, ''),
            type: 'text',
            text: {
              body: message
            }
          },
          {
            headers: {
              'Authorization': `Bearer ${this.whatsappBusinessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('WhatsApp message sent via Business API:', response.data);
        return response.data;
      }
      
      // If no credentials are configured, log the message
      console.log('[WhatsApp] Service not configured. Message would be:', message);
      return { status: 'skipped', reason: 'WhatsApp service not configured' };
      
    } catch (error) {
      console.error('Error sending WhatsApp alert:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Send payment reminder via WhatsApp
   */
  async sendPaymentReminder(toPhone, customerName, invoice) {
    try {
      const formattedPhone = this.formatPhoneNumber(toPhone);
      
      const message = `
⏰ *Payment Reminder*

Dear ${customerName},

This is a friendly reminder about your upcoming invoice payment:

📋 Invoice: ${invoice.invoice_number}
⏰ Due Date: ${invoice.due_date}
💰 Amount Due: $${parseFloat(invoice.total).toFixed(2)}

⚠️ Please process the payment soon to avoid service interruption.

Pay now: ${process.env.APP_URL || 'http://localhost:5173'}/invoice/${invoice.id}

Thank you!
      `.trim();

      if (this.twilioAccountSid && this.twilioAuthToken) {
        const response = await axios.post(
          `https://api.twilio.com/2010-04-01/Accounts/${this.twilioAccountSid}/Messages.json`,
          new URLSearchParams({
            From: this.twilioWhatsAppNumber,
            To: formattedPhone,
            Body: message
          }),
          {
            auth: {
              username: this.twilioAccountSid,
              password: this.twilioAuthToken
            }
          }
        );
        
        console.log('WhatsApp reminder sent via Twilio:', response.data.sid);
        return response.data;
      }

      if (this.whatsappBusinessApiUrl && this.whatsappBusinessToken) {
        const response = await axios.post(
          this.whatsappBusinessApiUrl,
          {
            messaging_product: 'whatsapp',
            to: toPhone.replace(/\D/g, ''),
            type: 'text',
            text: {
              body: message
            }
          },
          {
            headers: {
              'Authorization': `Bearer ${this.whatsappBusinessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('WhatsApp reminder sent via Business API:', response.data);
        return response.data;
      }

      console.log('[WhatsApp] Service not configured. Reminder would be:', message);
      return { status: 'skipped', reason: 'WhatsApp service not configured' };
      
    } catch (error) {
      console.error('Error sending WhatsApp reminder:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = new WhatsAppService();
