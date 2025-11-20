import { GoogleGenAI } from "@google/genai";
import { GEMINI_MODEL_NAME, SYSTEM_INSTRUCTION } from "../constants";

/**
 * Formats raw lyrics using the Gemini API.
 * @param rawLyrics The raw text input from the user.
 * @returns The formatted string.
 */
export const formatLyricsWithGemini = async (rawLyrics: string): Promise<string> => {
  try {
    if (!process.env.API_KEY) {
      throw new Error("API Key is missing. Please check your environment configuration.");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: rawLyrics,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.3, // Low temperature for deterministic formatting
      }
    });

    const text = response.text;
    
    if (!text) {
      throw new Error("Received empty response from Gemini.");
    }

    return text.trim();
  } catch (error) {
    console.error("Error formatting lyrics:", error);
    throw error;
  }
};
