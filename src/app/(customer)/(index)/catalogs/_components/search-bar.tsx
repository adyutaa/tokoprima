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
