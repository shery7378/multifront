//src/app/sign-up/layout.js
import FrontHeader from "@/components/FrontHeader";
import Footer from "@/components/Footer";

export default function SignUpLayout({ children }) {
  return (
    <div className="min-h-screen">
      <FrontHeader />
      <div className="grid md:items-center min-h-[calc(100vh-200px)] pt-32 lg:pt-24 xl:pt-28 justify-items-center">
        <div className="p-6">{children}</div>
      </div>
      <Footer />
    </div>
  );
}
