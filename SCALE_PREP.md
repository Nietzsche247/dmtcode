# Scale Preparation - Production Ready

## ✅ Rate Limiting Implemented

**Endpoint**: `/rate-limit-check` edge function
**Limit**: 10 requests per minute per IP address
**Window**: 60 seconds sliding window

### Rate Limit Headers
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 9
X-RateLimit-Reset: 60
Retry-After: 60
```

### Testing Rate Limits

**Browser Console Test** (10 req/sec burst):
```javascript
await testRateLimitBurst(10, 2)
```

**Manual cURL Test**:
```bash
for i in {1..15}; do
  curl -H "Authorization: Bearer YOUR_ANON_KEY" \
    https://bbmhrgpsyiahefnxqwfg.supabase.co/functions/v1/rate-limit-check
  echo "Request $i"
done
```

Expected behavior:
- First 10 requests: ✅ 200 OK with decreasing `remaining` count
- Requests 11+: ⛔ 429 Too Many Requests with `Retry-After` header

### Integration with Submit Flow

Use the `useRateLimit` hook before submissions:

```typescript
import { useRateLimit } from '@/hooks/useRateLimit';

const { checkRateLimit, isChecking, rateLimitInfo } = useRateLimit();

const handleSubmit = async () => {
  try {
    await checkRateLimit(); // Throws if rate limited
    // Proceed with submission
  } catch (error) {
    toast.error(error.message); // Shows user-friendly rate limit message
  }
};
```

## ✅ PWA Offline Capabilities

**Manifest Enhancements**:
- Offline glyph save with sync when online
- App shortcuts for quick actions
- Share target for external symbol sharing
- Stale-while-revalidate for /data.json

**Shortcuts**:
1. Submit Symbol → `/registry?submit=true`
2. Browse Registry → `/registry`
3. Null Report → `/null-reports`

**Offline Strategy**:
- Registry submissions queued in IndexedDB
- Auto-sync when connection restored
- Toast notification: "Offline - saved symbols will sync when online"

## ✅ Performance Optimizations

**Preload Hints**:
```html
<link rel="preload" href="/data.json" as="fetch" type="application/json" crossorigin="anonymous" />
<link rel="dns-prefetch" href="https://bbmhrgpsyiahefnxqwfg.supabase.co" />
<link rel="preconnect" href="https://bbmhrgpsyiahefnxqwfg.supabase.co" crossorigin />
```

**Cache Strategy**:
- `/data.json`: StaleWhileRevalidate (1 hour cache)
- Supabase API: NetworkFirst (5 min cache, 10s timeout)
- Google Fonts: CacheFirst (365 days)
- Registry: NetworkFirst with offline fallback

**Target Lighthouse Scores**:
- Performance: 95+ mobile
- Accessibility: 98+
- Best Practices: 95+
- SEO: 100

### Monitoring Performance

Run Lighthouse audit in Chrome DevTools:
1. Open DevTools (F12)
2. Navigate to "Lighthouse" tab
3. Select "Mobile" device
4. Check "Performance" category
5. Click "Analyze page load"

Look for:
- First Contentful Paint < 1.8s
- Largest Contentful Paint < 2.5s
- Total Blocking Time < 200ms
- Cumulative Layout Shift < 0.1

## Production Checklist

- [x] Rate limiting: 10/min per IP
- [x] PWA offline support with sync
- [x] Preload hints for critical resources
- [x] DNS prefetch for Supabase
- [x] Cache strategies optimized
- [x] Error handling with fail-open policy
- [x] User-friendly rate limit messages
- [x] Burst test utility included
- [x] Lighthouse performance optimized

## Next Steps for Production

1. **Add Upstash Redis** for distributed rate limiting:
   ```bash
   npm install @upstash/redis
   ```
   
2. **Monitor rate limit metrics**:
   - Track 429 responses in PostHog
   - Alert on sustained rate limit violations
   - Analyze per-IP submission patterns

3. **CDN Integration**:
   - Move /data.json to CDN edge cache
   - Add ETag support for efficient updates
   - Configure cache invalidation on DB updates

4. **Load Testing**:
   - Use k6 or Apache Bench for stress testing
   - Target: 100 concurrent users, 1000 req/sec
   - Monitor edge function cold starts
