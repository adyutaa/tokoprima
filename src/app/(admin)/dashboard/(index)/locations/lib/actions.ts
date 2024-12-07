"use server";

import { schemaCategory } from "@/lib/schema";
import { ActionResult } from "@/types";
import { redirect } from "next/navigation";
import prisma from "../../../../../../../lib/prisma";

export async function postCategory(
	_: unknown,
	formData: FormData
): Promise<ActionResult> {
	const validate = schemaCategory.safeParse({
		name: formData.get("name"),
	});

	if (!validate.success) {
		return {
			error: validate.error.errors[0].message,
		};
	}

	try {
		await prisma.location.create({
			data: {
				name: validate.data.name,
			},
		});
	} catch (error) {
		console.log(error);
		return {
			error: "Failed to insert data",
		};
	}

	return redirect("/dashboard/locations");
}

export async function updateCategory(
	_: unknown,
	formData: FormData,
	id: number | undefined
): Promise<ActionResult> {
	const validate = schemaCategory.safeParse({
		name: formData.get("name"),
	});

	if (!validate.success) {
		return {
			error: validate.error.errors[0].message,
		};
	}

	if (id === undefined) {
		return {
			error: "Id is not found",
		};
	}

	try {
		await prisma.location.update({
			where: {
				id: id,
			},
			data: {
				name: validate.data.name,
			},
		});
	} catch (error) {
		console.log(error);
		return {
			error: "Failed to update data",
		};
	}

	return redirect("/dashboard/locations");
}

export async function deleteCategory(
	_: unknown,
	formData: FormData,
	id: number
): Promise<ActionResult> {
	try {
		await prisma.location.delete({
			where: {
				id,
			},
		});
	} catch (error) {
		console.log(error);
		return {
			error: "Failed to delete data",
		};
	}

	return redirect("/dashboard/locations");
}
