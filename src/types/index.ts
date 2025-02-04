export type ActionResult = {
  error: string;
};

export type Tparams = {
  id: string;
};

export type Tedit = {
  params: Tparams;
};

// export type TProduct = {
//   id: number;
//   images: string;
//   name: string;
//   category_name: string;
//   price: number;
// };

export type TProduct = {
  // id: number;
  // category_id: number;
  // name: string;
  // description: string;
  // price: bigint; // Ubah dari number ke bigint
  // // stock: ProductStock; // Pastikan ProductStock sudah terdefinisi (misalnya sebagai enum atau tipe string)
  // images: string[] | null;
  // created_at: Date;
  // updated_at: Date;
  // rating: number | null;
  // rating_count: number | null;
};

export type ReviewSelect = {
  select: {
    comment: boolean;
  };
};

export type TPineconeProduct = {
  id: number;
  category_name: string;
  image_url: string;
  name: string;
  price: number;
};

export type TCart = TProduct & { quantity: number };
