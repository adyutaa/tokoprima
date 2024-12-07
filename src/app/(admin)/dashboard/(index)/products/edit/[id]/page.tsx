import { Tedit } from '@/types'
import React from 'react'


import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { getBrands } from '../../../brands/lib/data';
import { getCategories } from '../../../categories/lib/data';
import { getLocations } from '../../../locations/lib/data';
import FormProduct from '../../_components/form-product';
import { getProductById } from '../../lib/data';
import { redirect } from 'next/navigation';



export default async function EditPage({params}: Tedit) {
    const product = await getProductById(Number.parseInt(params.id))
    const brands = await getBrands()
    const categories = await getCategories()
    const locations = await getLocations()

    if (!product) {
        return redirect('/dashboard/products')
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
                            <SelectItem key={cat.id} value={`${cat.id}`}>{cat.name}</SelectItem>
                        ))}
					</SelectContent>
				</Select>
			</div>
			<div className="grid gap-3">
				<Label htmlFor="brand">Brand</Label>
				<Select name="brand_id" defaultValue={product.brand_id.toString()}>
					<SelectTrigger id="brand" aria-label="Select Brand">
						<SelectValue placeholder="Select brand" />
					</SelectTrigger>
					<SelectContent>
                    {brands?.map((cat) => (
                            <SelectItem key={cat.id} value={`${cat.id}`}>{cat.name}</SelectItem>
                        ))}
					</SelectContent>
				</Select>
			</div>
			<div className="grid gap-3">
				<Label htmlFor="location_id">Location</Label>
				<Select name="location_id" defaultValue={product.location_id.toString()}>
					<SelectTrigger id="location" aria-label="Select location">
						<SelectValue placeholder="Select location" />
					</SelectTrigger>
					<SelectContent>
                    {locations?.map((cat) => (
                            <SelectItem key={cat.id} value={`${cat.id}`}>{cat.name}</SelectItem>
                        ))}
					</SelectContent>
				</Select>
			</div>
		</FormProduct>
  )
}
