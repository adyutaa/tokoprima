// scripts/seedPinecone.ts
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import csvParser from "csv-parser";
import { Pinecone } from "@pinecone-database/pinecone";
import { generateProductEmbeddings } from "../src/lib/embeddings";
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
const index = pc.Index("ecommerce-3-large");
const ns = index.namespace("products-1");

// Map of common image MIME types
const mimeTypes: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".bmp": "image/bmp",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

// Helper function to get MIME type based on file extension
function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return mimeTypes[ext] || "application/octet-stream"; // Default if the MIME type isn't found
}

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

// Function to download and upload images to Supabase
async function downloadAndUploadImage(imageUrl: string, productId: string): Promise<string> {
  try {
    const cleanedUrl = cleanUrl(imageUrl);
    if (!cleanedUrl) return "";

    console.log(`Downloading image from: ${cleanedUrl}`);
    const bucketName = "ecommerce";
    const protocol = cleanedUrl.startsWith("https") ? https : http;

    // Download image stream
    const response = await new Promise<Buffer>((resolve, reject) => {
      protocol.get(cleanedUrl, (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", reject);
      });
    });

    console.log(`Downloaded image for product ${productId}`);

    // Get MIME type and upload
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

    return supabase.storage.from(bucketName).getPublicUrl(`products/${uniqueFilename}`).data.publicUrl;
  } catch (error) {
    console.error(`Failed to download/upload image for product ${productId}:`, error);
    return "";
  }
}

// Function to insert/update products in Supabase and sync with Pinecone
async function seedDatabase() {
  try {
    const filePath = "Categories-Refined.csv"; // Update this path
    const records: any[] = [];

    // Read CSV file
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on("data", (row: Record<string, string>) => records.push(row))
        .on("end", resolve)
        .on("error", reject);
    });

    for (const record of records) {
      const { id, name, categories, description, price, images } = record;
      console.log(`Processing ID: ${id} for product: ${name}`);

      if (!id || isNaN(parseInt(id))) {
        console.error(`Invalid ID for product: ${id}. Skipping product.`);
        continue;
      }

      if (!images || images.trim() === "") {
        console.log(`No images found for product ${id}. Skipping product.`);
        continue;
      }

      const imageUrls = images.split(",").map((img: string) => img.trim());
      const uploadedImages: string[] = [];

      for (const imageUrl of imageUrls) {
        const uploadedImageUrl = await downloadAndUploadImage(imageUrl, id.toString());
        if (uploadedImageUrl) uploadedImages.push(uploadedImageUrl);
      }

      // Split categories string into an array and clean up each category
      const categoryArray = categories ? categories.split(",").map((cat: string) => cat.trim().replace(/[\[\]'"]/g, "")) : [];

      // Insert or update product in Supabase
      const existingProduct = await prisma.product.findUnique({ where: { id: parseInt(id) } });

      if (existingProduct) {
        await prisma.product.update({
          where: { id: parseInt(id) },
          data: { name, categories: categoryArray, description, price: parseFloat(price), images: uploadedImages },
        });
      } else {
        await prisma.product.create({
          data: { id: parseInt(id), name, categories: categoryArray, description, price: parseFloat(price), images: uploadedImages },
        });
      }

      console.log(`Inserted/updated product in Supabase with ID: ${id}`);

      // Sync with Pinecone
      await updatePinecone(id, name, description, categoryArray, parseFloat(price));
    }

    console.log("Seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Function to update Pinecone vector
async function updatePinecone(id: string, name: string, description: string, categories: string[], price: number) {
  const embedding = await generateProductEmbeddings(`${name} ${description} ${categories.join(" ")} ${price}`);
  if (!embedding) {
    console.error(`Failed to generate embedding for product ID: ${id}`);
    return;
  }

  await ns.upsert([
    {
      id: id.toString(),
      values: embedding,
      metadata: { name, description, categories, price },
    },
  ]);

  console.log(`Inserted vector into Pinecone for product ID: ${id}`);
}

// Function to resync Pinecone with Supabase (Run manually if needed)
async function syncPineconeWithSupabase() {
  console.log("Starting Pinecone sync...");
  const products = await prisma.product.findMany();

  for (const product of products) {
    const existingVector = await ns.fetch([product.id.toString()]);

    if (!existingVector.records[product.id.toString()]) {
      console.log(`Fixing missing Pinecone vector for ${product.id}`);
      await updatePinecone(product.id.toString(), product.name, product.description, product.categories, Number(product.price));
    }
  }

  console.log("Pinecone sync completed!");
}

// Run the seed function
seedDatabase();

// Uncomment to manually sync Pinecone if needed
// syncPineconeWithSupabase();
