'use client';

import Link from 'next/link';
import Markdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { GithubOutlined, LinkedinOutlined } from '@ant-design/icons';
import authors from '@/lib/authors';
import articles from '@/content/articles';

function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

const markdownComponents = {
  a: ({ children, href, ...props }) => {
    const isInternal = href?.startsWith('/');
    return (
      <a
        href={href}
        {...(!isInternal && { target: '_blank', rel: 'noopener noreferrer' })}
        {...props}
      >
        {children}
      </a>
    );
  },
  code: ({ children, className, ...props }) => {
    const match = /language-(\w+)/.exec(className || '');
    if (match) {
      return (
        <SyntaxHighlighter
          style={oneDark}
          language={match[1]}
          PreTag="div"
          customStyle={{
            margin: 0,
            borderRadius: 0,
            background: '#1e293b',
          }}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      );
    }
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
};

export default function ArticlePage({ article }) {
  const author = authors[article.authorId];

  const relatedArticles = articles.filter((a) => a.id !== article.id).slice(0, 3);

  return (
    <article className="min-h-screen bg-white dark:bg-slate-950 pt-24 pb-0">
      {/* Header */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <Link
          href="/articles"
          className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors mb-8"
        >
          &larr; All Articles
        </Link>

        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white font-mono mb-4 leading-tight">
            {article.title}
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
            {article.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-6">
          {author && (
            <>
              <div className="flex items-center gap-2">
                <img
                  src={author.image}
                  alt={author.name}
                  width={28}
                  height={28}
                  className="w-7 h-7 rounded-full ring-1 ring-slate-200 dark:ring-slate-700"
                />
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {author.name}
                </span>
              </div>
              <span className="text-slate-300 dark:text-slate-700">&bull;</span>
            </>
          )}
          <time dateTime={article.publishedAt.toISOString()}>
            {formatDate(article.publishedAt)}
          </time>
          {article.readTimeMinutes && (
            <>
              <span className="text-slate-300 dark:text-slate-700">&bull;</span>
              <span>{article.readTimeMinutes} min read</span>
            </>
          )}
        </div>

        {article.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-t border-slate-200 dark:border-slate-800" />
      </div>

      {/* Article Body */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-3xl mx-auto article-content">
          <Markdown components={markdownComponents}>{article.markdown}</Markdown>
        </div>
      </div>

      {/* Author Bio */}
      {author && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="max-w-3xl mx-auto">
            <div className="p-6 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 bracket-corners">
              <div className="flex items-start gap-4">
                <img
                  src={author.image}
                  alt={author.name}
                  width={56}
                  height={56}
                  className="w-14 h-14 rounded-full ring-2 ring-slate-200 dark:ring-slate-700 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {author.name}
                    </span>
                    <div className="flex items-center gap-2">
                      {author.github && (
                        <Link
                          href={author.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        >
                          <GithubOutlined style={{ fontSize: 14 }} />
                        </Link>
                      )}
                      {author.linkedin && (
                        <Link
                          href={author.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        >
                          <LinkedinOutlined style={{ fontSize: 14 }} />
                        </Link>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{author.title}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {author.bio}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-900/50 bg-grid py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-mono mb-8">
              More Articles
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedArticles.map((related) => (
                <Link
                  key={related.id}
                  href={`/articles/${related.id}`}
                  className="group p-6 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-primary-500/30 dark:hover:border-primary-500/30 transition-colors"
                >
                  <span className="text-xs font-medium text-primary-500 mb-2 block">
                    {related.tags[0]}
                  </span>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-primary-500 transition-colors">
                    {related.title}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                    {related.subtitle}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
