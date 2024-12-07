"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getImageUrl } from "@/lib/supabase"
import { dateFormat, rupiahFormat } from "@/lib/utils"
import { ProductStock } from "@prisma/client"
import { ColumnDef } from "@tanstack/react-table"
import { Edit } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import FormDelete from "./_components/form-delete"

export type TColumn = {
    id: number
    name: string
    image_url: string
    category_name: string
    brand_name: string
    price: number
    total_sales: number
    stock: ProductStock
    createdAt: Date
}

export const columns: ColumnDef<TColumn>[] = [
    {
        accessorKey: 'name',
        header: 'Name',
        cell: ({row}) => {
            const product = row.original            

            return (
                <div className="inline-flex items-center gap-5">
					<Image
						src={getImageUrl(product.image_url, 'products')}
						alt="Product"
						width={80}
						height={80}
					/>
					<span>{product.name}</span>
				</div>
            )
        }
    },
    {
        accessorKey: 'price',
        header: 'Price',
        cell: ({row}) => {
            const product = row.original

            return rupiahFormat(product.price)
        }
    },
    {
        accessorKey: 'stock',
        header: 'Status',
        cell: ({row}) => {
            const product = row.original

            return <Badge variant={'outline'}>{product.stock}</Badge>
        }
    },
    {
        accessorKey: 'total_sales',
        header: 'Total sales'
    },
    {
        accessorKey: 'createdAt',
        header: 'Created At',
        cell: ({row}) => {
            const product = row.original

            return dateFormat(product.createdAt)
        }
    },
    {
		id: "actions",
		cell: ({ row }) => {
			const product = row.original;

			return (
				<div className="space-x-4 inline-flex">
					<Button size="sm" asChild>
						<Link href={`/dashboard/products/edit/${product.id}`}>
							<Edit className="w-4 h-4 mr-2" /> Edit
						</Link>
					</Button>
					<FormDelete id={product.id} />
				</div>
			);
		},
	},
]