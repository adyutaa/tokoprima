// import prisma from "../../../../lib/prisma";
// import { generateProductEmbeddings } from "@/lib/embeddings";
// import { generateVoyageProductEmbeddings } from "@/lib/VoyageAI";
// import { searchProductVectors } from "@/lib/PineconeService";
// import { getImageUrl } from "@/lib/supabase";
// import { BM25Retrieval } from "retrieval";

// /**
//  * Logger utility for better debugging of search process.
//  */
// // const logger = {
// //   info: (message: string, data?: any) => {
// //     console.log(`\n📘 INFO [${new Date().toISOString()}] ${message}`);
// //     if (data) {
// //       if (Array.isArray(data)) {
// //         console.log(`  └─ Count: ${data.length} items`);
// //         if (data.length > 0 && data.length <= 5) {
// //           console.log("  └─ Items:");
// //           data.forEach((item, i) => {
// //             console.log(`     [${i}] ${JSON.stringify(item, null, 2).substring(0, 100)}...`);
// //           });
// //         } else if (data.length > 5) {
// //           console.log("  └─ Sample items (first 3):");
// //           data.slice(0, 10).forEach((item, i) => {
// //             console.log(`     [${i}] ${JSON.stringify(item, null, 2).substring(0, 100)}...`);
// //           });
// //         }
// //       } else {
// //         console.log(`  └─ ${JSON.stringify(data, null, 2).substring(0, 200)}`);
// //         if (JSON.stringify(data).length > 200) console.log("     ... (truncated)");
// //       }
// //     }
// //   },
// //   time: (label: string) => {
// //     console.time(label); // Ensure the same label is used
// //     return () => console.timeEnd(label); // Use the same label when ending the timer
// //   },
// //   embeddings: (model: string, config: any) => {
// //     console.log(`\n🧠 EMBEDDINGS [${new Date().toISOString()}] Using embedding model: ${model}`);
// //     if (config) {
// //       console.log(`  └─ Configuration: ${JSON.stringify(config, null, 2)}`);
// //     }
// //   },
// // };

// export async function searchProducts(searchQuery: string, model: "openai" | "voyage" = "voyage", indexName: string = "ecommerce-voyage-3-large", namespace: string = "products-1", similarityThreshold: number = 1.0): Promise<any[]> {
//   // const totalTimer = logger.time("Total Search Duration");
//   const logger = new SearchLogger();

//   // 1. Log query input
//   logger.logQueryStart(searchQuery, { model, indexName, namespace, similarityThreshold });

//   // 2. Log model yang digunakan
//   logger.logEmbeddingModel(model);

//   const embeddingService = createEmbeddingService(model);

//   const searchTokens = searchQuery.toLowerCase().split(/\s+/);

//   const stopWords = ["for", "with", "and", "the", "a", "an", "in", "on", "at", "by", "to", "of"];
//   const importantTerms = searchTokens.filter((token) => !stopWords.includes(token));

//   // logger.info(`Query analysis`, {
//   //   allTerms: searchTokens,
//   //   importantTerms: importantTerms,
//   // });

//   // const exactTimer = logger.time("Exact Match Search");
//   logger.startTimer("exact_search");
//   const exactMatches = await prisma.product.findMany({
//     where: {
//       AND: searchTokens.map((token) => ({
//         OR: [{ name: { contains: token, mode: "insensitive" } }, { description: { contains: token, mode: "insensitive" } }, { categories: { has: token } }],
//       })),
//     },
//     select: {
//       id: true,
//       images: true,
//       name: true,
//       description: true,
//       categories: true,
//       price: true,
//     },
//   });
//   // exactTimer();
//   logger.endTimer("exact_search");

//   // logger.info(`Found ${exactMatches.length} exact matches`);

//   // const embeddingTimer = logger.time("Generate Query Embedding");
//   logger.startTimer("embedding_generation");
//   let queryEmbedding;
//   try {
//     queryEmbedding = await embeddingService.generateEmbeddings(searchQuery);
//     // embeddingTimer();
//     // logger.info("Generated query embedding");
//     logger.endTimer("embedding_generation");
//     logger.logEmbeddingGeneration(true);
//   } catch (error) {
//     // embeddingTimer();
//     // logger.info("Failed to generate embedding for query", { error: error.message });
//     logger.endTimer("embedding_generation");
//     logger.logEmbeddingGeneration(false, error);

