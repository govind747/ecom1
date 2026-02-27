import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { db } from "./db";
import { products } from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Setup Session
  const PostgresStore = connectPg(session);
  app.use(session({
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false,
    store: new PostgresStore({
      conObject: {
        connectionString: process.env.DATABASE_URL
      },
      createTableIfMissing: true
    }),
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    }
  }));

  // Setup Passport
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return done(null, false);
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Ensure DB has seed products
  async function seedDatabase() {
    try {
      const existingProducts = await storage.getProducts();
      if (existingProducts.length === 0) {
        await db.insert(products).values([
          { name: "Modern Desk Chair", description: "Elegant seating for your home office.", price: 15000, imageUrl: "https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1" },
          { name: "Ceramic Coffee Mug", description: "Handcrafted ceramic mug for your morning brew.", price: 2500, imageUrl: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d" },
          { name: "Wireless Headphones", description: "Noise-cancelling over-ear headphones.", price: 29900, imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e" },
          { name: "Leather Wallet", description: "Genuine leather bifold wallet.", price: 4500, imageUrl: "https://images.unsplash.com/photo-1627123424574-724758594e93" },
          { name: "Mechanical Keyboard", description: "Tactile mechanical keyboard with RGB lighting.", price: 12000, imageUrl: "https://images.unsplash.com/photo-1595225476474-87563907a212" },
          { name: "Smart Watch Series 9", description: "Stay connected with the latest health features.", price: 35000, imageUrl: "https://images.unsplash.com/photo-1546868871-7041f2a55e12" },
          { name: "Minimalist Desk Lamp", description: "Dimmable LED lamp for late night focus.", price: 3500, imageUrl: "https://images.unsplash.com/photo-1534073828943-f801091bb18c" },
          { name: "Premium Backpack", description: "Water-resistant commuter bag with laptop sleeve.", price: 6500, imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62" }
        ]);
        console.log("Database seeded with products.");
      }
    } catch (err) {
      console.error("Seed database error:", err);
    }
  }
  // Call seed async
  seedDatabase();

  app.post(api.auth.register.path, async (req, res, next) => {
    try {
      const input = api.auth.register.input.parse(req.body);
      const existing = await storage.getUserByUsername(input.username);
      if (existing) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const user = await storage.createUser(input);
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      next(err);
    }
  });

  app.post(api.auth.login.path, passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post(api.auth.logout.path, (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.status(200).json({ message: "Logged out" });
    });
  });

  app.get(api.auth.me.path, (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not logged in" });
    }
    res.status(200).json(req.user);
  });

  app.get(api.products.list.path, async (req, res) => {
    const allProducts = await storage.getProducts();
    res.status(200).json(allProducts);
  });

  app.get(api.orders.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not logged in" });
    
    const allOrders = await storage.getOrders();
    const userOrders = allOrders.filter(o => o.userId === (req.user as any).id);
    res.status(200).json(userOrders);
  });

  app.post(api.orders.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not logged in" });
    
    try {
      const input = api.orders.create.input.parse(req.body);
      const product = await storage.getProduct(input.productId);
      if (!product) return res.status(400).json({ message: "Product not found" });

      const order = await storage.createOrder({
        userId: (req.user as any).id,
        productId: input.productId,
        status: "processing"
      });

      const razorpayOrderId = `order_${Math.random().toString(36).substring(7)}`;
      await storage.updateOrder(order.id, { razorpayOrderId });

      res.status(201).json({
        orderId: order.id,
        razorpayOrderId,
        amount: product.price,
        currency: "INR",
        key: "rzp_test_mockkey123" // Mock key for MVP
      });

    } catch(err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.post(api.orders.verify.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not logged in" });
    
    try {
      const input = api.orders.verify.input.parse(req.body);
      
      const updatedOrder = await storage.updateOrder(input.orderId, {
        razorpayPaymentId: input.razorpayPaymentId,
        status: "dispatched"
      });

      res.status(200).json(updatedOrder);
    } catch(err) {
       if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal error" });
    }
  });

  return httpServer;
}
