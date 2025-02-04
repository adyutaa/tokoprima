// /**
//  * @jest-environment node
//  */
// import "openai/shims/node";
// import { POST } from "./route";
// import { PrismaClient } from "@prisma/client";
// import { generateProductEmbeddings } from "@/lib/embeddings";
// import { Pinecone } from "@pinecone-database/pinecone";
// import { NextResponse } from "next/server";

// const mockGenerateProductEmbeddings = generateProductEmbeddings as jest.Mock;
// // Mock Next.js Response
// jest.mock("next/server", () => ({
//   NextResponse: {
//     json: jest.fn((data) => ({
//       status: 200,
//       json: async () => data,
//     })),
//   },
// }));

// // Mock Prisma
// const mockPrismaClient = {
//   product: {
//     findMany: jest.fn(),
//   },
// };

// jest.mock("../../../../lib/prisma", () => ({
//   __esModule: true,
//   default: {
//     product: {
//       findMany: jest.fn(),
//     },
//   },
// }));

// // Mock Pinecone
// jest.mock("@pinecone-database/pinecone", () => ({
//   Pinecone: jest.fn().mockImplementation(() => ({
//     Index: jest.fn(() => ({
//       namespace: jest.fn(() => ({
//         query: jest.fn(),
//       })),
//     })),
//   })),
// }));

// // Mock embeddings generator
// jest.mock("../../../lib/embeddings", () => ({
//   generateProductEmbeddings: jest.fn(),
// }));

// // Mock image URL generator
// jest.mock("../../../lib/supabase", () => ({
//   getImageUrl: jest.fn((key: string) => key),
// }));

// describe("POST /api/catalog", () => {
//   beforeEach(() => {
//     jest.clearAllMocks();
//   });

//   it("returns products for a valid search query", async () => {
//     const mockRequest = new Request("http://localhost:3000/api/catalog", {
//       method: "POST",
//       body: JSON.stringify({ search: "test product" }),
//     });

//     const mockProducts = [
//       {
//         id: 1,
//         images: ["image1.jpg"],
//         name: "Test Product 1",
//         category: { name: "Category 1" },
//         price: 100,
//       },
//     ];

//     const vectorProducts = [
//       {
//         id: 2,
//         images: ["image2.jpg"],
//         name: "Vector Product 1",
//         category: { name: "Category 2" },
//         price: 150,
//       },
//     ];

//     // Configure mocks
//     mockPrismaClient.product.findMany.mockResolvedValueOnce(mockProducts).mockResolvedValueOnce(vectorProducts);

//     mockGenerateProductEmbeddings.mockResolvedValue([0.1, 0.2, 0.3]);

//     const mockPinecone = new Pinecone({ apiKey: "test" });
//     const mockIndex = mockPinecone.Index("ecommerce-test");
//     (mockIndex.namespace("products").query as jest.Mock).mockResolvedValue({
//       matches: [{ id: "2", score: 0.9 }],
//     });

//     // Execute test
//     const response = await POST(mockRequest);

//     expect(response.status).toBe(200);

//     const responseBody = await response.json();
//     expect(responseBody).toEqual([
//       {
//         id: 1,
//         category_name: "Category 1",
//         image_url: "image1.jpg",
//         name: "Test Product 1",
//         price: 100,
//       },
//       {
//         id: 2,
//         category_name: "Category 2",
//         image_url: "image2.jpg",
//         name: "Vector Product 1",
//         price: 150,
//       },
//     ]);
//   });

//   it("handles errors gracefully", async () => {
//     const mockRequest = new Request("http://localhost:3000/api/catalog", {
//       method: "POST",
//       body: JSON.stringify({ search: "" }),
//     });

//     const mockPrismaClient = require("../../../../lib/prisma").default.product.findMany;
//     mockPrismaClient.mockRejectedValue(new Error("Database error"));

//     const response = await POST(mockRequest);

//     expect(response.status).toBe(500);

//     const responseBody = await response.json(); // Parse JSON response
//     expect(responseBody).toEqual({ error: "Internal server error" }); // Check JSON content
//   });
// });

import { NextRequest, NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import { generateProductEmbeddings } from "@/lib/embeddings";
import { PrismaClient } from "@prisma/client";
import { TProduct } from "@/types";

// Initialize Pinecone
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY as string });
const index = pc.Index("ecommerce-test");
const ns = index.namespace("products");

