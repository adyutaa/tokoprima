import { getImageUrl } from "@/lib/supabase";
import prisma from "../../../../../../../lib/prisma";
import { TColumn } from "../columns";

export async function getOrders() {
    try {
        const orders = await prisma.order.findMany({
            include: {
                user: true,
                products: {
                    include: {
                        product: true
                    }
                },
            }
        })

        const response: TColumn[] = orders.map((ord) => {
            return {
                id: ord.id,
                customer_name: ord.user.name,
                price: Number(ord.total),
                products: ord.products?.map((item) => {
                    return {
                        name: item.product.name,
                        image: getImageUrl(item.product.images[0])
                    }
                }),
                status: ord.status
            }
        })

        return response
    } catch (error) {
        console.log(error);
        return []
    }
}