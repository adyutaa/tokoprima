
import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { getImageUrl } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { limit } = await request.json();

    const products = await prisma.product.findMany({
      take: limit || undefined, // Gunakan limit jika ada, jika tidak biarkan undefined
      select: {
        id: true,
        images: true,
        name: true,
        categories: true,
        price: true,
      },
    });

    const mappedProducts = products.map((item) => {
      let imageUrl = (item as any).image_url;
      if (!imageUrl && item.images && item.images.length > 0) {
        imageUrl = item.images[0].startsWith("http") ? item.images[0] : getImageUrl(item.images[0], "products");
      }

      return {
        ...item,
        image_url: imageUrl || null,
      };
    });

    return new Response(safeJsonStringify(mappedProducts), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

function safeJsonStringify(products: any[]): BodyInit {
  return JSON.stringify(products, (key, value) => (typeof value === "bigint" ? value.toString() : value));
}
