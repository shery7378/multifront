//src/app/Login/layout.js
import FrontHeader from "@/components/FrontHeader";
import Footer from "@/components/Footer";

export default function LoginLayout({ children }) {
  return (
    <div className="min-h-screen">
      <FrontHeader />
      <div className="p-6 pt-32 lg:pt-24 xl:pt-28">{children}</div>
      <Footer />
    </div>
  );
}

