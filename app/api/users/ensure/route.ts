import getDbConnection from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, email, fullName } = body;
    if (!email) {
      return NextResponse.json({ success: false, message: "Missing email" }, { status: 400 });
    }

    const sql = await getDbConnection();
    const existing = await sql`SELECT * FROM users WHERE email = ${email}`;
    if (existing && existing.length > 0) {
      // ensure user_id is set
      if (userId && !existing[0].user_id) {
        await sql`UPDATE users SET user_id = ${userId} WHERE email = ${email}`;
      }
      return NextResponse.json({ success: true, created: false });
    }

    await sql`INSERT INTO users (email, full_name, user_id, status, price_id) VALUES (${email}, ${fullName}, ${userId}, 'free', 'free')`;
    return NextResponse.json({ success: true, created: true });
  } catch (err) {
    console.error("/api/users/ensure error", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
