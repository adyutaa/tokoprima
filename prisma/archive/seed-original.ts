import { PrismaClient } from "@prisma/client";
import fs from "fs";
import csvParser from "csv-parser";
import { Pinecone } from "@pinecone-database/pinecone";
import { generateProductEmbeddings } from "../../src/lib/embeddings";
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

// Function to download and upload images to Supabase
async function downloadAndUploadImage(imageUrl: string, productId: string): Promise<string> {
  try {
    const cleanedUrl = cleanUrl(imageUrl);
    if (!cleanedUrl) {
      console.error(`Invalid URL for product ${productId}:`, imageUrl);
      return "";
    }

    console.log(`Downloading image from: ${cleanedUrl}`); // Log the URL being processed

    const bucketName = "ecommerce";
    const protocol = cleanedUrl.startsWith("https") ? https : http;

    // Download image stream from the URL
    const response = await new Promise<Buffer>((resolve, reject) => {
      protocol.get(cleanedUrl, (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", reject);
      });
    });

    console.log(`Downloaded image for product ${productId}: ${cleanedUrl}`); // Log successful download

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

    const publicURL = supabase.storage.from(bucketName).getPublicUrl(`products/${uniqueFilename}`).data.publicUrl;
    console.log(`Uploaded image for product ${productId}: ${publicURL}`); // Log successful upload

    return publicURL;
  } catch (error) {
    console.error(`Failed to download/upload image for product ${productId}:`, error);
    return "";
  }
}

// Function to seed the database
async function seedDatabase() {
  try {
    // Clear existing products and Pinecone vectors
    await prisma.product.deleteMany({});
    console.log("Cleared existing products from the database.");

    await ns.deleteAll();
    console.log("Cleared all vectors in the Pinecone namespace.");

    const filePath = "SEED-2-8FEB-FIXBANGET.csv"; // Update this path
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
      const { id, name, categories, description, price, images } = record;

      // Validate the ID
      if (!id || isNaN(parseInt(id))) {
        console.error(`Invalid ID for product: ${id}. Skipping product.`);
        continue; // Skip this product if the ID is invalid
      }

      // Check if images field is missing or empty
      if (!images || images.trim() === "") {
        console.log(`No images found for product ${id}. Skipping product.`);
        continue; // Skip this product if there are no images
      }

      const imageUrls = images.split(",").map((img: string) => img.trim());
      console.log(`Image URLs for product ${id}:`, imageUrls); // Log the extracted image URLs

      // Proceed with downloading and uploading images
      const uploadedImages: string[] = [];
      for (const imageUrl of imageUrls) {
        const uploadedImageUrl = await downloadAndUploadImage(imageUrl, id.toString());
        if (uploadedImageUrl) {
          uploadedImages.push(uploadedImageUrl); // Add the URL to the array
        }
      }

      console.log(`Uploaded images for product ${id}:`, uploadedImages); // Log uploaded images

      // Convert categories to an array
      const categoryArray = categories ? categories.split(",") : [];

      // Insert or update the product in the database
      const product = await prisma.product.upsert({
        where: { id: parseInt(id) }, // Find the product by ID
        update: {
          name,
          categories: categoryArray,
          description,
          price: parseFloat(price),
          images: uploadedImages,
        },
        create: {
          id: parseInt(id),
          name,
          categories: categoryArray,
          description,
          price: parseFloat(price),
          images: uploadedImages,
        },
      });

      console.log(`Upserted product into Supabase with ID: ${product.id}`);

      // Generate embeddings for the product (using description or name)
      const embedding = await generateProductEmbeddings(description || name);
      if (!embedding) {
        console.error(`Failed to generate embedding for product ID: ${id}`);
        continue; // Skip if embedding fails
      }

      // Insert or update vector in Pinecone
      await ns.upsert([
        {
          id: id.toString(),
          values: embedding,
          metadata: { name, description, categories, price },
        },
      ]);

      console.log(`Upserted vector into Pinecone for product ID: ${id}`);
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