//     return rankProductsWithBlendedScore(exactMatches, [], searchTokens, importantTerms);
//   }

//   // const vectorTimer = logger.time("Vector Search");
//   logger.logSimilaritySearch(indexName, namespace, 50); // Assuming topK is 50
//   const queryResponse = await searchProductVectors(queryEmbedding, indexName);
//   // vectorTimer();

//   const vectorMatches = queryResponse.matches || [];
//   // logger.info(`Found ${vectorMatches.length} vector matches`);
//   logger.logSimilarityResults(vectorMatches);

//   let vectorProducts = [];
//   if (vectorMatches.length > 0) logger.startTimer("db_fetch");
//   {
//     const vectorProductIds = vectorMatches.map((match) => parseInt(match.id, 10)).filter((id) => !isNaN(id));

//     const idToScoreMap = Object.fromEntries(vectorMatches.map((match) => [parseInt(match.id, 10), match.score || 0]));

//     // logger.info(`Vector product IDs from Pinecone:`, vectorProductIds);

//     // const dbTimer = logger.time("Vector Products Database Fetch");
//     const vectorResults = await prisma.product.findMany({
//       where: { id: { in: vectorProductIds } },
//       select: {
//         id: true,
//         images: true,
//         name: true,
//         description: true,
//         categories: true,
//         price: true,
//       },
//     });
//     // dbTimer();
//     logger.endTimer("db_fetch");

//     const retrievedIds = new Set(vectorResults.map((p) => p.id));
//     const missingProductIds = vectorProductIds.filter((id) => !retrievedIds.has(id));

//     // if (missingProductIds.length > 0) {
//     //   logger.info(`WARNING: ${missingProductIds.length} products exist in Pinecone but not in PostgreSQL`, {
//     //     missingIds: missingProductIds,
//     //     totalVectorMatches: vectorMatches.length,
//     //     retrievedFromDb: vectorResults.length,
//     //   });
//     // }

//     // logger.info(`Retrieved ${vectorResults.length} vector products from database`);

//     vectorProducts = vectorResults.map((product) => ({
//       ...product,
//       _score: idToScoreMap[product.id] || 0,
//       _matchType: "vector",
//     }));
//   }
//   logger.startTimer("ranking");
//   const rankedProducts = rankProductsWithBlendedScore(exactMatches, vectorProducts, searchTokens, importantTerms);
//   logger.endTimer("ranking");

//   // 6. Log returned products
//   logger.logReturnedProducts(rankedProducts);

//   // 7. Log total API duration
//   logger.logSearchComplete();

//   // totalTimer();
//   // logger.info(`Search completed with ${rankedProducts.length} total results`);

//   return rankedProducts;
// }

// function rankProductsWithBlendedScore(exactMatches: any[], vectorProducts: any[], searchTokens: string[], importantTerms: string[]): any[] {
//   // Hanya gunakan vector products dengan skor aslinya
//   const scoredVectorProducts = vectorProducts.map((product) => {
//     return {
//       ...product,
//       image_url: getProductImageUrl(product),
//       categories: normalizeCategories(product.categories),
//       _matchType: "vector",
//       _score: product._score || 0, // Gunakan skor vector asli
//     };
//   });

//   // Sort berdasarkan skor
//   const sortedProducts = scoredVectorProducts.sort((a, b) => b._score - a._score);

//   // Untuk query tanpa hasil vector, fallback ke exact match
//   if (sortedProducts.length === 0 && exactMatches.length > 0) {
//     return exactMatches.map((product) => ({
//       ...product,
//       image_url: getProductImageUrl(product),
//       categories: normalizeCategories(product.categories),
//       _matchType: "exact",
//       _score: 0.5, // Default score for fallback
//     }));
//   }

//   return sortedProducts;
// }

// // Helper untuk URL gambar
// function getProductImageUrl(product: any): string {
//   return product.images && product.images.length > 0 ? (product.images[0].startsWith("http") ? product.images[0] : getImageUrl(product.images[0], "products")) : "/images/placeholder-product.jpg";
// }

// // Helper function to normalize categories
// function normalizeCategories(categories: string[]): string[] {
//   if (!Array.isArray(categories)) return [];

