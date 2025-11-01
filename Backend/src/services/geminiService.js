const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

class GeminiService {
  static async extractPurchaseDetails(fileBuffer, mimeType) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `
        Analyze this purchase receipt/invoice image and extract the following information in JSON format:
        {
          "vendorName": "string",
          "purchaseDate": "YYYY-MM-DD",
          "totalAmount": number,
          "lineItems": [
            {
              "description": "string",
              "quantity": number,
              "unitPrice": number,
              "total": number
            }
          ]
        }

        Rules:
        - Extract vendor/supplier name
        - Extract purchase date in YYYY-MM-DD format
        - Extract total amount as a number
        - Extract line items with description, quantity, unit price, and total
        - If any field is not found, use null or empty array
        - Return only valid JSON, no additional text
      `;

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: mimeType,
            data: fileBuffer.toString('base64')
          }
        }
      ]);

      const response = await result.response;
      const text = response.text();

      // Clean the response to ensure it's valid JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid JSON response from Gemini');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error('Failed to extract purchase details');
    }
  }

  static async chat(message, history = []) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const chat = model.startChat({
        history: history.map(h => ({
          role: h.role,
          parts: [{ text: h.text }]
        }))
      });

      const result = await chat.sendMessage(message);
      const response = await result.response;

      return response.text();
    } catch (error) {
      console.error('Gemini chat error:', error);
      throw new Error('Failed to get chat response');
    }
  }
}

module.exports = GeminiService;