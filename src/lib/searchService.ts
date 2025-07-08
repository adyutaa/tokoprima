import prisma from "../../lib/prisma";
import { generateProductEmbeddings } from "@/lib/embeddings";
import { generateVoyageProductEmbeddings } from "@/lib/VoyageAI";
import { searchProductVectors } from "@/lib/PineconeService";
import { getImageUrl } from "@/lib/supabase";

export async function searchProducts(
  searchQuery: string,
  model: "openai" | "voyage" = "voyage",
  indexName: string = "ecommerce-voyage-3-large",
  namespace: string = "products-1",
  topK: number = 12,
  similarityThreshold: number = 0.3
): Promise<any[]> {
  const logger = new SearchLogger();

  logger.logQueryStart(searchQuery, { model, indexName, namespace, topK, similarityThreshold });

  logger.logEmbeddingModel(model);

  const embeddingService = createEmbeddingService(model);

  logger.startTimer("embedding_generation");
  let queryEmbedding;
  try {
    queryEmbedding = await embeddingService.generateEmbeddings(searchQuery);
    logger.endTimer("embedding_generation");
    logger.logEmbeddingGeneration(true);
  } catch (error) {
    logger.endTimer("embedding_generation");
    logger.logEmbeddingGeneration(false, error);

    logger.logSearchComplete();
    return [];
  }

  logger.logSimilaritySearch(indexName, namespace, topK);
  logger.startTimer("vector_search");

  const queryResponse = await searchProductVectors(queryEmbedding, indexName);

  logger.endTimer("vector_search");
  const vectorMatches = queryResponse.matches || [];
  logger.logSimilarityResults(vectorMatches);

  const filteredMatches = vectorMatches.filter((match) => match.score >= similarityThreshold);

  if (filteredMatches.length === 0) {
    logger.logNoResults(similarityThreshold);
    logger.logSearchComplete();
    return [];
  }

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

  const retrievedIds = new Set(vectorResults.map((p) => p.id));
  const missingProductIds = vectorProductIds.filter((id) => !retrievedIds.has(id));

  if (missingProductIds.length > 0) {
    logger.logMissingProducts(missingProductIds, vectorMatches.length, vectorResults.length);
  }

  logger.startTimer("ranking");
  const rankedProducts = createRankedProducts(vectorResults, idToScoreMap);
  logger.endTimer("ranking");

  logger.logReturnedProducts(rankedProducts);
  logger.logSearchComplete();

  return rankedProducts.slice(0, 12);
}

function createRankedProducts(products: any[], idToScoreMap: { [key: number]: number }): any[] {
  const rankedProducts = products.map((product) => ({
    ...product,
    image_url: getProductImageUrl(product),
    categories: normalizeCategories(product.categories),
    _matchType: "vector",
    _score: idToScoreMap[product.id] || 0,
  }));

  return rankedProducts.sort((a, b) => b._score - a._score);
}

function getProductImageUrl(product: any): string {
  return product.images && product.images.length > 0 ? (product.images[0].startsWith("http") ? product.images[0] : getImageUrl(product.images[0], "products")) : "/images/placeholder-product.jpg";
}

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

function createEmbeddingService(model: "openai" | "voyage") {
  return {
    model,
    generateEmbeddings: model === "openai" ? generateProductEmbeddings : generateVoyageProductEmbeddings,
  };
}

class SearchLogger {
  private requestId: string;
  private timers: Map<string, number> = new Map();
  private durations: Map<string, number> = new Map();

  constructor() {
    this.requestId = generateRequestId();
  }

  logQueryStart(query: string, params?: any) {
    console.log(`
┌───────────────────────────────────────────────────────────────────────────`);
    console.log(`│  PURE SEMANTIC SEARCH [${this.requestId}] ${new Date().toISOString()}`);
    console.log(`│ Query: "${query}"`);

    if (params) {
      console.log(`│ Parameters:`);
      console.log(`│   - Model: ${params.model?.toUpperCase()}`);
      console.log(`│   - Index: ${params.indexName}`);
      console.log(`│   - Namespace: ${params.namespace}`);
      console.log(`│   - Top K: ${params.topK}`);
      console.log(`│   - Similarity Threshold: ${params.similarityThreshold}`);
    }
    this.startTimer("total");
  }

  logEmbeddingModel(model: string) {
    console.log(`│  EMBEDDING MODEL: ${model.toUpperCase()}`);
  }

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

  logSimilaritySearch(indexName: string, namespace: string, topK: number) {
    console.log(`│  VECTOR SEARCH: Querying Pinecone index "${indexName}"`);
    console.log(`│   - Namespace: "${namespace}"`);
    console.log(`│   - Top K results: ${topK}`);
  }

  logSimilarityResults(matches: any[]) {
    const duration = this.durations.get("vector_search") || 0;

    console.log(`│  VECTOR RESULTS: Found ${matches.length} similar products in ${duration}ms`);

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

  logNoResults(threshold: number) {
    console.log(`│ ⚠️  NO RESULTS: No products found above similarity threshold of ${threshold}`);
    console.log(`│    Consider lowering the threshold for more results`);
  }

  logMissingProducts(missingIds: number[], totalMatches: number, retrievedCount: number) {
    console.log(`│ ⚠️  SYNC WARNING: ${missingIds.length} products exist in Pinecone but not in PostgreSQL`);
    console.log(`│   - Total vector matches: ${totalMatches}`);
    console.log(`│   - Retrieved from DB: ${retrievedCount}`);
    console.log(`│   - Missing IDs: ${missingIds.slice(0, 10).join(", ")}${missingIds.length > 10 ? "..." : ""}`);
  }

  logReturnedProducts(products: any[]) {
    console.log(`│  FINAL RESULTS: ${products.length} semantically ranked products`);

    if (products.length > 0) {
      console.log(`│`);
      console.log(`│  Top Semantic Matches:`);

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

  logSearchComplete() {
    const totalDuration = this.endTimer("total");

    console.log(`│`);
    console.log(`│ ⏱️  PERFORMANCE BREAKDOWN:`);

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
    console.log(`│  SEARCH TYPE: Pure Semantic Vector Search (No Exact Matching)`);
    console.log(`└───────────────────────────────────────────────────────────────────────────
`);
  }

  startTimer(name: string) {
    this.timers.set(name, performance.now());
  }

  endTimer(name: string): number {
    const start = this.timers.get(name);
    if (!start) return 0;

    const duration = Math.round(performance.now() - start);
    this.durations.set(name, duration);
    return duration;
  }
}

function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}
