
import { GoogleGenAI } from "@google/genai";

const API_KEY = (typeof process !== "undefined" && process.env?.API_KEY) || (import.meta as any).env?.VITE_GEMINI_API_KEY || "";

if (!API_KEY) {
  console.warn("Gemini API key is not set. AI features will be disabled until VITE_GEMINI_API_KEY is configured.");
}

const getAiClient = () => {
  if (!API_KEY) return null;
  try {
    return new GoogleGenAI({ apiKey: API_KEY });
  } catch (err) {
    console.error("Failed to initialize GoogleGenAI:", err);
    return null;
  }
};

export const generateProductDescription = async (
  productName: string,
  keywords: string
): Promise<string> => {
  const ai = getAiClient();
  if (!ai) {
    return "API Key belum dikonfigurasi. Fitur AI Generative saat ini dinonaktifkan.";
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
    });

    return response.text || "Deskripsi gagal dibuat.";
  } catch (error) {
    console.error("Error generating product description:", error);
    return "Failed to generate description due to an API error.";
  }
};
