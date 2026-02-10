'use client';

import { useState } from 'react';
import { CheckOutlined, CopyOutlined, ArrowRightOutlined } from '@ant-design/icons';

const SparklesIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    <path d="M20 3v4M22 5h-4M4 17v2M5 18H3" />
  </svg>
);
import Link from 'next/link';
import { useGitHubStats, formatStars } from '@/hooks/useGitHubStats';

export default function Hero() {
  const [copied, setCopied] = useState(false);
  const { stars, latestVersion } = useGitHubStats();

  const command = 'npx lowdefy@latest dev';

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-950 bg-grid overflow-hidden">
      {/* Subtle radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Content */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm font-medium mb-6">
              <SparklesIcon />
              <span>Build future-proof AI apps</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-6 leading-tight font-mono">
              The config-first web stack for
              <br />
              <span className="text-gradient">AI and humans</span>
            </h1>

            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-xl">
              AI generates config that's easy to generate, review, and maintain.
              A higher-order language between code and natural language.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Link
                href="https://docs.lowdefy.com/tutorial-start"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold text-white bg-primary-500 hover:bg-primary-600 transition-colors"
              >
                Get Started
                <ArrowRightOutlined style={{ fontSize: 14 }} />
              </Link>
              <Link
                href="https://docs.lowdefy.com"
                className="inline-flex items-center justify-center px-6 py-3 text-base font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Documentation
              </Link>
            </div>

            {/* Command */}
            <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-md bracket-corners">
              <span className="text-slate-400 dark:text-slate-600 font-mono text-sm">$</span>
              <code className="flex-1 text-sm text-slate-700 dark:text-slate-300 font-mono">{command}</code>
              <button
                onClick={copyToClipboard}
                className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                {copied ? <CheckOutlined style={{ fontSize: 14, color: '#4ade80' }} /> : <CopyOutlined style={{ fontSize: 14 }} />}
              </button>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-6 mt-8 pt-8 border-t border-slate-200 dark:border-slate-800/50">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="text-primary-400 font-mono font-semibold">{formatStars(stars)}+</span>
                <span>stars</span>
              </div>
              <div className="w-px h-4 bg-slate-200 dark:bg-slate-800" />
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="text-primary-400 font-mono font-semibold">4</span>
                <span>years open source</span>
              </div>
              <div className="w-px h-4 bg-slate-200 dark:bg-slate-800" />
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="text-primary-400 font-mono font-semibold">3K+</span>
                <span>weekly npm downloads</span>
              </div>
            </div>
          </div>

          {/* Right - Code Preview */}
          <div className="bg-slate-50 dark:bg-slate-900 overflow-hidden border border-slate-200 dark:border-slate-800 glow-blue bracket-corners">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
              <div className="w-2.5 h-2.5 bg-red-500/80"></div>
              <div className="w-2.5 h-2.5 bg-yellow-500/80"></div>
              <div className="w-2.5 h-2.5 bg-green-500/80"></div>
              <span className="ml-4 text-slate-400 dark:text-slate-500 text-sm font-mono">lowdefy.yaml</span>
            </div>
            <pre className="p-6 text-xs overflow-x-auto scrollbar-dark">
              <code>
                <span className="text-sky-700 dark:text-primary-400">lowdefy:</span>
                <span className="text-amber-700 dark:text-yellow-300"> &apos;{latestVersion}&apos;</span>
                {'\n'}
                <span className="text-sky-700 dark:text-primary-400">pages:</span>
                {'\n'}
                <span className="text-slate-600">  - </span>
                <span className="text-cyan-700 dark:text-cyan-400">id:</span>
                <span className="text-green-700 dark:text-green-400"> welcome</span>
                {'\n'}
                <span className="text-slate-600">    </span>
                <span className="text-cyan-700 dark:text-cyan-400">type:</span>
                <span className="text-green-700 dark:text-green-400"> PageHeaderMenu</span>
                {'\n'}
                <span className="text-slate-600">    </span>
                <span className="text-cyan-700 dark:text-cyan-400">blocks:</span>
                {'\n'}
                <span className="text-slate-600">      - </span>
                <span className="text-cyan-700 dark:text-cyan-400">id:</span>
                <span className="text-green-700 dark:text-green-400"> card</span>
                {'\n'}
                <span className="text-slate-600">        </span>
                <span className="text-cyan-700 dark:text-cyan-400">type:</span>
                <span className="text-green-700 dark:text-green-400"> Card</span>
                {'\n'}
                <span className="text-slate-600">        </span>
                <span className="text-cyan-700 dark:text-cyan-400">blocks:</span>
                {'\n'}
                <span className="text-slate-600">          - </span>
                <span className="text-cyan-700 dark:text-cyan-400">id:</span>
                <span className="text-green-700 dark:text-green-400"> name</span>
                {'\n'}
                <span className="text-slate-600">            </span>
                <span className="text-cyan-700 dark:text-cyan-400">type:</span>
                <span className="text-green-700 dark:text-green-400"> TextInput</span>
                {'\n'}
                <span className="text-slate-600">            </span>
                <span className="text-cyan-700 dark:text-cyan-400">properties:</span>
                {'\n'}
                <span className="text-slate-600">              </span>
                <span className="text-cyan-700 dark:text-cyan-400">label:</span>
                <span className="text-green-700 dark:text-green-400"> What&apos;s your name?</span>
                {'\n'}
                <span className="text-slate-600">          - </span>
                <span className="text-cyan-700 dark:text-cyan-400">id:</span>
                <span className="text-green-700 dark:text-green-400"> greeting</span>
                {'\n'}
                <span className="text-slate-600">            </span>
                <span className="text-cyan-700 dark:text-cyan-400">type:</span>
                <span className="text-green-700 dark:text-green-400"> Alert</span>
                {'\n'}
                <span className="text-slate-600">            </span>
                <span className="text-cyan-700 dark:text-cyan-400">properties:</span>
                {'\n'}
                <span className="text-slate-600">              </span>
                <span className="text-cyan-700 dark:text-cyan-400">type:</span>
                <span className="text-green-700 dark:text-green-400"> success</span>
                {'\n'}
                <span className="text-slate-600">              </span>
                <span className="text-cyan-700 dark:text-cyan-400">message:</span>
                {'\n'}
                <span className="text-slate-600">                </span>
                <span className="text-cyan-700 dark:text-cyan-400">_js:</span>
                <span className="text-green-700 dark:text-green-400"> |</span>
                {'\n'}
                <span className="text-slate-600">{'                  '}</span>
                <span className="text-green-700 dark:text-green-400">{'const n = state(\'name\');'}</span>
                {'\n'}
                <span className="text-slate-600">{'                  '}</span>
                <span className="text-green-700 dark:text-green-400">{'return n ? `Hello, ${n}!` : \'Type your name\';'}</span>
                {'\n'}
                <span className="text-slate-600">      - </span>
                <span className="text-cyan-700 dark:text-cyan-400">id:</span>
                <span className="text-green-700 dark:text-green-400"> submit</span>
                {'\n'}
                <span className="text-slate-600">        </span>
                <span className="text-cyan-700 dark:text-cyan-400">type:</span>
                <span className="text-green-700 dark:text-green-400"> Button</span>
                {'\n'}
                <span className="text-slate-600">        </span>
                <span className="text-cyan-700 dark:text-cyan-400">properties:</span>
                {'\n'}
                <span className="text-slate-600">          </span>
                <span className="text-cyan-700 dark:text-cyan-400">title:</span>
                <span className="text-green-700 dark:text-green-400"> Save</span>
                {'\n'}
                <span className="text-slate-600">        </span>
                <span className="text-cyan-700 dark:text-cyan-400">events:</span>
                {'\n'}
                <span className="text-slate-600">          </span>
                <span className="text-cyan-700 dark:text-cyan-400">onClick:</span>
                {'\n'}
                <span className="text-slate-600">            - </span>
                <span className="text-cyan-700 dark:text-cyan-400">id:</span>
                <span className="text-green-700 dark:text-green-400"> validate</span>
                {'\n'}
                <span className="text-slate-600">              </span>
                <span className="text-cyan-700 dark:text-cyan-400">type:</span>
                <span className="text-green-700 dark:text-green-400"> Validate</span>
              </code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
