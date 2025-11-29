import { handleChargeSuccess } from "@/lib/payment-helpers";
import {NextRequest, NextResponse} from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const paystackSignature = req.headers.get("x-paystack-signature");
    const secret = process.env.PAYSTACK_API_SECRET_KEY || "";

    //Generate hash using web crypto API
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      {name: "HMAC", hash: "SHA-512"},
      false,
      ["sign"]
    );

    const data = encoder.encode(JSON.stringify(body));
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, data);

    //convert buffer to hex string
    const hashArray = Array.from(new Uint8Array(signatureBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (hashHex !== paystackSignature) {
      return NextResponse.json({error: "invalid signature"}, {status: 400});
    }

    const event = body.event;
    console.log(event)

    switch (event) {
      case "charge.success":
        console.log("Handle successful payment", body.data);
        const session = body.data
        //connect to db create or update user
        await handleChargeSuccess(session); 
        break;
      case "customeridentification.success":
        console.log("identified customer:", body.data.customer_code);
        break;
      case "transfer.success":
        console.log("💸 Transfer successful:", body.data.reference);
        break;
      case "transfer.failed":
        console.log("⚠️ Transfer failed:", body.data.reference);
        break;
      case "subscription.create":
        console.log(
          "🆕 New subscription created:",
          body.data
        );
        const subscriptionId = body.data.subscription_code;
        // Update user subscription status in your database
        break;
      case "subscription.not_renew":
        console.log("🚫 Subscription disabled:", body.data.customer );
        
        break;
      default:
        console.log(`Unhandled event type: ${event}`);
    }

    return NextResponse.json({received: true});
  } catch (error) {
    console.log("Webhook Error", error);
    return NextResponse.json({status: "Error", error});
  }
}
