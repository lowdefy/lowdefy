import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import PostHogProvider from '@/providers/PostHogProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  metadataBase: new URL('https://lowdefy.com'),
  title: 'Lowdefy - Config-First Web Stack for AI and Humans',
  description:
    'Build full-stack web apps with YAML config. AI outputs production-ready code. Easy to review, secure by design, connects to any data source.',
  keywords: [
    'lowdefy',
    'low-code',
    'config-first',
    'YAML',
    'AI app builder',
    'open source',
    'web framework',
    'internal tools',
    'admin panels',
    'CRUD apps',
    'full-stack',
  ],
  authors: [{ name: 'Lowdefy, Inc.' }],
  creator: 'Lowdefy, Inc.',
  publisher: 'Lowdefy, Inc.',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
  },
  alternates: {
    canonical: 'https://lowdefy.com',
  },
  openGraph: {
    title: 'Lowdefy - Config-First Web Stack for AI and Humans',
    description:
      'Build full-stack web apps with YAML config. AI outputs production-ready code. Easy to review, secure by design.',
    type: 'website',
    url: 'https://lowdefy.com',
    siteName: 'Lowdefy',
    locale: 'en_US',
    images: ['/opengraph-image'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lowdefy - Config-First Web Stack for AI and Humans',
    description:
      'Build full-stack web apps with YAML config. AI outputs production-ready code. Easy to review, secure by design.',
    site: '@lowaboratories',
    creator: '@lowaboratories',
    images: ['/opengraph-image'],
  },
  verification: {
    google: 'GOOGLE_SITE_VERIFICATION_PLACEHOLDER',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://lowdefy.com/#organization',
      name: 'Lowdefy, Inc.',
      url: 'https://lowdefy.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://lowdefy.com/images/logo.svg',
      },
      sameAs: [
        'https://github.com/lowdefy/lowdefy',
        'https://x.com/lowaboratories',
        'https://discord.gg/lowdefy',
        'https://www.youtube.com/@lowdefy',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': 'https://lowdefy.com/#website',
      url: 'https://lowdefy.com',
      name: 'Lowdefy',
      publisher: { '@id': 'https://lowdefy.com/#organization' },
    },
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://lowdefy.com/#software',
      name: 'Lowdefy',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Any',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      license: 'https://www.apache.org/licenses/LICENSE-2.0',
    },
    {
      '@type': 'WebPage',
      '@id': 'https://lowdefy.com/#webpage',
      url: 'https://lowdefy.com',
      name: 'Lowdefy - Config-First Web Stack for AI and Humans',
      description:
        'Build full-stack web apps with YAML config. AI outputs production-ready code. Easy to review, secure by design, connects to any data source.',
      isPartOf: { '@id': 'https://lowdefy.com/#website' },
      about: { '@id': 'https://lowdefy.com/#software' },
    },
  ],
};

const themeScript = `(function(){try{var d=document.documentElement;var s=localStorage.getItem('theme');var m=window.matchMedia('(prefers-color-scheme: dark)');function a(v){d.classList.toggle('dark',v==='dark'||(v!=='light'&&m.matches))}a(s);m.addEventListener('change',function(){if(!localStorage.getItem('theme'))a()})}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <meta name="theme-color" content="#1990ff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0f172a" media="(prefers-color-scheme: dark)" />
      </head>
      <body className={inter.className}>
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
