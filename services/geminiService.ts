
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("Gemini API key is not set. Please set the process.env.API_KEY environment variable.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const generateProductDescription = async (
  productName: string,
  keywords: string
): Promise<string> => {
  if (!API_KEY) {
    return "API Key not configured. Please check the console for instructions.";
  }

  const prompt = `
    Generate a compelling and concise product description for a retail store.

    **Product Name:** ${productName}
    **Keywords:** ${keywords}

    The description should be professional, engaging, and around 2-3 sentences long. Highlight the key benefits and features based on the provided information. Do not use markdown or special formatting.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 1,
        topK: 32,
        maxOutputTokens: 150,
        thinkingConfig: { thinkingBudget: 0 } // Disable thinking for faster response
      }
    });
    
    return response.text.trim();
  } catch (error) {
    console.error("Error generating product description:", error);
    return "Failed to generate description due to an API error.";
  }
};
