"use client";

import { useState, useEffect } from "react";
import { useFilter } from "@/hooks/useFilter";

const embeddingOptions = [
  { name: "Model A", value: "openai", index: "ecommerce-3-large", namespace: "products-1" },
  { name: "Model B", value: "voyage", index: "ecommerce-voyage-3-large", namespace: "products-1" },
];

export default function SearchBar() {
  const { setFilter } = useFilter();
  const [query, setQuery] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState(embeddingOptions[0]);
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (query.trim().length > 0) {
      console.log("🔍 Searching for:", query, "with model:", selectedModel.name);

      setFilter({
        search: query,
        model: selectedModel.value,
        indexName: selectedModel.index,
        namespace: selectedModel.namespace,
      });
    } else {
      setFilter({});
    }
  };

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
      <div className="flex flex-col gap-3 max-w-[480px] w-full">
        <form
          onSubmit={handleSearch} // Prevent form submission on enter
          className="w-full bg-white flex items-center gap-[10px] rounded-full border border-[#E5E5E5] p-[12px_20px] focus-within:ring-2 focus-within:ring-[#FFC736] transition-all duration-300"
        >
          <input
            type="text"
            id="search"
            name="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="appearance-none outline-none w-full placeholder:text-[#616369] placeholder:font-normal font-semibold text-black"
            placeholder="Search for products..."
          />
          <button type="submit" className="flex shrink-0">
            <img src="/assets/icons/search-normal.svg" alt="Search Icon" />
          </button>
        </form>

        {/* Model Selector Dropdown */}
        <div className="relative w-full">
          <button
            onClick={() => setIsModelSelectorOpen(!isModelSelectorOpen)}
            className="flex items-center justify-between w-full p-2 text-sm text-left bg-white border border-[#E5E5E5] rounded-md font-medium text-gray-700 hover:bg-gray-50"
          >
            <span className="flex items-center">
              <span className="w-2 h-2 mr-2 bg-green-500 rounded-full"></span>
              Search model: {selectedModel.name}
            </span>
            <svg className="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          {isModelSelectorOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
              <ul className="py-1 text-sm text-gray-700">
                {embeddingOptions.map((option) => (
                  <li key={option.value}>
                    <button
                      onClick={() => {
                        setSelectedModel(option);
                        setIsModelSelectorOpen(false);
                      }}
                      className={`block w-full px-4 py-2 text-left hover:bg-gray-100 ${selectedModel.value === option.value ? "bg-gray-50 font-medium" : ""}`}
                    >
                      {option.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
