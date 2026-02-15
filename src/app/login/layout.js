import Footer from "@/components/Footer";
import SignUpPageHeader from "@/components/SignUpPageHeader";

export default function LoginLayout({ children }) {
  return (
    <div className="min-h-screen">
      <SignUpPageHeader />
      <div className="p-6 pt-8">{children}</div>
      <Footer />
    </div>
  );
}

