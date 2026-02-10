'use client';

import Link from 'next/link';
import { ArrowRightOutlined, GithubOutlined } from '@ant-design/icons';

export default function CTA() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-500 to-primary-700">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Ready to build faster?
        </h2>
        <p className="text-lg text-primary-100 mb-8 max-w-2xl mx-auto">
          Get started with Lowdefy in minutes. No signup required, just run one command.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="https://docs.lowdefy.com/tutorial-start"
            className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-primary-600 bg-white rounded-lg hover:bg-primary-50 transition-colors"
          >
            Get Started
            <ArrowRightOutlined style={{ fontSize: 14 }} />
          </Link>
          <Link
            href="https://github.com/lowdefy/lowdefy"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-white border-2 border-white/30 rounded-lg hover:bg-white/10 transition-colors"
          >
            <GithubOutlined style={{ fontSize: 20 }} />
            Star on GitHub
          </Link>
        </div>

        <p className="mt-8 text-sm text-primary-200">
          Open source • Apache 2.0
        </p>
      </div>
    </section>
  );
}
