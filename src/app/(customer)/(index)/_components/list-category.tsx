import React from 'react'
import { getCategories } from '../lib/data'
import Link from 'next/link'

export default async function ListCategory() {
    const categories = await getCategories()


  return (
    <div id="categories" className="flex flex-col gap-[30px]">
            <div className="flex items-center justify-between">
                <h2 className="font-bold text-2xl leading-[34px]">Browse Products <br /> by Categories</h2>
                <a href="catalog.html" className="p-[12px_24px] border border-[#E5E5E5] rounded-full font-semibold">Explore All</a>
            </div>
            <div className="grid grid-cols-4 gap-[30px]">
                {categories.map((item) => (
                    <Link key={`${item.name + item.id}`} href="#" className="categories-card">
                    <div className="bg-white flex items-center gap-[14px] p-5 rounded-[20px] ring-1 ring-[#E5E5E5] hover:ring-2 hover:ring-[#FFC736] transition-all duration-300 w-full">
                        <div className="w-12 h-12 flex shrink-0 rounded-full bg-[#0D5CD7] items-center justify-center overflow-hidden">
                            <img src="assets/icons/mobile.svg" alt="icon" />
                        </div>
                        <div className="flex flex-col gap-[2px]">
                            <p className="font-semibold leading-[22px]">{item.name}</p>
                            <p className="text-sm text-[#616369]">{item._count.products} products</p>
                        </div>
                    </div>
                </Link>
                ))}
            </div>
        </div>
  )
}
