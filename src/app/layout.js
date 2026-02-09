// Root layout for Next.js app directory
import { Providers } from './providers';
import './globals.css';
import { Manrope } from 'next/font/google';

const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-manrope',
});

export const metadata = {
  title: 'MultiKonnect',
  description: 'MultiKonnect - Your Food Delivery Platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className={manrope.variable}>
      <body suppressHydrationWarning class='h-screen'>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

