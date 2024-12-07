// "use client";

// import { useState, useEffect } from "react";
// import { useFilter } from "@/hooks/useFilter";
// import axios from "axios";

// export default function SearchBar() {
//   const { setFilter } = useFilter();
//   const [query, setQuery] = useState<string>("");
//   const [results, setResults] = useState<any[]>([]); // Store the search results

//   useEffect(() => {
//     // Set a debounce for search input
//     const debounceInput = setTimeout(async () => {
//       if (query.trim().length > 0) {
//         try {
//           // Call the backend search API
//           const response = await axios.post("/api/catalog", { query });
//           setResults(response.data.matches); // Assuming Pinecone response is in `matches`

//           // Optionally, you can update the filter with search results here
//           setFilter({
//             search: query,
//           });
//         } catch (error) {
//           console.error("Error fetching search results:", error);
//         }
//       }
//     }, 1500);

//     return () => clearTimeout(debounceInput);
//   }, [query]);

//   return (
// <div id="title" className="container max-w-[1130px] mx-auto flex items-center justify-between">
//   <div className="flex flex-col gap-5">
//     <div className="flex gap-5 items-center">
//       <a className="page text-sm text-[#6A7789] last-of-type:text-black">Shop</a>
//       <span className="text-sm text-[#6A7789]">/</span>
//       <a className="page text-sm text-[#6A7789] last-of-type:text-black">Browse</a>
//       <span className="text-sm text-[#6A7789]">/</span>
//       <a className="page text-sm text-[#6A7789] last-of-type:text-black">Catalog</a>
//     </div>
//     <h1 className="font-bold text-4xl leading-9">Our Product Catalog</h1>
//   </div>
//   <form action="" className="max-w-[480px] w-full bg-white flex items-center gap-[10px] rounded-full border border-[#E5E5E5] p-[12px_20px] focus-within:ring-2 focus-within:ring-[#FFC736] transition-all duration-300">
//     <input
//       type="text"
//       id="search"
//       name="search"
//       onChange={(e) => setQuery(e.target.value)}
//       className="appearance-none outline-none w-full placeholder:text-[#616369] placeholder:font-normal font-semibold text-black"
//       placeholder="Search product by name, brand, category"
//     />
//     <button type="submit" className="flex shrink-0">
//       <img src="assets/icons/search-normal.svg" alt="icon" />
//     </button>
//   </form>
//   {results.length > 0 && (
//     <div className="search-results mt-4">
//       <ul>
//         {results.map((result, index) => (
//           <li key={index} className="search-result-item">
//             {/* Display relevant fields from the result */}
//             <p>{result.name}</p> {/* Modify according to your result structure */}
//             <p>{result.description}</p>
//           </li>
//         ))}
//       </ul>
//     </div>
//   )}
// </div>
//   );
// }

// catalogs/_components/search-bar.tsx
// catalogs/_components/search-bar.tsx

// INI YANG BENER
// "use client";

// import { useState, useEffect } from "react";
// import { useFilter } from "@/hooks/useFilter";
// import axios from "axios";
// import { TProduct } from "@/types";

// export default function SearchBar() {
//   const { setFilter } = useFilter();
//   const [query, setQuery] = useState<string>("");
//   const [results, setResults] = useState<TProduct[]>([]); // Define the type based on your TProduct

//   useEffect(() => {
//     // Set a debounce for search input
//     const debounceInput = setTimeout(async () => {
//       if (query.trim().length > 0) {
//         try {
//           // Call the backend search API with { search: query }
//           const response = await axios.post("/api/catalog", { search: query });
//           setResults(response.data); // The backend returns an array of products

//           // Update the filter with search results here
//           setFilter({
//             search: query,
//           });
//         } catch (error) {
//           console.error("Error fetching search results:", error);
//         }
//       } else {
//         // If query is empty, clear results and reset filters
//         setResults([]);
//         setFilter({});
//       }
//     }, 500); // Reduced debounce time for better UX

