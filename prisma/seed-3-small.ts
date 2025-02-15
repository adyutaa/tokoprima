import { PrismaClient } from "@prisma/client";
import fs from "fs";
import csvParser from "csv-parser";
import { Pinecone } from "@pinecone-database/pinecone";
import { generateProductEmbeddings } from "../src/lib/embeddings";

const prisma = new PrismaClient();
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY as string });
const index = pc.Index("ecommerce-3-small");
const namespace = "products-vectors";

async function seedPineconeVectors() {
  try {
    const filePath = "SUPABASE-7Feb.csv";

    const records: any[] = [];

    // Read CSV
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on("data", (row: Record<string, string>) => records.push(row))
        .on("end", resolve)
        .on("error", reject);
    });

    // Batch vector upserts
    const batchSize = 50;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);

      const vectorBatch = await Promise.all(
        batch.map(async (record) => {
          const { id, name, description, price, category, images } = record;

          const embedding = await generateProductEmbeddings(description || name);

          if (!embedding) {
            console.warn(`Skipping product ${id}: embedding generation failed`);
            return null;
          }

          return {
            id: id.toString(),
            values: embedding,
            metadata: {
              name,
              description,
              category,
              price,
              images: images?.split(",") || [],
            },
          };
        })
      );

      // Filter out null embeddings
      const validVectors = vectorBatch.filter((v) => v !== null);

      if (validVectors.length > 0) {
        await index.namespace(namespace).upsert(validVectors);
        console.log(`Upserted ${validVectors.length} vectors`);
      }
    }

    console.log("Pinecone vector seeding completed!");
  } catch (error) {
    console.error("Seeding error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedPineconeVectors();
