'use client';

import Link from 'next/link';
import { Header, Footer } from '@/components';
import { GithubOutlined, MessageOutlined, MailOutlined, LinkedinOutlined } from '@ant-design/icons';

const channels = [
  {
    icon: MessageOutlined,
    title: 'Discord Community',
    description:
      'Join our Discord for questions, discussions, and community support. The fastest way to get help.',
    action: 'Join Discord',
    href: 'https://discord.gg/WmcJgXt',
    accent: 'cyan',
  },
  {
    icon: GithubOutlined,
    title: 'GitHub Discussions',
    description: 'Ask questions, share ideas, and participate in the Lowdefy community forum.',
    action: 'Open Discussions',
    href: 'https://github.com/lowdefy/lowdefy/discussions',
    accent: 'primary',
  },
  {
    icon: GithubOutlined,
    title: 'Bug Reports & Features',
    description: 'Found a bug or have a feature request? Open an issue on GitHub.',
    action: 'Open an Issue',
    href: 'https://github.com/lowdefy/lowdefy/issues',
    accent: 'primary',
  },
  {
    icon: MailOutlined,
    title: 'Email Us',
    description: 'For general inquiries, partnerships, or anything else.',
    action: 'hello@lowdefy.com',
    href: 'mailto:hello@lowdefy.com',
    accent: 'cyan',
  },
];

export default function Contact() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white dark:bg-slate-950 pt-24 pb-0">
        {/* Hero */}
        <section className="px-4 sm:px-6 lg:px-8 pb-16">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-4 font-mono">
              Get in Touch
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Whether you need help, want to contribute, or have a business inquiry, we&apos;d love
              to hear from you.
            </p>
          </div>
        </section>

        {/* Channels */}
        <section className="px-4 sm:px-6 lg:px-8 pb-20">
          <div className="max-w-4xl mx-auto grid sm:grid-cols-2 gap-6">
            {channels.map((channel) => (
              <Link
                key={channel.title}
                href={channel.href}
                target={channel.href.startsWith('mailto:') ? undefined : '_blank'}
                rel={channel.href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                className={`group p-6 border border-slate-200 dark:border-slate-800 hover:border-${
                  channel.accent === 'cyan' ? 'cyan' : 'primary'
                }-500/40 bg-white dark:bg-slate-900/50 transition-all hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50`}
              >
                <div
                  className={`w-10 h-10 bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-${
                    channel.accent === 'cyan' ? 'cyan' : 'primary'
                  }-500/10 transition-colors`}
                >
                  <channel.icon
                    style={{
                      fontSize: 20,
                      color: channel.accent === 'cyan' ? '#22d3ee' : '#1990ff',
                    }}
                  />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  {channel.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                  {channel.description}
                </p>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-primary-500 group-hover:text-primary-400 transition-colors">
                  {channel.action} →
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Professional Services */}
        <section className="px-4 sm:px-6 lg:px-8 py-20 bg-slate-50 dark:bg-slate-900/50 bg-grid">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-4 font-mono">
              Need a Custom Solution?
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-xl mx-auto leading-relaxed">
              <Link
                href="https://resonancy.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-500 hover:text-cyan-400 transition-colors font-medium"
              >
                Resonancy
              </Link>
              , founded by the Lowdefy team, builds purpose-built business applications. From
              internal tools to full platforms, delivered in weeks not months.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="https://resonancy.io"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white dark:text-slate-900 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
              >
                Talk to Resonancy
              </Link>
              <Link
                href="https://www.linkedin.com/in/gervwyk/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <LinkedinOutlined style={{ fontSize: 16 }} />
                Connect with Gerrie
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
