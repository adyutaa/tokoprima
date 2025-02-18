import { Pinecone, PineconeRecord, RecordMetadata } from "@pinecone-database/pinecone";

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY as string });

interface PineconeConfig {
  indexName: string;
  namespace: string;
  dimension: number;
  metric: "cosine" | "euclidean" | "dotproduct";
  cloud: "aws" | "gcp";
  region: string;
}

// const INDEX_CONFIG = {
//   name: "ecommerce-3-large",
//   namespace: "products-1",
//   dimension: 3072,
//   metric: "cosine" as const,
//   spec: {
//     serverless: {
//       cloud: "aws" as const,
//       region: "us-east-1",
//     },
//   },
// };

const INDEX_CONFIG = {
  name: "ecommerce-voyage-3-large",
  namespace: "products-1",
  dimension: 1024,
  metric: "cosine" as const,
  spec: {
    serverless: {
      cloud: "aws" as const,
      region: "us-east-1",
    },
  },
};

export async function initializePinecone() {
  try {
    const existingIndexes = await pc.listIndexes();

    if (!existingIndexes.indexes?.some((index) => index.name === INDEX_CONFIG.name)) {
      console.log(`Creating index "${INDEX_CONFIG.name}"...`);
      await pc.createIndex({
        name: INDEX_CONFIG.name,
        dimension: INDEX_CONFIG.dimension,
        metric: INDEX_CONFIG.metric,
        spec: INDEX_CONFIG.spec,
      });
      console.log(`Index "${INDEX_CONFIG.name}" created!`);
    } else {
      console.log(`Index "${INDEX_CONFIG.name}" exists.`);
    }

    const index = await pc.describeIndex(INDEX_CONFIG.name);
    console.log(`Retrieved index "${index.name}".`);

    return index;
  } catch (error) {
    console.error("Error initializing Pinecone:", error);
    throw error;
  }
}

/**
 * Upsert vector untuk produk ke Pinecone.
 */
export async function upsertProductVector(productId: number, embedding: number[], metadata: RecordMetadata): Promise<void> {
  const vector: PineconeRecord<RecordMetadata> = {
    id: productId.toString(),
    values: embedding,
    metadata,
  };

  const index = pc.Index(INDEX_CONFIG.name);
  await index.namespace(INDEX_CONFIG.namespace).upsert([vector]);
}

/**
 * Update vector produk secara parsial.
 * Gunakan operasi update jika hanya ingin mengubah vector atau metadata tertentu.
 */
export async function updateProductVector(productId: number, embedding: number[] | undefined, metadata: RecordMetadata): Promise<void> {
  // Berdasarkan dokumentasi terbaru, jika ingin update parsial, gunakan operasi update.

  const updateData: any = { id: productId.toString(), metadata };
  if (embedding && embedding.length > 0) {
    updateData.values = embedding;
  }
  const index = pc.Index(INDEX_CONFIG.name);
  await index.namespace(INDEX_CONFIG.namespace).update(updateData);
}

/**
 * Hapus vector produk dari Pinecone.
 */
export async function deleteProductVector(productId: number): Promise<void> {
  const index = pc.Index(INDEX_CONFIG.name);
  await index.namespace(INDEX_CONFIG.namespace).deleteOne(productId.toString());
}

/**
 * Pencarian vector produk berdasarkan query embedding.
 */
export async function searchProductVectors(queryEmbedding: number[], topK: number = 15) {
  const index = pc.Index(INDEX_CONFIG.name);
  return await index.namespace(INDEX_CONFIG.namespace).query({
    vector: queryEmbedding,
    topK,
    includeMetadata: true,
    // includeValues: false, jika tidak diperlukan
  });
}
