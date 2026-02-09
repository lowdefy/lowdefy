'use client';

import { WarningOutlined, ClockCircleOutlined, SafetyOutlined, AppstoreOutlined } from '@ant-design/icons';

const problems = [
  {
    icon: ClockCircleOutlined,
    title: 'Slow development cycles',
    description: 'Traditional full-stack development takes months. Business requirements change faster than code ships.',
  },
  {
    icon: WarningOutlined,
    title: 'AI-generated code is hard to review',
    description: 'LLMs produce thousands of lines of code. Who reviews it? Who maintains it?',
  },
  {
    icon: SafetyOutlined,
    title: 'Security is an afterthought',
    description: 'Generated code often has vulnerabilities. SQL injection, XSS, broken auth—waiting to be exploited.',
  },
  {
    icon: AppstoreOutlined,
    title: 'Integration complexity',
    description: 'Connecting databases, APIs, and auth systems requires deep expertise and endless boilerplate.',
  },
];

export default function Problem() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Building web apps is broken
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Whether you&apos;re coding by hand or prompting AI, the same problems persist.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {problems.map((problem) => (
            <div
              key={problem.title}
              className="p-6 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors"
            >
              <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center mb-4">
                <problem.icon style={{ fontSize: 24, color: '#ef4444' }} />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">{problem.title}</h3>
              <p className="text-sm text-slate-600">{problem.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
