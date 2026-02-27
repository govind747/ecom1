import { Link } from "wouter";
import { Plus } from "lucide-react";
import { type Product } from "@shared/schema";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const addToCart = useCart((state) => state.addToCart);
  const { toast } = useToast();

  const handleAdd = () => {
    addToCart(product);
    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  return (
    <div className="group flex flex-col gap-4">
      <div className="relative aspect-[4/5] bg-secondary rounded-2xl overflow-hidden mb-2">
        <img
          src={product.imageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80"}
          alt={product.name}
          className="object-cover w-full h-full mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
        
        <button
          onClick={handleAdd}
          className="absolute bottom-4 right-4 w-12 h-12 bg-background/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
        >
          <Plus size={20} />
        </button>
      </div>
      
      <div>
        <h3 className="font-display text-lg font-semibold text-foreground">
          {product.name}
        </h3>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
          {product.description}
        </p>
        <p className="mt-3 font-medium text-foreground">
          {formatPrice(product.price)}
        </p>
      </div>
    </div>
  );
}
