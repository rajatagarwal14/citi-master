import { logger } from './logger';

// In-memory cache to replace Redis
class InMemoryCache {
  private cache = new Map<string, string>();
  private expirations = new Map<string, NodeJS.Timeout>();

  async get(key: string): Promise<string | null> {
    return this.cache.get(key) || null;
  }

  async set(key: string, value: string, mode?: string, duration?: number): Promise<void> {
    this.cache.set(key, value);
    
    // Handle expiration
    if (mode === 'EX' && duration) {
      // Clear any existing expiration
      const existing = this.expirations.get(key);
      if (existing) clearTimeout(existing);
      
      // Set new expiration
      const timeout = setTimeout(() => {
        this.cache.delete(key);
        this.expirations.delete(key);
      }, duration * 1000);
      
      this.expirations.set(key, timeout);
    }
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
    const timeout = this.expirations.get(key);
    if (timeout) {
      clearTimeout(timeout);
      this.expirations.delete(key);
    }
  }

  async setex(key: string, seconds: number, value: string): Promise<void> {
    await this.set(key, value, 'EX', seconds);
  }
}

export const redis = new InMemoryCache();
logger.info('✅ In-memory cache initialized');
