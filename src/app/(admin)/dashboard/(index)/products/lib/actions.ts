"use server";

import { schemaProduct, schemaProductEdit } from "@/lib/schema";
import { deleteFile, uploadFile } from "@/lib/supabase";
import { ActionResult } from "@/types";
import { redirect } from "next/navigation";
import prisma from "../../../../../../../lib/prisma";
import { ProductStock } from "@prisma/client";
import { Pinecone, PineconeRecord, RecordMetadata } from "@pinecone-database/pinecone";
import { initializePinecone } from "../../../../../../../lib/pinecone";
import { generateProductEmbeddings } from "@/lib/embeddings";

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY as string });
const index = pc.Index("ecommerce-test");
const ns = index.namespace("products");
initializePinecone();

export async function storeProduct(_: unknown, formData: FormData): Promise<ActionResult> {
  const parse = schemaProduct.safeParse({
    name: formData.get("name"),
    price: formData.get("price"),
    description: formData.get("description"),
    category_id: formData.get("category_id"),
    stock: formData.get("stock"),
    images: formData.getAll("images"),
  });

  if (!parse.success) {
    return {
      error: parse.error.errors[0].message,
    };
  }

  const uploaded_images = parse.data.images as File[];
  const filenames = [];

  for (const image of uploaded_images) {
    const filename = await uploadFile(image, "products");
    filenames.push(filename);
  }

  try {
    const newProduct = await prisma.product.create({
      data: {
        name: parse.data.name,
        description: parse.data.description,
        category_id: Number.parseInt(parse.data.category_id),
        price: Number.parseInt(parse.data.price),
        stock: parse.data.stock as ProductStock,
        images: filenames,
      },
    });
    // Generate embedding for the product
    const embeddingText = `${newProduct.name} ${newProduct.description} ${newProduct.category_id}`;
    const embedding = await generateProductEmbeddings(embeddingText);

    const vector: PineconeRecord<RecordMetadata> = {
      id: newProduct.id.toString(), // Convert to string if necessary
      values: embedding || [],
      metadata: {
        name: newProduct.name,
        description: newProduct.description,
        category_id: newProduct.category_id,
        price: newProduct.price.toString(),
        stock: newProduct.stock,
      },
    };
    // Upsert into Pinecone
    await ns.upsert([vector]);
  } catch (error) {
    console.log(error);
    return {
      error: "Failed to insert data product",
    };
  }

  return redirect("/dashboard/products");
}

export async function updateProduct(_: unknown, formData: FormData, id: number): Promise<ActionResult> {
  const parse = schemaProductEdit.safeParse({
    name: formData.get("name"),
    price: formData.get("price"),
    description: formData.get("description"),
    category_id: formData.get("category_id"),
    stock: formData.get("stock"),
    id: id,
  });

  if (!parse.success) {
    return {
      error: parse.error.errors[0].message,
    };
  }

  const product = await prisma.product.findFirst({
    where: { id: id },
  });

  if (!product) {
    return {
      error: "Product not found",
    };
  }

  const uploaded_images = formData.getAll("images") as File[];
  let filenames = [];

  if (uploaded_images.length === 3) {
    const parseImages = schemaProduct.pick({ images: true }).safeParse({
      images: uploaded_images,
    });

    if (!parseImages.success) {
      return {
        error: parseImages.error.errors[0].message,
      };
    }

    for (const image of uploaded_images) {
      const filename = await uploadFile(image, "products");
      filenames.push(filename);
    }
  } else {
    filenames = product.images;
  }

  try {
    // ✅ Update product in Prisma database
    const updatedProduct = await prisma.product.update({
      where: { id: id },
      data: {
        name: parse.data.name,
        description: parse.data.description,
        category_id: Number.parseInt(parse.data.category_id),
        price: Number.parseInt(parse.data.price),
        stock: parse.data.stock as ProductStock,
        images: filenames,
      },
    });

    // ✅ Generate new embeddings if the description or name changed
    let embedding: number[] | undefined;
    if (updatedProduct.name !== product.name || updatedProduct.description !== product.description) {
      const embeddingText = `${updatedProduct.name} ${updatedProduct.description} ${updatedProduct.category_id}`;
      embedding = await generateProductEmbeddings(embeddingText);
    }

    // ✅ Prepare Pinecone update operation
    const updateOperation: any = { id: updatedProduct.id.toString() };

    if (embedding && embedding.length > 0) {
      updateOperation.values = embedding; // Update vector values if new embeddings are generated
    }

    updateOperation.metadata = {
      name: updatedProduct.name,
      description: updatedProduct.description,
      category_id: updatedProduct.category_id,
      price: updatedProduct.price.toString(),
      stock: updatedProduct.stock.toString(),
      images: filenames,
    };

    // ✅ Update Pinecone record for the specific ID
    await ns.update(updateOperation);
  } catch (error) {
    console.log(error);
    return {
      error: "Failed to update data",
    };
  }

  return redirect("/dashboard/products");
}

export async function deleteProduct(_: unknown, formData: FormData, id: number): Promise<ActionResult> {
  const product = await prisma.product.findFirst({
    where: {
      id: id,
    },
    select: {
      id: true,
      images: true,
    },
  });

  if (!product) {
    return {
      error: "Product not found",
    };
  }

  try {
    for (const image of product.images) {
      await deleteFile(image, "products");
    }

    await prisma.product.delete({
      where: {
        id,
      },
    });
    // Delete the corresponding vector from Pinecone
    await ns.deleteOne(id.toString());
  } catch (error) {
    console.log(error);

    return {
      error: "Failed to delete data",
    };
  }

  return redirect("/dashboard/products");
}
