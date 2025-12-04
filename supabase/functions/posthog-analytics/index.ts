import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const POSTHOG_API_KEY = Deno.env.get('POSTHOG_API_KEY');
    const POSTHOG_PROJECT_ID = Deno.env.get('POSTHOG_PROJECT_ID');

    if (!POSTHOG_API_KEY || !POSTHOG_PROJECT_ID) {
      console.error('Missing PostHog configuration');
      return new Response(
        JSON.stringify({ error: 'PostHog not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const baseUrl = `https://app.posthog.com/api/projects/${POSTHOG_PROJECT_ID}`;
    const headers = {
      'Authorization': `Bearer ${POSTHOG_API_KEY}`,
      'Content-Type': 'application/json',
    };

    // Get date range (last 30 days)
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    console.log(`Fetching PostHog analytics from ${startDate} to ${endDate}`);

    // Fetch bundle-related events using insights API
    const bundleEventsQuery = {
      kind: 'EventsQuery',
      select: ['event', 'properties', 'timestamp'],
      where: [
        `event IN ('product_viewed', 'added_to_cart', 'bundle_upsell_shown', 'checkout_started', 'bundle_added_to_cart', 'bundle_upsell_clicked', 'bundle_upsell_dismissed')`
      ],
      after: `${startDate}T00:00:00Z`,
      before: `${endDate}T23:59:59Z`,
      limit: 1000,
    };

    const eventsResponse = await fetch(`${baseUrl}/query/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: bundleEventsQuery }),
    });

    let events = [];
    if (eventsResponse.ok) {
      const eventsData = await eventsResponse.json();
      events = eventsData.results || [];
      console.log(`Fetched ${events.length} events`);
    } else {
      console.error('Events query failed:', await eventsResponse.text());
    }

    // Process events into metrics
    const bundleMetrics: Record<string, any> = {
      starter: { name: 'Fractal Starter Kit', price: 85, views: 0, addToCart: 0, purchases: 0, revenue: 0, conversionRate: 0 },
      gateway: { name: 'Gateway Research Kit', price: 1200, views: 0, addToCart: 0, purchases: 0, revenue: 0, conversionRate: 0 },
      complete: { name: 'Complete Symbol Kit', price: 2300, views: 0, addToCart: 0, purchases: 0, revenue: 0, conversionRate: 0 },
      ceremony: { name: 'Extended Ceremony Package', price: 3500, views: 0, addToCart: 0, purchases: 0, revenue: 0, conversionRate: 0 },
    };

    const upsellMetrics = {
      shown: 0,
      clicked: 0,
      converted: 0,
      dismissed: 0,
      clickRate: 0,
      conversionRate: 0,
      revenueGenerated: 0,
    };

    const funnelCounts = {
      views: 0,
      addToCart: 0,
      checkoutStarted: 0,
      purchaseComplete: 0,
    };

    const recentEvents: Array<{ event: string; bundle: string; time: string; timestamp: number }> = [];

    // Process each event
    for (const event of events) {
      const [eventName, properties, timestamp] = event;
      const props = typeof properties === 'string' ? JSON.parse(properties) : properties;
      const bundleId = props?.bundle_id || props?.product_id || '';
      const bundleKey = bundleId.toLowerCase().replace(/[^a-z]/g, '');

      // Map to bundle key
      let mappedKey = '';
      if (bundleKey.includes('starter') || bundleKey.includes('fractal')) mappedKey = 'starter';
      else if (bundleKey.includes('gateway')) mappedKey = 'gateway';
      else if (bundleKey.includes('complete') || bundleKey.includes('symbol')) mappedKey = 'complete';
      else if (bundleKey.includes('ceremony') || bundleKey.includes('extended')) mappedKey = 'ceremony';

      // Count events
      switch (eventName) {
        case 'product_viewed':
          funnelCounts.views++;
          if (mappedKey && bundleMetrics[mappedKey]) {
            bundleMetrics[mappedKey].views++;
          }
          break;
        case 'added_to_cart':
        case 'bundle_added_to_cart':
          funnelCounts.addToCart++;
          if (mappedKey && bundleMetrics[mappedKey]) {
            bundleMetrics[mappedKey].addToCart++;
          }
          break;
        case 'checkout_started':
          funnelCounts.checkoutStarted++;
          if (mappedKey && bundleMetrics[mappedKey]) {
            bundleMetrics[mappedKey].purchases++;
            bundleMetrics[mappedKey].revenue += bundleMetrics[mappedKey].price;
          }
          break;
        case 'bundle_upsell_shown':
          upsellMetrics.shown++;
          break;
        case 'bundle_upsell_clicked':
          upsellMetrics.clicked++;
          break;
        case 'bundle_upsell_dismissed':
          upsellMetrics.dismissed++;
          break;
      }

      // Add to recent events
      if (recentEvents.length < 20) {
        const eventTime = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - eventTime.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const timeAgo = diffMins < 60 
          ? `${diffMins} min ago`
          : diffMins < 1440
            ? `${Math.floor(diffMins / 60)} hours ago`
            : `${Math.floor(diffMins / 1440)} days ago`;

        recentEvents.push({
          event: eventName,
          bundle: mappedKey || props?.bundle_name || 'unknown',
          time: timeAgo,
          timestamp: eventTime.getTime(),
        });
      }
    }

    // Calculate conversion rates
    for (const key of Object.keys(bundleMetrics)) {
      const bundle = bundleMetrics[key];
      bundle.conversionRate = bundle.views > 0 
        ? parseFloat(((bundle.purchases / bundle.views) * 100).toFixed(2))
        : 0;
    }

    // Calculate upsell metrics
    upsellMetrics.clickRate = upsellMetrics.shown > 0 
      ? parseFloat(((upsellMetrics.clicked / upsellMetrics.shown) * 100).toFixed(2))
      : 0;
    upsellMetrics.conversionRate = upsellMetrics.clicked > 0
      ? parseFloat(((upsellMetrics.converted / upsellMetrics.clicked) * 100).toFixed(2))
      : 0;
    upsellMetrics.revenueGenerated = upsellMetrics.converted * 85; // Starter kit price

    // Build funnel steps
    const totalViews = funnelCounts.views || 1;
    const funnelSteps = [
      { name: 'Product Views', count: funnelCounts.views, percentage: 100 },
      { name: 'Add to Cart', count: funnelCounts.addToCart, percentage: parseFloat(((funnelCounts.addToCart / totalViews) * 100).toFixed(2)) },
      { name: 'Checkout Started', count: funnelCounts.checkoutStarted, percentage: parseFloat(((funnelCounts.checkoutStarted / totalViews) * 100).toFixed(2)) },
      { name: 'Purchase Complete', count: funnelCounts.purchaseComplete, percentage: parseFloat(((funnelCounts.purchaseComplete / totalViews) * 100).toFixed(2)) },
    ];

    // Sort recent events by timestamp
    recentEvents.sort((a, b) => b.timestamp - a.timestamp);

    const response = {
      bundleMetrics,
      upsellMetrics,
      funnelSteps,
      recentEvents: recentEvents.slice(0, 10),
      dateRange: { start: startDate, end: endDate },
      totalEvents: events.length,
    };

    console.log('Analytics response prepared successfully');

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('PostHog analytics error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
