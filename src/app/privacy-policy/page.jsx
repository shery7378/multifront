'use client';

import FrontHeader from '@/components/FrontHeader';
import Footer from '@/components/new-design/Footer';
import ResponsiveText from '@/components/UI/ResponsiveText';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white">
      <FrontHeader />
      <main className="max-w-4xl mx-auto px-4 py-24 sm:py-32">
        <ResponsiveText as="h1" minSize="32px" maxSize="48px" className="font-bold text-oxford-blue mb-8">
          Privacy Policy
        </ResponsiveText>
        
        <div className="prose prose-slate max-w-none text-gray-600 space-y-6">
          <p className="text-lg text-gray-500">
            Last Updated: February 21, 2026
          </p>
          
          <section>
            <h2 className="text-2xl font-semibold text-oxford-blue mb-3">1. Information We Collect</h2>
            <p>
              We collect information you provide directly to us, such as when you create or modify your account, 
              request service, contact customer support, or otherwise communicate with us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-oxford-blue mb-3">2. How We Use Information</h2>
            <p>
              We use the information we collect to provide, maintain, and improve our services, 
              to develop new services, and to protect MultiKonnect and our users.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-oxford-blue mb-3">3. Sharing Information</h2>
            <p>
              We may share the information we collect about you as described in this Policy 
              or as described at the time of collection or sharing.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-oxford-blue mb-3">4. Security</h2>
            <p>
              We take reasonable measures to help protect information about you from loss, 
              theft, misuse and unauthorized access, disclosure, alteration and destruction.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-oxford-blue mb-3">5. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at info@multikonnect.com.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
