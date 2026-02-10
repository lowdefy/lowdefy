import Link from 'next/link';
import Image from 'next/image';

const footerLinks = {
  product: [
    { name: 'Documentation', href: 'https://docs.lowdefy.com' },
    { name: 'Getting Started', href: 'https://docs.lowdefy.com/tutorial-start' },
    { name: 'Blocks', href: 'https://docs.lowdefy.com/blocks' },
  ],
  resources: [
    { name: 'GitHub', href: 'https://github.com/lowdefy/lowdefy' },
    { name: 'Discord', href: 'https://discord.gg/lowdefy' },
    { name: 'Changelog', href: 'https://github.com/lowdefy/lowdefy/releases' },
  ],
  company: [
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <Image
                src="/images/logo.svg"
                alt="Lowdefy"
                width={120}
                height={30}
                className="h-7 w-auto block dark:hidden"
              />
              <Image
                src="/images/logo-white.svg"
                alt="Lowdefy"
                width={120}
                height={30}
                className="h-7 w-auto hidden dark:block"
              />
            </Link>
            <p className="text-sm text-slate-500 mb-4">
              The config-first web stack for AI and humans.
            </p>
            <div className="flex items-center gap-4">
              <Link
                href="https://github.com/lowdefy/lowdefy"
                className="text-slate-600 hover:text-slate-400 transition-colors"
              >
                <Image
                  src="/images/social/github.svg"
                  alt="GitHub"
                  width={20}
                  height={20}
                  className="w-5 h-5 dark:invert opacity-50 hover:opacity-80 transition-opacity"
                />
              </Link>
              <Link
                href="https://discord.gg/lowdefy"
                className="text-slate-600 hover:text-slate-400 transition-colors"
              >
                <Image
                  src="/images/social/discord.svg"
                  alt="Discord"
                  width={20}
                  height={20}
                  className="w-5 h-5 dark:invert opacity-50 hover:opacity-80 transition-opacity"
                />
              </Link>
              <Link
                href="https://x.com/lowaboratories"
                className="text-slate-600 hover:text-slate-400 transition-colors"
              >
                <Image
                  src="/images/social/x.svg"
                  alt="X"
                  width={20}
                  height={20}
                  className="w-5 h-5 dark:invert opacity-50 hover:opacity-80 transition-opacity"
                />
              </Link>
              <Link
                href="https://www.youtube.com/@lowdefy"
                className="text-slate-600 hover:text-slate-400 transition-colors"
              >
                <Image
                  src="/images/social/youtube.svg"
                  alt="YouTube"
                  width={20}
                  height={20}
                  className="w-5 h-5 dark:invert opacity-50 hover:opacity-80 transition-opacity"
                />
              </Link>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-4">Product</h3>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-4">Resources</h3>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-4">Company</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800/50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500 dark:text-slate-600">
              &copy; {new Date().getFullYear()} Lowdefy. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-600">
              <span>Open Source</span>
              <span className="text-slate-300 dark:text-slate-700">&bull;</span>
              <span>Apache 2.0 License</span>
              <span className="text-slate-300 dark:text-slate-700">&bull;</span>
              <Link
                href="https://resonancy.io"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-slate-700 dark:hover:text-slate-400 transition-colors"
              >
                Powered by Resonancy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
