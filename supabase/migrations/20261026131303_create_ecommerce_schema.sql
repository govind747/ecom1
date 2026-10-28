/*
# E-commerce schema: profiles, products, orders, comments, likes

1. New Tables
- profiles, products, orders, comments, likes, product_likes (see details in notes).
2. Security
- RLS enabled on all tables; ownership-scoped policies; products public read.
3. Notes
- user_id columns default to auth.uid().
*/

-- profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;

DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- products
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  price integer NOT NULL,
  image_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON products TO anon, authenticated;

DROP POLICY IF EXISTS "products_select_public" ON products;
CREATE POLICY "products_select_public" ON products
  FOR SELECT TO anon, authenticated USING (true);

-- orders
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'processing',
  razorpay_order_id text,
  razorpay_payment_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON orders TO authenticated;

DROP POLICY IF EXISTS "orders_select_own" ON orders;
CREATE POLICY "orders_select_own" ON orders
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "orders_insert_own" ON orders;
CREATE POLICY "orders_insert_own" ON orders
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "orders_update_own" ON orders;
CREATE POLICY "orders_update_own" ON orders
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "orders_delete_own" ON orders;
CREATE POLICY "orders_delete_own" ON orders
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- comments
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON comments TO anon, authenticated;

DROP POLICY IF EXISTS "comments_select_public" ON comments;
CREATE POLICY "comments_select_public" ON comments
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "comments_insert_own" ON comments;
CREATE POLICY "comments_insert_own" ON comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "comments_update_own" ON comments;
CREATE POLICY "comments_update_own" ON comments
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "comments_delete_own" ON comments;
CREATE POLICY "comments_delete_own" ON comments
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- likes (comment likes)
CREATE TABLE IF NOT EXISTS likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON likes TO anon, authenticated;

DROP POLICY IF EXISTS "likes_select_public" ON likes;
CREATE POLICY "likes_select_public" ON likes
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "likes_insert_own" ON likes;
CREATE POLICY "likes_insert_own" ON likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "likes_delete_own" ON likes;
CREATE POLICY "likes_delete_own" ON likes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- product_likes
CREATE TABLE IF NOT EXISTS product_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, user_id)
);
ALTER TABLE product_likes ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON product_likes TO anon, authenticated;

DROP POLICY IF EXISTS "product_likes_select_public" ON product_likes;
CREATE POLICY "product_likes_select_public" ON product_likes
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "product_likes_insert_own" ON product_likes;
CREATE POLICY "product_likes_insert_own" ON product_likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "product_likes_delete_own" ON product_likes;
CREATE POLICY "product_likes_delete_own" ON product_likes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_product_id ON comments(product_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_likes_comment_id ON likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_product_likes_product_id ON product_likes(product_id);
