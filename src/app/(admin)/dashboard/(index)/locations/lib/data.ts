import prisma from "../../../../../../../lib/prisma";

export async function getLocations() {
	try {
		const categories = await prisma.location.findMany({});

		return categories;
	} catch (error) {
		console.log(error);
		return [];
	}
}

export async function getCategoryById(id: string) {
	try {
		const category = await prisma.location.findFirst({
			where: {
				id: Number.parseInt(id),
			},
		});

		return category;
	} catch (error) {
		console.log(error);
		return null;
	}
}
