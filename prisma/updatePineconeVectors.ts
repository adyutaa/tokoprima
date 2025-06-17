// File: updatePineconeVectors.ts
import { PrismaClient, Product } from "@prisma/client";
import { Pinecone, PineconeRecord, RecordMetadata } from "@pinecone-database/pinecone";
import { generateProductEmbeddings } from "../src/lib/embeddings"; // Pastikan path ini benar
import { generateVoyageProductEmbeddings } from "../src/lib/VoyageAI"; // Pastikan path ini benar
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize Prisma Client
const prisma = new PrismaClient();

// Initialize Pinecone
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY as string });

// Define configurations for different models (sama seperti script Anda)
const modelConfigs = {
  openai: {
    indexName: "ecommerce-3-large",
    namespace: "products-1",
    generateEmbeddings: generateProductEmbeddings,
  },
  voyage: {
    indexName: "ecommerce-voyage-3-large",
    namespace: "products-1",
    generateEmbeddings: generateVoyageProductEmbeddings,
  },
};

// Create Pinecone service (sama seperti script Anda)
function createPineconeService(indexName: string, namespace: string) {
  const ns = pc.Index(indexName).namespace(namespace);
  return {
    async upsertProductVector(productId: number, embedding: number[], metadata: RecordMetadata): Promise<void> {
      const vector: PineconeRecord<RecordMetadata> = {
        id: productId.toString(),
        values: embedding,
        metadata,
      };
      await ns.upsert([vector]);
    },
  };
}

// Fungsi utama untuk mengupdate vektor di Pinecone
async function updateAllPineconeVectors(batchSize: number = 20) {
  try {
    console.log("Memulai proses update vektor di Pinecone...");

    // 1. Ambil SEMUA produk dari database Supabase (dengan deskripsi yang sudah diupdate)
    console.log("Mengambil data produk terbaru dari database...");
    const products: Product[] = await prisma.product.findMany();
    console.log(`Ditemukan ${products.length} produk untuk diupdate.`);

    if (products.length === 0) {
      console.log("Tidak ada produk yang ditemukan. Proses dihentikan.");
      return;
    }

    // Inisialisasi Pinecone services
    const openaiPineconeService = createPineconeService(modelConfigs.openai.indexName, modelConfigs.openai.namespace);
    const voyagePineconeService = createPineconeService(modelConfigs.voyage.indexName, modelConfigs.voyage.namespace);

    // 2. Proses produk dalam batch untuk regenerasi embedding dan upsert
    console.log("Memulai regenerasi embedding dan proses upsert ke Pinecone...");
    const total = products.length;
    for (let i = 0; i < total; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      console.log(`Memproses batch ${Math.floor(i / batchSize) + 1} dari ${Math.ceil(total / batchSize)}...`);

      await Promise.all(
        batch.map(async (product) => {
          const { id, name, description, categories, price } = product;

          // INI BAGIAN KUNCINYA:
          // 'description' di sini adalah deskripsi BARU (Bahasa Inggris) yang sudah Anda update di Supabase.
          const embeddingText = `${name} ${description || ""} ${categories.join(" ")}`;

          const metadata: RecordMetadata = {
            name,
            description: description || "",
            categories: categories.join(","),
            price: price.toString(),
          };

          try {
            // Generate & Upsert untuk OpenAI
            const openaiEmbedding = await modelConfigs.openai.generateEmbeddings(embeddingText);
            await openaiPineconeService.upsertProductVector(id, openaiEmbedding, metadata);

            // Generate & Upsert untuk Voyage AI
            const voyageEmbedding = await modelConfigs.voyage.generateEmbeddings(embeddingText);
            await voyagePineconeService.upsertProductVector(id, voyageEmbedding, metadata);

            console.log(`✓ Vektor untuk produk ID: ${id} (${name.substring(0, 20)}...) berhasil diupdate.`);
          } catch (error) {
            console.error(`✗ Gagal memproses embedding untuk produk ID: ${id}. Error:`, error);
          }
        })
      );
    }

    console.log(`\nProses update Pinecone selesai! ${total} vektor produk telah di-upsert dengan embedding terbaru.`);
  } catch (error) {
    console.error("Terjadi kesalahan besar dalam proses update Pinecone:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Jalankan fungsi update
updateAllPineconeVectors();
