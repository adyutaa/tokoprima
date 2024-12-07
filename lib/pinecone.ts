import { Pinecone } from "@pinecone-database/pinecone";

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY as string });

export async function initializePinecone() {
  try {
    // List all existing indexes
    const existingIndexes = await pc.listIndexes();

    // Check if the "ecommerce-test" index already exists
    if (!existingIndexes.indexes) {
      console.log('Index "ecommerce-test" does not exist. Creating it now...');
      // Create the index since it doesn't exist
      await pc.createIndex({
        name: "ecommerce-test",
        dimension: 1536, // Ensure this matches your embedding size
        metric: "cosine", // Can also be "euclidean" or "dotproduct"
        spec: {
          serverless: {
            cloud: "gcp",
            region: "europe-west4", // or your desired region
          },
        },
      });
      console.log('Index "ecommerce-test" created successfully!');
    } else {
      console.log('Index "ecommerce-test" already exists.');
    }

    // Retrieve the index description (this is safe now since we know it exists)
    const index = await pc.describeIndex("ecommerce-test");
    console.log(`Retrieved Pinecone index "${index.name}".`);

    return index; // Return the index metadata
  } catch (error) {
    console.error("Error checking or creating the index:", error);
    throw error;
  }
}
