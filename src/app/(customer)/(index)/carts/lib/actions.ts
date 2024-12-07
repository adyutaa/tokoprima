"use server"

import { getUser } from "@/lib/auth";
import { schemaShippingAddress } from "@/lib/schema";
import { ActionResult, TCart } from "@/types";
import { redirect } from "next/navigation";
import prisma from "../../../../../../lib/prisma";
import { generateRandomString } from "@/lib/utils";
import { PaymentRequestParameters, PaymentRequest } from "xendit-node/payment_request/models";
import xenditClient from "@/lib/xendit";
import { Prisma } from "@prisma/client";

export async function storeOrder(
    _: unknown,
    formData: FormData,
    total: number,
    products: TCart[]
): Promise<ActionResult> {

    const {session, user} = await getUser()

    if (!session) {
        return redirect('/')
    }

    const parse = schemaShippingAddress.safeParse({
        name: formData.get('name'),
        address: formData.get('address'),
        city: formData.get('city'),
        postal_code: formData.get('postal_code'),
        notes: formData.get('notes'),
        phone: formData.get('phone'),
    })

    if (!parse.success) {
        return {
            error: parse.error.errors[0].message
        }
    }

    let redirectPaymentUrl = '/'

    try {
        const order = await prisma.order.create({
            data: {
                total: total,
                status: 'pending',
                user_id: user.id,
                code: generateRandomString(15)
            }
        })

        const data: PaymentRequestParameters = {
            amount: total,
            paymentMethod: {
                ewallet: {
                    channelProperties: {
                        successReturnUrl: process.env.NEXT_PUBLIC_REDIRECT_URL
                    },
                    channelCode: 'SHOPEEPAY'
                },
                reusability: "ONE_TIME_USE",
                type: "EWALLET"
            },
            currency: "IDR",
            referenceId: order.code
        }

        const response: PaymentRequest = await xenditClient.PaymentRequest.createPaymentRequest({
            data
        })

        redirectPaymentUrl = response.actions?.find((val) => val.urlType === "DEEPLINK")?.url ?? "/"

        const queryCreateProductOrder: Prisma.OrderProductCreateManyInput[] = []

        for (const product of products) {
            queryCreateProductOrder.push({
                order_id: order.id,
                product_id: product.id,
                quantity: product.quantity,
                subtotal: product.price
            })
        }

        await prisma.orderProduct.createMany({
            data: queryCreateProductOrder
        })

        await prisma.orderDetail.create({
            data: {
                address: parse.data.address,
                city: parse.data.city,
                name: parse.data.name,
                phone: parse.data.phone,
                postal_code: parse.data.postal_code,
                notes: parse.data.notes,
                order_id: order.id
            }
        })

    } catch (error) {
        console.log(error);
        return {
            error: "Failed to checkout"
        }
    }

    return redirect(redirectPaymentUrl)
}