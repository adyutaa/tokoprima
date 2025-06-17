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

// Define configurations for different models
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

// Create Pinecone service for both models
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

    async deleteProductVector(productId: number): Promise<void> {
      await ns.deleteOne(productId.toString());
    },
  };
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
    console.log(`Uploaded image for product ${productId}: ${publicURL}`);

    return publicURL;
  } catch (error) {
    console.error(`Failed to download/upload image for product ${productId}:`, error);
    return "";
  }
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

async function seedDatabase(batchSize: number = 10, skipDatabaseInsert: boolean = false) {
  try {
    // Create Pinecone services for both embedding models
    const openaiPineconeService = createPineconeService(modelConfigs.openai.indexName, modelConfigs.openai.namespace);

    const voyagePineconeService = createPineconeService(modelConfigs.voyage.indexName, modelConfigs.voyage.namespace);

    let products;

    if (skipDatabaseInsert) {
      // If skipping database insert, fetch all products from the database
      console.log("Skipping database insert, using existing products...");
      products = await prisma.product.findMany();
      console.log(`Found ${products.length} existing products in database.`);
    } else {
      // Otherwise, process the CSV file and insert into database
      const filePath = "./Dataset/skincare.csv";
      const records: any[] = [];

      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csvParser())
          .on("data", (row: Record<string, string>) => {
            records.push(row);
          })
          .on("end", resolve)
          .on("error", reject);
      });

      console.log(`Processing ${records.length} records from CSV file...`);

      products = [];
      const totalRecords = records.length;

      for (let i = 0; i < totalRecords; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(totalRecords / batchSize)}`);

        for (const record of batch) {
          const { name, categories, description, price, images } = record;

          if (!images || images.trim() === "") {
            console.log(`No images found for product ${name}. Skipping product.`);
            continue;
          }

          const imageUrls = images.split(",").map((img: string) => img.trim());

          const uploadedImages: string[] = [];
          for (const imageUrl of imageUrls) {
            const uploadedImageUrl = await downloadAndUploadImage(imageUrl, name);
            if (uploadedImageUrl) {
              uploadedImages.push(uploadedImageUrl);
            }
          }

          let categoryArray: string[] = [];

          if (categories) {
            const rawCategories = categories.split(",").map((cat) => cat.trim());

            categoryArray = rawCategories
              .map((cat) => {
                if ((cat.startsWith("[") && cat.endsWith("]")) || (cat.startsWith('"') && cat.endsWith('"')) || (cat.startsWith("'") && cat.endsWith("'"))) {
                  try {
                    const parsed = JSON.parse(cat);
                    if (Array.isArray(parsed)) {
                      return parsed[0] || "";
                    }
                    if (typeof parsed === "string") {
                      return parsed;
                    }
                    return cat;
                  } catch (e) {
                    return cat.replace(/[\[\]"']/g, "").trim();
                  }
                }
                return cat;
              })
              .filter((cat) => cat);
          }

          // Insert the product
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
          products.push(product);
        }

        console.log(`Batch ${Math.floor(i / batchSize) + 1} database insertion complete!`);
      }
    }

    // Generate embeddings and upsert to Pinecone (for all products)
    console.log("Generating embeddings for all products and upserting to Pinecone...");

    let processed = 0;
    const total = products.length;

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      console.log(`Processing embeddings for batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(total / batchSize)}`);

      await Promise.all(
        batch.map(async (product) => {
          const { id, name, description, categories, price } = product;
          const embeddingText = `${name} ${description || ""} ${categories.join(" ")}`;

          const metadata = {
            name,
            description: description || "",
            categories: categories.join(","),
            price: price.toString(),
          };

          try {
            // Generate OpenAI embedding and upsert to OpenAI index
            const openaiEmbedding = await modelConfigs.openai.generateEmbeddings(embeddingText);
            if (openaiEmbedding) {
              await openaiPineconeService.upsertProductVector(id, openaiEmbedding, metadata);
              console.log(`✓ OpenAI embedding generated and upserted for product ${id}`);
            } else {
              console.error(`✗ Failed to generate OpenAI embedding for product ${id}`);
            }

            // Generate Voyage embedding and upsert to Voyage index
            const voyageEmbedding = await modelConfigs.voyage.generateEmbeddings(embeddingText);
            if (voyageEmbedding) {
              await voyagePineconeService.upsertProductVector(id, voyageEmbedding, metadata);
              console.log(`✓ Voyage embedding generated and upserted for product ${id}`);
            } else {
              console.error(`✗ Failed to generate Voyage embedding for product ${id}`);
            }

            processed++;
            if (processed % 10 === 0) {
              console.log(`Progress: ${processed}/${total} products processed`);
            }
          } catch (error) {
            console.error(`Error processing embeddings for product ${id}:`, error);
          }
        })
      );
    }

    console.log(`Seeding completed successfully! ${processed}/${total} products processed.`);
  } catch (error) {
    console.error("Error in seeding process:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// To seed both database and embeddings:
seedDatabase(10);

// To update only embeddings for existing products:
// seedDatabase(10, true);
