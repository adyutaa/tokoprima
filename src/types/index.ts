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
  id: number;
  categories: string[];
  name: string;
  description?: string;
  price: BigInt;
  images: string[] | null;
};

export type TPineconeProduct = {
  id: number;
  categories: string[];
  images: string[];
  name: string;
  description: string;
  price: BigInt;
};

export type TCart = TProduct & { quantity: number };
