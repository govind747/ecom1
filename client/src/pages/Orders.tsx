import { useOrders } from "@/hooks/use-orders";
import { formatPrice } from "@/lib/utils";
import { Package, Clock, Truck, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";
import { useUser } from "@/hooks/use-auth";

export default function Orders() {
  const [, setLocation] = useLocation();
  const { data: user, isLoading: isUserLoading } = useUser();
  const { data: orders, isLoading: isOrdersLoading } = useOrders();

  if (isUserLoading) return null;
  
  if (!user) {
    setLocation("/auth");
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'dispatched': return <Truck className="w-5 h-5 text-blue-500" />;
      default: return <Clock className="w-5 h-5 text-amber-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'delivered': return 'Delivered';
      case 'dispatched': return 'On the way';
      default: return 'Processing';
    }
  };

  return (
    <div className="pt-24 pb-16 min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-display font-bold text-foreground mb-8">Your Orders</h1>

        {isOrdersLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-secondary/50 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="text-center py-20 bg-secondary/30 rounded-3xl border border-border/50">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h2 className="text-xl font-medium text-foreground mb-2">No orders found</h2>
            <p className="text-muted-foreground">When you buy something, it will appear here.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div 
                key={order.id} 
                className="bg-card rounded-2xl border border-border shadow-sm p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6 transition-all hover:shadow-md"
              >
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-secondary flex-shrink-0">
                  <img
                    src={order.product.imageUrl}
                    alt={order.product.name}
                    className="w-full h-full object-cover mix-blend-multiply"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-lg font-medium text-foreground truncate">
                      {order.product.name}
                    </h3>
                    <span className="font-semibold ml-4">
                      {formatPrice(order.product.price)}
                    </span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    Order #{order.razorpayOrderId?.slice(-8) || order.id} • {new Date(order.createdAt!).toLocaleDateString()}
                  </p>
                  
                  <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-sm font-medium">
                    {getStatusIcon(order.status)}
                    <span>{getStatusText(order.status)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
