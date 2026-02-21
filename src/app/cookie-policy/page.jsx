'use client';

import FrontHeader from '@/components/FrontHeader';
import Footer from '@/components/new-design/Footer';
import ResponsiveText from '@/components/UI/ResponsiveText';

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-white">
      <FrontHeader />
      <main className="max-w-4xl mx-auto px-4 py-24 sm:py-32">
        <ResponsiveText as="h1" minSize="32px" maxSize="48px" className="font-bold text-oxford-blue mb-8">
          Cookie Policy
        </ResponsiveText>
        
        <div className="prose prose-slate max-w-none text-gray-600 space-y-6">
          <p className="text-lg text-gray-500">
            Last Updated: February 21, 2026
          </p>
          
          <section>
            <h2 className="text-2xl font-semibold text-oxford-blue mb-3">1. What are Cookies?</h2>
            <p>
              Cookies are small text files that are stored on your computer or mobile device when you 
              visit a website. They are widely used to make websites work or work more efficiently.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-oxford-blue mb-3">2. How We Use Cookies</h2>
            <p>
              We use cookies to understand how you use our website and to improve your experience. 
              This includes keeping you logged in and remembering your preferences.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-oxford-blue mb-3">3. Types of Cookies We Use</h2>
            <p>
              We use both session cookies (which expire once you close your web browser) and persistent 
              cookies (which stay on your device until you delete them).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-oxford-blue mb-3">4. Managing Cookies</h2>
            <p>
              Most web browsers allow you to control cookies through their settings preferences. 
              However, if you limit the ability of websites to set cookies, you may impair your 
              overall user experience.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
