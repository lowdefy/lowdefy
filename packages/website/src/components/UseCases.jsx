'use client';

import {
  DashboardOutlined,
  TeamOutlined,
  FormOutlined,
  BarChartOutlined,
  SettingOutlined,
  TableOutlined,
} from '@ant-design/icons';

const useCases = [
  {
    icon: DashboardOutlined,
    title: 'Internal Tools & Admin Panels',
    description:
      'User management, content moderation, order processing. Replace spreadsheets with proper tools.',
  },
  {
    icon: TeamOutlined,
    title: 'Customer Portals',
    description:
      'Let customers view orders, download invoices, submit tickets. Secure, role-based access.',
  },
  {
    icon: FormOutlined,
    title: 'Multi-step Forms & Intake',
    description:
      'Applications, onboarding flows, surveys. Conditional logic, file uploads, e-signatures.',
  },
  {
    icon: BarChartOutlined,
    title: 'BI Dashboards & Reporting',
    description: 'Connect to your database. Build KPI dashboards, scheduled reports, data exports.',
  },
  {
    icon: SettingOutlined,
    title: 'Approval Workflows',
    description:
      'Expense approvals, leave requests, document sign-offs. Multi-stage with notifications.',
  },
  {
    icon: TableOutlined,
    title: 'Inventory & Asset Management',
    description:
      'Track stock, equipment, licenses. Barcode scanning, audit trails, low-stock alerts.',
  },
];

export default function UseCases() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            What can you build?
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Lowdefy excels at data-driven internal tools and business applications.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {useCases.map((useCase) => (
            <div
              key={useCase.title}
              className="p-6 rounded-xl border border-slate-200 hover:border-primary-500 hover:shadow-lg transition-all group"
            >
              <div className="w-12 h-12 rounded-lg bg-slate-100 group-hover:bg-primary-50 flex items-center justify-center mb-4 transition-colors">
                <useCase.icon
                  style={{ fontSize: 24, color: '#64748b' }}
                  className="group-hover:text-primary-500"
                />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">{useCase.title}</h3>
              <p className="text-sm text-slate-600">{useCase.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