//   return categories.map((cat) => {
//     if (typeof cat === "string") {
//       if ((cat.startsWith('["') || cat.startsWith("['")) && (cat.endsWith('"]') || cat.endsWith("']"))) {
//         try {
//           const parsed = JSON.parse(cat);
//           return Array.isArray(parsed) ? parsed[0] : cat;
//         } catch (e) {
//           return cat;
//         }
//       }
//       return cat;
//     }
//     return String(cat);
//   });
// }

// /**
//  * Helper function to create embedding service based on model type.
//  */
// function createEmbeddingService(model: "openai" | "voyage") {
//   const embeddingService = {
//     model,
//     generateEmbeddings: model === "openai" ? generateProductEmbeddings : generateVoyageProductEmbeddings,
//   };

//   return embeddingService;
// }

// /**
//  * Enhanced structured logger for semantic search operations
//  */
// class SearchLogger {
//   private requestId: string;
//   private timers: Map<string, number> = new Map();
//   private durations: Map<string, number> = new Map();

//   constructor() {
//     this.requestId = generateRequestId();
//   }

//   /**
//    * Logs the start of a search query
//    */
//   logQueryStart(query: string, params?: any) {
//     console.log(`\n┌───────────────────────────────────────────────────────────────────────────`);
//     console.log(`│ 🔍 SEARCH REQUEST [${this.requestId}] ${new Date().toISOString()}`);
//     console.log(`│ Query: "${query}"`);

//     if (params) {
//       console.log(`│ Parameters: ${JSON.stringify(params, null, 2)}`);
//     }

//     // Start total timer
//     this.startTimer("total");
//   }

//   /**
//    * Logs the embedding model being used
//    */
//   logEmbeddingModel(model: string) {
//     console.log(`│ 🧠 MODEL: Using ${model.toUpperCase()} embedding model`);
//   }

//   /**
//    * Logs the query embedding generation
//    */
//   logEmbeddingGeneration(success: boolean, error?: any) {
//     if (success) {
//       console.log(`│ ✅ EMBEDDING: Query embedding generated successfully`);
//     } else {
//       console.log(`│ ❌ EMBEDDING: Failed to generate query embedding`);
//       if (error) {
//         console.log(`│     Error: ${error.message || JSON.stringify(error)}`);
//       }
//     }
//   }

//   /**
//    * Logs similarity search execution
//    */
//   logSimilaritySearch(indexName: string, namespace: string, topK: number) {
//     console.log(`│ 🔎 SIMILARITY: Searching Pinecone index "${indexName}" (namespace: "${namespace}", topK: ${topK})`);
//     this.startTimer("vector_search");
//   }

//   /**
//    * Logs similarity search results
//    */
//   logSimilarityResults(matches: any[]) {
//     const duration = this.endTimer("vector_search");

//     console.log(`│ 📊 RESULTS: Found ${matches.length} vector matches in ${duration}ms`);

//     if (matches.length > 0) {
//       console.log(`│ Top matching scores:`);
//       matches.slice(0, 5).forEach((match, idx) => {
//         console.log(`│   ${idx + 1}. ID: ${match.id}, Score: ${match.score.toFixed(4)}`);
//       });
//     }
//   }

//   /**
//    * Logs the returned products
//    */
//   logReturnedProducts(products: any[]) {
//     console.log(`│ 📦 PRODUCTS: Returning ${products.length} ranked products`);

//     if (products.length > 0) {
//       console.log(`│`);
//       console.log(`│ Top Search Results:`);
//       console.log(`│`);

//       products.slice(0, 5).forEach((product, idx) => {
//         console.log(`│ Result ${idx + 1}:`);
//         console.log(`│ Product ID: ${product.id}`);
//         console.log(`│ Title: ${product.name}`);
//         console.log(`│ Category: ${product.categories.join(", ")}`);
//         console.log(`│ Description: ${product.description ? product.description.substring(0, 150) + (product.description.length > 150 ? "..." : "") : "No description available"}`);
//         console.log(`│ Similarity Score: ${product._score.toFixed(4)}`);
//         console.log(`│`);
//       });

//       if (products.length > 5) {
//         console.log(`│ ... and ${products.length - 5} more results`);
//         console.log(`│`);
//       }
//     }
//   }

//   /**
//    * Logs total search duration
//    */
//   logSearchComplete() {
//     const totalDuration = this.endTimer("total");

