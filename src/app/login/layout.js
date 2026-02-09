//src/app/Login/layout.js
import SignUpPageHeader from "@/components/SignUpPageHeader";

export default function LoginLayout({ children }) {
  return (
    <div className="">
      <SignUpPageHeader />
      <div className="p-6">{children}</div>
    </div>
  );
}

// src/app/Login/layout.jsx
// import SharedLayout from '@/components/SharedLayout';

// export default function LoginLayout({ children }) {
//   return <SharedLayout>{children}</SharedLayout>;
// }

