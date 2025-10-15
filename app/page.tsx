import Banner from "@/components/home/Banner";
import HowItWorks from "@/components/home/howitworks";
import Divider from "@/components/Divider";
import Pricing from "@/components/home/Pricing";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <main className="mx-auto bg-[radial-gradient(e5e7eb_1px, transparent_1px] w-full inset-0 h-full [background-size:16px_16px]">
      <SignedOut>
              <SignInButton />
              {/* <SignUpButton>
              </SignUpButton> */}
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
       <div className="relative isolate">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
      >
        <div
          style={{
            clipPath:
              "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
          }}
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72rem]"
        />
      </div>
      </div>
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
