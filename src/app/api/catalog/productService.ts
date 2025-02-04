import prisma from "../../../../lib/prisma";
import { generateProductEmbeddings } from "@/lib/embeddings";
import { upsertProductVector, updateProductVector, deleteProductVector, searchProductVectors } from "@/lib/PineconeService";
import { ProductStock } from "@prisma/client";
import { TPineconeProduct, TProduct } from "@/types";
import { getImageUrl } from "@/lib/supabase";

/**
 * Buat produk baru di PostgreSQL dan upsert vector-nya ke Pinecone.
 */
export async function createProduct(data: { name: string; description: string; category_id: number; price: number; stock: ProductStock; images: string[] }): Promise<TProduct> {
  // Pertimbangkan untuk membungkus operasi ini dengan transaksi jika ingin menjamin konsistensi.
  const newProduct = await prisma.product.create({ data });

  // Buat embedding dengan menggabungkan informasi relevan
  const embeddingText = `${newProduct.name} ${newProduct.description} ${newProduct.category_id}`;
  const embedding = await generateProductEmbeddings(embeddingText);
  if (embedding && embedding.length > 0) {
    await upsertProductVector(newProduct.id, embedding, {
      name: newProduct.name,
      description: newProduct.description,
      category_id: newProduct.category_id,
      price: newProduct.price.toString(),
      stock: newProduct.stock,
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
    category_id: number;
    price: number;
    stock: ProductStock;
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
    const embeddingText = `${updatedProduct.name} ${updatedProduct.description} ${updatedProduct.category_id}`;
    embedding = await generateProductEmbeddings(embeddingText);
  }

  await updateProductVector(updatedProduct.id, embedding, {
    name: updatedProduct.name,
    description: updatedProduct.description,
    category_id: updatedProduct.category_id,
    price: updatedProduct.price.toString(),
    stock: updatedProduct.stock.toString(),
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
  // Pencarian eksak: gunakan query berbasis token
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
      category: { select: { name: true } },
      price: true,
    },
  });

  // In searchProducts function, when mapping results:
  const exactProducts: TProduct[] = exactMatches.map((product) => ({
    ...product, // Include all product fields, including 'images'
    image_url: product.images && product.images.length > 0 ? (product.images[0].startsWith("http") ? product.images[0] : getImageUrl(product.images[0], "products")) : null,
    category: { name: product.category.name }, // Adjust according to your type
  }));

  // Pencarian semantik: buat embedding query dan cari di Pinecone
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
        category: { select: { name: true } },
        price: true,
      },
    });
    vectorProducts = vectorResults.map((product) => ({
      id: product.id,
      category_name: product.category.name,
      image_url: product.images && product.images.length > 0 ? (product.images[0].startsWith("http") ? product.images[0] : getImageUrl(product.images[0], "products")) : null,
      name: product.name,
      price: Number(product.price),
    }));
  }

  return [...exactProducts, ...vectorProducts];
}
