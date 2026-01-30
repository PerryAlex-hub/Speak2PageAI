import BgGradient from "@/components/common/bg-gradient";
import { Badge } from "@/components/ui/badge";
import UpgradeYourPlan from "@/components/upload/upgrade-your-plan";
import UploadForm from "@/components/upload/upload-form";
import getDbConnection from "@/lib/db";
import {
  createUser,
  doesUserExist,
  getBenefitsForPlan,
  getPlanType,
  hasCancelledSubscription,
  updateUser,
} from "@/lib/user-helpers";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const Dashboard = async () => {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    return redirect("/sign-in");
  }
  const email = clerkUser?.emailAddresses?.[0].emailAddress ?? "";
  const fullName =
    `${clerkUser?.firstName ?? ""}${clerkUser?.lastName ?? ""}`.trim();
  const sql = await getDbConnection();
  const user = await doesUserExist(sql, email);
  let userId = null;
  let priceId = null;
  const hasUserCancelled = await hasCancelledSubscription(sql, email);

  if (user) {
    userId = clerkUser?.id;
    if (userId) {
      console.log(email);
      console.log(fullName)
      await updateUser(sql, email, userId!);
    }
    priceId = user[0].price_id;
  } else {
    userId = clerkUser?.id;
    await createUser(sql, email, fullName, userId);
  }
  const { id: planTypeId = "starter", name: PlanTypeName } =
    await getPlanType(priceId);
  console.log({ planTypeId, PlanTypeName });

  const isBasicPlan = planTypeId === "free";
  userId = clerkUser?.id;
  const isUserOnFree = await getBenefitsForPlan(sql, userId, email);

  // const isProPlan = planTypeId === "pro";
  return (
    <BgGradient>
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="flex flex-col items-center justify-center gap-6 text-center">
          <Badge className="bg-linear-to-r from-purple-700 to-pink-800 text-white px-4 py-1 text-lg font-semibold capitalize">
            {PlanTypeName} Plan
          </Badge>

          <h2 className="capitalize text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Start creating amazing content
          </h2>
          <p className="mt-2 text-lg leading-8 text-gray-600 max-w-2xl text-center">
            Upload your audio or video file and let our AI do the magic!
          </p>

          <p className="mt-2 text-lg leading-8 text-gray-600 max-w-2xl text-center ">
            You get{" "}
            <span className="font-bold text-amber-600 bg-amber-100 px-2 py-1 rounded-md">
              {isBasicPlan ? "3" : "unlimited"}
            </span>{" "}
            blog posts as part of the{" "}
            <span className="font-bold capitalize">{PlanTypeName} </span> Plan.
          </p>

          {isUserOnFree || hasUserCancelled ? (
            <UpgradeYourPlan />
          ) : (
            <BgGradient>
              {" "}
              <UploadForm />{" "}
            </BgGradient>
          )}
        </div>
      </div>
    </BgGradient>
  );
};

export default Dashboard;
