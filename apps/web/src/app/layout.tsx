import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import SessionProvider from '@/components/providers/SessionProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Agent Bowery - Content Management System',
  description: 'AI-powered content management and social media automation platform',
  keywords: 'content management, social media, AI, automation, marketing',
  authors: [{ name: 'Agent Bowery Team' }],
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <div id="root">
            {children}
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
