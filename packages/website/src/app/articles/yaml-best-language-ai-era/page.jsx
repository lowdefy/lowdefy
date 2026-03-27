'use client';

import { Header, Footer } from '@/components';
import ArticlePage from '@/components/ArticlePage';
import articles from '@/content/articles';

const content = articles.find((a) => a.id === 'yaml-best-language-ai-era');

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
