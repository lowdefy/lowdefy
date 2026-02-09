'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { MenuOutlined, CloseOutlined, GithubOutlined } from '@ant-design/icons';
import { useGitHubStats, formatStars } from '@/hooks/useGitHubStats';

const navigation = [
  { name: 'Docs', href: 'https://docs.lowdefy.com' },
  { name: 'Examples', href: 'https://docs.lowdefy.com/examples' },
  { name: 'Blog', href: '/blog' },
  { name: 'Discord', href: 'https://discord.gg/lowdefy' },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { stars } = useGitHubStats();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/images/logo.svg" alt="Lowdefy" width={120} height={30} className="h-7 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link
              href="https://github.com/lowdefy/lowdefy"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              <GithubOutlined style={{ fontSize: 16 }} />
              <span>{formatStars(stars)}</span>
            </Link>
            <Link
              href="https://docs.lowdefy.com/getting-started"
              className="px-4 py-2 text-sm font-semibold text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <CloseOutlined style={{ fontSize: 24 }} /> : <MenuOutlined style={{ fontSize: 24 }} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200">
            <div className="flex flex-col gap-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-sm font-medium text-slate-600 hover:text-slate-900"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <Link
                href="https://docs.lowdefy.com/getting-started"
                className="inline-flex justify-center px-4 py-2 text-sm font-semibold text-white bg-primary-500 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
