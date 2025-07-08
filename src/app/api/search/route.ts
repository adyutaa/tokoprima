import { NextRequest } from "next/server";
import { searchProducts } from "@/lib/searchService";
import prisma from "../../../../lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { search, model, indexName, namespace } = await request.json();

    if (!search || search.trim() === "") {
      return new Response(JSON.stringify({ error: "Search query is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let products = [];

    try {
      // Panggil service pencarian yang sudah mencakup logging lengkap
      products = await searchProducts(search.trim(), model, indexName, namespace);
    } catch (searchError) {
      console.error("Vector search failed, falling back to text search:", searchError);
      // Fallback ke pencarian teks sederhana jika terjadi error pada pencarian vektor
      products = await prisma.product.findMany({
        where: {
          OR: [{ name: { contains: search.trim(), mode: "insensitive" } }, { description: { contains: search.trim(), mode: "insensitive" } }],
        },
        select: {
          id: true,
          images: true,
          name: true,
          categories: true,
          price: true,
        },
      });
    }

    return new Response(safeJsonStringify(products), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in search API:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

function safeJsonStringify(obj: any): string {
  return JSON.stringify(obj, (key, value) => (typeof value === "bigint" ? value.toString() : value));
}
