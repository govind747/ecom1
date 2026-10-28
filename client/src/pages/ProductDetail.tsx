import { useState } from "react";
import { Link, useParams } from "wouter";
import { Heart, ShoppingBag, ArrowLeft, Loader2, MessageCircle, ThumbsUp, Send } from "lucide-react";
import {
  useProduct,
  useProductSuggestions,
  useProductLikes,
  useToggleProductLike,
} from "@/hooks/use-products";
import { useComments, useAddComment } from "@/hooks/use-comments";
import { useUser } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { formatPrice, toCartProduct, cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ProductCard } from "@/components/ui/ProductCard";
import { CommentItem } from "@/components/ui/CommentItem";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const productId = id;
  const { data: product, isLoading } = useProduct(productId);
  const { data: suggestions } = useProductSuggestions(productId, 4);
  const { data: likeInfo } = useProductLikes(productId);
  const toggleLike = useToggleProductLike();
  const { data: comments, isLoading: commentsLoading } = useComments(productId);
  const addComment = useAddComment();
  const { data: user } = useUser();
  const addToCart = useCart((s) => s.addToCart);
  const { toast } = useToast();
  const [commentText, setCommentText] = useState("");

  const handleLike = () => {
    if (!user) {
      toast({ variant: "destructive", title: "Please sign in to like products" });
      return;
    }
    toggleLike.mutate({ productId: productId!, liked: likeInfo?.liked ?? false });
  };

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(toCartProduct(product));
    toast({ title: "Added to cart", description: `${product.name} added to your bag.` });
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment.mutate(
      { productId: productId!, content: commentText.trim() },
      {
        onSuccess: () => {
          setCommentText("");
          toast({ title: "Comment posted" });
        },
        onError: (err) => toast({ variant: "destructive", title: "Error", description: err.message }),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pt-24 min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Product not found.</p>
        <Link href="/" className="text-primary hover:underline">Back to home</Link>
      </div>
    );
  }

  return (
    <div className="pt-20 pb-16 min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft size={16} />
          Back to shop
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-16">
          <div className="relative aspect-square bg-secondary rounded-3xl overflow-hidden">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover mix-blend-multiply"
            />
          </div>

          <div className="flex flex-col justify-center">
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight">
              {product.name}
            </h1>
            <p className="mt-4 text-muted-foreground leading-relaxed">{product.description}</p>
            <p className="mt-6 text-3xl font-display font-semibold text-foreground">
              {formatPrice(product.price)}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                onClick={handleAddToCart}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 hover:shadow-lg transition-all"
              >
                <ShoppingBag size={18} />
                Add to Bag
              </button>
              <button
                onClick={handleLike}
                className={cn(
                  "inline-flex items-center gap-2 px-5 py-3.5 rounded-full border font-medium transition-all",
                  likeInfo?.liked
                    ? "border-red-200 bg-red-50 text-red-600"
                    : "border-border text-foreground hover:bg-secondary"
                )}
              >
                <Heart size={18} className={cn(likeInfo?.liked && "fill-current")} />
                <span>{likeInfo?.count ?? 0}</span>
              </button>
            </div>
          </div>
        </div>

        <section className="mb-16">
          <div className="flex items-center gap-2 mb-6">
            <MessageCircle size={22} />
            <h2 className="text-2xl font-display font-bold text-foreground">
              Discussion {comments && `(${comments.length})`}
            </h2>
          </div>

          {user ? (
            <form onSubmit={handleComment} className="mb-8 flex gap-3">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Share your thoughts about this product..."
                className="flex-1 rounded-full border border-input bg-background px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                disabled={!commentText.trim() || addComment.isPending}
                className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 hover:bg-primary/90 transition-colors"
              >
                {addComment.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </form>
          ) : (
            <div className="mb-8 p-5 bg-secondary/50 rounded-2xl text-center text-sm text-muted-foreground">
              <Link href="/auth" className="text-primary font-medium hover:underline">Sign in</Link> to join the discussion.
            </div>
          )}

          {commentsLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
          ) : !comments || comments.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              No comments yet. Be the first to share your thoughts!
            </div>
          ) : (
            <div className="space-y-6">
              {comments.map((c) => (
                <CommentItem key={c.id} comment={c} productId={productId!} />
              ))}
            </div>
          )}
        </section>

        {suggestions && suggestions.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-6">
              <ThumbsUp size={22} />
              <h2 className="text-2xl font-display font-bold text-foreground">You may also like</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {suggestions.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
