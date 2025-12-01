// Ping Google and Bing with updated sitemap
// Deploy and invoke via cron or manual trigger

Deno.serve(async (req) => {
  try {
    const sitemapUrl = 'https://dmtcode.com/sitemap.xml';
    
    // Ping Google
    const googleResponse = await fetch(
      `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`
    );
    
    // Ping Bing
    const bingResponse = await fetch(
      `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`
    );
    
    return new Response(
      JSON.stringify({
        success: true,
        google: googleResponse.status,
        bing: bingResponse.status,
        timestamp: new Date().toISOString(),
        sitemap: sitemapUrl
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
