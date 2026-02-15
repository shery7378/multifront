import Footer from "@/components/Footer";
import SignUpPageHeader from "@/components/SignUpPageHeader";

export default function SignUpLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <SignUpPageHeader />
      <main className="flex-grow flex items-center justify-center pt-8 pb-8 px-4 w-full">
        <div className="w-full max-w-lg">{children}</div>
      </main>
      <Footer />
    </div>
  );
}
