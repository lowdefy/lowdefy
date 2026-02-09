'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRightOutlined, AppstoreOutlined, ApiOutlined, PartitionOutlined, ThunderboltOutlined, CheckCircleOutlined } from '@ant-design/icons';

const painPoints = [
  'Teams losing time to clunky or disconnected systems',
  'Key workflow dependencies limit business growth',
  'Lost revenue because of mismanaged data',
  'Falling behind competitors with more efficient operations',
];

const solutions = [
  {
    icon: AppstoreOutlined,
    title: 'Consolidate Your Stack',
    description: 'Replace 10+ disconnected apps with one purpose-built solution.',
  },
  {
    icon: PartitionOutlined,
    title: 'Streamline Workflows',
    description: 'Seamlessly integrated systems that free up your team.',
  },
  {
    icon: ThunderboltOutlined,
    title: 'Ship in Weeks',
    description: 'Custom apps built fast with Lowdefy, not months.',
  },
  {
    icon: ApiOutlined,
    title: 'Connect Everything',
    description: 'Real-time data across your business for reliable insights.',
  },
];

export default function Services() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950 bg-grid">
      <div className="max-w-7xl mx-auto p-8 md:p-12 border border-slate-200 dark:border-slate-700/50 bg-white/50 dark:bg-slate-900/30 bracket-corners bracket-corners-cyan">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left - Content */}
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Too many apps?
            </h2>

            <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
              Most teams run 10+ business apps that don&apos;t talk to each other. Resonancy builds
              one purpose-built solution that replaces them all, built on Lowdefy, delivered in weeks.
            </p>

            {/* Pain points */}
            <div className="mb-8 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 bracket-corners bracket-corners-red">
              <p className="text-red-600 dark:text-red-400 text-sm font-medium mb-3">Sound familiar?</p>
              <ul className="space-y-2">
                {painPoints.map((point) => (
                  <li key={point} className="flex items-start gap-2 text-slate-600 dark:text-slate-400 text-sm">
                    <span className="text-red-500 dark:text-red-400 mt-0.5">•</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {solutions.map((solution) => (
                <div
                  key={solution.title}
                  className="flex items-start gap-3 p-4 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800"
                >
                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <solution.icon style={{ fontSize: 20, color: '#22d3ee' }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{solution.title}</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-xs mt-1">{solution.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="https://resonancy.io"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white dark:text-slate-900 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
            >
              Talk to Resonancy
              <ArrowRightOutlined style={{ fontSize: 14 }} />
            </Link>
          </div>

          {/* Right - Stats/Social proof */}
          <div className="lg:pl-8">
            <div className="flex flex-col items-end mb-4">
              <span className="text-slate-500 text-sm font-medium mb-1">Services by</span>
              <Image
                src="/images/resonancy-wordmark.svg"
                alt="Resonancy"
                width={140}
                height={35}
                className="h-7 w-auto dark:invert"
              />
            </div>
            <div className="bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-900/50 p-8 border border-slate-200 dark:border-slate-800 bracket-corners bracket-corners-cyan">
              <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
                <div className="text-center">
                  <div className="text-4xl font-bold text-slate-900 dark:text-white mb-1">10+</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Years building business apps</div>
                </div>
                <div className="text-center border-l border-slate-200 dark:border-slate-700">
                  <div className="text-4xl font-bold text-slate-900 dark:text-white mb-1">50+</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Internal tools deployed</div>
                </div>
              </div>

              <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/50">
                <p className="text-slate-700 dark:text-slate-300 text-sm mb-2">Built on open source</p>
                <p className="text-slate-500 dark:text-slate-400 text-xs">
                  We build on Lowdefy, our own open source stack. Quick starter modules get you live fast,
                  then we customize for your exact workflows.
                </p>
              </div>

              {/* What you get */}
              <div className="mb-6">
                <p className="text-slate-700 dark:text-slate-300 text-sm font-medium mb-4">What we deliver:</p>
                <ul className="space-y-2">
                  {[
                    'One unified app replacing your SaaS dependency',
                    'A custom solution tailored to your business',
                    'AI, data science & integrations included',
                    'Ongoing support & managed hosting',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm">
                      <CheckCircleOutlined style={{ fontSize: 16, color: '#4ade80' }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <p className="text-slate-500 dark:text-slate-300 text-sm italic mb-4">
                  &ldquo;When people, processes, and technology resonate together, magic happens.&rdquo;
                </p>
                <Link
                  href="https://www.linkedin.com/in/gervwyk/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 group"
                >
                  <Image
                    src="/images/profiles/gerrie_van_wyk.webp"
                    alt="Gerrie van Wyk"
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <div className="text-slate-900 dark:text-white font-medium text-sm group-hover:text-primary-400 transition-colors">Gerrie van Wyk</div>
                    <div className="text-slate-500 dark:text-slate-400 text-xs">Co-founder, Resonancy &amp; Lowdefy</div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
