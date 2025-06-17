import { PrismaClient } from "@prisma/client";
import { Pinecone, RecordMetadata } from "@pinecone-database/pinecone";
import { generateGeminiProductEmbeddings } from "../src/lib/gemini";
import * as dotenv from "dotenv";
import * as fs from "fs";

// Load environment variables
dotenv.config();

// Initialize Prisma Client
const prisma = new PrismaClient();

// Initialize Pinecone
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY as string });

// Define configuration for Gemini model
const geminiConfig = {
  indexName: "ecommerce-gemini-3072",
  namespace: "products-1",
  generateEmbeddings: generateGeminiProductEmbeddings,
};

// Progress tracking file
const PROGRESS_FILE = "./gemini-embedding-progress.json";

// Create Pinecone service for Gemini model
function createGeminiPineconeService() {
  const ns = pc.Index(geminiConfig.indexName).namespace(geminiConfig.namespace);

  return {
    async upsertProductVector(productId: number, embedding: number[], metadata: RecordMetadata): Promise<void> {
      const vector = {
        id: productId.toString(),
        values: embedding,
        metadata,
      };
      await ns.upsert([vector]);
    },
  };
}

// Helper for delay (sleep)
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Retry function with exponential backoff
async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries: number = 5, initialDelay: number = 1000): Promise<T> {
  let retries = 0;
  let currentDelay = initialDelay;

  while (true) {
    try {
      return await fn();
    } catch (error: any) {
      if (retries >= maxRetries) {
        throw error;
      }

      // Check if it's a rate limit error
      if (error.response?.data?.error?.code === 429 || (error.message && error.message.includes("429")) || (error.message && error.message.includes("Resource has been exhausted"))) {
        // For rate limit errors, use a longer delay
        currentDelay = initialDelay * Math.pow(2, retries) + Math.random() * 1000;
        console.log(`Rate limit hit. Retrying in ${(currentDelay / 1000).toFixed(1)}s...`);
      } else {
        // For other errors, use shorter delay
        currentDelay = initialDelay * Math.pow(1.5, retries) + Math.random() * 500;
        console.log(`Error occurred. Retrying in ${(currentDelay / 1000).toFixed(1)}s...`);
      }

      retries++;
      await delay(currentDelay);
    }
  }
}

// Load progress
function loadProgress(): {
  processedIds: number[];
  lastBatchIndex: number;
} {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      const data = fs.readFileSync(PROGRESS_FILE, "utf8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error reading progress file:", error);
  }
  return { processedIds: [], lastBatchIndex: 0 };
}

// Save progress
function saveProgress(processedIds: number[], lastBatchIndex: number) {
  try {
    fs.writeFileSync(
      PROGRESS_FILE,
      JSON.stringify({
        processedIds,
        lastBatchIndex,
        timestamp: new Date().toISOString(),
      }),
      "utf8"
    );
  } catch (error) {
    console.error("Error saving progress:", error);
  }
}

async function addGeminiEmbeddings(batchSize: number = 3, delayBetweenRequests: number = 2000) {
  try {
    console.log("Starting Gemini embeddings generation process...");

    // Create Pinecone service for Gemini embeddings
    const geminiPineconeService = createGeminiPineconeService();

    // Load progress if available
    const { processedIds, lastBatchIndex } = loadProgress();
    console.log(`Resuming from batch ${lastBatchIndex + 1} with ${processedIds.length} products already processed`);

    // Fetch all products from the database
    console.log("Fetching existing products from database...");
    const allProducts = await prisma.product.findMany();
    console.log(`Found ${allProducts.length} existing products in database.`);

    // Filter out already processed products
    const products = allProducts.filter((p) => !processedIds.includes(p.id));
    console.log(`${products.length} products remaining to process`);

    // Generate embeddings and upsert to Pinecone
    console.log("Generating Gemini embeddings for products and upserting to Pinecone...");

    let processed = processedIds.length;
    const total = allProducts.length;
    let currentBatchIndex = lastBatchIndex;

    for (let i = currentBatchIndex * batchSize; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(products.length / batchSize);

      console.log(`Processing embeddings for batch ${batchNumber} of ${totalBatches}`);

      // Process products in sequence, not in parallel
      for (const product of batch) {
        const { id, name, description, categories, price } = product;
        const embeddingText = `${name} ${description || ""} ${categories.join(" ")}`;

        const metadata = {
          name,
          description: description || "",
          categories: categories.join(","),
          price: price.toString(),
        };

        try {
          // Generate Gemini embedding with retry logic
          const generateEmbeddingWithRetry = () => geminiConfig.generateEmbeddings(embeddingText);
          const geminiEmbedding = await retryWithBackoff(generateEmbeddingWithRetry);

          if (geminiEmbedding) {
            // Upsert with retry logic
            const upsertWithRetry = () => geminiPineconeService.upsertProductVector(id, geminiEmbedding, metadata);
            await retryWithBackoff(upsertWithRetry);

            console.log(`✓ Gemini embedding generated and upserted for product ${id}`);

            // Update progress
            processed++;
            processedIds.push(id);
            saveProgress(processedIds, currentBatchIndex);

            console.log(`Progress: ${processed}/${total} products processed (${Math.round((processed / total) * 100)}%)`);
          } else {
            console.error(`✗ Failed to generate Gemini embedding for product ${id}`);
          }

          // Add delay between requests to avoid rate limiting
          await delay(delayBetweenRequests);
        } catch (error) {
          console.error(`Error processing Gemini embeddings for product ${id}:`, error);
        }
      }

      currentBatchIndex++;
      saveProgress(processedIds, currentBatchIndex);
    }

    console.log(`Gemini embeddings process completed successfully! ${processed}/${total} products processed.`);
  } catch (error) {
    console.error("Error in Gemini embeddings process:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function with smaller batch size and delay between requests
addGeminiEmbeddings(3, 3000);
