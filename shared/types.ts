// Shared types matching the Supabase schema.

export type Profile = {
  id: string;
  username: string;
  created_at: string;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number; // in paise
  image_url: string;
  created_at: string;
};

export type OrderStatus = "processing" | "dispatched" | "delivered";

export type Order = {
  id: string;
  user_id: string;
  product_id: string;
  status: OrderStatus;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  created_at: string;
};

export type OrderWithProduct = Order & { product: Product };

export type Comment = {
  id: string;
  product_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
};

export type CommentWithProfile = Comment & {
  profile: Profile | null;
  likes: { user_id: string }[];
  replies?: CommentWithProfile[];
};

export type ProductLike = {
  id: string;
  product_id: string;
  user_id: string;
  created_at: string;
};

// Frontend-facing Product shape used by the cart (matches old interface name).
export type CartProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
};

// Map a DB product to the cart shape used by zustand.
export function toCartProduct(p: Product): CartProduct {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    imageUrl: p.image_url,
  };
}
