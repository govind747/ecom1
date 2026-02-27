import { Link } from "wouter";
import { ShoppingBag, User as UserIcon, LogOut, Package } from "lucide-react";
import { useUser, useLogout } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { data: user, isLoading } = useUser();
  const logout = useLogout();
  const items = useCart((state) => state.items);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-primary text-primary-foreground rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
              <ShoppingBag size={18} />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">LUXE.</span>
          </Link>

          <nav className="flex items-center gap-6">
            <Link 
              href="/cart" 
              className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ShoppingBag size={20} />
              {items.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center translate-x-1/4 -translate-y-1/4">
                  {items.length}
                </span>
              )}
            </Link>

            {!isLoading && (
              user ? (
                <div className="flex items-center gap-4">
                  <Link 
                    href="/orders" 
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                  >
                    <Package size={16} />
                    <span className="hidden sm:inline">Orders</span>
                  </Link>
                  <button
                    onClick={() => logout.mutate()}
                    disabled={logout.isPending}
                    className="text-sm font-medium text-muted-foreground hover:text-destructive transition-colors flex items-center gap-2"
                  >
                    <LogOut size={16} />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </div>
              ) : (
                <Link 
                  href="/auth" 
                  className={cn(
                    "flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full",
                    "bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  )}
                >
                  <UserIcon size={16} />
                  <span>Sign In</span>
                </Link>
              )
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
