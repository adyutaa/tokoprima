// import { Pinecone } from "@pinecone-database/pinecone";

// const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY as string });

// export async function initializePinecone() {
//   try {
//     // List all existing indexes
//     const existingIndexes = await pc.listIndexes();

//     // Check if the "ecommerce-test" index already exists
//     if (!existingIndexes.indexes) {
//       console.log('Index "ecommerce-test" does not exist. Creating it now...');
//       // Create the index since it doesn't exist
//       await pc.createIndex({
//         name: "ecommerce-3-large",
//         dimension: 1536, // Ensure this matches your embedding size
//         metric: "cosine", // Can also be "euclidean" or "dotproduct"
//         spec: {
//           serverless: {
//             cloud: "aws",
//             region: "us-east-1", // or your desired region
//           },
//         },
//       });
//       console.log('Index "ecommerce-3-large" created successfully!');
//     } else {
//       console.log('Index "ecommerce-3-large" already exists.');
//     }

//     // Retrieve the index description (this is safe now since we know it exists)
//     const index = await pc.describeIndex("ecommerce-3-large");
//     console.log(`Retrieved Pinecone index "${index.name}".`);

//     return index; // Return the index metadata
//   } catch (error) {
//     console.error("Error checking or creating the index:", error);
//     throw error;
//   }
// }

// import { Pinecone } from "@pinecone-database/pinecone";

// // Hardcode the full index configuration here
// const INDEX_CONFIG = {
//   name: "ecommerce-3-large",
//   dimension: 1536, // Ensure this matches your embedding size
//   metric: "cosine", // Can also be "euclidean" or "dotproduct"
//   spec: {
//     serverless: {
//       cloud: "aws",
//       region: "us-east-1", // or your desired region
//     },
//   },
// };

import { Pinecone } from "@pinecone-database/pinecone";

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY as string });

interface PineconeConfig {
  indexName: string;
  dimension: number;
  metric: "cosine" | "euclidean" | "dotproduct";
  cloud: "aws" | "gcp";
  region: string;
}

const INDEX_CONFIG = {
  name: "ecommerce-3-large",
  dimension: 3072,
  metric: "cosine" as const,
  spec: {
    serverless: {
      cloud: "aws" as const,
      region: "us-east-1",
    },
  },
};

export async function initializePinecone() {
  try {
    const existingIndexes = await pc.listIndexes();

    if (!existingIndexes.indexes?.some((index) => index.name === INDEX_CONFIG.name)) {
      console.log(`Creating index "${INDEX_CONFIG.name}"...`);
      await pc.createIndex({
        name: INDEX_CONFIG.name,
        dimension: INDEX_CONFIG.dimension,
        metric: INDEX_CONFIG.metric,
        spec: INDEX_CONFIG.spec,
      });
      console.log(`Index "${INDEX_CONFIG.name}" created!`);
    } else {
      console.log(`Index "${INDEX_CONFIG.name}" exists.`);
    }

    const index = await pc.describeIndex(INDEX_CONFIG.name);
    console.log(`Retrieved index "${index.name}".`);

    return index;
  } catch (error) {
    console.error("Error initializing Pinecone:", error);
    throw error;
  }
}
