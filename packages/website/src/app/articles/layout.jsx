export const metadata = {
  title: 'Articles | Lowdefy',
  description:
    'Insights and practical guides from the Lowdefy team on config-first development, AI, and building web applications.',
  openGraph: {
    title: 'Articles | Lowdefy',
    description:
      'Insights and practical guides from the Lowdefy team on config-first development, AI, and building web applications.',
    type: 'website',
    url: 'https://lowdefy.com/articles',
    siteName: 'Lowdefy',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Articles | Lowdefy',
    description:
      'Insights and practical guides from the Lowdefy team on config-first development, AI, and building web applications.',
    site: '@lowdefy',
    creator: '@lowdefy',
  },
};

export default function ArticlesLayout({ children }) {
  return children;
}
