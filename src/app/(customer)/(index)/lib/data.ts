export async function getProducts(limit?: number) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ limit }), // Kirim limit di body
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }

    const products = await response.json();

    return products;
  } catch (error) {
    console.error("Error fetching products from API:", error);
    return [];
  }
}