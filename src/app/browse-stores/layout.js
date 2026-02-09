// src/app/browse-stores/layout.js
import Footer from "@/components/Footer";
import FrontHeader from "@/components/FrontHeader";

export default function BrowseStoresLayout({ children }) {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <FrontHeader />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-32 lg:pt-24 xl:pt-28">{children}</div>
      <Footer />
    </div>
  );
}
