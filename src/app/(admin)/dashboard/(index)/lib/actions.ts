"use server"

import { getUser, lucia } from "@/lib/auth";
import { ActionResult } from "@/types";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function Logout(
    _: unknown,
    formData: FormData,
): Promise<ActionResult> {
    console.log('logout');

    const {session} = await getUser()

    if (!session) {
        return {
            error: 'Unauthorized'
        }
    }

    await lucia.invalidateSession(session.id)

    const sessionCookie = lucia.createBlankSessionCookie()

    cookies().set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes
    )

    return redirect('/dashboard/sign-in')
    
}