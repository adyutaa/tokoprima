import { Pinecone, PineconeRecord, RecordMetadata } from "@pinecone-database/pinecone";

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY as string });

/**
 * Dynamically initialize Pinecone index based on indexName.
 */
export async function initializePinecone(indexName: string) {
  try {
    const existingIndexes = await pc.listIndexes();

    if (!existingIndexes.indexes?.some((index) => index.name === indexName)) {
      console.log(`Creating index "${indexName}"...`);
      await pc.createIndex({
        name: indexName,
        dimension: indexName === "ecommerce-3-large" ? 3072 : 1024, 
        metric: "cosine" as const,
        spec: {
          serverless: {
            cloud: "aws" as const,
            region: "us-east-1",
          },
        },
      });
      console.log(`Index "${indexName}" created!`);
    } else {
      console.log(`Index "${indexName}" exists.`);
    }

    const index = await pc.describeIndex(indexName);
    console.log(`Retrieved index "${index.name}".`);

    return index;
  } catch (error) {
    console.error("Error initializing Pinecone:", error);
    throw error;
  }
}

/**
 * Upsert product vector into Pinecone index based on model (indexName).
 */
export async function upsertProductVector(productId: number, embedding: number[], metadata: RecordMetadata, indexName: string): Promise<void> {
  const vector: PineconeRecord<RecordMetadata> = {
    id: productId.toString(),
    values: embedding,
    metadata,
  };

  const index = pc.Index(indexName); // Dynamically use the indexName here
  await index.namespace("products-1").upsert([vector]);
}

/**
 * Perform a vector search on Pinecone based on the given queryEmbedding and indexName.
 */
export async function searchProductVectors(queryEmbedding: number[], indexName: string, topK: number = 15) {
  const index = pc.Index(indexName); // Dynamically use the indexName here
  return await index.namespace("products-1").query({
    vector: queryEmbedding,
    topK,
    includeMetadata: true,
  });
}
