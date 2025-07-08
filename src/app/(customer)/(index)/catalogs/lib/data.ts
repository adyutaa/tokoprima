// catalogs/lib.ts
import { TFilter } from "@/hooks/useFilter";
import { TProduct } from "@/types";

export async function fetchProduct(body?: TFilter): Promise<TProduct[]> {
  // If a search query is present, use the search API, otherwise use the products API.
  const apiUrl = body?.search ? "/api/search" : "/api/products";

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
