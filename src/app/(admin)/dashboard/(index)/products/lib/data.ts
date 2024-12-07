import prisma from "../../../../../../../lib/prisma";
import { TColumn } from "../columns";

export async function getProducts() {
    try {
        const products = await prisma.product.findMany({
            orderBy: {
                name: 'asc'
            },
            select: {
                id: true,
                _count: {
                    select: {
                        orders: true
                    }
                },
                name: true,
                created_at: true,
                price: true,
                stock: true,
                category: {
                    select: {
                        name: true
                    }
                },
                brand: {
                    select: {
                        name: true
                    }
                },
                images: true
            }
        })

        const response_products: TColumn[] = products.map((product) => {
            return {
                brand_name: product.brand.name,
                category_name: product.category.name,
                createdAt: product.created_at,
                image_url: product.images[0],
                id: product.id,
                name: product.name,
                price: Number(product.price),
                stock: product.stock,
                total_sales: product._count.orders
            }
        })

        return response_products
    } catch (error) {
        console.log(error);
        return []
    }
}

export async function getProductById(id: number) {
    try {
        const product = await prisma.product.findFirst({
            where: {
                id: id
            }
        })

        return product
    } catch (error) {
        console.log(error);
        return null
    }
}