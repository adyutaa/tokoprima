import { TFilter } from "@/hooks/useFilter";
import { Pinecone } from "@pinecone-database/pinecone";
import { generateProductEmbeddings } from "@/lib/embeddings";
import prisma from "../../../../lib/prisma";
import { TProduct } from "@/types";

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY as string });
const index = pc.Index("ecommerce-test");

export async function POST(request: Request) {
  try {
    const res = (await request.json()) as TFilter;
    const searchQuery = res.search?.trim() || "";

    let responseProducts: TProduct[] = [];

    if (searchQuery.trim() !== "") {
      const searchTokens = searchQuery.toLowerCase().split(/\s+/);
      const exactMatches = await prisma.product.findMany({
        where: {
          AND: searchTokens.map((token) => ({
            OR: [{ name: { contains: token, mode: "insensitive" } }],
          })),
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
          reviews: {
            select: {
              comment: true,
            },
          },
        },
      });

      const exactProducts: TProduct[] = exactMatches.map((product) => ({
        id: product.id,
        category_name: product.category.name,
        image_url: product.images && product.images.length > 0 ? (product.images[0].startsWith("http") ? product.images[0] : `https://gclyhedubfskowdnrtmg.supabase.co/storage/v1/object/public/products/${product.images[0]}`) : null,
        name: product.name,
        price: Number(product.price),
      }));

      responseProducts = exactProducts;

      console.log("Generating embeddings for query:", searchQuery);
      const queryEmbedding = await generateProductEmbeddings(searchQuery);
      if (!queryEmbedding || queryEmbedding.length === 0) {
        console.log("Failed to generate embeddings for query:", searchQuery);
        return new Response("Failed to generate embeddings", { status: 400 });
      }

      console.log("Generated embeddings:", queryEmbedding);
      const queryResponse = await index.namespace("products").query({
        vector: queryEmbedding,
        topK: 15,
        includeMetadata: true,
      });

      console.log("Query response from Pinecone:", queryResponse);

      const productIds = (queryResponse.matches || []).map((match) => parseInt(match.id, 10)).filter((id) => !isNaN(id));

      const exactProductIds = exactMatches.map((product) => product.id);
      const vectorProductIds = productIds.filter((id) => !exactProductIds.includes(id));

      if (vectorProductIds.length > 0) {
        console.log("Fetching vector products with IDs:", vectorProductIds);
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

        console.log("Vector products fetched:", vectorProducts);

        const mappedVectorProducts: TProduct[] = vectorProducts.map((product) => ({
          id: product.id,
          category_name: product.category.name,
          image_url: product.images && product.images.length > 0 ? (product.images[0].startsWith("http") ? product.images[0] : `https://gclyhedubfskowdnrtmg.supabase.co/storage/v1/object/public/products/${product.images[0]}`) : null,
          name: product.name,
          price: Number(product.price),
        }));

        responseProducts = responseProducts.concat(mappedVectorProducts);
      }
    } else {
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
        image_url: product.images && product.images.length > 0 ? (product.images[0].startsWith("http") ? product.images[0] : `https://gclyhedubfskowdnrtmg.supabase.co/storage/v1/object/public/products/${product.images[0]}`) : null,
        name: product.name,
        price: Number(product.price),
      }));
    }

    return new Response(JSON.stringify(responseProducts), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
