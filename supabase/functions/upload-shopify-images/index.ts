import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SHOPIFY_ACCESS_TOKEN = Deno.env.get("SHOPIFY_ACCESS_TOKEN");
const SHOPIFY_STORE_DOMAIN = "5biatp-m0.myshopify.com";
const SHOPIFY_API_VERSION = "2025-01";

interface ImageUploadRequest {
  productId: string;
  imageBase64: string;
  altText?: string;
  position?: number;
}

async function uploadImageToShopify(
  productId: string,
  imageBase64: string,
  altText: string = "",
  position: number = 1
): Promise<any> {
  // Extract numeric ID from GraphQL ID if needed
  const numericId = productId.replace("gid://shopify/Product/", "");
  
  const endpoint = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/products/${numericId}/images.json`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN!,
    },
    body: JSON.stringify({
      image: {
        attachment: imageBase64.replace(/^data:image\/\w+;base64,/, ""),
        alt: altText,
        position: position,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Shopify API error:", errorText);
    throw new Error(`Shopify API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productId, imageBase64, altText, position }: ImageUploadRequest = await req.json();

    if (!productId || !imageBase64) {
      return new Response(
        JSON.stringify({ error: "productId and imageBase64 are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Uploading image for product: ${productId}`);

    const result = await uploadImageToShopify(productId, imageBase64, altText, position);

    console.log("Image uploaded successfully:", result.image?.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        imageId: result.image?.id,
        imageUrl: result.image?.src 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error uploading image:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
