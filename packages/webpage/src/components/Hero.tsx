'use client';

import { useState } from 'react';
import { CheckOutlined, CopyOutlined, StarFilled, ArrowRightOutlined } from '@ant-design/icons';
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
    <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Content */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-600 text-sm font-medium mb-6">
              <StarFilled style={{ fontSize: 14 }} />
              <span>{formatStars(stars)} stars on GitHub</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              The config-first web stack for{' '}
              <span className="text-gradient">AI and humans</span>
            </h1>

            <p className="text-lg text-slate-600 mb-8 max-w-xl">
              Build full-stack web apps with YAML config. AI outputs production-ready code.
              Easy to review, secure by design, connects to any data source.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Link
                href="https://docs.lowdefy.com/getting-started"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors"
              >
                Get Started
                <ArrowRightOutlined style={{ fontSize: 14 }} />
              </Link>
              <Link
                href="https://docs.lowdefy.com"
                className="inline-flex items-center justify-center px-6 py-3 text-base font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Documentation
              </Link>
            </div>

            {/* Command */}
            <div className="flex items-center gap-2 p-3 bg-slate-900 rounded-lg max-w-md">
              <code className="flex-1 text-sm text-slate-300 font-mono">{command}</code>
              <button
                onClick={copyToClipboard}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                {copied ? <CheckOutlined style={{ fontSize: 14, color: '#4ade80' }} /> : <CopyOutlined style={{ fontSize: 14 }} />}
              </button>
            </div>
          </div>

          {/* Right - Code Preview */}
          <div className="bg-slate-900 rounded-xl overflow-hidden shadow-2xl">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="ml-4 text-slate-400 text-sm font-mono">lowdefy.yaml</span>
            </div>
            <pre className="p-6 text-sm overflow-x-auto">
              <code>
                <span className="text-slate-500"># Copy to lowdefy.yaml, run: npx lowdefy@latest dev</span>
                {'\n'}
                <span className="text-primary-400">lowdefy:</span>
                <span className="text-yellow-300"> &apos;{latestVersion}&apos;</span>
                {'\n\n'}
                <span className="text-primary-400">pages:</span>
                {'\n'}
                <span className="text-slate-400">  - </span>
                <span className="text-cyan-400">id:</span>
                <span className="text-green-400"> welcome</span>
                {'\n'}
                <span className="text-slate-400">    </span>
                <span className="text-cyan-400">type:</span>
                <span className="text-green-400"> PageHeaderMenu</span>
                {'\n'}
                <span className="text-slate-400">    </span>
                <span className="text-cyan-400">blocks:</span>
                {'\n'}
                <span className="text-slate-400">      - </span>
                <span className="text-cyan-400">id:</span>
                <span className="text-green-400"> card</span>
                {'\n'}
                <span className="text-slate-400">        </span>
                <span className="text-cyan-400">type:</span>
                <span className="text-green-400"> Card</span>
                {'\n'}
                <span className="text-slate-400">        </span>
                <span className="text-cyan-400">blocks:</span>
                {'\n'}
                <span className="text-slate-400">          - </span>
                <span className="text-cyan-400">id:</span>
                <span className="text-green-400"> name</span>
                {'\n'}
                <span className="text-slate-400">            </span>
                <span className="text-cyan-400">type:</span>
                <span className="text-green-400"> TextInput</span>
                {'\n'}
                <span className="text-slate-400">            </span>
                <span className="text-cyan-400">properties:</span>
                {'\n'}
                <span className="text-slate-400">              </span>
                <span className="text-cyan-400">label:</span>
                <span className="text-green-400"> What&apos;s your name?</span>
                {'\n'}
                <span className="text-slate-400">          - </span>
                <span className="text-cyan-400">id:</span>
                <span className="text-green-400"> greeting</span>
                {'\n'}
                <span className="text-slate-400">            </span>
                <span className="text-cyan-400">type:</span>
                <span className="text-green-400"> Alert</span>
                {'\n'}
                <span className="text-slate-400">            </span>
                <span className="text-cyan-400">properties:</span>
                {'\n'}
                <span className="text-slate-400">              </span>
                <span className="text-cyan-400">type:</span>
                <span className="text-green-400"> success</span>
                {'\n'}
                <span className="text-slate-400">              </span>
                <span className="text-cyan-400">message:</span>
                {'\n'}
                <span className="text-slate-400">                </span>
                <span className="text-cyan-400">_if:</span>
                {'\n'}
                <span className="text-slate-400">                  </span>
                <span className="text-cyan-400">test:</span>
                {'\n'}
                <span className="text-slate-400">                    </span>
                <span className="text-cyan-400">_state:</span>
                <span className="text-green-400"> name</span>
                {'\n'}
                <span className="text-slate-400">                  </span>
                <span className="text-cyan-400">then:</span>
                {'\n'}
                <span className="text-slate-400">                    </span>
                <span className="text-cyan-400">_string.concat:</span>
                {'\n'}
                <span className="text-slate-400">                      </span>
                <span className="text-green-400">- Hello, </span>
                {'\n'}
                <span className="text-slate-400">                      - </span>
                <span className="text-cyan-400">_state:</span>
                <span className="text-green-400"> name</span>
                {'\n'}
                <span className="text-slate-400">                      </span>
                <span className="text-green-400">- &quot;!&quot;</span>
                {'\n'}
                <span className="text-slate-400">                  </span>
                <span className="text-cyan-400">else:</span>
                <span className="text-green-400"> Type your name above!</span>
              </code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
