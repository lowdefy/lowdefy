'use client';

import { CheckCircleOutlined, ThunderboltOutlined, EyeOutlined, LockOutlined, DatabaseOutlined } from '@ant-design/icons';

const solutions = [
  {
    icon: ThunderboltOutlined,
    title: 'Ship in days, not months',
    description: 'Config-driven development is 10x faster. Less code, fewer bugs, instant results.',
  },
  {
    icon: EyeOutlined,
    title: 'AI output you can actually review',
    description: '50 lines of YAML vs 5000 lines of code. See exactly what your app does at a glance.',
  },
  {
    icon: LockOutlined,
    title: 'Secure by design',
    description: 'Auth, permissions, and data validation built into the framework. Not bolted on.',
  },
  {
    icon: DatabaseOutlined,
    title: 'Connect to anything',
    description: 'MongoDB, PostgreSQL, REST APIs, GraphQL—all through simple config blocks.',
  },
];

export default function Solution() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-green-600 text-sm font-medium mb-4">
            <CheckCircleOutlined style={{ fontSize: 14 }} />
            The Solution
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Config-first changes everything
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Lowdefy is a full-stack framework where your entire app is defined in YAML.
            What used to take months now takes days.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {solutions.map((solution) => (
            <div
              key={solution.title}
              className="p-6 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200 hover:shadow-lg transition-shadow"
            >
              <div className="w-12 h-12 rounded-lg bg-primary-50 flex items-center justify-center mb-4">
                <solution.icon style={{ fontSize: 24, color: '#1990ff' }} />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">{solution.title}</h3>
              <p className="text-sm text-slate-600">{solution.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
