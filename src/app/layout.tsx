import type { Metadata } from 'next';
import { Inter, Lora, Merriweather, Outfit, Playfair_Display } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import NavigationProgress from '@/components/layout/NavigationProgress';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-lora',
  display: 'swap',
});

const merriweather = Merriweather({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  variable: '--font-merriweather',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Folio | Your Personal Library',
  description: 'A beautiful, distraction-free reading experience',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${lora.variable} ${merriweather.variable} ${outfit.variable} ${playfair.variable} font-sans antialiased bg-bg text-text-primary`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('folio-sidebar-open');if(s==='false')document.documentElement.setAttribute('data-sidebar-closed','')}catch(e){}})();`,
          }}
        />
        <NavigationProgress />
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: '#1C1C1E',
              color: '#FAF8F4',
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'var(--font-outfit)',
            },
          }}
        />
      </body>
    </html>
  );
}
