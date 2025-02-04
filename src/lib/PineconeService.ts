import { Pinecone, PineconeRecord, RecordMetadata } from "@pinecone-database/pinecone";

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY as string });
const index = pc.index("ecommerce-test");
const NAMESPACE = "products";

/**
 * Upsert vector untuk produk ke Pinecone.
 */
export async function upsertProductVector(productId: number, embedding: number[], metadata: RecordMetadata): Promise<void> {
  const vector: PineconeRecord<RecordMetadata> = {
    id: productId.toString(),
    values: embedding,
    metadata,
  };

  await index.namespace(NAMESPACE).upsert([vector]);
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
  await index.namespace(NAMESPACE).update(updateData);
}

/**
 * Hapus vector produk dari Pinecone.
 */
export async function deleteProductVector(productId: number): Promise<void> {
  await index.namespace(NAMESPACE).deleteOne(productId.toString());
}

/**
 * Pencarian vector produk berdasarkan query embedding.
 */
export async function searchProductVectors(queryEmbedding: number[], topK: number = 15) {
  return await index.namespace(NAMESPACE).query({
    vector: queryEmbedding,
    topK,
    includeMetadata: true,
    // includeValues: false, jika tidak diperlukan
  });
}
