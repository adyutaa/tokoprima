"use client"

import { useFilter } from '@/hooks/useFilter'
import React, { useEffect, useState } from 'react'

export default function FilterPrice() {
    const {setFilter} = useFilter()
    const [minPrice, setMinPrice] = useState<number>(0)
    const [maxPrice, setMaxPrice] = useState<number>(0)

    useEffect(() => {
        const debounceInput = setTimeout(() => {

            setFilter({
                minPrice: minPrice
            })
        }, 1500)

        return () => clearTimeout(debounceInput)
    }, [minPrice])


    useEffect(() => {
        const debounceInput = setTimeout(() => {

            setFilter({
                maxPrice: maxPrice
            })
            
        }, 1500)

        return () => clearTimeout(debounceInput)
    }, [maxPrice])

  return (
    <div className="flex flex-col gap-[14px]">
                <p className="font-semibold leading-[22px]">Range Harga</p>
                <div className="max-w-[480px] w-full bg-white flex items-center gap-[10px] rounded-full border border-[#E5E5E5] p-[12px_20px] focus-within:ring-2 focus-within:ring-[#FFC736] transition-all duration-300">
                    <div className="flex shrink-0">
                        <img src="assets/icons/dollar-circle.svg" alt="icon" />
                    </div>
                    <input type="number" id="" onChange={(e) => setMinPrice(Number.parseInt(e.target.value))
                    } name="" className="appearance-none outline-none w-full placeholder:text-[#616369] placeholder:font-normal font-semibold text-black" placeholder="Minimum price" />
                </div>
                <div className="max-w-[480px] w-full bg-white flex items-center gap-[10px] rounded-full border border-[#E5E5E5] p-[12px_20px] focus-within:ring-2 focus-within:ring-[#FFC736] transition-all duration-300">
                    <div className="flex shrink-0">
                        <img src="assets/icons/dollar-circle.svg" alt="icon" />
                    </div>
                    <input type="number" id="" name="" onChange={(e) => setMaxPrice(Number.parseInt(e.target.value))
                    } className="appearance-none outline-none w-full placeholder:text-[#616369] placeholder:font-normal font-semibold text-black" placeholder="Maximum price" />
                </div>
            </div>
  )
}
