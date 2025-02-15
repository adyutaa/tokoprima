// utils/imageUtils.ts
export function getValidImageUrl(image: string | string[], folder: "products" | "brands" = "products"): string | null {
  if (!image || (Array.isArray(image) && image.length === 0)) {
    console.warn("No valid image provided.");
    return null; // Return null if no image is provided
  }

  // Ensure image is a string, not an array
  const imageUrl = Array.isArray(image) ? image[0] : image;

  // If the image is already a full URL, return it as-is
  if (imageUrl.startsWith("http")) {
    return imageUrl;
  }

  // If the image is a valid path, construct the full URL
  if (imageUrl && imageUrl.trim() !== "") {
    return `https://gclyhedubfskowdnrtmg.supabase.co/storage/v1/object/public/ecommerce/${folder}/${imageUrl}`;
  }

  console.error("Invalid image URL:", imageUrl);
  return null; // Return null if the image URL is not valid
}
