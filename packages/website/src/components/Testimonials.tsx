'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRightOutlined, GithubOutlined } from '@ant-design/icons';

const testimonials = [
  {
    quote: 'Lowdefy has allowed me to quickly test new product ideas without having to write any code. I have even recreated older PHP tools which are now easier to maintain and update.',
    author: 'Jon Bennetts',
    role: '86-88 Solutions',
    avatar: '/images/profiles/jon_bennetts.webp',
  },
  {
    quote: 'As a project manager with limited coding knowledge, I\'ve been able to create various financial tracking and academic documentation apps effortlessly. The best part is the supportive community.',
    author: 'Mahdy Arief',
    role: 'Product Manager at Feedloop',
    avatar: '/images/profiles/mahdy_arief.jpeg',
  },
  {
    quote: 'Lowdefy is the ideal solution for anyone looking to build a web application. Its simplicity allowed me to create a functional CRUD app in just a few hours.',
    author: 'Ehan Groenewald',
    role: 'Data Scientist',
    avatar: '/images/profiles/ehan_groenewald.webp',
  },
];

export default function Testimonials() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900 bg-grid-dense">
      <div className="max-w-7xl mx-auto">
        {/* Testimonials */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4 font-mono">
            Loved by developers
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Teams around the world are building faster with Lowdefy.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.author}
              className="bg-white dark:bg-slate-800/50 p-6 border border-slate-200 dark:border-slate-700 bracket-corners"
            >
              <p className="text-slate-700 dark:text-slate-300 mb-6">&ldquo;{testimonial.quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                <Image
                  src={testimonial.avatar}
                  alt={testimonial.author}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <div className="font-medium text-slate-900 dark:text-white">{testimonial.author}</div>
                  <div className="text-sm text-slate-500">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="relative text-center py-16 px-8 bg-gradient-to-br from-primary-500/10 to-cyan-500/10 border border-slate-200 dark:border-slate-800 bracket-corners bracket-corners-cyan">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4 font-mono">
            Ready to build faster?
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
            Get started with Lowdefy in minutes. No signup required&mdash;just run one command.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="https://docs.lowdefy.com/tutorial-start"
              className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-white bg-primary-500 hover:bg-primary-600 transition-colors"
            >
              Get Started
              <ArrowRightOutlined style={{ fontSize: 14 }} />
            </Link>
            <Link
              href="https://github.com/lowdefy/lowdefy"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <GithubOutlined style={{ fontSize: 20 }} />
              Star on GitHub
            </Link>
          </div>

          <p className="mt-8 text-sm text-slate-500">
            Open source &bull; Apache 2.0
          </p>
        </div>
      </div>
    </section>
  );
}
