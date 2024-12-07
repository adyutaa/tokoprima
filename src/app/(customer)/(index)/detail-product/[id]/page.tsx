import React, { Suspense } from 'react'
import Navbar from '../../_components/navbar'
import CarouseImages from './_components/carousel-images'
import ListProducts from '../../_components/list-products'
import PriceInfo from './_components/price-info'
import { Tparams } from '@/types'
import { getProductById } from './lib/data'
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'

interface DetailProductProp {
	params: Tparams;
}

export default async function DetailProductPage({params}: DetailProductProp) {
    const {session} = await getUser()
    const product = await getProductById(Number.parseInt(params.id))
    
    console.log(session);
    
    if (!product) {
        return redirect('/')
    }

  return (
    <>
    <header className="bg-[#EFF3FA] pt-[30px] h-[480px] -mb-[310px]">
        <Navbar />
    </header>
    <div id="title" className="container max-w-[1130px] mx-auto flex items-center justify-between">
        <div className="flex flex-col gap-5">
            <div className="flex gap-5 items-center">
                <a className="page text-sm text-[#6A7789] last-of-type:text-black">Shop</a>
                <span className="text-sm text-[#6A7789]">/</span>
                <a className="page text-sm text-[#6A7789] last-of-type:text-black">Browse</a>
                <span className="text-sm text-[#6A7789]">/</span>
                <a className="page text-sm text-[#6A7789] last-of-type:text-black">Details</a>
            </div>
            <h1 className="font-bold text-4xl leading-9">{product.name}</h1>
        </div>
        <div className="flex items-center gap-2 justify-end">
            <div className="flex items-center">
                <div className="flex shrink-0">
                    <img src="/assets/icons/Star.svg" alt="star" />
                </div>
                <div className="flex shrink-0">
                    <img src="/assets/icons/Star.svg" alt="star" />
                </div>
                <div className="flex shrink-0">
                    <img src="/assets/icons/Star.svg" alt="star" />
                </div>
                <div className="flex shrink-0">
                    <img src="/assets/icons/Star.svg" alt="star" />
                </div>
                <div className="flex shrink-0">
                    <img src="/assets/icons/Star-gray.svg" alt="star" />
                </div>
            </div>
            <p className="font-semibold">({product._count.orders})</p>
        </div>
    </div>
    <CarouseImages images={product.images} />
    <div id="details-benefits" className="container max-w-[1130px] mx-auto flex items-center gap-[50px] justify-center mt-[50px]">
        <div className="flex items-center gap-[10px]">
            <div className="w-12 h-12 flex shrink-0 rounded-full bg-[#FFC736] items-center justify-center overflow-hidden">
                <img src="/assets/icons/star-outline.svg" alt="icon" />
            </div>
            <p className="font-semibold text-sm">Include Official <br /> Warranty</p>
        </div>
        <div className="border-[0.5px] border-[#E5E5E5] h-12"></div>
        <div className="flex items-center gap-[10px]">
            <div className="w-12 h-12 flex shrink-0 rounded-full bg-[#FFC736] items-center justify-center overflow-hidden">
                <img src="/assets/icons/code-circle.svg" alt="icon" />
            </div>
            <p className="font-semibold text-sm">Bonus Mac OS <br /> Capitan Pro</p>
        </div>
        <div className="border-[0.5px] border-[#E5E5E5] h-12"></div>
        <div className="flex items-center gap-[10px]">
            <div className="w-12 h-12 flex shrink-0 rounded-full bg-[#FFC736] items-center justify-center overflow-hidden">
                <img src="/assets/icons/like.svg" alt="icon" />
            </div>
            <p className="font-semibold text-sm">100% Original <br /> From Factory</p>
        </div>
        <div className="border-[0.5px] border-[#E5E5E5] h-12"></div>
        <div className="flex items-center gap-[10px]">
            <div className="w-12 h-12 flex shrink-0 rounded-full bg-[#FFC736] items-center justify-center overflow-hidden">
                <img src="/assets/icons/tag.svg" alt="icon" />
            </div>
            <p className="font-semibold text-sm">Free Tax On <br /> Every Sale</p>
        </div>
    </div>
    <div id="details-info" className="container max-w-[1030px] mx-auto flex justify-between gap-5 mt-[50px]">
        <div className="max-w-[650px] w-full flex flex-col gap-[30px]">
            <div id="about" className="flex flex-col gap-[10px]">
                <h3 className="font-semibold">About Product</h3>
                <p className="leading-[32px]">
                    {product.description}
                </p>
            </div>
            <div id="testi" className="flex flex-col gap-[10px]">
                <h3 className="font-semibold">Real Testimonials</h3>
                <div className="grid grid-cols-2 gap-5">
                    <div className="testi-card flex flex-col bg-white p-5 gap-5 border border-[#E5E5E5] rounded-[20px] h-fit">
                        <div className="flex">
                            <div className="flex shrink-0">
                                <img src="/assets/icons/Star.svg" alt="star" />
                            </div>
                            <div className="flex shrink-0">
                                <img src="/assets/icons/Star.svg" alt="star" />
                            </div>
                            <div className="flex shrink-0">
                                <img src="/assets/icons/Star.svg" alt="star" />
                            </div>
                            <div className="flex shrink-0">
                                <img src="/assets/icons/Star.svg" alt="star" />
                            </div>
                            <div className="flex shrink-0">
                                <img src="/assets/icons/Star-gray.svg" alt="star" />
                            </div>
                        </div>
                        <p className="line-clamp-2 hover:line-clamp-none leading-[28px]">I do really love this product helped me to achieve my first million Lorem ipsum dolor sit amet.</p>
                        <div className="flex items-center gap-[10px]">
                            <div className="w-[50px] h-[50px] flex shrink-0 rounded-full p-1 border border-[#E5E5E5] overflow-hidden">
                                <img src="/assets/photos/p2.png" className="w-full h-full object-cover rounded-full" alt="photo" />
                            </div>
                            <div className="flex flex-col gap-[2px]">
                                <p className="font-semibold text-sm leading-[22px]">Angga Risky</p>
                                <p className="text-xs leading-[18px]">12 January 2028</p>
                            </div>
                        </div>
                    </div>
                    <div className="testi-card flex flex-col bg-white p-5 gap-5 border border-[#E5E5E5] rounded-[20px] h-fit">
                        <div className="flex">
                            <div className="flex shrink-0">
                                <img src="/assets/icons/Star.svg" alt="star" />
                            </div>
                            <div className="flex shrink-0">
                                <img src="/assets/icons/Star.svg" alt="star" />
                            </div>
                            <div className="flex shrink-0">
                                <img src="/assets/icons/Star.svg" alt="star" />
                            </div>
                            <div className="flex shrink-0">
                                <img src="/assets/icons/Star-gray.svg" alt="star" />
                            </div>
                            <div className="flex shrink-0">
                                <img src="/assets/icons/Star-gray.svg" alt="star" />
                            </div>
                        </div>
                        <p className="line-clamp-2 hover:line-clamp-none leading-[28px]">I do really love this product helped me to achieve my first million Lorem ipsum dolor sit amet.</p>
                        <div className="flex items-center gap-[10px]">
                            <div className="w-[50px] h-[50px] flex shrink-0 rounded-full p-1 border border-[#E5E5E5] overflow-hidden">
                                <img src="/assets/photos/p4.png" className="w-full h-full object-cover rounded-full" alt="photo" />
                            </div>
                            <div className="flex flex-col gap-[2px]">
                                <p className="font-semibold text-sm leading-[22px]">Sarifuding</p>
                                <p className="text-xs leading-[18px]">12 January 2028</p>
                            </div>
                        </div>
                    </div>
                    <div className="testi-card flex flex-col bg-white p-5 gap-5 border border-[#E5E5E5] rounded-[20px] h-fit">
                        <div className="flex">
                            <div className="flex shrink-0">
                                <img src="/assets/icons/Star.svg" alt="star" />
                            </div>
                            <div className="flex shrink-0">
                                <img src="/assets/icons/Star.svg" alt="star" />
                            </div>
                            <div className="flex shrink-0">
                                <img src="/assets/icons/Star.svg" alt="star" />
                            </div>
                            <div className="flex shrink-0">
                                <img src="/assets/icons/Star.svg" alt="star" />
                            </div>
                            <div className="flex shrink-0">
                                <img src="/assets/icons/Star.svg" alt="star" />
                            </div>
                        </div>
                        <p className="line-clamp-2 hover:line-clamp-none leading-[28px]">I do really love this product helped me to achieve my first million Lorem ipsum dolor sit amet.</p>
                        <div className="flex items-center gap-[10px]">
                            <div className="w-[50px] h-[50px] flex shrink-0 rounded-full p-1 border border-[#E5E5E5] overflow-hidden">
                                <img src="/assets/photos/p3.png" className="w-full h-full object-cover rounded-full" alt="photo" />
                            </div>
                            <div className="flex flex-col gap-[2px]">
                                <p className="font-semibold text-sm leading-[22px]">Ika Nurina</p>
                                <p className="text-xs leading-[18px]">12 January 2028</p>
                            </div>
                        </div>
                    </div>
                    <div className="testi-card flex flex-col bg-white p-5 gap-5 border border-[#E5E5E5] rounded-[20px] h-fit">
                        <div className="flex">
                            <div className="flex shrink-0">
                                <img src="/assets/icons/Star.svg" alt="star" />
                            </div>
                            <div className="flex shrink-0">
                                <img src="/assets/icons/Star.svg" alt="star" />
                            </div>
                            <div className="flex shrink-0">
                                <img src="/assets/icons/Star.svg" alt="star" />
                            </div>
                            <div className="flex shrink-0">
                                <img src="/assets/icons/Star.svg" alt="star" />
                            </div>
                            <div className="flex shrink-0">
                                <img src="/assets/icons/Star-gray.svg" alt="star" />
                            </div>
                        </div>
                        <p className="line-clamp-2 hover:line-clamp-none leading-[28px]">I do really love this product helped me to achieve my first million Lorem ipsum dolor sit amet.</p>
                        <div className="flex items-center gap-[10px]">
                            <div className="w-[50px] h-[50px] flex shrink-0 rounded-full p-1 border border-[#E5E5E5] overflow-hidden">
                                <img src="/assets/photos/p1.png" className="w-full h-full object-cover rounded-full" alt="photo" />
                            </div>
                            <div className="flex flex-col gap-[2px]">
                                <p className="font-semibold text-sm leading-[22px]">Sami Mami</p>
                                <p className="text-xs leading-[18px]">12 January 2028</p>
                            </div>
                        </div>
                    </div>
                    <div className="testi-card flex flex-col bg-white p-5 gap-5 border border-[#E5E5E5] rounded-[20px] h-fit">
                        <div className="flex">
                            <div className="flex shrink-0">
                                <img src="/assets/icons/Star.svg" alt="star" />
                            </div>
                            <div className="flex shrink-0">
                                <img src="/assets/icons/Star.svg" alt="star" />
                            </div>
                            <div className="flex shrink-0">
                                <img src="/assets/icons/Star.svg" alt="star" />
                            </div>
                            <div className="flex shrink-0">
                                <img src="/assets/icons/Star-gray.svg" alt="star" />
                            </div>
                            <div className="flex shrink-0">
                                <img src="/assets/icons/Star-gray.svg" alt="star" />
                            </div>
                        </div>
                        <p className="line-clamp-2 hover:line-clamp-none leading-[28px]">I do really love this product helped me to achieve my first million Lorem ipsum dolor sit amet.</p>
                        <div className="flex items-center gap-[10px]">
                            <div className="w-[50px] h-[50px] flex shrink-0 rounded-full p-1 border border-[#E5E5E5] overflow-hidden">
                                <img src="/assets/photos/p2.png" className="w-full h-full object-cover rounded-full" alt="photo" />
                            </div>
                            <div className="flex flex-col gap-[2px]">
                                <p className="font-semibold text-sm leading-[22px]">Baronia</p>
                                <p className="text-xs leading-[18px]">12 January 2028</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <PriceInfo isLogIn={session ? true : false} item={{ 
            id: product.id,
            category_name: product.category.name,
            image_url: product.images[0],
            name: product.name,
            price: Number(product.price)
         }} />
    </div>
    <div id="recommedations" className="container max-w-[1130px] mx-auto flex flex-col gap-[30px] pb-[100px] mt-[70px]">
    <Suspense fallback={<span>Loading...</span>}>
                <ListProducts
					title={
						<>
							Other Products <br /> You Might Need
						</>
					}
                    isShowDetail={false}
				/>
                </Suspense>
    </div>
    
    </>
  )
}
