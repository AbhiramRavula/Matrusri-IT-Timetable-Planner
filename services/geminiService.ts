
import { GoogleGenAI } from "@google/genai";

export const getGeminiAssistance = async (prompt: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are an expert academic scheduler at Matrusri Engineering College. Help the IT Department HoD optimize timetables, explain scheduling conflicts, and suggest better period allocations based on pedagogical best practices.",
      },
    });
    return response.text || "No response from AI assistant.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I encountered an error while processing your request. Please ensure the API key is valid.";
  }
};
