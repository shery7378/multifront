// Root layout for Next.js app directory
import { Providers } from './providers';
import './globals.css';

export const metadata = {
  title: 'MultiKonnect',
  description: 'MultiKonnect - Your Food Delivery Platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

