
import { GoogleGenAI, Type } from "@google/genai";
import type { ExtractedPurchaseDetails } from '../types';

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

export const extractPurchaseDetailsFromImage = async (imageFile: File): Promise<ExtractedPurchaseDetails> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const imagePart = await fileToGenerativePart(imageFile);
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
        parts: [
            imagePart,
            { text: "Extract the vendor name, purchase date, total amount, and line items (including description, quantity, unit price, and total) from this invoice or receipt. Ensure the date is in YYYY-MM-DD format." }
        ]
    },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          vendorName: { type: Type.STRING },
          purchaseDate: { type: Type.STRING, description: "Date in YYYY-MM-DD format" },
          totalAmount: { type: Type.NUMBER },
          lineItems: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                description: { type: Type.STRING },
                quantity: { type: Type.NUMBER },
                unitPrice: { type: Type.NUMBER },
                total: { type: Type.NUMBER },
              }
            }
          }
        }
      }
    }
  });

  try {
    // FIX: Trim whitespace from the response before parsing.
    const jsonString = response.text.trim();
    const details = JSON.parse(jsonString);
    return details;
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    throw new Error("Could not extract details from the document. The format may be unsupported.");
  }
};
