import { z } from 'zod';
import { insertUserSchema, users, products, orders } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

const userSchema = z.custom<typeof users.$inferSelect>();
const productSchema = z.custom<typeof products.$inferSelect>();
const orderSchema = z.custom<typeof orders.$inferSelect>();

export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/login' as const,
      input: insertUserSchema,
      responses: {
        200: userSchema,
        401: z.object({ message: z.string() }),
      },
    },
    register: {
      method: 'POST' as const,
      path: '/api/register' as const,
      input: insertUserSchema,
      responses: {
        201: userSchema,
        400: errorSchemas.validation,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/logout' as const,
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/me' as const,
      responses: {
        200: userSchema,
        401: z.object({ message: z.string() }),
      },
    },
  },
  products: {
    list: {
      method: 'GET' as const,
      path: '/api/products' as const,
      responses: {
        200: z.array(productSchema),
      },
    },
  },
  orders: {
    list: {
      method: 'GET' as const,
      path: '/api/orders' as const,
      responses: {
        200: z.array(z.custom<typeof orders.$inferSelect & { product: typeof products.$inferSelect }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/orders' as const,
      input: z.object({ productId: z.number() }),
      responses: {
        201: z.object({
          orderId: z.number(),
          razorpayOrderId: z.string(),
          amount: z.number(),
          currency: z.string(),
          key: z.string(), // Razorpay key to use on frontend
        }),
        401: z.object({ message: z.string() }),
      },
    },
    verify: {
      method: 'POST' as const,
      path: '/api/orders/verify' as const,
      input: z.object({
        orderId: z.number(),
        razorpayPaymentId: z.string(),
        razorpayOrderId: z.string(),
        razorpaySignature: z.string(),
      }),
      responses: {
        200: orderSchema,
        400: errorSchemas.validation,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
