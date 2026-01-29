import { ArrowRight } from "lucide-react";
import Link from "next/link";
import React from "react";

const UpgradeYourPlan = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-6 text-center ">
      <p className="mt-2 text-lg leading-8 text-gray-600 max-w-2xl text-center sm:text-xl border-2 border-red-200 bg-red-100 p-4 rounded-lg border-dashed ">
        Free trial has been exceeded. You need to upgrade your plan to create blog posts.
      </p>
      <Link className="flex gap-2 items-center text-purple-600 font-semibold" href="/#pricing">Go to Pricing <ArrowRight className="w-4 h-4" /> </Link>
    </div>
  );
};

export default UpgradeYourPlan;
