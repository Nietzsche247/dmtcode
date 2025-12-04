import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SHOPIFY_ACCESS_TOKEN = Deno.env.get("SHOPIFY_ACCESS_TOKEN");
const SHOPIFY_STORE_DOMAIN = "5biatp-m0.myshopify.com";
const SHOPIFY_API_VERSION = "2025-01";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  variants: Array<{
    id: number;
    inventory_quantity: number;
    price: string;
    compare_at_price: string | null;
    sku: string;
  }>;
  images: Array<{ src: string }>;
}

async function fetchShopifyProducts(): Promise<ShopifyProduct[]> {
  const endpoint = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/products.json?limit=250`;

  const response = await fetch(endpoint, {
    headers: {
      "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN!,
    },
  });

  if (!response.ok) {
    throw new Error(`Shopify API error: ${response.status}`);
  }

  const data = await response.json();
  return data.products || [];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting inventory sync...");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch all products from Shopify
    const shopifyProducts = await fetchShopifyProducts();
    console.log(`Fetched ${shopifyProducts.length} products from Shopify`);

    const syncResults = {
      synced: 0,
      errors: 0,
      soldOutUpdated: 0,
      newProducts: 0,
    };

    for (const product of shopifyProducts) {
      try {
        // Calculate total inventory across variants
        const totalInventory = product.variants.reduce(
          (sum, variant) => sum + (variant.inventory_quantity || 0),
          0
        );

        const isSoldOut = totalInventory <= 0;
        const primaryVariant = product.variants[0];

        // Upsert into store_products table
        const { error: upsertError } = await supabase
          .from("store_products")
          .upsert({
            shopify_id: String(product.id),
            title: product.title,
            handle: product.handle,
            price: parseFloat(primaryVariant?.price || "0"),
            compare_at_price: primaryVariant?.compare_at_price 
              ? parseFloat(primaryVariant.compare_at_price) 
              : null,
            inventory_quantity: totalInventory,
            sold_out: isSoldOut,
            last_synced_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'shopify_id',
          });

        if (upsertError) {
          console.error(`Error syncing ${product.title}:`, upsertError);
          syncResults.errors++;
        } else {
          syncResults.synced++;
          if (isSoldOut) syncResults.soldOutUpdated++;
        }

        // Also update legacy products table if product exists there
        const { data: existingProduct } = await supabase
          .from("products")
          .select("id")
          .eq("title", product.title)
          .single();

        if (existingProduct) {
          await supabase
            .from("products")
            .update({
              price: parseFloat(primaryVariant?.price || "0"),
              specs: {
                inventory_quantity: totalInventory,
                sold_out: isSoldOut,
                shopify_id: product.id,
                last_synced: new Date().toISOString(),
              },
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingProduct.id);
        }

        console.log(`Synced: ${product.title} - Inventory: ${totalInventory} - Sold Out: ${isSoldOut}`);
      } catch (productError) {
        console.error(`Error processing ${product.title}:`, productError);
        syncResults.errors++;
      }
    }

    console.log("Inventory sync complete:", syncResults);

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        ...syncResults,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Inventory sync failed:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
