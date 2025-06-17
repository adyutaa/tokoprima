import { create } from "zustand";
import { PrismaClient } from "@prisma/client";
export type TFilter = {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  categories?: number[] | null;
  model?: string;
  indexName?: string;
  namespace?: string;
  stock?: any | null;
  brands?: any | null;
  locations?: any | null;
};

export interface FilterState {
  filter: TFilter;
  setFilter: (filter: TFilter) => void;
}

export const useFilter = create<FilterState>()((set) => ({
  filter: {
    search: "",
    minPrice: 0,
    maxPrice: 0,
    stock: null,
    brands: null,
    categories: null,
    locations: null,
    model: "voyage",
    indexName: "ecommerce-voyage-3-large",
    namespace: "products-1",
  },
  setFilter: (filter) =>
    set((state) => ({
      filter: {
        ...state.filter,
        ...filter,
      },
    })),
}));
