import cluster from "cluster";
import { VoyageAIClient } from "voyageai";

const client = new VoyageAIClient({ apiKey: process.env.VOYAGEAI_API_KEY });

export async function generateVoyageProductEmbeddings(text: string): Promise<number[] | null> {
  try {
    const response = await client.embed({
      input: text,
      model: "voyage-3-large",
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
