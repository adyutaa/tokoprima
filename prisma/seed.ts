import { PrismaClient } from "@prisma/client";
import fs from "fs";
import csvParser from "csv-parser";
import axios from "axios";
import path from "path";
import { Pinecone } from "@pinecone-database/pinecone";
import { initializePinecone } from "../lib/pinecone";
import { generateProductEmbeddings } from "../src/lib/embeddings";
import { createClient } from "@supabase/supabase-js";

// Initialize Prisma Client
const prisma = new PrismaClient();
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY as string });
const index = pc.Index("ecommerce-test");
const ns = index.namespace("products");

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY as string; // Ensure you're using the correct service role key
const supabase = createClient(supabaseUrl, supabaseKey);

async function downloadAndUploadImage(imageUrl: string, filename: string): Promise<string | null> {
  try {
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    const fileBuffer = Buffer.from(response.data);

    // Upload the image to Supabase Storage
    const { data, error } = await supabase.storage
      .from("ecommerce") // Ensure this is your correct bucket
      .upload(`products/${filename}`, fileBuffer, {
        contentType: "image/jpg", // Adjust the content type if necessary
        upsert: true, // If the file already exists, overwrite it
      });

    if (error) {
      console.error(`Error uploading image ${filename}:`, error);
      return null;
    }

    // Return the public URL of the uploaded image
    return data?.path ? supabase.storage.from("ecommerce").getPublicUrl(data.path).data.publicUrl : null;
  } catch (error) {
    console.error(`Failed to download or upload image ${imageUrl}:`, error);
    return null;
  }
}

async function seedDatabase() {
  try {
    initializePinecone();

    // Read CSV file
    const filePath = "./prisma/Cleaned_Updated_Product_Images.csv";
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

    // Seed data into Supabase (PostgreSQL) via Prisma
    for (const record of records) {
      const { id, name, description, price, category, category_id, stock, images } = record;

      // Check if the product with this ID already exists in the database
      const existingProduct = await prisma.product.findUnique({
        where: { id: parseInt(id) },
      });

      if (existingProduct) {
        console.log(`Product with ID ${id} already exists, skipping...`);
        continue; // Skip the current product if it already exists
      }

      let imageUrls: string[] = [];
      try {
        // Attempt to parse the 'images' field as a JSON array
        imageUrls = JSON.parse(images);
      } catch (err) {
        console.error(`Invalid JSON in 'images' for product ID: ${id}, raw data: ${images}, Error:`, err);
        continue; // Skip this product if JSON parsing fails
      }

      const filenames: string[] = [];

      for (const imageUrl of imageUrls) {
        const filename = path.basename(imageUrl); // Extract file name from the URL
        const uploadedImageUrl = await downloadAndUploadImage(imageUrl, filename);
        if (uploadedImageUrl) {
          filenames.push(uploadedImageUrl); // Store the URL of the uploaded image
        }
      }

      // Generate embeddings for the product (using description or name)
      const embedding = await generateProductEmbeddings(description || name);
      if (!embedding) {
        console.error(`Failed to generate embedding for product ID: ${id}`);
        continue; // Skip the current product if embedding generation failed
      }

      // Insert into Prisma-managed Supabase database
      const product = await prisma.product.create({
        data: {
          id: parseInt(id), // Ensure product ID is set
          name,
          description,
          price: parseFloat(price),
          category_id: parseInt(category_id),
          stock: stock,
          images: filenames, // Store image URLs
        },
      });

      console.log(`Inserted product into Supabase:`, product);

      // Insert vector data into Pinecone
      await index.namespace("products").upsert([
        {
          id: id.toString(),
          values: embedding, // Use the generated embedding here
          metadata: { name, description, category, price, images: filenames },
        },
      ]);

      console.log(`Inserted vector into Pinecone for product ID: ${id}`);
    }

    console.log("Seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase();