//     return () => clearTimeout(debounceInput);
//   }, [query, setFilter]);

//   return (
//     <div className="container max-w-[1130px] mx-auto flex items-center justify-between">
//       <form
//         onSubmit={(e) => e.preventDefault()} // Prevent form submission on enter
//         className="max-w-[480px] w-full bg-white flex items-center gap-[10px] rounded-full border border-[#E5E5E5] p-[12px_20px] focus-within:ring-2 focus-within:ring-[#FFC736] transition-all duration-300"
//       >
//         <input
//           type="text"
//           id="search"
//           name="search"
//           value={query}
//           onChange={(e) => setQuery(e.target.value)}
//           className="appearance-none outline-none w-full placeholder:text-[#616369] placeholder:font-normal font-semibold text-black"
//           placeholder="Search product by name, brand, category"
//         />
//         <button type="submit" className="flex shrink-0">
//           <img src="/assets/icons/search-normal.svg" alt="Search Icon" />
//         </button>
//       </form>
//       {results.length > 0 && (
//         <div className="search-results mt-4">
//           <ul>
//             {results.map((product) => (
//               <li key={product.id} className="search-result-item">
//                 {/* Display relevant fields from the product */}
//                 <p className="font-semibold">{product.name}</p>
//                 <p className="text-sm text-gray-500">{product.category_name}</p>
//                 <p className="text-sm text-gray-700">${product.price.toFixed(2)}</p>
//                 <img src={product.image_url} alt={product.name} width={100} />
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}
//     </div>
//   );
// }

// catalogs/_components/search-bar.tsx

"use client";

import { useState, useEffect } from "react";
import { useFilter } from "@/hooks/useFilter";
import axios from "axios";
import { TProduct } from "@/types";

export default function SearchBar() {
  const { setFilter } = useFilter();
  const [query, setQuery] = useState<string>("");

  useEffect(() => {
    // Set a debounce for search input
    const debounceInput = setTimeout(async () => {
      if (query.trim().length > 0) {
        try {
          // Call the backend search API with { search: query }
          const response = await axios.post("/api/catalog", { search: query });
          // Assuming the response is used to update the filter
          setFilter({
            search: query,
          });
        } catch (error) {
          console.error("Error fetching search results:", error);
        }
      } else {
        // If query is empty, clear filters
        setFilter({});
      }
    }, 500); // Reduced debounce time for better UX

    return () => clearTimeout(debounceInput);
  }, [query, setFilter]);

  return (
    <div className="container max-w-[1130px] mx-auto flex items-center justify-between">
      <div className="flex flex-col gap-5">
        <div className="flex gap-5 items-center">
          <a className="page text-sm text-[#6A7789] last-of-type:text-black">Belanja</a>
          <span className="text-sm text-[#6A7789]">/</span>
          <a className="page text-sm text-[#6A7789] last-of-type:text-black">Browse</a>
          <span className="text-sm text-[#6A7789]">/</span>
          <a className="page text-sm text-[#6A7789] last-of-type:text-black">Katalog</a>
        </div>
        <h1 className="font-bold text-4xl leading-9">Katalog Produk</h1>
      </div>
      <form
        onSubmit={(e) => e.preventDefault()} // Prevent form submission on enter
        className="max-w-[480px] w-full bg-white flex items-center gap-[10px] rounded-full border border-[#E5E5E5] p-[12px_20px] focus-within:ring-2 focus-within:ring-[#FFC736] transition-all duration-300"
      >
        <input
          type="text"
          id="search"
          name="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="appearance-none outline-none w-full placeholder:text-[#616369] placeholder:font-normal font-semibold text-black"
          placeholder="Search product by name, brand, category"
        />
        <button type="submit" className="flex shrink-0">
          <img src="/assets/icons/search-normal.svg" alt="Search Icon" />
        </button>
      </form>
    </div>
  );
}
