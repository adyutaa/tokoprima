// catalogs/lib.ts
import { TFilter } from "@/hooks/useFilter";
import { TProduct } from "@/types";

export async function fetchProduct(body?: TFilter): Promise<TProduct[]> {
  // Define the API endpoint URL
  const apiUrl = "/api/catalog";

  // Set up the request options
  const requestOptions: RequestInit = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : JSON.stringify({}),
  };

  try {
    const res = await fetch(apiUrl, requestOptions);

    if (!res.ok) {
      throw new Error(`Error fetching products: ${res.statusText}`);
    }

    const data: TProduct[] = await res.json();
    return data ?? [];
  } catch (error) {
    console.error("Fetch Product Error:", error);
    return [];
  }
}
