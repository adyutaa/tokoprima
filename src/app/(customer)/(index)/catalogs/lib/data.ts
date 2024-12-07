// import { TFilter } from "@/hooks/useFilter";
// import { TProduct } from "@/types";

// export async function fetchProduct(body?: TFilter): Promise<TProduct[]> {
//   // If a search query is provided, call the search API that interacts with Pinecone
//   if (body?.search) {
//     const res = await fetch("/api/catalog", {
//       method: "POST",
//       body: JSON.stringify({ search: body.search }), // Send the search query
//       headers: {
//         "Content-Type": "application/json",
//       },
//     });

//     const data = await res.json();
//     return data ?? []; // Return the search results
//   }

//   // If no search query, fetch the full catalog (adjust this as needed)
//   const res = await fetch("/api/catalog", {
//     method: "POST",
//     body: JSON.stringify(body ?? {}),
//     headers: {
//       "Content-Type": "application/json",
//     },
//   });

//   const data = await res.json();
//   return data ?? []; // Return the full catalog
// }

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
