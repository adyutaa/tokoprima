// api/catalog/route.ts
import { TFilter } from "@/hooks/useFilter";
import { Pinecone } from "@pinecone-database/pinecone"; // Ensure this import is correct based on Pinecone SDK version

import { getImageUrl } from "@/lib/supabase";
import { generateProductEmbeddings } from "@/lib/embeddings"; // Ensure this function is correctly implemented
import prisma from "../../../../lib/prisma";
import { TProduct } from "@/types";

// Initialize Pinecone client
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY as string });
const index = pc.Index("ecommerce-test"); // Ensure the index name is correct

// Function to handle Pinecone queries for similar products
export async function POST(request: Request) {
  try {
    const res = (await request.json()) as TFilter;

    // Extract the search query
    const searchQuery = res.search?.trim() || "";

    let responseProducts: TProduct[] = [];

    if (searchQuery.trim() !== "") {
      // tokenizer nya buat split
      const searchTokens = searchQuery.toLowerCase().split(/\s+/);
      const exactMatches = await prisma.product.findMany({
        where: {
          AND: searchTokens.map((token) => ({
            OR: [
              { name: { contains: token, mode: "insensitive" } },
              // { description: { contains: token, mode: "insensitive" } }, // Optional
              // Add more fields as necessary
              // id: number
              // image_url: string
              // name: string
              // category_name: string
              // price: number
            ],
          })),
        },
        select: {
          id: true,
          images: true,
          name: true,
          brand: true,
          category: {
            select: {
              name: true,
            },
          },
          price: true,
        },
      });

      // Map exact matches to TProduct
      const exactProducts: TProduct[] = exactMatches.map((product) => ({
        id: product.id,
        category_name: product.category.name,
        image_url: getImageUrl(product.images[0], "products"),
        name: product.name,
        price: Number(product.price),
      }));

      // Add exact matches to response
      responseProducts = exactProducts;

      // Generate embedding for search query using your embedding function
      const queryEmbedding = await generateProductEmbeddings(searchQuery);
      console.log("Query Embedding:", queryEmbedding);

      if (!queryEmbedding || queryEmbedding.length === 0) {
        return new Response("Failed to generate embeddings", { status: 400 });
      }

      // Use Pinecone to search for similar vectors
      const queryResponse = await index.namespace("products").query({
        vector: queryEmbedding,
        topK: 3,
        includeMetadata: true, // Include namespace if you have one, else remove
      });
      console.log("Pinecone Query Response:", queryResponse);

      // Extract product IDs from Pinecone response
      const productIds = queryResponse.matches
        .map((match) => {
          const parsedId = parseInt(match.id, 10); // Convert to number
          if (isNaN(parsedId)) {
            console.warn(`Invalid product ID: ${match.id}`); // Log the invalid ID
            return null; // Return null for invalid ID
          }
          return parsedId;
        })
        .filter((id): id is number => id !== null); // Remove null values and ensure type safety
      console.log("Filtered Product IDs:", productIds);

      //   // Fetch product details from your database based on the product IDs returned by Pinecone
      //   const products = await prisma.product.findMany({
      //     where: {
      //       id: {
      //         in: productIds,
      //       },
      //     },
      //     select: {
      //       id: true,
      //       images: true,
      //       name: true,
      //       category: {
      //         select: {
      //           name: true,
      //         },
      //       },
      //       price: true,
      //     },
      //   });

      //   // Map products to the desired response format
      //   responseProducts = products.map((product) => {
      //     return {
      //       id: product.id,
      //       category_name: product.category.name,
      //       image_url: getImageUrl(product.images[0], "products"),
      //       name: product.name,
      //       price: Number(product.price),
      //     };
      //   });
      // } else {
      //   // If no search query, return the full product catalog
      //   const products = await prisma.product.findMany({
      //     select: {
      //       id: true,
      //       images: true,
      //       name: true,
      //       category: {
      //         select: {
      //           name: true,
      //         },
      //       },
      //       price: true,
      //     },
      //   });

      //   responseProducts = products.map((product) => {
      //     return {
      //       id: product.id,
      //       category_name: product.category.name,
      //       image_url: getImageUrl(product.images[0], "products"),
      //       name: product.name,
      //       price: Number(product.price),
      //     };
      //   });
      // }
      // Exclude exact match product IDs to avoid duplication
      const exactProductIds = exactMatches.map((product) => product.id);
      const vectorProductIds = productIds.filter((id) => !exactProductIds.includes(id));

      console.log("Vector Product IDs after Exclusion:", vectorProductIds);

      if (vectorProductIds.length > 0) {
        // Fetch products from Prisma based on vector search
        const vectorProducts = await prisma.product.findMany({
          where: {
            id: {
              in: vectorProductIds,
            },
          },
          select: {
            id: true,
            images: true,
            name: true,
            category: {
              select: {
                name: true,
              },
            },
            price: true,
          },
        });

        // Map vector search products to TProduct
        const mappedVectorProducts: TProduct[] = vectorProducts.map((product) => ({
          id: product.id,
          category_name: product.category.name,
          image_url: getImageUrl(product.images[0], "products"),
          name: product.name,
          price: Number(product.price),
        }));

        // Add vector-based products to response
        responseProducts = responseProducts.concat(mappedVectorProducts);
      }
    } else {
      // If no search query, return the full product catalog
      const products = await prisma.product.findMany({
        select: {
          id: true,
          images: true,
          name: true,
          category: {
            select: {
              name: true,
            },
          },
          price: true,
        },
      });

      responseProducts = products.map((product) => ({
        id: product.id,
        category_name: product.category.name,
        image_url: getImageUrl(product.images[0], "products"),
        name: product.name,
        price: Number(product.price),
      }));
    }

    // Return the product data
    return new Response(JSON.stringify(responseProducts), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Catalog API Error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
