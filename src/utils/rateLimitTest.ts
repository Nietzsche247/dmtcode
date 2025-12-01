// Rate limit burst test utility
// Run in browser console: await testRateLimitBurst()

export const testRateLimitBurst = async (requestsPerSecond = 10, durationSeconds = 2) => {
  const results: Array<{ success: boolean; status: number; remaining?: number; timestamp: number }> = [];
  const totalRequests = requestsPerSecond * durationSeconds;
  const delayMs = 1000 / requestsPerSecond;
  
  console.log(`🔥 Starting burst test: ${requestsPerSecond} req/sec for ${durationSeconds}s (${totalRequests} total)`);
  
  const startTime = Date.now();
  
  for (let i = 0; i < totalRequests; i++) {
    const requestStart = Date.now();
    
    try {
      const response = await fetch(
        'https://bbmhrgpsyiahefnxqwfg.supabase.co/functions/v1/rate-limit-check',
        {
          headers: {
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJibWhyZ3BzeWlhaGVmbnhxd2ZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1Njc5ODcsImV4cCI6MjA3OTE0Mzk4N30.zPuWahf5g140hdR__asVINWBvYJaxZmVvDQTvIAjLww'
          }
        }
      );
      
      const data = await response.json();
      
      results.push({
        success: response.ok,
        status: response.status,
        remaining: data.remaining,
        timestamp: Date.now() - startTime
      });
      
      // Rate limit hit
      if (response.status === 429) {
        console.warn(`⛔ Request ${i + 1}: RATE LIMITED (${data.remaining} remaining, reset in ${data.resetIn}s)`);
      } else {
        console.log(`✅ Request ${i + 1}: SUCCESS (${data.remaining} remaining)`);
      }
    } catch (error) {
      results.push({
        success: false,
        status: 0,
        timestamp: Date.now() - startTime
      });
      console.error(`❌ Request ${i + 1}: ERROR`, error);
    }
    
    // Maintain rate by delaying
    const elapsed = Date.now() - requestStart;
    const delay = Math.max(0, delayMs - elapsed);
    if (delay > 0 && i < totalRequests - 1) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  const duration = Date.now() - startTime;
  const successCount = results.filter(r => r.success).length;
  const rateLimited = results.filter(r => r.status === 429).length;
  const actualRPS = (totalRequests / duration) * 1000;
  
  console.log('\n📊 Burst Test Results:');
  console.log(`Duration: ${duration}ms (${durationSeconds}s target)`);
  console.log(`Total Requests: ${totalRequests}`);
  console.log(`Successful: ${successCount} (${((successCount/totalRequests)*100).toFixed(1)}%)`);
  console.log(`Rate Limited: ${rateLimited} (${((rateLimited/totalRequests)*100).toFixed(1)}%)`);
  console.log(`Actual Rate: ${actualRPS.toFixed(2)} req/sec`);
  console.log(`\nExpected behavior: First 10 requests succeed, rest rate-limited within 60s window`);
  
  return results;
};

// Make available globally for console access
if (typeof window !== 'undefined') {
  (window as any).testRateLimitBurst = testRateLimitBurst;
}
