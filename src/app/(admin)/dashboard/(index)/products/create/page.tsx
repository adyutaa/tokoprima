import React from "react";
import FormProduct from "../_components/form-product";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { getCategories } from "../../categories/lib/data";

export default async function CreatePage() {
  const categories = await getCategories();

  return (
    <FormProduct type="ADD">
      <div className="grid gap-3">
        <Label htmlFor="category">Category</Label>
        <Select name="category_id">
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
