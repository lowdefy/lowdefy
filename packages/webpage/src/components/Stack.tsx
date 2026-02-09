'use client';

import Image from 'next/image';
import {
  AppstoreOutlined,
  ApartmentOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  CloudOutlined,
  DashboardOutlined,
  TeamOutlined,
  FormOutlined,
  BarChartOutlined,
  SettingOutlined,
  TableOutlined,
} from '@ant-design/icons';

const features = [
  { icon: AppstoreOutlined, title: '70+ UI Components', href: 'https://docs.lowdefy.com/blocks' },
  { icon: SafetyOutlined, title: 'Auth.js + RBAC', href: 'https://docs.lowdefy.com/authentication' },
  { icon: ApartmentOutlined, title: '50+ Operators', href: 'https://docs.lowdefy.com/operators' },
  { icon: ThunderboltOutlined, title: 'Events & Actions', href: 'https://docs.lowdefy.com/events-and-actions' },
  { icon: CloudOutlined, title: 'Deploy Anywhere', href: 'https://docs.lowdefy.com/deployment' },
  { icon: DashboardOutlined, title: 'Plugin Ecosystem', href: 'https://docs.lowdefy.com/plugins' },
];

const connectors = [
  { name: 'MongoDB', icon: '/images/connectors/MongoDB.png' },
  { name: 'PostgreSQL', icon: '/images/connectors/PostgreSQL.png' },
  { name: 'MySQL', icon: '/images/connectors/MySQL.png' },
  { name: 'Google Sheets', icon: '/images/connectors/GoogleSheets.png' },
  { name: 'REST API', icon: '/images/connectors/AxiosHttp.png' },
  { name: 'Elasticsearch', icon: '/images/connectors/Elasticsearch.png' },
  { name: 'AWS S3', icon: '/images/connectors/AWSS3.png' },
  { name: 'SendGrid', icon: '/images/connectors/Sendgrid.png' },
  { name: 'MS SQL', icon: '/images/connectors/MSSQL.png' },
  { name: 'MariaDB', icon: '/images/connectors/MariaDB.png' },
  { name: 'SQLite', icon: '/images/connectors/SQLite.png' },
  { name: 'Stripe', icon: '/images/connectors/Stripe.png' },
];

const useCases = [
  { icon: DashboardOutlined, title: 'Internal Tools & Admin Panels' },
  { icon: TeamOutlined, title: 'Customer Portals' },
  { icon: FormOutlined, title: 'Multi-step Forms & Intake' },
  { icon: BarChartOutlined, title: 'BI Dashboards & Reporting' },
  { icon: SettingOutlined, title: 'Approval Workflows' },
  { icon: TableOutlined, title: 'Inventory & Asset Management' },
];

export default function Stack() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900 bg-grid-dense">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4 font-mono">
            Full-stack, <span className="text-gradient">production-ready</span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Everything you need to build, connect, and deploy data-driven business apps.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-px bg-slate-200 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700/50">
          {/* Stack Column */}
          <div className="bg-white dark:bg-slate-900 p-6">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="w-1.5 h-1.5 bg-primary-500" />
              <h3 className="text-sm font-mono font-semibold text-primary-400 uppercase tracking-wider">Stack</h3>
            </div>
            <div className="space-y-1">
              {features.map((feature) => (
                <a
                  key={feature.title}
                  href={feature.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3 py-2.5 -mx-1 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                >
                  <feature.icon style={{ fontSize: 16, color: '#2cb7ff' }} className="flex-shrink-0" />
                  <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-primary-400 transition-colors">
                    {feature.title}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Connect Column */}
          <div className="bg-white dark:bg-slate-900 p-6">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="w-1.5 h-1.5 bg-cyan-400" />
              <h3 className="text-sm font-mono font-semibold text-cyan-400 uppercase tracking-wider">Connect</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {connectors.map((connector) => (
                <div
                  key={connector.name}
                  className="flex flex-col items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <Image
                    src={connector.icon}
                    alt={connector.name}
                    width={32}
                    height={32}
                    className="w-8 h-8 object-contain"
                  />
                  <span className="text-[10px] text-slate-500 dark:text-slate-500 text-center leading-tight">{connector.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Build Column */}
          <div className="bg-white dark:bg-slate-900 p-6">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="w-1.5 h-1.5 bg-green-400" />
              <h3 className="text-sm font-mono font-semibold text-green-400 uppercase tracking-wider">Build</h3>
            </div>
            <div className="space-y-1">
              {useCases.map((useCase) => (
                <div
                  key={useCase.title}
                  className="flex items-center gap-3 px-3 py-2.5 -mx-1 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                >
                  <useCase.icon style={{ fontSize: 16, color: '#94a3b8' }} className="flex-shrink-0 group-hover:text-green-400" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    {useCase.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
