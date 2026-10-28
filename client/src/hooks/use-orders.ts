import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Order, OrderWithProduct } from "@shared/types";

export function useOrders() {
  return useQuery<OrderWithProduct[]>({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      const { data, error } = await supabase
        .from("orders")
        .select("*, product:products(*)")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as OrderWithProduct[];
    },
  });
}

export function useCreateOrder() {
  return useMutation({
    mutationFn: async ({ productId }: { productId: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Please sign in to checkout");

      // Insert an order row (status processing).
      const { data: order, error } = await supabase
        .from("orders")
        .insert({ product_id: productId, status: "processing" })
        .select("*")
        .single();
      if (error) throw new Error(error.message);

      // Generate a mock razorpay order id (no real Razorpay configured).
      const razorpayOrderId = `order_${Math.random().toString(36).substring(2, 12)}`;
      const { error: updErr } = await supabase
        .from("orders")
        .update({ razorpay_order_id: razorpayOrderId })
        .eq("id", order.id);
      if (updErr) throw new Error(updErr.message);

      // Fetch product for amount.
      const { data: product, error: prodErr } = await supabase
        .from("products")
        .select("price")
        .eq("id", productId)
        .maybeSingle();
      if (prodErr) throw new Error(prodErr.message);

      return {
        orderId: order.id,
        razorpayOrderId,
        amount: product?.price ?? 0,
        currency: "INR",
        key: "rzp_test_mockkey123",
      };
    },
  });
}

export function useVerifyOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      razorpayPaymentId,
    }: {
      orderId: string;
      razorpayPaymentId: string;
      razorpayOrderId: string;
      razorpaySignature: string;
    }) => {
      const { data, error } = await supabase
        .from("orders")
        .update({ razorpay_payment_id: razorpayPaymentId, status: "dispatched" })
        .eq("id", orderId)
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return data as Order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
