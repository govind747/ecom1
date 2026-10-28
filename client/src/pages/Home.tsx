import { useProducts } from "@/hooks/use-products";
import { ProductCard } from "@/components/ui/ProductCard";
import { ArrowRight, Loader2, Star, Zap, Flame } from "lucide-react";
import { Link } from "wouter";
import { toCartProduct } from "@/lib/utils";

export default function Home() {
  const { data: products, isLoading } = useProducts();

  const all = (products ?? []).map(toCartProduct);
  const newItems = all.slice(5, 8);
  const topSellers = all.slice(0, 3);
  const featured = all.slice(0, 5);

  return (
    <div className="pt-16 min-h-screen flex flex-col relative">
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] bg-primary/3 rounded-full blur-[80px]" />
      </div>

      <section className="relative overflow-hidden py-20 lg:py-32 bg-[url('/herobg.jpg')] bg-cover bg-center bg-no-repeat">
        <div className="absolute inset-0 bg-background/10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-6">
              <Zap size={14} />
              New Spring Collection 2024
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight text-foreground leading-[1.1]">
              Elevate your <span className="text-primary">everyday</span> essentials.
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl">
              Discover our curated collection of premium products designed to bring style and functionality to your modern lifestyle.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="#collection"
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-full font-medium hover:scale-105 hover:shadow-xl transition-all duration-300"
              >
                Shop Collection
                <ArrowRight size={18} />
              </Link>
              <Link
                href="#new-arrivals"
                className="inline-flex items-center gap-2 px-8 py-4 bg-background border border-border text-foreground rounded-full font-medium hover:bg-secondary transition-all duration-300"
              >
                New Arrivals
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 border-y border-border/50 bg-secondary/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-8">
            <Flame className="text-orange-500" size={24} />
            <h2 className="text-2xl font-display font-bold">Top Sellers</h2>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {topSellers.map((product) => (
                <div key={product.id} className="relative group">
                  <div className="absolute -top-2 -left-2 z-10 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-tighter">Best Value</div>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="collection" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-3xl font-display font-bold text-foreground">Featured Collection</h2>
            <p className="text-muted-foreground mt-2">Carefully selected for your daily needs.</p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="new-arrivals" className="py-24 bg-primary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <div className="flex items-center gap-2 text-primary font-bold mb-2">
                <Star size={20} fill="currentColor" />
                <span>JUST IN</span>
              </div>
              <h2 className="text-4xl font-display font-bold">New Arrivals</h2>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {newItems.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
