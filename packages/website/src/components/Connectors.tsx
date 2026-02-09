import Image from 'next/image';

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

export default function Connectors() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Connect to any data source
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Built-in connectors for databases, APIs, and services. No boilerplate, no SDKs to learn.
          </p>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-6">
          {connectors.map((connector) => (
            <div
              key={connector.name}
              className="flex flex-col items-center gap-3 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="w-12 h-12 flex items-center justify-center">
                <Image
                  src={connector.icon}
                  alt={connector.name}
                  width={40}
                  height={40}
                  className="w-10 h-10 object-contain"
                />
              </div>
              <span className="text-xs text-slate-600 text-center">{connector.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
