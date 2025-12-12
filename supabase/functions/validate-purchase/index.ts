import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PurchaseRequest {
  userId: number;
  productId: string;
  purchaseToken: string;
  transactionId: string;
}

interface GooglePlayVerifyResponse {
  purchaseState: number;
  consumptionState: number;
  orderId: string;
  purchaseTimeMillis: string;
  acknowledgementState: number;
}

const PRODUCT_COIN_MAP: Record<string, { coins: number; bonus: number }> = {
  novoin_10: { coins: 10, bonus: 0 },
  novoin_25: { coins: 25, bonus: 2 },
  novoin_50: { coins: 50, bonus: 5 },
  novoin_100: { coins: 100, bonus: 15 },
  novoin_250: { coins: 250, bonus: 50 },
  novoin_500: { coins: 500, bonus: 125 },
};

async function getGoogleAccessToken(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/androidpublisher",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const unsignedToken = `${headerB64}.${payloadB64}`;

  const privateKeyPem = serviceAccount.private_key;
  const pemContents = privateKeyPem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");
  const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    encoder.encode(unsignedToken)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const jwt = `${unsignedToken}.${signatureB64}`;

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenResponse.json();
  if (!tokenData.access_token) {
    throw new Error("Failed to get Google access token");
  }
  return tokenData.access_token;
}

async function verifyGooglePlayPurchase(
  packageName: string,
  productId: string,
  purchaseToken: string,
  accessToken: string
): Promise<GooglePlayVerifyResponse> {
  const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/products/${productId}/tokens/${purchaseToken}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Google Play API error:", error);
    throw new Error(`Google Play verification failed: ${response.status}`);
  }

  return response.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const googleServiceAccountJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
    const packageName = Deno.env.get("ANDROID_PACKAGE_NAME") || "com.novea.app";

    if (!googleServiceAccountJson) {
      throw new Error("Google Service Account not configured");
    }

    const serviceAccount = JSON.parse(googleServiceAccountJson);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId, productId, purchaseToken, transactionId }: PurchaseRequest = await req.json();

    if (!userId || !productId || !purchaseToken) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const coinInfo = PRODUCT_COIN_MAP[productId];
    if (!coinInfo) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid product ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const referenceId = transactionId || purchaseToken;
    const { data: existingTx } = await supabase
      .from("coin_transactions")
      .select("id")
      .eq("reference_id", referenceId)
      .maybeSingle();

    if (existingTx) {
      return new Response(
        JSON.stringify({ success: true, totalCoins: 0, message: "Transaction already processed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accessToken = await getGoogleAccessToken(serviceAccount);
    const verification = await verifyGooglePlayPurchase(packageName, productId, purchaseToken, accessToken);

    if (verification.purchaseState !== 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Purchase not completed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const totalCoins = coinInfo.coins + coinInfo.bonus;

    const { error: txError } = await supabase.from("coin_transactions").insert({
      user_id: userId,
      type: "purchase",
      amount: totalCoins,
      description: `Pembelian ${totalCoins} Novoin via Google Play`,
      reference_id: referenceId,
    });

    if (txError) {
      if (txError.code === "23505") {
        return new Response(
          JSON.stringify({ success: true, totalCoins: 0, message: "Transaction already processed" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw txError;
    }

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("coin_balance")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      throw new Error("User not found");
    }

    const newBalance = user.coin_balance + totalCoins;

    const { error: updateError } = await supabase
      .from("users")
      .update({ coin_balance: newBalance })
      .eq("id", userId);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({ success: true, totalCoins, newBalance }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
