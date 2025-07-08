import { redirect } from "next/navigation";
import prisma from "../../../../../../../lib/prisma";
import { getImageUrl } from "@/lib/supabase";
import { getUser } from "@/lib/auth";

export async function getProductById(id: number) {
  
  try {
    const product = await prisma.product.findFirst({
      where: { id: id },
      select: {
        id: true,
        name: true,
        _count: { select: { orders: true } },
        images: true,
        description: true,
        price: true,
        categories: true,
      },
    });

    if (!product) {
      return redirect("/");
    }

    // Handle image parsing and URL construction
    const parsedImages = typeof product.images === "string" ? JSON.parse(product.images) : product.images;

    return {
      ...product,
      images: parsedImages.map((img) => getImageUrl(img, "products")),
    };
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}
