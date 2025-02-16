import prisma from "../../../../lib/prisma";
import { generateProductEmbeddings } from "@/lib/embeddings";
import { upsertProductVector, updateProductVector, deleteProductVector, searchProductVectors } from "@/lib/PineconeService";
import { TPineconeProduct, TProduct } from "@/types";
import { getImageUrl } from "@/lib/supabase";

/**
 * Buat produk baru di PostgreSQL dan upsert vector-nya ke Pinecone.
 */
export async function createProduct(data: { name: string; description: string; categories: string[]; price: number; images: string[] }): Promise<TProduct> {
  const newProduct = await prisma.product.create({ data });

  const embeddingText = `${newProduct.name} ${newProduct.description} ${newProduct.categories}`;
  const embedding = await generateProductEmbeddings(embeddingText);
  if (embedding && embedding.length > 0) {
    await upsertProductVector(newProduct.id, embedding, {
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
 * Perbarui produk dan vector-nya.
 */
export async function updateProduct(
  id: number,
  data: {
    name: string;
    description: string;
    categories: string[];
    price: number;
    images: string[];
  }
): Promise<TProduct> {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new Error("Product not found");

  const updatedProduct = await prisma.product.update({
    where: { id },
    data,
  });

  let embedding: number[] | undefined;
  // Hanya generate embedding baru jika ada perubahan signifikan (misalnya nama atau deskripsi)
  if (updatedProduct.name !== product.name || updatedProduct.description !== product.description) {
    const embeddingText = `${updatedProduct.name} ${updatedProduct.description} ${updatedProduct.categories}`;
    embedding = await generateProductEmbeddings(embeddingText);
  }

  await updateProductVector(updatedProduct.id, embedding, {
    name: updatedProduct.name,
    description: updatedProduct.description,
    category_id: updatedProduct.categories,
    price: updatedProduct.price.toString(),
    images: updatedProduct.images,
  });

  return updatedProduct;
}

/**
 * Hapus produk dan vector-nya.
 */
export async function deleteProduct(id: number): Promise<void> {
  // Hapus data di PostgreSQL
  await prisma.product.delete({ where: { id } });
  // Hapus vector yang bersangkutan di Pinecone
  await deleteProductVector(id);
}

/**
 * Pencarian produk dengan gabungan pencarian eksak (PostgreSQL) dan pencarian semantik (Pinecone).
 */
export async function searchProducts(searchQuery: string): Promise<TProduct[]> {
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

  const queryEmbedding = await generateProductEmbeddings(searchQuery);
  console.log("Query Embedding:", queryEmbedding);
  if (!queryEmbedding || queryEmbedding.length === 0) {
    throw new Error("Gagal menghasilkan embedding untuk query pencarian");
  }
  const queryResponse = await searchProductVectors(queryEmbedding);
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
