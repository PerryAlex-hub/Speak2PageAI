import Banner from "@/components/home/Banner";
import HowItWorks from "@/components/home/howitworks";
import Divider from "@/components/Divider";
import Pricing from "@/components/home/Pricing";
import BgGradient from "@/components/common/bg-gradient";
// import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

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
