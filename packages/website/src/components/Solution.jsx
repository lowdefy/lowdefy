'use client';

import {
  CheckCircleOutlined,
  CompressOutlined,
  SafetyCertificateOutlined,
  SyncOutlined,
  LockOutlined,
} from '@ant-design/icons';

const solutions = [
  {
    icon: CompressOutlined,
    title: '50 lines of config vs 500 lines of code',
    description:
      'Declarative YAML replaces thousands of lines of boilerplate. Review entire apps at a glance.',
  },
  {
    icon: SafetyCertificateOutlined,
    title: 'Schema-validated. No arbitrary code paths',
    description:
      'Every config property is validated against a schema. No room for hidden logic or unexpected behavior.',
  },
  {
    icon: SyncOutlined,
    title: 'One framework update upgrades all your apps',
    description:
      'Config is stable. Update Lowdefy once, and every app benefits. No migration scripts needed.',
  },
  {
    icon: LockOutlined,
    title: 'Config is interpreted, not executed. Secure by design',
    description:
      'No code injection possible. Auth, permissions, and data validation are built into the runtime.',
  },
];

export default function Solution() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900 bg-grid-dense">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium mb-4">
            <CheckCircleOutlined style={{ fontSize: 14 }} />
            The Solution
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4 font-mono">
            Config-first: the abstraction layer <span className="text-gradient">AI needs</span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            A declarative config that sits between JavaScript and natural language. Constrained
            enough for guarantees, expressive enough for real apps.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {solutions.map((solution) => (
            <div
              key={solution.title}
              className="p-6 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-primary-500/30 transition-colors bracket-corners bracket-corners-green"
            >
              <div className="w-12 h-12 bg-primary-500/10 flex items-center justify-center mb-4">
                <solution.icon style={{ fontSize: 24, color: '#2cb7ff' }} />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                {solution.title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{solution.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