/**
 * GET: Fetch all products
 */
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        images: true,
        name: true,
        category: { select: { name: true } },
        price: true,
      },
    });

    const responseProducts: TProduct[] = products.map((product) => ({
      id: product.id,
      category_name: product.category.name,
      image_url: product.images?.[0]?.startsWith("http") ? product.images[0] : `https://gclyhedubfskowdnrtmg.supabase.co/storage/v1/object/public/products/${product.images[0]}`,
      name: product.name,
      price: Number(product.price),
    }));

    return NextResponse.json(responseProducts, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

/**
 * POST: Search for products using keyword or vector search
 */
export async function POST(req: NextRequest) {
  try {
    const { search } = await req.json();
    const searchQuery = search?.trim() || "";
    let responseProducts: TProduct[] = [];

    if (searchQuery) {
      // Text-based search in Prisma
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
          category: { select: { name: true } },
          price: true,
        },
      });

      responseProducts = exactMatches.map((product) => ({
        id: product.id,
        category_name: product.category.name,
        image_url: product.images?.[0]?.startsWith("http") ? product.images[0] : `https://gclyhedubfskowdnrtmg.supabase.co/storage/v1/object/public/products/${product.images[0]}`,
        name: product.name,
        price: Number(product.price),
      }));

      // Vector-based search using Pinecone
      const queryEmbedding = await generateProductEmbeddings(searchQuery);
      if (!queryEmbedding || queryEmbedding.length === 0) {
        return NextResponse.json({ error: "Failed to generate embeddings" }, { status: 400 });
      }

      const queryResponse = await ns.query({ vector: queryEmbedding, topK: 3, includeMetadata: true });
      const productIds = queryResponse.matches?.map((match) => parseInt(match.id, 10)) || [];

      // Fetch products from vector search
      const vectorProducts = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true,
          images: true,
          name: true,
          category: { select: { name: true } },
          price: true,
        },
      });

      responseProducts = [
        ...responseProducts,
        ...vectorProducts.map((product) => ({
          id: product.id,
          category_name: product.category.name,
          image_url: product.images?.[0]?.startsWith("http") ? product.images[0] : `https://gclyhedubfskowdnrtmg.supabase.co/storage/v1/object/public/products/${product.images[0]}`,
          name: product.name,
          price: Number(product.price),
        })),
      ];
    }

    return NextResponse.json(responseProducts, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to search products" }, { status: 500 });
  }
}

/**
 * PUT: Update a product by ID
 */
export async function PUT(req: NextRequest) {
  try {
    const formData = await req.formData();
    const id = parseInt(formData.get("id") as string, 10);

    if (!id || isNaN(id)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }

    const product = await prisma.product.findFirst({ where: { id } });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const filenames = formData.getAll("images") as File[];
    const newImages = filenames.length ? await Promise.all(filenames.map((file) => uploadFile(file, "products"))) : product.images;

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        category_id: Number.parseInt(formData.get("category_id") as string),
        price: Number.parseInt(formData.get("price") as string),
        stock: formData.get("stock") as string,
        images: newImages,
      },
    });

    // Update Pinecone Vector
    const embeddingText = `${updatedProduct.name} ${updatedProduct.description} ${updatedProduct.category_id}`;
    const embedding = await generateProductEmbeddings(embeddingText);

    const vector = {
      id: updatedProduct.id.toString(),
      values: embedding || [],
      metadata: {
        name: updatedProduct.name,
        description: updatedProduct.description,
        category_id: updatedProduct.category_id,
        price: updatedProduct.price.toString(),
        stock: updatedProduct.stock.toString(),
        images: newImages,
      },
    };
    await ns.upsert([vector]);

    return NextResponse.json({ message: "Product updated successfully", product: updatedProduct }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

/**
 * DELETE: Remove a product by ID
 */
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }

    const product = await prisma.product.findFirst({ where: { id: parseInt(id) } });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Delete images from storage
    for (const image of product.images) {
      await deleteFile(image, "products");
    }

    // Delete from database
    await prisma.product.delete({ where: { id: parseInt(id) } });

    // Delete from Pinecone
    await ns.deleteOne(id.toString());

    return NextResponse.json({ message: "Product deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
