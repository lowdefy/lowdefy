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
    description: 'Custom apps built fast with Lowdefy—not months.',
  },
  {
    icon: ApiOutlined,
    title: 'Connect Everything',
    description: 'Real-time data across your business for reliable insights.',
  },
];

export default function Services() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Content */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-slate-400 text-sm font-medium">Services by</span>
              <Image
                src="/images/resonancy-wordmark.svg"
                alt="Resonancy"
                width={140}
                height={35}
                className="h-7 w-auto invert"
              />
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Too many apps?{' '}
              <span className="text-gradient">We consolidate them.</span>
            </h2>

            <p className="text-lg text-slate-400 mb-6">
              Most teams run 10+ business apps that don&apos;t talk to each other. Resonancy builds
              one purpose-built solution that replaces them all—built on Lowdefy, delivered in weeks.
            </p>

            {/* Pain points */}
            <div className="mb-8 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-red-400 text-sm font-medium mb-3">Sound familiar?</p>
              <ul className="space-y-2">
                {painPoints.map((point) => (
                  <li key={point} className="flex items-start gap-2 text-slate-400 text-sm">
                    <span className="text-red-400 mt-0.5">•</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {solutions.map((solution) => (
                <div
                  key={solution.title}
                  className="flex items-start gap-3 p-4 rounded-lg bg-slate-800/50 border border-slate-700"
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
                    <solution.icon style={{ fontSize: 20, color: '#22d3ee' }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm">{solution.title}</h3>
                    <p className="text-slate-400 text-xs mt-1">{solution.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="https://resonancy.io"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-slate-900 bg-white rounded-lg hover:bg-slate-100 transition-colors"
            >
              Talk to Resonancy
              <ArrowRightOutlined style={{ fontSize: 14 }} />
            </Link>
          </div>

          {/* Right - Stats/Social proof */}
          <div className="lg:pl-8">
            <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-2xl p-8 border border-slate-700">
              <div className="flex items-center gap-6 mb-6 pb-6 border-b border-slate-700">
                <div className="text-center flex-1">
                  <div className="text-4xl font-bold text-white mb-1">10+</div>
                  <div className="text-sm text-slate-400">Years building<br />business apps</div>
                </div>
                <div className="w-px h-16 bg-slate-700"></div>
                <div className="text-center flex-1">
                  <div className="text-4xl font-bold text-white mb-1">50+</div>
                  <div className="text-sm text-slate-400">Internal tools<br />deployed</div>
                </div>
              </div>

              <div className="mb-6 p-4 rounded-lg bg-slate-700/30">
                <p className="text-slate-300 text-sm mb-2">Built on open source</p>
                <p className="text-slate-400 text-xs">
                  We build on Lowdefy—our own open source stack. Quick starter modules get you live fast,
                  then we customize for your exact workflows.
                </p>
              </div>

              {/* What you get */}
              <div className="mb-6">
                <p className="text-slate-300 text-sm font-medium mb-4">What we deliver:</p>
                <ul className="space-y-2">
                  {[
                    'One unified app replacing your stack',
                    'Full ownership—your code, your servers',
                    'AI, data science & integrations included',
                    'Ongoing support & managed hosting',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-slate-400 text-sm">
                      <CheckCircleOutlined style={{ fontSize: 16, color: '#4ade80' }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-slate-700 pt-6">
                <p className="text-slate-300 text-sm italic mb-4">
                  &ldquo;When people, processes, and technology resonate together, magic happens.&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-cyan-400 flex items-center justify-center text-white font-semibold">
                    R
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm">Resonancy</div>
                    <div className="text-slate-400 text-xs">Lowdefy&apos;s Services Partner</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
