'use client';

import { CodeOutlined, BranchesOutlined, BugOutlined, WarningOutlined } from '@ant-design/icons';

const problems = [
  {
    icon: CodeOutlined,
    title: "AI generates 5000 lines of code that you can't review",
    description:
      'Every prompt produces a wall of code. No one has time to audit it all, so bugs and vulnerabilities slip through.',
  },
  {
    icon: BranchesOutlined,
    title: 'Every AI session creates new standards, destroying quality',
    description:
      "There's no consistency between sessions. Each generation is a unique snowflake of dependencies and patterns.",
  },
  {
    icon: BugOutlined,
    title: 'Security vulnerabilities are often an afterthought',
    description:
      "SQL injection, XSS, broken auth. LLMs don't audit their output. Neither do most teams.",
  },
  {
    icon: WarningOutlined,
    title: 'Dependency updates break everything, across every project',
    description:
      'When Next.js ships a breaking change, you have to fix every AI-generated codebase individually.',
  },
];

export default function Problem() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-950 bg-grid">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4 font-mono">
            AI writes code fast{' '}
            <span className="text-red-400">but the maintenance doesn&apos;t scale</span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Vibe-coding produces working prototypes. But production needs maintainability, security,
            and consistency.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {problems.map((problem) => (
            <div
              key={problem.title}
              className="p-6 bg-slate-50 dark:bg-slate-900 border border-red-500/20 hover:border-red-500/40 transition-colors bracket-corners bracket-corners-red"
            >
              <div className="w-12 h-12 bg-red-500/10 flex items-center justify-center mb-4">
                <problem.icon style={{ fontSize: 24, color: '#f87171' }} />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">{problem.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{problem.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
