import BgGradient from "@/components/common/bg-gradient";
import {SignUp} from "@clerk/nextjs";

const page = () => {
  return (
    <section className="flex justify-center items-center py-20">
      <BgGradient>
        <SignUp />
      </BgGradient>
    </section>
  );
};
export default page;
