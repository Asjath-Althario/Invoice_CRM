const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  async extractPurchaseDetails(imageBuffer, mimeType) {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `
        Analyze this receipt image and extract the following information in JSON format:
        {
          "supplier": "supplier name",
          "invoice_number": "invoice number",
          "date": "date in YYYY-MM-DD format",
          "items": [
            {
              "description": "item description",
              "quantity": quantity,
              "unit_price": unit_price,
              "total": total
            }
          ],
          "subtotal": subtotal,
          "tax": tax_amount,
          "total": total_amount
        }

        If any information is not available, use null or empty string.
      `;

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: mimeType,
            data: imageBuffer.toString('base64')
          }
        }
      ]);

      const response = result.response.text();
      return JSON.parse(response);
    } catch (error) {
      console.error('Gemini service error:', error);
      throw new Error('Failed to extract purchase details from image');
    }
  }

  async chat(message, history = []) {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const chat = model.startChat({
        history: history.map(h => ({
          role: h.role,
          parts: [{ text: h.content }]
        }))
      });

      const result = await chat.sendMessage(message);
      return result.response.text();
    } catch (error) {
      console.error('Gemini chat error:', error);
      throw new Error('Failed to process chat message');
    }
  }
}

module.exports = new GeminiService();