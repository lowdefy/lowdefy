'use client';

import Link from 'next/link';
import { Header, Footer } from '@/components';
import articles from '@/content/articles';

function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function Articles() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white dark:bg-slate-950 pt-24 pb-0">
        {/* Hero */}
        <section className="px-4 sm:px-6 lg:px-8 pb-12">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white font-mono mb-4">
              Articles
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
              Insights and practical guides from the Lowdefy team on config-first development, AI,
              and building web applications.
            </p>
          </div>
        </section>

        {/* Divider */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-t border-slate-200 dark:border-slate-800" />
        </div>

        {/* Article Grid */}
        <section className="px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-5xl mx-auto">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <Link key={article.id} href={`/articles/${article.id}`} className="group block">
                  <div className="h-full p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-primary-500/30 dark:hover:border-primary-500/30 transition-colors bracket-corners">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-medium text-primary-500">
                        {article.tags[0]}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-600">&bull;</span>
                      <time
                        dateTime={article.publishedAt.toISOString()}
                        className="text-xs text-slate-400 dark:text-slate-500"
                      >
                        {formatDate(article.publishedAt)}
                      </time>
                    </div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 font-mono group-hover:text-primary-500 transition-colors leading-snug">
                      {article.title}
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3 mb-4">
                      {article.subtitle}
                    </p>
                    <span className="text-sm font-medium text-primary-500 group-hover:text-primary-400 transition-colors">
                      Read article &rarr;
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
