import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Trash2, CreditCard, ShoppingBag, Loader2 } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useUser } from "@/hooks/use-auth";
import { useCreateOrder, useVerifyOrder } from "@/hooks/use-orders";
import { formatPrice } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const loadRazorpayScript = () => {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function Cart() {
  const [, setLocation] = useLocation();
  const { data: user } = useUser();
  const { items, removeFromCart } = useCart();
  const createOrder = useCreateOrder();
  const verifyOrder = useVerifyOrder();
  const { toast } = useToast();

  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleCheckout = async (productId: string) => {
    if (!user) {
      toast({ title: "Authentication required", description: "Please sign in to checkout." });
      setLocation("/auth");
      return;
    }

    try {
      setProcessingId(productId);

      const orderData = await createOrder.mutateAsync({ productId });

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Razorpay SDK failed to load. Are you online?");
      }

      const options: RazorpayOptions = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "LUXE",
        description: "Test Transaction",
        order_id: orderData.razorpayOrderId,
        handler: async function (response: RazorpayResponse) {
          try {
            await verifyOrder.mutateAsync({
              orderId: orderData.orderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            });

            toast({ title: "Payment successful!" });
            removeFromCart(productId);
            setLocation("/orders");
          } catch (err: any) {
            toast({ variant: "destructive", title: "Verification failed", description: err.message });
          }
        },
        prefill: {
          name: user.username,
        },
        theme: {
          color: "#000000",
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

      paymentObject.on('payment.failed', function (response: any) {
        toast({ variant: "destructive", title: "Payment failed", description: response.error.description });
      });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Checkout Error", description: err.message });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="pt-24 pb-16 min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-display font-bold text-foreground mb-8">Shopping Bag</h1>

        {items.length === 0 ? (
          <div className="text-center py-20 bg-secondary/30 rounded-3xl border border-border/50">
            <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h2 className="text-xl font-medium text-foreground mb-2">Your bag is empty</h2>
            <p className="text-muted-foreground mb-6">Looks like you haven't added anything yet.</p>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-medium rounded-full shadow-sm text-primary-foreground bg-primary hover:bg-primary/90 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-card rounded-2xl border border-border shadow-sm"
              >
                <div className="w-full sm:w-32 aspect-square rounded-xl overflow-hidden bg-secondary flex-shrink-0">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover mix-blend-multiply"
                  />
                </div>

                <div className="flex-1 w-full text-center sm:text-left">
                  <h3 className="text-lg font-medium text-foreground">{item.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{item.description}</p>
                  <p className="mt-2 font-semibold text-foreground">{formatPrice(item.price)}</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors w-full sm:w-auto flex justify-center"
                    title="Remove item"
                  >
                    <Trash2 size={20} />
                  </button>
                  <button
                    onClick={() => handleCheckout(item.id)}
                    disabled={processingId === item.id}
                    className="flex w-full sm:w-auto items-center justify-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 hover:shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {processingId === item.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <CreditCard size={18} />
                        Pay Now
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
