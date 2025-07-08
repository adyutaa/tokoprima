"use client";

import { useCart } from "@/hooks/useCart";
import { rupiahFormat } from "@/lib/utils";
import React from "react";

export default function CartProducts() {
  const { products, decreaseQuantity, increaseQuantity, removeProduct } = useCart();
  return (
    <div id="cart" className="container max-w-[1130px] mx-auto flex flex-col gap-5 mt-[50px]">
      {products.map((cart) => (
        <div key={cart.id + cart.name} className="product-total-card bg-white flex items-center justify-between p-5 rounded-[20px] border border-[#E5E5E5]">
          <div className="flex items-center w-[340px] gap-5">
            <div className="w-[120px] h-[70px] flex shrink-0 overflow-hidden items-center justify-center">
              {cart.images && cart.images.length > 0 ? (
                <img src={cart.images[0]} className="w-full h-full object-contain" alt={cart.name || "Product image"} />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">No Image</div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <p className="font-semibold leading-[22px]">{cart.name}</p>
              <p className="text-sm text-[#616369]">{cart.category_id}</p>
            </div>
          </div>
          <div className="w-[150px] flex flex-col gap-1">
            <p className="text-sm text-[#616369]">Price</p>
            <p className="font-semibold text-[#0D5CD7] leading-[22px]">{rupiahFormat(cart.price)}</p>
          </div>
          <div className="w-[120px] flex flex-col gap-1">
            <p className="text-sm text-[#616369]">Quantity</p>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => decreaseQuantity(cart.id)} className="w-6 h-6 flex shrink-0">
                <img src="assets/icons/minus-cirlce.svg" alt="minus" />
              </button>
              <p className="text-[#0D5CD7] font-semibold leading-[22px]">{cart.quantity}</p>
              <button type="button" onClick={() => increaseQuantity(cart.id)} className="w-6 h-6 flex shrink-0">
                <img src="assets/icons/add-circle.svg" alt="plus" />
              </button>
            </div>
          </div>
          <div className="w-[150px] flex flex-col gap-1">
            <p className="text-sm text-[#616369]">Total</p>
            <p className="font-semibold text-[#0D5CD7] leading-[22px]">{rupiahFormat(Number(cart.price * BigInt(cart.quantity)))}</p>
          </div>
          <button type="button" onClick={() => removeProduct(cart.id)} className="p-[12px_24px] bg-white rounded-full text-center font-semibold border border-[#E5E5E5]">
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}
