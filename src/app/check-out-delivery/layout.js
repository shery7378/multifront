//src/app/check-out-delivery/layout.js
import Footer from "@/components/Footer";
import FrontHeader from "@/components/FrontHeader";

// app/CheckoutDelivery/layout.jsx
export default function CheckoutDeliveryLayout({ children }) {
  return (
    <div className="min-h-screen">
      <FrontHeader />
      <div className="container mx-auto p-6 pt-24 xl:pt-28">{children}</div>
      <Footer />
    </div>
  );
}
