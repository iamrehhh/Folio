import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Lora } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
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

export const metadata: Metadata = {
  title: 'Folio — Your Personal Library',
  description: 'A beautiful, distraction-free reading experience',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${lora.variable} font-sans antialiased`}>
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: '#1C1C1E',
              color: '#FAF8F4',
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'var(--font-inter)',
            },
          }}
        />
      </body>
    </html>
  );
}
