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
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@100;200;300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning className='h-screen'>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