//     console.log(`│ ⏱️ PERFORMANCE:`);
//     this.durations.forEach((duration, name) => {
//       if (name !== "total") {
//         const percentage = ((duration / totalDuration) * 100).toFixed(1);
//         console.log(`│   - ${name}: ${duration}ms (${percentage}%)`);
//       }
//     });
//     console.log(`│   - Total: ${totalDuration}ms`);

//     console.log(`└───────────────────────────────────────────────────────────────────────────\n`);
//   }

//   /**
//    * Helper to start a timer
//    */
//   startTimer(name: string) {
//     this.timers.set(name, performance.now());
//   }

//   /**
//    * Helper to end a timer and return duration
//    */
//   endTimer(name: string): number {
//     const start = this.timers.get(name);
//     if (!start) return 0;

//     const duration = Math.round(performance.now() - start);
//     this.durations.set(name, duration);
//     return duration;
//   }

//   /**
//    * Record a duration for an external operation
//    */
//   recordDuration(name: string, durationMs: number) {
//     this.durations.set(name, Math.round(durationMs));
//   }
// }

// /**
//  * Generate a short unique request ID
//  */
// function generateRequestId(): string {
//   return Math.random().toString(36).substring(2, 8).toUpperCase();
// }

import prisma from "../../../../lib/prisma";
import { generateProductEmbeddings } from "@/lib/embeddings";
import { generateVoyageProductEmbeddings } from "@/lib/VoyageAI";
import { searchProductVectors } from "@/lib/PineconeService";
import { getImageUrl } from "@/lib/supabase";

/**
 * Pure Semantic Vector Search for Products
 * This function performs ONLY vector similarity search using embeddings,
 * no exact text matching from PostgreSQL
 */
export async function searchProducts(
  searchQuery: string,
  model: "openai" | "voyage" = "voyage",
  indexName: string = "ecommerce-voyage-3-large",
  namespace: string = "products-1",
  topK: number = 50,
  similarityThreshold: number = 0.3
): Promise<any[]> {
  const logger = new SearchLogger();

  // 1. Log query input
  logger.logQueryStart(searchQuery, { model, indexName, namespace, topK, similarityThreshold });

  // 2. Log embedding model
  logger.logEmbeddingModel(model);

  const embeddingService = createEmbeddingService(model);

  // 3. Generate query embedding
  logger.startTimer("embedding_generation");
  let queryEmbedding;
  try {
    queryEmbedding = await embeddingService.generateEmbeddings(searchQuery);
    logger.endTimer("embedding_generation");
    logger.logEmbeddingGeneration(true);
  } catch (error) {
    logger.endTimer("embedding_generation");
    logger.logEmbeddingGeneration(false, error);

    // If embedding fails, return empty results
    logger.logSearchComplete();
    return [];
  }

  // 4. Perform vector similarity search in Pinecone
  logger.logSimilaritySearch(indexName, namespace, topK);
  logger.startTimer("vector_search");

  const queryResponse = await searchProductVectors(queryEmbedding, indexName);

  logger.endTimer("vector_search");
  const vectorMatches = queryResponse.matches || [];
  logger.logSimilarityResults(vectorMatches);

  // 5. Filter by similarity threshold
  const filteredMatches = vectorMatches.filter((match) => match.score >= similarityThreshold);

  if (filteredMatches.length === 0) {
    logger.logNoResults(similarityThreshold);
    logger.logSearchComplete();
    return [];
  }

  // 6. Fetch product details from database
  logger.startTimer("db_fetch");
  const vectorProductIds = filteredMatches.map((match) => parseInt(match.id, 10)).filter((id) => !isNaN(id));
  const idToScoreMap = Object.fromEntries(filteredMatches.map((match) => [parseInt(match.id, 10), match.score || 0]));

  const vectorResults = await prisma.product.findMany({
    where: { id: { in: vectorProductIds } },
    select: {
      id: true,
      images: true,
      name: true,
      description: true,
      categories: true,
      price: true,
    },
  });

  logger.endTimer("db_fetch");

  // 7. Handle missing products (exist in Pinecone but not in PostgreSQL)
  const retrievedIds = new Set(vectorResults.map((p) => p.id));
  const missingProductIds = vectorProductIds.filter((id) => !retrievedIds.has(id));

  if (missingProductIds.length > 0) {
    logger.logMissingProducts(missingProductIds, vectorMatches.length, vectorResults.length);
  }

  // 8. Create final ranked products
  logger.startTimer("ranking");
  const rankedProducts = createRankedProducts(vectorResults, idToScoreMap);
  logger.endTimer("ranking");

  // 9. Log results and complete
  logger.logReturnedProducts(rankedProducts);
  logger.logSearchComplete();

  return rankedProducts;
}

