'use client';

import FrontHeader from '@/components/FrontHeader';
import Footer from '@/components/new-design/Footer';
import ResponsiveText from '@/components/UI/ResponsiveText';

export default function TermsConditions() {
  return (
    <div className="min-h-screen bg-white">
      <FrontHeader />
      <main className="max-w-4xl mx-auto px-4 py-24 sm:py-32">
        <ResponsiveText as="h1" minSize="32px" maxSize="48px" className="font-bold text-oxford-blue mb-8">
          Terms & Conditions
        </ResponsiveText>
        
        <div className="prose prose-slate max-w-none text-gray-600 space-y-6">
          <p className="text-lg text-gray-500">
            Last Updated: February 21, 2026
          </p>
          
          <section>
            <h2 className="text-2xl font-semibold text-oxford-blue mb-3">1. Agreement to Terms</h2>
            <p>
              By accessing or using MultiKonnect, you agree to be bound by these Terms and Conditions 
              and all applicable laws and regulations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-oxford-blue mb-3">2. Use License</h2>
            <p>
              Permission is granted to temporarily download one copy of the materials on MultiKonnect's website 
              for personal, non-commercial transitory viewing only.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-oxford-blue mb-3">3. Disclaimer</h2>
            <p>
              The materials on MultiKonnect's website are provided on an 'as is' basis. MultiKonnect makes no 
              warranties, expressed or implied, and hereby disclaims and negates all other warranties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-oxford-blue mb-3">4. Limitations</h2>
            <p>
              In no event shall MultiKonnect or its suppliers be liable for any damages arising out of the 
              use or inability to use the materials on MultiKonnect's website.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-oxford-blue mb-3">5. Governing Law</h2>
            <p>
              These terms and conditions are governed by and construed in accordance with the laws 
              and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
