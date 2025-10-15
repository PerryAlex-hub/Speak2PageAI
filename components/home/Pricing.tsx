import {ArrowRight, CheckIcon} from "lucide-react";
import {Button} from "../ui/button";
import Link from "next/link";

const Pricing = () => {
  const plansMap = [
    {
      id: "basic",
      name: "Basic",
      description: "Get started with Speak2Page!",
      price: "10",
      items: ["3 Blog Posts", "3 Transcriptions"],
    },

    {
      id: "pro",
      name: "Pro",
      description: "All Blog Posts, let's go!",
      price: "19.99",
      items: ["Unlimited Blog Posts", "Unlimited Transcriptions"],
    },
  ];

  return (
    <section className="relative overflow-hidden" id="pricing">
      <div className="mx-auto max-w-5xl py-12 lg:py-24 px-12 lg:px-0">
        <div className="flex items-center justify-center pb-12 w-full">
          <h2 className="font-bold text-xl text-purple-600 uppercase mb-6">
            {" "}
            Pricing
          </h2>
        </div>
        <div className="relative flex flex-col lg:flex-row items-center lg:items-stretch gap-8 justify-center">
          {plansMap.map(({name, price, description, items, id}, idx) => (
            <div key={idx} className="max-w-lg w-full relative">
              <div
                className={`relative flex flex-col gap-4 lg:gap-8 h-full z-10 p-8 rounded-box border-[1px]  rounded-2xl ${
                  id === "pro"
                    ? "border-violet-500 border-[2px] gap-5"
                    : "border-gray-500/20"
                } `}
              >
                <div className="flex justify-between items-center gap-4">
                  <div>
                    <p className="text-lg lg:text-xl font-bold capitalize">
                      {name}
                    </p>
                    <p className="text-base-content/80 mt-2"> {description}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <p className="tracking-tight font-extrabold text-5xl">
                    {" "}
                    ${price}{" "}
                  </p>
                  <div className="flex flex-col justify-end mb-[4px]">
                    <p className="text-xs text-base-content/60 uppercase font-semibold">
                      {" "}
                      USD{" "}
                    </p>
                    <p className="text-xs text-base-content/60 ">/month</p>
                  </div>
                </div>
                <ul className="flex-1 space-y-2.5 leading-relaxed text-base">
                  {items.map((item, idx) => (
                    <li className="flex items-center gap-2" key={idx}>
                      {" "}
                      <CheckIcon size={18} /> <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="space-y-2">
                  <Button
                    variant={"link"}
                    className={`border-2 bg-black text-gray-100 rounded-full flex ${
                      id === "pro" ? "border-amber-300 px-4" : ""
                    } gap-2`}
                  >
                    <Link href="/" className="flex gap-1 items-center">
                      {" "}
                      Get Speak2Page <ArrowRight size={18} />{" "}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
