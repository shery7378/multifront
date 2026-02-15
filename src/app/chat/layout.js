//src/app/chat/layout.js
import Footer from "@/components/Footer";
import FrontHeader from "@/components/FrontHeader";

export default function ChatLayout({ children }) {
  return (
    <div className="min-h-screen">
      <FrontHeader />
      <main className="p-4 sm:p-6 pt-32 lg:pt-24 xl:pt-28">{children}</main>
      <Footer />
    </div>
  );
}

