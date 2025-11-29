import getDbConnection from "./db";
import {PaystackCustomer, PaystackPlan} from "./types";
interface PaystackChargeData {
  id: number;
  domain: string;
  status: string;
  reference: string;
  amount: number; // In kobo (Nigerian currency smallest unit)
  message: string | null;
  gateway_response: string;
  paid_at: string;
  created_at: string;
  customer: PaystackCustomer;
  channel: string;
  plan?: PaystackPlan;
  currency: string;
  ip_address: string;
}
export async function handleChargeSuccess(data: PaystackChargeData) {
  // Example: Log the charge data
  console.log("Charge successful:", data);
  const customer = data.customer;
  const priceId = data.plan?.plan_code;
  const plan = data.plan;
  const status = data.status;
  const sql = await getDbConnection();
  if ("email" in customer && priceId) {
    await createOrUpdateUser(customer, sql);
    //update user subscription
    await updateUserSubscription(sql, customer.email, priceId);
    //insert payment record
    await insertPayment(sql, customer.email, priceId, plan, status);
  }
}

async function createOrUpdateUser(customer: PaystackCustomer, sql: any) {
  try {
    const fullName = `${customer.first_name} ${customer.last_name}`;
    const user = await sql`SELECT * FROM users WHERE email = ${customer.email}`;
    if (user.length === 0) {
      await sql`INSERT INTO users (email, full_name, customer_id) VALUES (${customer.email}, ${fullName}, ${customer.id})`;
    }
  } catch (err) {
    console.error("Error creating or updating user:", err);
  }
}

async function updateUserSubscription(
  sql: any,
  email: string,
  priceId?: string
) {
  try {
    await sql`UPDATE users SET price_id = ${priceId}, status = 'active' where email = ${email}`;
  } catch (err) {
    console.error("Error creating or updating user:", err);
  }
}

async function insertPayment(
  sql: any,
  email: string,
  priceId?: string,
  plan?: PaystackPlan,
  status?: string
) {
  try {
    await sql`INSERT INTO payments (amount, status, paystack_payment_id, price_id, user_email) VALUES (${plan?.amount}, ${status}, ${plan?.id}, ${priceId}, ${email})`;
  } catch (err) {
    console.error("Error creating or updating user:", err);
  }
}
