export const plansMap = [
    {
      id: "basic",
      name: "Basic",
      description: "Get started with Speak2Page!",
      price: "2,500",
      items: ["3 Blog Posts", "3 Transcriptions"],
      paymentLink: "https://paystack.shop/pay/zcpwrrhqws",
      priceId: process.env.NODE_ENV === "development" ? "PLN_woyl75nsciaj5df" : ""
    },

    {
      id: "pro",
      name: "Pro",
      description: "All Blog Posts, let's go!",
      price: "10,000",
      items: ["Unlimited Blog Posts", "Unlimited Transcriptions"],
      paymentLink: "https://paystack.shop/pay/9w45i57enf",
      priceId: process.env.NODE_ENV === "development" ? "PLN_qrho3w4qnusfq2e" : ""
    },
  ];