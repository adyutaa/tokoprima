import { NextRequest, NextResponse } from "next/server";
import { searchProducts } from "@/app/api/catalog/productService";
import prisma from "../../../../lib/prisma";
import { getImageUrl } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { search, model = "voyage", indexName = "ecommerce-voyage-3-large", namespace = "products-1" } = await request.json();

    let products = [];

    if (search && search.trim() !== "") {
      try {
        products = await searchProducts(search.trim(), model, indexName, namespace);
      } catch (searchError) {
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
    } else {
      products = await prisma.product.findMany({
        select: {
          id: true,
          images: true,
          name: true,
          categories: true,
          price: true,
        },
      });
    }

    const mappedProducts = products.map((item) => {
      let imageUrl = item.image_url;
      if (!imageUrl && item.images && item.images.length > 0) {
        imageUrl = item.images[0].startsWith("http") ? item.images[0] : getImageUrl(item.images[0], "products");
      }

      const { _matchType, _score, ...rest } = item as any;

      return {
        ...rest,
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