/**
 * Create ranked products with similarity scores
 */
function createRankedProducts(products: any[], idToScoreMap: { [key: number]: number }): any[] {
  const rankedProducts = products.map((product) => ({
    ...product,
    image_url: getProductImageUrl(product),
    categories: normalizeCategories(product.categories),
    _matchType: "vector",
    _score: idToScoreMap[product.id] || 0,
  }));

  // Sort by similarity score (highest first)
  return rankedProducts.sort((a, b) => b._score - a._score);
}

/**
 * Helper untuk URL gambar
 */
function getProductImageUrl(product: any): string {
  return product.images && product.images.length > 0 ? (product.images[0].startsWith("http") ? product.images[0] : getImageUrl(product.images[0], "products")) : "/images/placeholder-product.jpg";
}

/**
 * Helper function to normalize categories
 */
function normalizeCategories(categories: string[]): string[] {
  if (!Array.isArray(categories)) return [];

  return categories.map((cat) => {
    if (typeof cat === "string") {
      if ((cat.startsWith('["') || cat.startsWith("['")) && (cat.endsWith('"]') || cat.endsWith("']"))) {
        try {
          const parsed = JSON.parse(cat);
          return Array.isArray(parsed) ? parsed[0] : cat;
        } catch (e) {
          return cat;
        }
      }
      return cat;
    }
    return String(cat);
  });
}

/**
 * Helper function to create embedding service based on model type
 */
function createEmbeddingService(model: "openai" | "voyage") {
  return {
    model,
    generateEmbeddings: model === "openai" ? generateProductEmbeddings : generateVoyageProductEmbeddings,
  };
}

/**
 * Enhanced structured logger for pure semantic search operations
 */
class SearchLogger {
  private requestId: string;
  private timers: Map<string, number> = new Map();
  private durations: Map<string, number> = new Map();

  constructor() {
    this.requestId = generateRequestId();
  }

  /**
   * Logs the start of a search query
   */
  logQueryStart(query: string, params?: any) {
    console.log(`\n┌───────────────────────────────────────────────────────────────────────────`);
    console.log(`│ 🔍 PURE SEMANTIC SEARCH [${this.requestId}] ${new Date().toISOString()}`);
    console.log(`│ Query: "${query}"`);

    if (params) {
      console.log(`│ Parameters:`);
      console.log(`│   - Model: ${params.model?.toUpperCase()}`);
      console.log(`│   - Index: ${params.indexName}`);
      console.log(`│   - Namespace: ${params.namespace}`);
      console.log(`│   - Top K: ${params.topK}`);
      console.log(`│   - Similarity Threshold: ${params.similarityThreshold}`);
    }

    // Start total timer
    this.startTimer("total");
  }

  /**
   * Logs the embedding model being used
   */
  logEmbeddingModel(model: string) {
    console.log(`│ 🧠 EMBEDDING MODEL: ${model.toUpperCase()}`);
  }

  /**
   * Logs the query embedding generation
   */
  logEmbeddingGeneration(success: boolean, error?: any) {
    if (success) {
      console.log(`│ ✅ EMBEDDING: Query vector generated successfully`);
    } else {
      console.log(`│ ❌ EMBEDDING: Failed to generate query vector`);
      if (error) {
        console.log(`│     Error: ${error.message || JSON.stringify(error)}`);
      }
    }
  }

  /**
   * Logs similarity search execution
   */
  logSimilaritySearch(indexName: string, namespace: string, topK: number) {
    console.log(`│ 🔎 VECTOR SEARCH: Querying Pinecone index "${indexName}"`);
    console.log(`│   - Namespace: "${namespace}"`);
    console.log(`│   - Top K results: ${topK}`);
  }

