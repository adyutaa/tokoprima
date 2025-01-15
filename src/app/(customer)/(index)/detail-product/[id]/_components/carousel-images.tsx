"use client";

import React from "react";
import Flickity from "react-flickity-component";

interface CarouselImagesProp {
  images: string[];
}

export default function CarouseImages({ images }: CarouselImagesProp) {
  console.log("Carousel Images:", images); // Debug log
  return (
    <div id="details-images" className="main-carousel overflow-x-hidden mt-[30px]">
      <Flickity
        options={{
          cellAlign: "left",
          contain: true,
          pageDots: false,
          prevNextButtons: false,
        }}
      >
        {images.map((item, i) => (
          <div key={item + i} className="image-card pr-5 first-of-type:pl-[calc((100vw-1130px-20px)/2)]">
            <div className="bg-white w-[470px] h-[350px] p-10 flex shrink-0 border border-[#E5E5E5] justify-center items-center rounded-[30px] overflow-hidden">
              <img src={item} className="w-full h-full object-contain" alt="thumbnail" />
            </div>
          </div>
        ))}
      </Flickity>
    </div>
  );
}
