'use client';

import Link from 'next/link';
import { Header, Footer } from '@/components';
import {
  GithubOutlined,
  HeartOutlined,
  GlobalOutlined,
  CodeOutlined,
  RocketOutlined,
  LinkedinOutlined,
} from '@ant-design/icons';
import { useGitHubStats, formatStars } from '@/hooks/useGitHubStats';

const values = [
  {
    icon: CodeOutlined,
    title: 'Open Source First',
    description:
      'Lowdefy is Apache 2.0 licensed. We believe the best tools are built in the open, with transparency, community input, and shared ownership.',
  },
  {
    icon: HeartOutlined,
    title: 'Simplicity Over Complexity',
    description:
      'Config when you can, code when you need to. We aim for the minimum complexity needed to solve real problems.',
  },
  {
    icon: GlobalOutlined,
    title: 'Built for Everyone',
    description:
      'From solo developers to enterprise teams. Lowdefy bridges the gap between no-code simplicity and full-code flexibility.',
  },
  {
    icon: RocketOutlined,
    title: 'Ship Fast, Iterate Faster',
    description:
      'Internal tools shouldn\'t take months. Our config-first approach means you can go from idea to production in days.',
  },
];

const team = [
  {
    name: 'Albert van Wyk',
    image: 'https://avatars.githubusercontent.com/u/25527299?v=4',
    github: 'https://github.com/ACvWyk',
    linkedin: 'https://www.linkedin.com/in/albert-van-wyk-43667919/',
  },
  {
    name: 'Sam Tolmay',
    image: 'https://avatars.githubusercontent.com/u/23532753?v=4',
    github: 'https://github.com/SamTolmay',
    linkedin: 'https://www.linkedin.com/in/sam-tolmay-ba8566106/',
  },
  {
    name: 'Gerrie van Wyk',
    image: 'https://avatars.githubusercontent.com/u/7165064?v=4',
    github: 'https://github.com/Gervwyk',
    linkedin: 'https://www.linkedin.com/in/gervwyk/',
  },
  {
    name: 'Johann M\u00F6ller',
    image: 'https://avatars.githubusercontent.com/u/35911443?v=4',
    github: 'https://github.com/JohannMoller',
    linkedin: 'https://www.linkedin.com/in/johann-moller-1a084b88/',
  },
  {
    name: 'Stephanie Smit',
    image: 'https://avatars.githubusercontent.com/u/47713197?v=4',
    github: 'https://github.com/StephanieJKS',
    linkedin: 'https://www.linkedin.com/in/stephaniejksmit/',
  },
  {
    name: 'Ioannis Ktistakis',
    image: 'https://avatars.githubusercontent.com/u/47716028?v=4',
    github: 'https://github.com/Yianni99',
    linkedin: 'https://www.linkedin.com/in/ioannis-ktistakis-38a750183/',
  },
  {
    name: 'Salahuddin Saiet',
    image: 'https://avatars.githubusercontent.com/u/80051168?v=4',
    github: 'https://github.com/Saiby100',
    linkedin: 'https://www.linkedin.com/in/salahuddin-saiet-2a7190241/',
  },
  {
    name: 'Machiel van der Walt',
    image: 'https://avatars.githubusercontent.com/u/94852967?v=4',
    github: 'https://github.com/machielvdw',
    linkedin: 'https://www.linkedin.com/in/machiel-van-der-walt-550343242/',
  },
];

const milestones = [
  { year: '2020', event: 'Lowdefy founded, first commit' },
  { year: '2021', event: 'v1.0 released, open-source launch' },
  { year: '2023', event: 'v4.0,rebuilt on Next.js & Auth.js' },
  { year: '2024', event: '70+ blocks, 150+ operators, plugin ecosystem' },
  { year: '2025', event: 'AI-native config generation, growing community' },
];