  /**
   * Logs similarity search results
   */
  logSimilarityResults(matches: any[]) {
    const duration = this.durations.get("vector_search") || 0;

    console.log(`│ 📊 VECTOR RESULTS: Found ${matches.length} similar products in ${duration}ms`);

    if (matches.length > 0) {
      const avgScore = matches.reduce((sum, match) => sum + match.score, 0) / matches.length;
      const maxScore = Math.max(...matches.map((m) => m.score));
      const minScore = Math.min(...matches.map((m) => m.score));

      console.log(`│   - Score Range: ${minScore.toFixed(4)} - ${maxScore.toFixed(4)} (avg: ${avgScore.toFixed(4)})`);
      console.log(`│   - Top 5 matches:`);

      matches.slice(0, 5).forEach((match, idx) => {
        console.log(`│     ${idx + 1}. ID: ${match.id} | Score: ${match.score.toFixed(4)}`);
      });
    }
  }

  /**
   * Logs when no results meet the similarity threshold
   */
  logNoResults(threshold: number) {
    console.log(`│ ⚠️  NO RESULTS: No products found above similarity threshold of ${threshold}`);
    console.log(`│    Consider lowering the threshold for more results`);
  }

  /**
   * Logs missing products warning
   */
  logMissingProducts(missingIds: number[], totalMatches: number, retrievedCount: number) {
    console.log(`│ ⚠️  SYNC WARNING: ${missingIds.length} products exist in Pinecone but not in PostgreSQL`);
    console.log(`│   - Total vector matches: ${totalMatches}`);
    console.log(`│   - Retrieved from DB: ${retrievedCount}`);
    console.log(`│   - Missing IDs: ${missingIds.slice(0, 10).join(", ")}${missingIds.length > 10 ? "..." : ""}`);
  }

  /**
   * Logs the returned products
   */
  logReturnedProducts(products: any[]) {
    console.log(`│ 📦 FINAL RESULTS: ${products.length} semantically ranked products`);

    if (products.length > 0) {
      console.log(`│`);
      console.log(`│ 🏆 Top Semantic Matches:`);

      products.slice(0, 5).forEach((product, idx) => {
        console.log(`│`);
        console.log(`│ Rank ${idx + 1}:`);
        console.log(`│   ID: ${product.id}`);
        console.log(`│   Name: ${product.name}`);
        console.log(`│   Categories: ${product.categories.join(", ")}`);
        console.log(`│   Similarity: ${(product._score * 100).toFixed(2)}%`);
        if (product.description) {
          const desc = product.description.length > 100 ? product.description.substring(0, 100) + "..." : product.description;
          console.log(`│   Description: ${desc}`);
        }
      });

      if (products.length > 5) {
        console.log(`│`);
        console.log(`│ ... and ${products.length - 5} more semantic matches`);
      }
    }
  }

  /**
   * Logs total search duration and performance breakdown
   */
  logSearchComplete() {
    const totalDuration = this.endTimer("total");

    console.log(`│`);
    console.log(`│ ⏱️  PERFORMANCE BREAKDOWN:`);

    // Calculate percentages
    const operations = [
      { name: "embedding_generation", label: "Query Embedding" },
      { name: "vector_search", label: "Vector Search" },
      { name: "db_fetch", label: "Database Fetch" },
      { name: "ranking", label: "Result Ranking" },
    ];

    operations.forEach(({ name, label }) => {
      const duration = this.durations.get(name) || 0;
      const percentage = totalDuration > 0 ? ((duration / totalDuration) * 100).toFixed(1) : "0.0";
      console.log(`│   - ${label}: ${duration}ms (${percentage}%)`);
    });

    console.log(`│   - Total Duration: ${totalDuration}ms`);
    console.log(`│`);
    console.log(`│ 🎯 SEARCH TYPE: Pure Semantic Vector Search (No Exact Matching)`);
    console.log(`└───────────────────────────────────────────────────────────────────────────\n`);
  }

  /**
   * Helper to start a timer
   */
  startTimer(name: string) {
    this.timers.set(name, performance.now());
  }

  /**
   * Helper to end a timer and return duration
   */
  endTimer(name: string): number {
    const start = this.timers.get(name);
    if (!start) return 0;

    const duration = Math.round(performance.now() - start);
    this.durations.set(name, duration);
    return duration;
  }
}

/**
 * Generate a short unique request ID
 */
function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}
