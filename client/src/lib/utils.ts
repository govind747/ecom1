import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toCartProduct } from "@shared/types";
import { toCartProduct } from "@shared/types";
export { toCartProduct };


export { toCartProduct };

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(paise / 100);
}
