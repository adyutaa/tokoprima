import { NextRequest, NextResponse } from "next/server";
import { searchProducts } from "@/app/api/catalog/productService";
import prisma from "../../../../lib/prisma";
import { getImageUrl } from "@/lib/supabase";

// Logger utility with formatting
// const logger = {
//   info: (message: string, data?: any) => {
//     console.log(`\n📘 INFO [${new Date().toISOString()}] ${message}`);
//     if (data) {
//       if (Array.isArray(data)) {
//         console.log(`  └─ Count: ${data.length} items`);
//         // For arrays, log a summary instead of the full data
//         if (data.length > 0) {
//           // Show first 3 items with limited fields
//           console.log("  └─ Sample items:");
//           data.slice(0, 3).forEach((item, i) => {
//             const simplified = {
//               id: item.id,
//               name: item.name?.substring(0, 40) + (item.name?.length > 40 ? "..." : ""),
//               score: item.score !== undefined ? item.score.toFixed(4) : undefined,
//             };
//             console.log(`     [${i}] ${JSON.stringify(simplified)}`);
//           });
//           if (data.length > 3) {
//             console.log(`     ... and ${data.length - 3} more items`);
//           }
//         }
//       } else {
//         console.log(`  └─ ${JSON.stringify(data, null, 2).substring(0, 200)}`);
//         if (JSON.stringify(data).length > 200) console.log("     ... (truncated)");
//       }
//     }
//   },
//   error: (message: string, error: any) => {
//     console.error(`\n🔴 ERROR [${new Date().toISOString()}] ${message}`);
//     console.error(`  └─ ${error.message || error}`);
//     if (error.stack) {
//       console.error(`  └─ ${error.stack.split("\n").slice(0, 3).join("\n     ")}`);
//     }
//   },
//   time: (label: string) => {
//     console.time(`⏱️ ${label}`);
//     return () => console.timeEnd(`⏱️ ${label}`);
//   },
// };

export async function POST(request: NextRequest) {
  // const endTimer = logger.time("API Request Duration");

  try {
    const { search, model = "voyage", indexName = "ecommerce-voyage-3-large", namespace = "products-1" } = await request.json();

    // logger.info(`Search request received`, {
    //   query: search,
    //   model,
    //   indexName,
    //   namespace,
    // });

    let products = [];

    // Remove the duplicate searchProducts call
    if (search && search.trim() !== "") {
      // const searchTimer = logger.time("Search Products");
      try {
        // Only call searchProducts once
        products = await searchProducts(search.trim(), model, indexName, namespace);

        // logger.info(`Found ${products.length} products via search`, {
        //   exactMatches: products.filter((p) => p._matchType === "exact").length,
        //   vectorMatches: products.filter((p) => p._matchType === "vector").length,
        //   model: model,
        //   indexName: indexName,
        // });
      } catch (searchError) {
        // Add specific error handling for search
        // logger.error("Error in searchProducts function", searchError);
        // Fall back to database search on vector search failure
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
        // logger.info(`Fell back to database search, found ${products.length} products`);
      }
      // searchTimer();
    } else {
      // If no search query, fetch products with paging
      // const dbTimer = logger.time("DB Products Fetch");
      products = await prisma.product.findMany({
        select: {
          id: true,
          images: true,
          name: true,
          categories: true,
          price: true,
        },
      });
      // dbTimer();

      // logger.info(`Fetched ${products.length} products from database`);
    }

    // Rest of your function remains the same...

    // Map the products to include a proper image_url field
    const mappedProducts = products.map((item) => {
      // Use existing image_url if available
      let imageUrl = item.image_url;
      // Generate from images array if image_url is not present
      if (!imageUrl && item.images && item.images.length > 0) {
        imageUrl = item.images[0].startsWith("http") ? item.images[0] : getImageUrl(item.images[0], "products");
      }

      // Keep track of match type and score for logging, but remove from final response
      const { _matchType, _score, ...rest } = item as any;

      return {
        ...rest,
        image_url: imageUrl || null,
      };
    });

    // logger.info(`Returning mapped products`, mappedProducts);

    // endTimer();
    return new Response(safeJsonStringify(mappedProducts), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // logger.error("Error in API catalog", error);
    // endTimer();
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Helper function to safely stringify objects that might contain BigInt values
function safeJsonStringify(products: any[]): BodyInit {
  return JSON.stringify(products, (key, value) => (typeof value === "bigint" ? value.toString() : value));
}
