import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Navbar } from "@/components/layout/Navbar";
import { useAuthStateSubscription } from "@/hooks/use-auth";

// Pages
import Home from "@/pages/Home";
import Auth from "@/pages/Auth";
import Cart from "@/pages/Cart";
import Orders from "@/pages/Orders";
import ProductDetail from "@/pages/ProductDetail";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth" component={Auth} />
      <Route path="/cart" component={Cart} />
      <Route path="/orders" component={Orders} />
      <Route path="/product/:id" component={ProductDetail} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useAuthStateSubscription();
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Router />
          </main>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
