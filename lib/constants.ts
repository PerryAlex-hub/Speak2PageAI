export const plansMap = [
  {
    id: "free",
    name: "Free",
    description: "Get started with Speak2Page!",
    price: "0",
    items: ["3 Blog Posts", "3 Transcriptions"],
    paymentLink: "",
    priceId: "free",
  },

  {
    id: "pro",
    name: "Pro",
    description: "All Blog Posts, let's go!",
    price: "5,000",
    items: ["Unlimited Blog Posts", "Unlimited Transcriptions"],
    paymentLink: "https://paystack.shop/pay/vkewf0my5w",
    priceId:
      process.env.NODE_ENV === "development"
        ? "PLN_qrho3w4qnusfq2e"
        : "PLN_dre6ehau6gnggv3",
  },
];

export const ORIGIN_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://speak2pageai.vercel.app";
