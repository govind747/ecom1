import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type CartProduct } from "@shared/types";

interface CartState {
  items: CartProduct[];
  addToCart: (product: CartProduct) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addToCart: (product) =>
        set((state) => ({
          items: state.items.some((item) => item.id === product.id)
            ? state.items
            : [...state.items, product],
        })),
      removeFromCart: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== productId),
        })),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: "ecommerce-cart",
    }
  )
);
