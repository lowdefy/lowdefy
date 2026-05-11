import { Header, Footer } from '@/components';
import ArticlePage from '@/components/ArticlePage';
import articles from '@/content/articles';

const content = articles.find((a) => a.id === 'lowdefy-5-whats-new');
const relatedArticles = articles.filter((a) => a.id !== content.id).slice(0, 3);

export default function Article() {
  return (
    <>
      <Header />
      <main>
        <ArticlePage article={content} relatedArticles={relatedArticles} />
      </main>
      <Footer />
    </>
  );
}
