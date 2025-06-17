import { GoogleGenAI } from "@google/genai";

export async function generateGeminiProductEmbeddings(text: string): Promise<number[] | null> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.embedContent({
      model: "gemini-embedding-exp-03-07",
      contents: text,
      config: {
        taskType: "SEMANTIC_SIMILARITY",
      },
    });

    const productEmbeddings = response.embeddings[0].values;
    if (response.embeddings && response.embeddings.length > 0) {
      return productEmbeddings;
    } else {
      console.error("Invalid embedding response structure:", response.embeddings);
      return null;
    }
  } catch (error: any) {
    console.error("Failed to generate product embeddings:", error.response?.data || error.message || error);
    return null;
  }
}
