//src/app/store/layout.js
import Footer from "@/components/Footer";
import FrontHeader from "@/components/FrontHeader";

export default function HomeLayout({ children }) {
  return (
    <div className="min-h-screen">
      <FrontHeader />
      <main className="p-6 pt-24 xl:pt-28">{children}</main>
      <Footer />
    </div>
  );
}
