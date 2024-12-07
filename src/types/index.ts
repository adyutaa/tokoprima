export type ActionResult = {
	error: string;
};

export type Tparams = {
	id: string;
};

export type Tedit = {
	params: Tparams;
};

export type TProduct = {
    id: number
    image_url: string
    name: string
    category_name: string
    price: number
}

export type TCart = TProduct & {quantity: number}