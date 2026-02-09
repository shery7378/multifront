"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home page immediately
    router.replace("/home");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vivid-red mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to home...</p>
      </div>
    </div>
  );
}
