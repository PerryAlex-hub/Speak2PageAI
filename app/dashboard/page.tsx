import { plansMap } from "@/lib/constants";
import getDbConnection from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";


const Dashboard = async () => {
  const clerkUser = await currentUser()
  const email = clerkUser?.emailAddresses[0]?.emailAddress ?? ""
  const sql = await getDbConnection();
   const user = await sql`SELECT * FROM users WHERE  email = ${email}`;
   let userId = null
   let planType = "starter"
   if(user && user.length > 0) {
     userId = clerkUser?.id
     await sql `UPDATE users SET user_id = ${userId} WHERE email = ${email}`
     let priceId = user[0].price_id
     planType = plansMap.filter((plan) => plan.priceId === priceId)[0].id
   }
  return <div>Dashboard status: {JSON.stringify(user)}</div>;
}

export default Dashboard