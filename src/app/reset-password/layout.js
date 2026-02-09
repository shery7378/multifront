// src/app/forgot-password/layout.js
import Footer from "@/components/Footer";
import FrontHeader from "@/components/FrontHeader";

export default function ResetPasswordLayout({ children }) {
  return (
    <div className="min-h-screen">
      <FrontHeader />
      <div className="p-6 pt-24 xl:pt-28">{children}</div>
      <Footer />
    </div>
  );
}

