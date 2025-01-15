import { redirect } from "next/navigation";
import prisma from "../../../../../../../lib/prisma";
import { getImageUrl } from "@/lib/supabase";
import { getUser } from "@/lib/auth";

export async function getProductById(id: number) {
  function getImageUrl(image: string, folder: string): string {
    if (image.startsWith("http")) {
      return image; // If the image already has a full URL, return as is
    }
    return `https://gclyhedubfskowdnrtmg.supabase.co/storage/v1/object/public/${folder}/${image}`;
  }
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
        category: { select: { name: true } },
        reviews: {
          select: {
            id: true,
            rating: true,
            comment: true,
            user: {
              select: { id: true, name: true },
            },
          },
        },
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

// Call your new /api/reviews route to add a review
export async function addReview(product_id: number, rating: number, comment: string) {
  const res = await fetch("/api/reviews", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product_id, rating, comment }),
  });

  if (!res.ok) {
    throw new Error(`Error creating review: ${res.statusText}`);
  }

  const newReview = await res.json();
  return newReview;
}
