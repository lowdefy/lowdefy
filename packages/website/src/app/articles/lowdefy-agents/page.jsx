'use client';

import { Header, Footer } from '@/components';
import ArticlePage from '@/components/ArticlePage';
import articles from '@/content/articles';

const content = articles.find((a) => a.id === 'lowdefy-agents');

export default function Article() {
  return (
    <>
      <Header />
      <main>
        <ArticlePage article={content} />
      </main>
      <Footer />
    </>
  );
}
