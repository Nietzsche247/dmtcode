// Rate limiting for /submit endpoint
// Uses in-memory store (for production, use Upstash Redis or KV store)

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetAt: number;
  };
}

const rateLimitStore: RateLimitStore = {};
const RATE_LIMIT = 10; // requests per minute
const WINDOW_MS = 60000; // 1 minute

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(rateLimitStore).forEach(key => {
    if (rateLimitStore[key].resetAt < now) {
      delete rateLimitStore[key];
    }
  });
}, 300000);

Deno.serve(async (req) => {
  try {
    // Get client IP from headers
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() 
      || req.headers.get('x-real-ip') 
      || 'unknown';
    
    const now = Date.now();
    const key = `submit:${ip}`;
    
    // Initialize or get current rate limit state
    if (!rateLimitStore[key] || rateLimitStore[key].resetAt < now) {
      rateLimitStore[key] = {
        count: 1,
        resetAt: now + WINDOW_MS
      };
    } else {
      rateLimitStore[key].count++;
    }
    
    const { count, resetAt } = rateLimitStore[key];
    const isAllowed = count <= RATE_LIMIT;
    const remaining = Math.max(0, RATE_LIMIT - count);
    const resetIn = Math.ceil((resetAt - now) / 1000);
    
    return new Response(
      JSON.stringify({
        allowed: isAllowed,
        limit: RATE_LIMIT,
        remaining,
        resetIn,
        ip: ip.substring(0, 10) + '...' // Partial IP for privacy
      }),
      {
        status: isAllowed ? 200 : 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': RATE_LIMIT.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': resetIn.toString(),
          'Retry-After': resetIn.toString()
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Rate limit check failed',
        allowed: true // Fail open for availability
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
