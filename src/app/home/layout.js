//src/app/home/layout.js
import Footer from "@/components/Footer";
import FrontHeader from "@/components/FrontHeader";

export default function HomeLayout({ children }) {
  return (
    <div className="min-h-screen">
      <FrontHeader />
      <div className="container mx-auto p-6 pt-24 xl:pt-28">{children}</div>
      <Footer />
    </div>
  );
}

// src/app/home/layout.jsx
// import SharedLayout from '@/components/SharedLayout';

// export default function HomeLayout({ children }) {
//   return <SharedLayout>{children}</SharedLayout>;
// }

