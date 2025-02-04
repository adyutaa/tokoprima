import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY ?? "";

// Create a single supabase client for interacting with your database
const supabase = createClient(supabaseUrl, supabaseKey);

// export const getImageUrl = (name: string, path: "brands" | "products" = "brands") => {
//   const { data } = supabase.storage.from("ecommerce").getPublicUrl(`public/${path}/${name}`);

//   return data.publicUrl;
// };
// export const getImageUrl = (name: string, path: "brands" | "products" = "brands"): string => {
//   // Kita tanya Supabase: "Bro, kasih tau aku URL publik gambar ini!"
//   const { data } = supabase.storage.from("ecommerce").getPublicUrl(`public/${path}/${name}`);

//   // Jika data.publicUrl ada, berarti Supabase gak iseng dan memberi URL yang valid.
//   // Kalau enggak, kita kasih tahu si pengguna bahwa gambar tersebut lagi off duty.
//   return data.publicUrl || `https://oops.yourdomain.com/image-not-found?name=${encodeURIComponent(name)}`;
// };

// export const getImageUrl = (images: string[] | null, path: "brands" | "products" = "products"): string | null => {
//   if (!images || images.length === 0) return null;

//   const image = images[0];
//   return image.startsWith("http") ? image : `https://gclyhedubfskowdnrtmg.supabase.co/storage/v1/object/public/${path}/${image}`;
// };

export const getImageUrl = (name: string, path: "brands" | "products" = "brands"): string => {
  // Assume that files are stored in the path "products/example.jpg" within the bucket
  const { data } = supabase.storage.from("ecommerce").getPublicUrl(`${path}/${name}`);
  return data.publicUrl;
};

// // lib/supabase.ts
// export const getImageUrl = (name: string, path: "brands" | "products" = "products"): string => {
//   return `https://gclyhedubfskowdnrtmg.supabase.co/storage/v1/object/public/${path}/${name}`;
// };
const testUrl = getImageUrl("example.jpg", "products");
console.log("Test image URL:", testUrl);

export const uploadFile = async (file: File, path: "brands" | "products" = "brands") => {
  const fileType = file.type.split("/")[1];
  const filename = `${path}-${Date.now()}.${fileType}`;
  console.log("Generated filename:", filename);

  await supabase.storage.from("ecommerce").upload(`public/${path}/${filename}`, file, {
    cacheControl: "3600",
    upsert: false,
  });

  return filename;
};

export const deleteFile = async (filename: string, path: "brands" | "products" = "brands") => {
  await supabase.storage.from("ecommerce").remove([`public/${path}/${filename}`]);
};
