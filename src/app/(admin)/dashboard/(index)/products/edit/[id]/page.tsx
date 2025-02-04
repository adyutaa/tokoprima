import { Tedit } from "@/types";
import React from "react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { getCategories } from "../../../categories/lib/data";

import FormProduct from "../../_components/form-product";
import { getProductById } from "../../lib/data";
import { redirect } from "next/navigation";

export default async function EditPage({ params }: Tedit) {
  const product = await getProductById(Number.parseInt(params.id));

  const categories = await getCategories();

  if (!product) {
    return redirect("/dashboard/products");
  }

  return (
    <FormProduct type="EDIT" data={product}>
      <div className="grid gap-3">
        <Label htmlFor="category">Category</Label>
        <Select name="category_id" defaultValue={product.category_id.toString()}>
          <SelectTrigger id="category" aria-label="Select category">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories?.map((cat) => (
              <SelectItem key={cat.id} value={`${cat.id}`}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </FormProduct>
  );
}
