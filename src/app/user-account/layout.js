//src/app/user-account/layout.js
import FrontHeader from "@/components/FrontHeader";

export default function ProfileLayout({ children }) {
  return (
    <div className="">
      <FrontHeader />
      <main className="p-4 sm:p-6 pt-32 lg:pt-24 xl:pt-28">{children}</main>
    </div>
  );
}
