import prisma from "../../../../lib/prisma";
import { generateProductEmbeddings } from "@/lib/embeddings";
import { generateVoyageProductEmbeddings } from "@/lib/VoyageAI";
import { upsertProductVector, updateProductVector, deleteProductVector, searchProductVectors } from "@/lib/PineconeService"; // Fungsi-fungsi Pinecone
import { TPineconeProduct, TProduct } from "@/types";
import { getImageUrl } from "@/lib/supabase";
import { RecordMetadata } from "@pinecone-database/pinecone";

/**
 * Membuat produk baru di PostgreSQL dan upsert vector-nya ke Pinecone.
 */
export async function createProduct(data: { name: string; description: string; categories: string[]; price: number; images: string[] }): Promise<TProduct> {
  const newProduct = await prisma.product.create({ data });

  const embeddingService = createEmbeddingService("voyage"); // Ubah model embeddings sesuai yang diinginkan (openai / voyage)
  const pineconeService = createPineconeService("ecommerce-voyage-3-large", "products-1"); // Ganti index sesuai yang diinginkan

  const embeddingText = `${newProduct.name} ${newProduct.description} ${newProduct.categories}`;
  const embedding = await embeddingService.generateEmbeddings(embeddingText);

  if (embedding && embedding.length > 0) {
    await pineconeService.upsertProductVector(newProduct.id, embedding, {
      name: newProduct.name,
      description: newProduct.description,
      categories: newProduct.categories,
      price: newProduct.price.toString(),
    });
  } else {
    console.error("Gagal menghasilkan embedding untuk produk:", newProduct.id);
  }

  return newProduct;
}

/**
 * Memperbarui produk dan vector-nya.
 */
export async function updateProduct(id: number, data: { name: string; description: string; categories: string[]; price: number; images: string[] }): Promise<TProduct> {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new Error("Product not found");

  const updatedProduct = await prisma.product.update({
    where: { id },
    data,
  });

  const embeddingService = createEmbeddingService("voyage"); // Ubah model embeddings sesuai yang diinginkan (openai / voyage)
  const pineconeService = createPineconeService("ecommerce-voyage-3-large", "products-1"); // Ganti index sesuai yang diinginkan

  let embedding: number[] | undefined;
  // Hanya generate embedding baru jika ada perubahan signifikan (misalnya nama atau deskripsi)
  if (updatedProduct.name !== product.name || updatedProduct.description !== product.description) {
    const embeddingText = `${updatedProduct.name} ${updatedProduct.description} ${updatedProduct.categories}`;
    embedding = await embeddingService.generateEmbeddings(embeddingText);
  }

  await pineconeService.updateProductVector(updatedProduct.id, embedding, {
    name: updatedProduct.name,
    description: updatedProduct.description,
    categories: updatedProduct.categories,
    price: updatedProduct.price.toString(),
  });

  return updatedProduct;
}

/**
 * Menghapus produk dan vector-nya.
 */
export async function deleteProduct(id: number): Promise<void> {
  // Hapus data di PostgreSQL
  await prisma.product.delete({ where: { id } });

  // Hapus vector yang bersangkutan di Pinecone
  const pineconeService = createPineconeService("ecommerce-voyage-3-large", "products-1"); // Ganti index sesuai yang diinginkan
  await pineconeService.deleteProductVector(id);
}

/**
 * Pencarian produk dengan gabungan pencarian eksak (PostgreSQL) dan pencarian semantik (Pinecone).
 */
export async function searchProducts(searchQuery: string): Promise<TProduct[]> {
  const embeddingService = createEmbeddingService("voyage"); // Ubah model embeddings sesuai yang diinginkan (openai / voyage)
  const pineconeService = createPineconeService("ecommerce-voyage-3-large", "products-1"); // Ganti index sesuai yang diinginkan

  const searchTokens = searchQuery.toLowerCase().split(/\s+/);
  const exactMatches = await prisma.product.findMany({
    where: {
      AND: searchTokens.map((token) => ({
        OR: [{ name: { contains: token, mode: "insensitive" } }],
      })),
    },
    select: {
      id: true,
      images: true,
      name: true,
      description: true,
      categories: true,
      price: true,
    },
  });

  const exactProducts: TProduct[] = exactMatches.map((product) => ({
    ...product,
    image_url: product.images && product.images.length > 0 ? (product.images[0].startsWith("http") ? product.images[0] : getImageUrl(product.images[0], "products")) : null,
    categories: product.categories,
  }));

  const queryEmbedding = await embeddingService.generateEmbeddings(searchQuery);
  console.log("Query Embedding:", queryEmbedding);
  if (!queryEmbedding || queryEmbedding.length === 0) {
    throw new Error("Gagal menghasilkan embedding untuk query pencarian");
  }

  const queryResponse = await pineconeService.searchProductVectors(queryEmbedding);
  console.log("Pinecone Query Response:", queryResponse);

  const vectorProductIds = (queryResponse.matches || []).map((match) => parseInt(match.id, 10)).filter((id) => !exactMatches.some((prod) => prod.id === id));

  let vectorProducts: TPineconeProduct[] = [];
  if (vectorProductIds.length > 0) {
    const vectorResults = await prisma.product.findMany({
      where: { id: { in: vectorProductIds } },
      select: {
        id: true,
        images: true,
        name: true,
        description: true,
        categories: true,
        price: true,
      },
    });
    vectorProducts = vectorResults.map((product) => ({
      id: product.id,
      categories: product.categories,
      images: product.images && product.images.length > 0 ? [product.images[0].startsWith("http") ? product.images[0] : getImageUrl(product.images[0], "products")] : [],
      name: product.name,
      description: product.description,
      price: product.price,
    }));
  }

  return [...exactProducts, ...vectorProducts];
}

/**
 * Helper function to create embedding service based on model type (OpenAI or Voyage).
 */
function createEmbeddingService(model: "openai" | "voyage") {
  if (model === "openai") {
    return {
      generateEmbeddings: generateProductEmbeddings,
    };
  } else {
    return {
      generateEmbeddings: generateVoyageProductEmbeddings,
    };
  }
}

/**
 * Helper function to create Pinecone service based on index and namespace.
 */
function createPineconeService(indexName: string, namespace: string) {
  return {
    upsertProductVector: (productId: number, embedding: number[], metadata: RecordMetadata) => upsertProductVector(productId, embedding, metadata),
    updateProductVector: (productId: number, embedding: number[] | undefined, metadata: RecordMetadata) => updateProductVector(productId, embedding, metadata),
    deleteProductVector: (productId: number) => deleteProductVector(productId),
    searchProductVectors: (queryEmbedding: number[]) => searchProductVectors(queryEmbedding),
  };
}
