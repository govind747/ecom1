import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Product, CartProduct } from "@shared/types";
import { toCartProduct } from "@shared/types";

export function useProducts() {
  return useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

export function useProduct(productId: string | undefined) {
  return useQuery<Product | null>({
    queryKey: ["product", productId],
    queryFn: async () => {
      if (!productId) return null;
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!productId,
  });
}

export function useProductSuggestions(productId: string | undefined, limit = 4) {
  return useQuery<CartProduct[]>({
    queryKey: ["product-suggestions", productId],
    queryFn: async () => {
      if (!productId) return [];
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .neq("id", productId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw new Error(error.message);
      return (data ?? []).map(toCartProduct);
    },
    enabled: !!productId,
  });
}

export function useProductLikes(productId: string | undefined) {
  return useQuery<{ count: number; liked: boolean }>({
    queryKey: ["product-likes", productId],
    queryFn: async () => {
      if (!productId) return { count: 0, liked: false };
      const { count, error } = await supabase
        .from("product_likes")
        .select("*", { count: "exact", head: true })
        .eq("product_id", productId);
      if (error) throw new Error(error.message);

      const { data: { session } } = await supabase.auth.getSession();
      let liked = false;
      if (session) {
        const { data: myLike } = await supabase
          .from("product_likes")
          .select("id")
          .eq("product_id", productId)
          .eq("user_id", session.user.id)
          .maybeSingle();
        liked = !!myLike;
      }
      return { count: count ?? 0, liked };
    },
    enabled: !!productId,
  });
}

export function useToggleProductLike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, liked }: { productId: string; liked: boolean }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Please sign in to like products");
      if (liked) {
        const { error } = await supabase
          .from("product_likes")
          .delete()
          .eq("product_id", productId)
          .eq("user_id", session.user.id);
        if (error) throw new Error(error.message);
        return { liked: false };
      } else {
        const { error } = await supabase
          .from("product_likes")
          .insert({ product_id: productId });
        if (error) throw new Error(error.message);
        return { liked: true };
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["product-likes", variables.productId] });
    },
  });
}
