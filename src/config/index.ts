import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  // WhatsApp
  WHATSAPP_TOKEN: z.string().min(1),
  PHONE_NUMBER_ID: z.string().min(1),
  VERIFY_TOKEN: z.string().min(1),
  WHATSAPP_API_VERSION: z.string().default('v22.0'),

  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().url(),

  // Server
  PORT: z.string().transform(Number).default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Business
  SESSION_TTL: z.string().transform(Number).default('172800'),
  RATE_LIMIT_WINDOW: z.string().transform(Number).default('60000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('10'),
  COMMISSION_RATE: z.string().transform(Number).default('0.15'),
  DEFAULT_SERVICE_RADIUS_KM: z.string().transform(Number).default('5'),
  MAX_VENDOR_MATCHES: z.string().transform(Number).default('3'),
});

const env = envSchema.parse(process.env);

export const config = {
  whatsapp: {
    token: env.WHATSAPP_TOKEN,
    phoneNumberId: env.PHONE_NUMBER_ID,
    verifyToken: env.VERIFY_TOKEN,
    apiVersion: env.WHATSAPP_API_VERSION,
  },
  database: {
    url: env.DATABASE_URL,
  },
  redis: {
    url: env.REDIS_URL,
  },
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  business: {
    sessionTtl: env.SESSION_TTL,
    rateLimitWindow: env.RATE_LIMIT_WINDOW,
    rateLimitMaxRequests: env.RATE_LIMIT_MAX_REQUESTS,
    commissionRate: env.COMMISSION_RATE,
    defaultServiceRadiusKm: env.DEFAULT_SERVICE_RADIUS_KM,
    maxVendorMatches: env.MAX_VENDOR_MATCHES,
  },
} as const;
