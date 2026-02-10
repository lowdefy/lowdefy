'use client';

import { AppstoreOutlined, ApartmentOutlined, SafetyOutlined, DashboardOutlined, CodeOutlined, CloudOutlined } from '@ant-design/icons';

const features = [
  {
    icon: AppstoreOutlined,
    title: '60+ UI Components',
    description: 'Ant Design, AG Grid, ECharts, and more. Production-ready blocks for any interface.',
    href: 'https://docs.lowdefy.com/blocks',
  },
  {
    icon: ApartmentOutlined,
    title: 'Visual Logic',
    description: 'Operators like _if, _get, _sum let you build complex logic without code.',
    href: 'https://docs.lowdefy.com/operators',
  },
  {
    icon: SafetyOutlined,
    title: 'Built-in Auth',
    description: 'OpenID Connect, OAuth, JWT. Role-based access control out of the box.',
    href: 'https://docs.lowdefy.com/authentication',
  },
  {
    icon: DashboardOutlined,
    title: 'Real-time Updates',
    description: 'WebSocket connections and live data subscriptions made simple.',
    href: 'https://docs.lowdefy.com/connections-and-requests',
  },
  {
    icon: CodeOutlined,
    title: 'Escape Hatches',
    description: 'Write custom JavaScript when you need it. Full flexibility, zero lock-in.',
    href: 'https://docs.lowdefy.com/custom-blocks',
  },
  {
    icon: CloudOutlined,
    title: 'Deploy Anywhere',
    description: 'Vercel, AWS, Docker, or self-hosted. Your app, your infrastructure.',
    href: 'https://docs.lowdefy.com/deployment',
  },
];

export default function Features() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Everything you need to build
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            A complete toolkit for internal tools, dashboards, CRMs, and data apps.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <a
              key={feature.title}
              href={feature.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-4 group"
            >
              <div className="w-12 h-12 rounded-lg bg-primary-100 group-hover:bg-primary-200 flex items-center justify-center flex-shrink-0 transition-colors">
                <feature.icon style={{ fontSize: 24, color: '#0077f2' }} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-primary-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-600">{feature.description}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