export default function About() {
  const { stars } = useGitHubStats();

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white dark:bg-slate-950 pt-24 pb-0">
        {/* Hero */}
        <section className="px-4 sm:px-6 lg:px-8 pb-20">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-6 font-mono">
              Building the config webstack{' '}
              <span className="text-gradient">for everyone</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Lowdefy is an open-source framework that makes it possible to build web apps
              using simple YAML or JSON configuration. A higher-order language between code and
              natural language,designed for both humans and AI.
            </p>
          </div>
        </section>

        {/* Stats bar */}
        <section className="px-4 sm:px-6 lg:px-8 pb-20">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 bracket-corners">
              <Stat value={`${formatStars(stars)}+`} label="GitHub stars" />
              <Stat value="70+" label="UI components" />
              <Stat value="150+" label="Logic operators" />
              <Stat value="Apache 2.0" label="License" />
            </div>
          </div>
        </section>

        {/* Our Story */}
        <section className="px-4 sm:px-6 lg:px-8 pb-20">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-6 font-mono">
              Our Story
            </h2>
            <div className="space-y-4 text-slate-600 dark:text-slate-400 leading-relaxed">
              <p>
                Lowdefy started with a frustration: building internal tools and business apps took
                too long. Every project needed the same UI components, the same database connections,
                the same auth setup,but developers kept rebuilding from scratch.
              </p>
              <p>
                We asked: what if you could describe an entire web application in configuration?
                Not a drag-and-drop builder with limitations, but a real framework where config
                handles the 80% and code handles the rest.
              </p>
              <p>
                Built on Next.js and Auth.js, Lowdefy applications are real web apps,deployable
                anywhere, version-controlled in Git, and extensible through a plugin ecosystem.
                The config-first approach also makes Lowdefy uniquely suited for AI-assisted
                development, where LLMs can generate and review structured configuration naturally.
              </p>
              <p>
                Today, Lowdefy powers internal tools, admin panels, client portals, and dashboards
                for teams around the world. And because it&apos;s open source, the community helps
                shape every release.
              </p>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="px-4 sm:px-6 lg:px-8 pb-20 bg-slate-50 dark:bg-slate-900/50 py-20 bg-grid">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-10 font-mono text-center">
              What We Believe
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {values.map((value) => (
                <div
                  key={value.title}
                  className="p-6 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/30 transition-colors"
                >
                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                    <value.icon style={{ fontSize: 20, color: '#22d3ee' }} />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    {value.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-10 font-mono">
              Milestones
            </h2>
            <div className="relative">
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-200 dark:bg-slate-800" />
              <div className="space-y-8">
                {milestones.map((milestone) => (
                  <div key={milestone.year} className="flex items-start gap-6 relative">
                    <div className="w-[15px] h-[15px] rounded-full bg-cyan-500/20 border-2 border-cyan-500 flex-shrink-0 mt-1 z-10" />
                    <div>
                      <span className="text-sm font-mono font-bold text-cyan-500">{milestone.year}</span>
                      <p className="text-slate-600 dark:text-slate-400 mt-1">{milestone.event}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="px-4 sm:px-6 lg:px-8 py-20 bg-slate-50 dark:bg-slate-900/50 bg-grid-dense">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2 font-mono text-center">
              The Team
            </h2>
            <p className="text-slate-500 dark:text-slate-500 text-center mb-16 text-sm">
              Building the future of config-first development
            </p>
            <div className="flex flex-wrap justify-center gap-x-10 gap-y-12 sm:gap-x-14 md:gap-x-16">
              {team.map((member) => (
                <div key={member.name} className="group text-center w-[100px] sm:w-[110px]">
                  <div className="relative mx-auto mb-3">
                    <div className="w-[88px] h-[88px] sm:w-[100px] sm:h-[100px] rounded-full overflow-hidden ring-2 ring-slate-200 dark:ring-slate-800 group-hover:ring-cyan-500/50 transition-all duration-300 mx-auto">
                      <img
                        src={member.image}
                        alt={member.name}
                        width={100}
                        height={100}
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                      />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-tight mb-2">
                    {member.name}
                  </p>
                  <div className="flex items-center justify-center gap-2.5 opacity-40 group-hover:opacity-100 transition-opacity duration-300">
                    {member.github && (
                      <Link
                        href={member.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                      >
                        <GithubOutlined style={{ fontSize: 15 }} />
                      </Link>
                    )}
                    {member.linkedin && (
                      <Link
                        href={member.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                      >
                        <LinkedinOutlined style={{ fontSize: 15 }} />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Community + Resonancy */}
        <section className="px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
            {/* Community */}
            <div className="p-8 border border-slate-200 dark:border-slate-800 bracket-corners">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 font-mono">
                Join the Community
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 leading-relaxed">
                Lowdefy is shaped by its community. Whether you contribute code, report bugs, write plugins,
                or help others on Discord,you&apos;re part of what makes this project great.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="https://github.com/lowdefy/lowdefy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
                >
                  <GithubOutlined style={{ fontSize: 16 }} />
                  Star on GitHub
                </Link>
                <Link
                  href="https://discord.gg/WmcJgXt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Join Discord
                </Link>
              </div>
            </div>

            {/* Resonancy */}
            <div className="p-8 border border-slate-200 dark:border-slate-800 bracket-corners bracket-corners-cyan">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                  Need Help Building?
                </h3>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 leading-relaxed">
                <Link href="https://resonancy.io" target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:text-cyan-400 transition-colors font-medium">
                  Resonancy
                </Link>
                , founded by the Lowdefy team,builds purpose-built business applications on Lowdefy.
                10+ years of experience, 50+ internal tools deployed.
              </p>
              <ul className="space-y-2 mb-6">
                {['Custom internal tools & admin panels', 'Data integration & workflow automation', 'AI, data science & managed hosting'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm">
                    <span className="text-cyan-500">&bull;</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="https://resonancy.io"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-cyan-500 hover:text-cyan-400 transition-colors"
              >
                Talk to Resonancy →
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-mono">{value}</div>
      <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">{label}</div>
    </div>
  );
}
