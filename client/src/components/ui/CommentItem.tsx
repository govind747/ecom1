import { useState } from "react";
import { Heart, Trash2, CornerDownRight, Send } from "lucide-react";
import type { CommentWithProfile } from "@shared/types";
import { useToggleCommentLike, useAddComment, useDeleteComment, useCurrentUserId } from "@/hooks/use-comments";
import { useUser } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface CommentItemProps {
  comment: CommentWithProfile;
  productId: string;
  depth?: number;
}

export function CommentItem({ comment, productId, depth = 0 }: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState("");
  const toggleLike = useToggleCommentLike();
  const addComment = useAddComment();
  const deleteComment = useDeleteComment();
  const { toast } = useToast();
  const currentUserId = useCurrentUserId();
  const { data: user } = useUser();

  const isOwn = currentUserId === comment.user_id;
  const liked = user ? comment.likes.some((l) => l.user_id === user.id) : false;

  const handleLike = () => {
    if (!user) {
      toast({ variant: "destructive", title: "Please sign in to like comments" });
      return;
    }
    toggleLike.mutate({ commentId: comment.id, liked, productId });
  };

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    addComment.mutate(
      { productId, content: replyText.trim(), parentId: comment.id },
      {
        onSuccess: () => {
          setReplyText("");
          setShowReplyForm(false);
          toast({ title: "Reply posted" });
        },
        onError: (err) => toast({ variant: "destructive", title: "Error", description: err.message }),
      }
    );
  };

  const handleDelete = () => {
    deleteComment.mutate(
      { commentId: comment.id, productId },
      {
        onSuccess: () => toast({ title: "Comment deleted" }),
        onError: (err) => toast({ variant: "destructive", title: "Error", description: err.message }),
      }
    );
  };

  return (
    <div className={cn("flex gap-3", depth > 0 && "ml-8 sm:ml-12 border-l border-border pl-4")}>
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold uppercase">
        {comment.profile?.username?.[0] ?? "U"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm text-foreground">
            {comment.profile?.username ?? "Unknown user"}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(comment.created_at).toLocaleDateString()}
          </span>
        </div>
        <p className="text-sm text-foreground/90 leading-relaxed break-words">{comment.content}</p>

        <div className="flex items-center gap-4 mt-2">
          <button
            onClick={handleLike}
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium transition-colors",
              liked ? "text-red-500" : "text-muted-foreground hover:text-red-500"
            )}
          >
            <Heart size={14} className={cn(liked && "fill-current")} />
            <span>{comment.likes.length}</span>
          </button>
          <button
            onClick={() => setShowReplyForm((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <CornerDownRight size={14} />
            <span>Reply</span>
          </button>
          {isOwn && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 size={14} />
              <span>Delete</span>
            </button>
          )}
        </div>

        {showReplyForm && (
          <form onSubmit={handleReply} className="mt-3 flex gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply..."
              className="flex-1 rounded-full border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              disabled={!replyText.trim() || addComment.isPending}
              className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50"
            >
              <Send size={14} />
            </button>
          </form>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-3">
            {comment.replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} productId={productId} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
