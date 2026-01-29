import { NeonQueryFunction } from "@neondatabase/serverless";
import { plansMap } from "./constants";

export async function hasCancelledSubscription(
  sql: NeonQueryFunction<false, false>,
  email: string,
) {
  const query =
    await sql`SELECT * FROM users WHERE  email = ${email} AND status = 'cancelled'`;
  return query && query.length > 0;
}

export async function updateUser(
  sql: NeonQueryFunction<false, false>,
  email: string,
  userId: string,
) {
  return await sql`UPDATE users SET user_id = ${userId} WHERE email = ${email}`;
}

export async function doesUserExist(
  sql: NeonQueryFunction<false, false>,
  email: string,
) {
  const query = await sql`SELECT * FROM users WHERE  email = ${email}`;
  if (query && query.length > 0) {
    return query;
  }
  return null;
}

export async function createUser(
  sql: NeonQueryFunction<false, false>,
  email: string,
  fullName: string | null,
  userId: string | null,
) {
  // create a free user by default with price_id 'free'
  return await sql`INSERT INTO users (email, full_name, user_id, status, price_id) VALUES (${email}, ${fullName}, ${userId}, 'free', 'free')`;
}

export async function getPlanType(priceId: string) {
  const checkPlanType = plansMap.filter((plan) => plan.priceId === priceId);
  return checkPlanType?.[0];
}
