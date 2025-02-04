import React from "react";
import Navbar from "../_components/navbar";
import SearchBar from "./_components/search-bar";

import ProductListing from "./_components/product-listing";

export default function CatalogPage() {
  return (
    <>
      <header className="bg-[#EFF3FA] pt-[30px] h-[351px] -mb-[181px]">
        <Navbar />
      </header>
      <SearchBar />
      <div id="catalog" className="container max-w-[1400px] mx-auto flex gap-[30px] mt-[50px] pb-[100px] justify-center">
        <div className="w-[900px] flex flex-col bg-white p-[30px] gap-[30px] h-fit border border-[#E5E5E5] rounded-[30px]">
          <h2 className="font-bold text-2xl leading-[34px]">Produk</h2>
          <ProductListing />
        </div>
      </div>
    </>
  );
}
