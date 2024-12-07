// "use client";

// import React from "react";
// import CardProduct from "../../_components/card-product";
// import { useQuery } from "@tanstack/react-query";
// import { fetchProduct } from "../lib/data";
// import { useFilter } from "@/hooks/useFilter";

// export default function ProductListing() {
//   const { filter } = useFilter();

//   const { data, isLoading } = useQuery({
//     queryKey: ["product-listing", filter],
//     queryFn: () => fetchProduct(filter),
//   });

//   if (isLoading) {
//     return (
//       <div className="grid grid-cols-1 gap-[30px]">
//         <span>Loading...</span>
//       </div>
//     );
//   }

//   return (
//     <div className="grid grid-cols-3 gap-[30px]">
//       {data?.map((product) => (
//         <CardProduct key={product.id + product.name} item={product} />
//       ))}
//     </div>
//   );
// }

// ini yang bener
// "use client";

// import React from "react";
// import CardProduct from "../../_components/card-product";
// import { useQuery } from "@tanstack/react-query";
// import { fetchProduct } from "../lib/data";
// import { useFilter } from "@/hooks/useFilter";

// export default function ProductListing() {
//   const { filter } = useFilter();

//   const { data, isLoading } = useQuery({
//     queryKey: ["product-listing", filter],
//     queryFn: () => fetchProduct(filter),
//   });

//   if (isLoading) {
//     return (
//       <div className="grid grid-cols-1 gap-[30px]">
//         <span>Loading...</span>
//       </div>
//     );
//   }

//   return (
//     <div className="grid grid-cols-3 gap-[30px]">
//       {data?.map((product) => (
//         <CardProduct key={product.id + product.name} item={product} />
//       ))}
//     </div>

//   );
// }

// catalogs/_components/product-listing.tsx

"use client";

import React from "react";
import CardProduct from "../../_components/card-product";
import { useQuery } from "@tanstack/react-query";
import { fetchProduct } from "../lib/data";
import { useFilter } from "@/hooks/useFilter";

export default function ProductListing() {
  const { filter } = useFilter();

  const { data, isLoading } = useQuery({
    queryKey: ["product-listing", filter],
    queryFn: () => fetchProduct(filter),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-[30px]">
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-[30px]">
      {data?.map((product) => (
        <CardProduct key={product.id + product.name} item={product} />
      ))}
    </div>
  );
}
