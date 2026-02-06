import Banner from "@/components/home/Banner";
import HowItWorks from "@/components/home/howitworks";
import Divider from "@/components/Divider";
import Pricing from "@/components/home/Pricing";
import BgGradient from "@/components/common/bg-gradient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Content Generator - Transform Your Media into Engaging Content",
  description:
    "Easily convert your audio and video files into captivating blog posts. Our AI-powered content generator analyzes your media and creates engaging, SEO-friendly articles in minutes. Perfect for bloggers, marketers, and content creators looking to repurpose their media content effortlessly.",
  openGraph: {
    title: "AI Content Generator - Transform Your Media into Engaging Content",
    description:
      "Easily convert your audio and video files into captivating blog posts. Our AI-powered content generator analyzes your media and creates engaging, SEO-friendly articles in minutes. Perfect for bloggers, marketers, and content creators looking to repurpose their media content effortlessly.",
    url: "https://speak2page.app",
    siteName: "AI Content Generator",
  },
  keywords: [
    "AI content generator",
    "audio to blog",
    "video to blog",
    "AI writing assistant",
    "content creation tool",
    "SEO-friendly articles",
    "blog post generator",
    "media to content",
  ],
};

export default function Home() {
  return (
    <main className="mx-auto bg-[radial-gradient(e5e7eb_1px, transparent_1px] w-full inset-0 h-full [background-size:16px_16px]">
      <BgGradient />
      <Banner />
      <Divider />

      <HowItWorks />
      <Divider />

      <Pricing />
      <Divider />

      <footer className="bg-gray-200/20 flex h-20 py-24 px-12 z-20 relative overflow-hidden">
        <p className="">All Rights Reserved, {new Date().getFullYear()}</p>
      </footer>
    </main>
  );
}
