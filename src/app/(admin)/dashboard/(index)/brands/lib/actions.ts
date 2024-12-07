"use server";

import { schemaBrand } from "@/lib/schema";
import { deleteFile, uploadFile } from "@/lib/supabase";
import { ActionResult } from "@/types";
import { redirect } from "next/navigation";
import prisma from "../../../../../../../lib/prisma";

export async function postBrand(
	_: unknown,
	formData: FormData
): Promise<ActionResult> {
	const validate = schemaBrand.safeParse({
		name: formData.get("name"),
		image: formData.get("image"),
	});

	if (!validate.success) {
		return {
			error: validate.error.errors[0].message,
		};
	}

	try {
		const filename = await uploadFile(validate.data.image, "brands");

		await prisma.brand.create({
			data: {
				name: validate.data.name,
				logo: filename,
			},
		});
	} catch (error) {
		console.log(error);
		return {
			error: "Failed to insert data",
		};
	}

	return redirect("/dashboard/brands");
}

export async function updateBrand(
	_: unknown,
	formData: FormData,
	id: number
): Promise<ActionResult> {
	console.log(formData.get("image"));

	const fileUpload = formData.get("image") as File;

	const validate = schemaBrand.pick({ name: true }).safeParse({
		name: formData.get("name"),
	});

	if (!validate.success) {
		return {
			error: validate.error.errors[0].message,
		};
	}

	const brand = await prisma.brand.findFirst({
		where: {
			id: id,
		},
		select: {
			logo: true,
		},
	});

	let filename = brand?.logo;

	if (fileUpload.size > 0) {
		filename = await uploadFile(fileUpload, "brands");
	}

	try {
		await prisma.brand.update({
			where: {
				id: id,
			},
			data: {
				name: validate.data.name,
				logo: filename,
			},
		});
	} catch (error) {
		console.log(error);
		return {
			error: "Failed to update data",
		};
	}

	return redirect("/dashboard/brands");
}

export async function deleteBrand(
	_: unknown,
	formData: FormData,
	id: number
): Promise<ActionResult> {
	console.log(id);

	const brand = await prisma.brand.findFirst({
		where: {
			id: id,
		},
		select: {
			logo: true,
		},
	});

	if (!brand) {
		return {
			error: "Brand not found",
		};
	}

	try {
		deleteFile(brand.logo, "brands");

		await prisma.brand.delete({
			where: {
				id: id,
			},
		});
	} catch (error) {
		console.log(error);
		return {
			error: "Failed to delete Data",
		};
	}

	return redirect("/dashboard/brands");
}
