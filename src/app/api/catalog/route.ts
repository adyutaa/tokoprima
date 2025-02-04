import { NextRequest, NextResponse } from "next/server";
import { searchProducts } from "@/app/api/catalog/productService";
import prisma from "../../../../lib/prisma";
import { getImageUrl } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { search } = await request.json();
    let products = [];
    if (search && search.trim() !== "") {
      products = await searchProducts(search.trim());
    } else {
      // Jika tidak ada query pencarian, ambil produk dengan paging
      products = await prisma.product.findMany({
        select: {
          id: true,
          images: true,
          name: true,
          category: { select: { name: true } },
          price: true,
        },
      });
    }

    // Map the products to include a proper image_url field
    const mappedProducts = products.map((item) => {
      // Use existing image_url if available
      let imageUrl = item.image_url;
      // Generate from images array if image_url is not present
      if (!imageUrl && item.images && item.images.length > 0) {
        imageUrl = item.images[0].startsWith("http") ? item.images[0] : getImageUrl(item.images[0], "products");
      }
      return {
        ...item,
        image_url: imageUrl || null, // Ensure image_url is set
      };
    });
    console.log("Mapped Products:", mappedProducts);

    return new Response(safeJsonStringify(mappedProducts), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in API catalog:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

function safeJsonStringify(products: any[]): BodyInit {
  return JSON.stringify(products, (key, value) => (typeof value === "bigint" ? value.toString() : value));
}
