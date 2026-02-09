//src/app/pick-up/layout.js
import Footer from "@/components/Footer";
import FrontHeader from "@/components/FrontHeader";

export default function PickUpLayout({ children }) {
  return (
    <div className="">
      <FrontHeader />
      <main className="pt-24 xl:pt-28">{children}</main>
      <Footer />
    </div>
  );
}