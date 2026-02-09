//src/app/refund-requests/layout.js
import Footer from "@/components/Footer";
import FrontHeader from "@/components/FrontHeader";

export default function RefundRequestsLayout({ children }) {
  return (
    <div className=" flex flex-col">
      <FrontHeader />
      <div className="flex-1 flex pt-24 xl:pt-28">
        {children}
      </div>
      <Footer />
    </div>
  );
}


