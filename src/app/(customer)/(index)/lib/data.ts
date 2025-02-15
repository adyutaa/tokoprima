import { getImageUrl } from "@/lib/supabase";
import prisma from "../../../../../lib/prisma";

export async function getProducts() {
  try {
    const products = await prisma.product.findMany({
      select: {
        images: true, // Assuming this is an array of strings
        id: true,
        name: true,
        categories: true,
        price: true,
      },
    });

    const response = products.map((item) => {
      const imageUrl =
        item.images && item.images.length > 0
          ? item.images[0].startsWith("http") // Check if it's already a full URL
            ? item.images[0] // Use the URL as-is
            : `https://gclyhedubfskowdnrtmg.supabase.co/storage/v1/object/public/products/${item.images[0]}` // Append base URL for file names
          : null; // No image available

      console.log("Corrected image_url:", imageUrl); // Debugging

      return {
        ...item,
        image_url: imageUrl,
      };
    });

    return response;
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}
