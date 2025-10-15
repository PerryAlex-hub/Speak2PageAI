import BgGradient from "@/components/common/bg-gradient";
import {SignIn} from "@clerk/nextjs";

const page = () => {
  return (
    <main className="pt-20">
    <section className="flex justify-center  py-90">
      <BgGradient>
        <SignIn />
      </BgGradient>
    </section>
    </main>
  );
};

export default page;
