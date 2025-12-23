//src/app/sign-up/layout.js
import SignUpPageHeader from "@/components/SignUpPageHeader";

export default function SignUpLayout({ children }) {
  return (
    <div className="h-screen ">
      <SignUpPageHeader />
      <div className="grid md:items-center h-full -mt-21 pt-21 justify-items-center">
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
