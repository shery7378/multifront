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
        <link rel="preload" href="/fonts/Bricle.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/Bricle.woff" as="font" type="font/woff" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/Bricle.ttf" as="font" type="font/ttf" crossOrigin="anonymous" />
      </head>
      <body suppressHydrationWarning className='min-h-screen flex flex-col relative'>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

