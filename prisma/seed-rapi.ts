import { PrismaClient } from "@prisma/client";
import fs from "fs";
import csvParser from "csv-parser";
import { Pinecone, PineconeRecord, RecordMetadata } from "@pinecone-database/pinecone";
import { generateProductEmbeddings } from "../src/lib/embeddings";
import { generateVoyageProductEmbeddings } from "../src/lib/VoyageAI";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";
import https from "https";
import http from "http";

// Load environment variables
dotenv.config();

// Initialize Prisma Client
const prisma = new PrismaClient();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Pinecone
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY as string });

// Define an interface for embedding services
interface EmbeddingService {
  generateEmbeddings(text: string): Promise<number[] | null>;
}

class OpenAIEmbeddingService implements EmbeddingService {
  async generateEmbeddings(text: string): Promise<number[] | null> {
    return generateProductEmbeddings(text);
  }
}

class VoyageEmbeddingService implements EmbeddingService {
  async generateEmbeddings(text: string): Promise<number[] | null> {
    return generateVoyageProductEmbeddings(text);
  }
}

interface PineconeIndexService {
  upsertProductVector(productId: number, embedding: number[], metadata: RecordMetadata): Promise<void>;
  deleteProductVector(productId: number): Promise<void>;
}

class PineconeIndexServiceImpl implements PineconeIndexService {
  private ns: any;

  constructor(indexName: string, namespace: string) {
    this.ns = pc.Index(indexName).namespace(namespace);
  }

  async upsertProductVector(productId: number, embedding: number[], metadata: RecordMetadata): Promise<void> {
    const vector: PineconeRecord<RecordMetadata> = {
      id: productId.toString(),
      values: embedding,
      metadata,
    };
    await this.ns.upsert([vector]);
  }

  async deleteProductVector(productId: number): Promise<void> {
    await this.ns.deleteOne(productId.toString());
  }
}

const mimeTypes: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".bmp": "image/bmp",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return mimeTypes[ext] || "application/octet-stream";
}

async function downloadAndUploadImage(imageUrl: string, productId: string): Promise<string> {
  try {
    const cleanedUrl = cleanUrl(imageUrl);
    if (!cleanedUrl) {
      console.error(`Invalid URL for product ${productId}:`, imageUrl);
      return "";
    }

    console.log(`Downloading image from: ${cleanedUrl}`);

    const bucketName = "ecommerce";
    const protocol = cleanedUrl.startsWith("https") ? https : http;

    const response = await new Promise<Buffer>((resolve, reject) => {
      protocol.get(cleanedUrl, (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", reject);
      });
    });

    console.log(`Downloaded image for product ${productId}: ${cleanedUrl}`);

    const mimeType = getMimeType(cleanedUrl);
    const uniqueFilename = `${Date.now()}_${path.basename(cleanedUrl)}`;
    const { data, error } = await supabase.storage.from(bucketName).upload(`products/${uniqueFilename}`, response, {
      cacheControl: "3600",
      upsert: false,
      contentType: mimeType,
    });

    if (error) {
      console.error(`Error uploading image to Supabase: ${error.message}`);
      return "";
    }

    const publicURL = supabase.storage.from(bucketName).getPublicUrl(`products/${uniqueFilename}`).data.publicUrl;
    console.log(`Uploaded image for product ${productId}: ${publicURL}`); // Log successful upload

    return publicURL;
  } catch (error) {
    console.error(`Failed to download/upload image for product ${productId}:`, error);
    return "";
  }
}

/// SWITCH MODEL DI SINI ////////
const embeddingService: EmbeddingService = new VoyageEmbeddingService(); // Switch to VoyageEmbeddingService if needed
const pineconeService: PineconeIndexService = new PineconeIndexServiceImpl("ecommerce-voyage-3-large", "products-1");

// Helper function to clean and validate URLs
function cleanUrl(url: string): string | null {
  const cleanedUrl = url.replace(/[\[\]"]/g, "").trim();
  try {
    new URL(cleanedUrl);
    return cleanedUrl;
  } catch (error) {
    console.error(`Invalid URL: ${cleanedUrl}`);
    return null;
  }
}

async function seedDatabase() {
  try {
    const filePath = "./Dataset/camera_accessories_final_descriptions.csv";
    const records: any[] = [];

    // Read CSV file
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on("data", (row: Record<string, string>) => {
          records.push(row);
        })
        .on("end", resolve)
        .on("error", reject);
    });

    // Seed data into Supabase (PostgreSQL) via Prisma
    for (const record of records) {
      const { name, categories, description, price, images } = record;

      // Check if images field is missing or empty
      if (!images || images.trim() === "") {
        console.log(`No images found for product ${name}. Skipping product.`);
        continue; // Skip this product if there are no images
      }

      const imageUrls = images.split(",").map((img: string) => img.trim());
      console.log(`Image URLs for product ${name}:`, imageUrls); // Log the extracted image URLs

      // Proceed with downloading and uploading images
      const uploadedImages: string[] = [];
      for (const imageUrl of imageUrls) {
        const uploadedImageUrl = await downloadAndUploadImage(imageUrl, name);
        if (uploadedImageUrl) {
          uploadedImages.push(uploadedImageUrl); // Add the URL to the array
        }
      }

      console.log(`Uploaded images for product ${name}:`, uploadedImages); // Log uploaded images

      // Convert categories to an array
      const categoryArray = categories ? categories.split(",") : [];

      // Insert the product without specifying the `id` (let Supabase handle it)
      const product = await prisma.product.create({
        data: {
          name,
          categories: categoryArray,
          description,
          price: parseFloat(price),
          images: uploadedImages,
        },
      });

      console.log(`Inserted product into Supabase with generated ID: ${product.id}`);

      // Generate embeddings for the product (using description or name)
      const embedding = await embeddingService.generateEmbeddings(description || name);
      if (!embedding) {
        console.error(`Failed to generate embedding for product: ${name}`);
        continue; // Skip if embedding fails
      }

      // Insert or update vector in Pinecone
      await pineconeService.upsertProductVector(product.id, embedding, { name, description, categories, price });

      console.log(`Upserted vector into Pinecone for product ID: ${product.id}`);
    }

    console.log("Seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedDatabase();
