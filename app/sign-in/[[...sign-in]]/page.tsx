import BgGradient from "@/components/common/bg-gradient";
import {SignIn} from "@clerk/nextjs";

const page = () => {
  return (
    <section className="flex justify-center pt-20">
      <BgGradient>
        <SignIn />
      </BgGradient>
    </section>

  );
};

export default page;
