import type { Request, Response, NextFunction } from 'express';

/**
 * Simple in-memory rate limiter middleware.
 * Prevents abuse without adding external dependencies.
 *
 * Design decision: In-memory is sufficient for a single-instance SME internal system.
 * For production multi-instance deployment, replace with Redis-based limiter.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup expired entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetTime) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

interface RateLimitOptions {
  /** Time window in milliseconds */
  windowMs: number;
  /** Maximum requests per window */
  maxRequests: number;
}

export function rateLimiter(options: RateLimitOptions = { windowMs: 60_000, maxRequests: 100 }) {
  const { windowMs, maxRequests } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const clientKey = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    const entry = store.get(clientKey);

    if (!entry || now > entry.resetTime) {
      store.set(clientKey, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }

    entry.count++;

    if (entry.count > maxRequests) {
      res.status(429).json({
        error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
        retryAfterMs: entry.resetTime - now,
      });
      return;
    }

    next();
  };
}
