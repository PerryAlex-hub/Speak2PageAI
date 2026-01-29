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

export async function getPlanType(priceId?: string) {
  const checkPlanType = plansMap.filter((plan) => plan.priceId === priceId);
  if (checkPlanType && checkPlanType.length > 0) return checkPlanType[0];
  // fallback to free plan if available, otherwise first plan
  const freePlan = plansMap.find((p) => p.id === "free") || plansMap[0];
  return checkPlanType.length > 0 ? checkPlanType[0] : freePlan;
}

export async function getBenefitsForPlan(
  sql: NeonQueryFunction<false, false>,
  userId: string,
  email: string,
) {
  const posts = await sql`SELECT * FROM posts WHERE  user_id = ${userId}`;
  const postsNumber = posts ? posts.length : 0;
  const priceId = await sql`SELECT price_id FROM users WHERE  email = ${email}`;
  const planType = await getPlanType(priceId[0]?.price_id);
  const determineBenefits = postsNumber === 3 && planType.id === "free"
  return determineBenefits;
}