// embedding.ts

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generates embeddings for the given text using OpenAI's API.
 * @param text - The input text to generate embeddings for.
 * @returns An array of numbers representing the embedding or null if failed.
 */
export async function generateProductEmbeddings(text: string): Promise<number[] | null> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text,
    });
    const productEmbeddings = response.data[0].embedding;
    if (response.data && response.data && response.data.length > 0 && response.data[0].embedding) {
      return productEmbeddings;
    } else {
      console.error("Invalid embedding response structure:", response.data);
      return null;
    }
  } catch (error: any) {
    console.error("Failed to generate product embeddings:", error.response?.data || error.message || error);
    return null;
  }
}
