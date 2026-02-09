import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  metadataBase: new URL('https://lowdefy.com'),
  title: 'Lowdefy - Config-First Web Stack for AI and Humans',
  description:
    'Build full-stack web apps with YAML config. AI outputs production-ready code. Easy to review, secure by design, connects to any data source.',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'Lowdefy - Config-First Web Stack for AI and Humans',
    description:
      'Build full-stack web apps with YAML config. AI outputs production-ready code. Easy to review, secure by design.',
    type: 'website',
  },
};

const themeScript = `(function(){try{var d=document.documentElement;var s=localStorage.getItem('theme');var m=window.matchMedia('(prefers-color-scheme: dark)');function a(v){d.classList.toggle('dark',v==='dark'||(v!=='light'&&m.matches))}a(s);m.addEventListener('change',function(){if(!localStorage.getItem('theme'))a()})}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
