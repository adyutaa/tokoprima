import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import React from "react";
import { columns } from "./columns";
import { getBrands } from "./lib/data";

export default async function BrandPage() {
	const brands = await getBrands();

	return (
		<div className="space-y-4">
			<div className="text-right">
				<Button size="sm" className="h-8 gap-1" asChild>
					<Link href="/dashboard/brands/create">
						<PlusCircle className="h-3.5 w-3.5" />
						<span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
							Add Brand
						</span>
					</Link>
				</Button>
			</div>
			<Card x-chunk="dashboard-06-chunk-0">
				<CardHeader>
					<CardTitle>Brands</CardTitle>
					<CardDescription>
						Manage your brands and view their sales performance.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<DataTable columns={columns} data={brands} />
				</CardContent>
			</Card>
		</div>
	);
}
