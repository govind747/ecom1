import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type Product } from "@shared/schema";

interface CartState {
  items: Product[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addToCart: (product) => 
        set((state) => ({
          // Only add if not already in cart
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
