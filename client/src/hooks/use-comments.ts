import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Comment, CommentWithProfile, Profile } from "@shared/types";

type RawCommentRow = Comment & { profiles: Profile | null };

function buildTree(rows: RawCommentRow[], likeRows: { comment_id: string; user_id: string }[]): CommentWithProfile[] {
  const likeMap = new Map<string, { user_id: string }[]>();
  for (const l of likeRows) {
    const arr = likeMap.get(l.comment_id) ?? [];
    arr.push({ user_id: l.user_id });
    likeMap.set(l.comment_id, arr);
  }

  const map = new Map<string, CommentWithProfile>();
  const roots: CommentWithProfile[] = [];

  for (const r of rows) {
    const node: CommentWithProfile = {
      ...r,
      profile: r.profiles,
      likes: likeMap.get(r.id) ?? [],
      replies: [],
    };
    map.set(r.id, node);
  }

  for (const node of map.values()) {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.replies!.push(node);
    } else {
      roots.push(node);
    }
  }

  // Sort roots and replies by created_at ascending.
  const sortRec = (list: CommentWithProfile[]) => {
    list.sort((a, b) => a.created_at.localeCompare(b.created_at));
    for (const n of list) if (n.replies?.length) sortRec(n.replies);
  };
  sortRec(roots);
  return roots;
}

export function useComments(productId: string | undefined) {
  return useQuery<CommentWithProfile[]>({
    queryKey: ["comments", productId],
    queryFn: async () => {
      if (!productId) return [];
      const { data, error } = await supabase
        .from("comments")
        .select("*, profiles:profiles!comments_user_id_fkey(id, username, created_at)")
        .eq("product_id", productId)
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);

      const commentIds = (data ?? []).map((c) => c.id);
      let likeRows: { comment_id: string; user_id: string }[] = [];
      if (commentIds.length > 0) {
        const { data: likes, error: likeErr } = await supabase
          .from("likes")
          .select("comment_id, user_id")
          .in("comment_id", commentIds);
        if (likeErr) throw new Error(likeErr.message);
        likeRows = likes ?? [];
      }

      return buildTree(data as unknown as RawCommentRow[], likeRows);
    },
    enabled: !!productId,
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, content, parentId }: { productId: string; content: string; parentId?: string | null }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Please sign in to comment");
      const { data, error } = await supabase
        .from("comments")
        .insert({
          product_id: productId,
          content,
          parent_id: parentId ?? null,
        })
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return data as Comment;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comments", variables.productId] });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentId, productId }: { commentId: string; productId: string }) => {
      const { error } = await supabase.from("comments").delete().eq("id", commentId);
      if (error) throw new Error(error.message);
      return { productId };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comments", variables.productId] });
    },
  });
}

export function useToggleCommentLike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentId, liked, productId }: { commentId: string; liked: boolean; productId: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Please sign in to like comments");
      if (liked) {
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("comment_id", commentId)
          .eq("user_id", session.user.id);
        if (error) throw new Error(error.message);
        return { liked: false, productId };
      } else {
        const { error } = await supabase
          .from("likes")
          .insert({ comment_id: commentId });
        if (error) throw new Error(error.message);
        return { liked: true, productId };
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comments", variables.productId] });
    },
  });
}
