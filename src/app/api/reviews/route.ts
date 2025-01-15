// /api/reviews/route.ts
import { getUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { Pinecone } from "@pinecone-database/pinecone";
import { generateProductEmbeddings } from "@/lib/embeddings";

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY as string,
});
const index = pc.Index("ecommerce-test");

export async function POST(request: Request) {
  try {
    // Authenticate user
    const { session } = await getUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const { product_id, rating, comment } = body;

    if (!product_id || typeof product_id !== "number") {
      return NextResponse.json({ error: "Invalid product_id" }, { status: 400 });
    }

    if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
    }

    if (!comment || typeof comment !== "string" || comment.trim() === "") {
      return NextResponse.json({ error: "Comment is required" }, { status: 400 });
    }

    // 1) Create the new review in Prisma
    const newReview = await prisma.review.create({
      data: {
        user_id: session.userId,
        product_id,
        rating,
        comment,
      },
    });

    // 2) Aggregate and update the product's rating & review count
    const aggregate = await prisma.review.aggregate({
      where: { product_id },
      _avg: { rating: true },
      _count: { rating: true },
    });
    await prisma.product.update({
      where: { id: product_id },
      data: {
        rating: aggregate._avg.rating,
        rating_count: aggregate._count.rating,
      },
    });

    // 3) Generate embedding for the newly created review
    const commentEmbedding = await generateProductEmbeddings(comment);
    // Make sure `commentEmbedding` is a float array with the correct dimension

    // 4) Upsert to Pinecone so we can search/filter by this review
    await index
      .namespace("reviews") // Or "products" or any other namespace
      .upsert([
        {
          // Use the Review ID as the Pinecone vector ID
          id: newReview.id.toString(),

          // The numeric embedding array
          values: commentEmbedding ?? [],

          // Store relevant fields as metadata
          metadata: {
            product_id,
            user_id: session.userId,
            rating,
            comment,
          },
        },
      ]);

    // 5) Return the new review in JSON
    return NextResponse.json(newReview, { status: 201 });
  } catch (error: any) {
    console.error("Error in POST /api/reviews:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
