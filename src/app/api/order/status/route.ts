import { NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma"

export async function POST(request: Request) {
    const body = await request.json()

    try {
        const code = body.data.reference_id

    await prisma.order.update({
        where: {
            code: code
        },
        data: {
            status: body.data.status === "SUCCEEDED" ? 'success' : 'failed'
        }
    })
    } catch (error) {
      console.log(error);
        
    }

    return NextResponse.json({status: true})
}