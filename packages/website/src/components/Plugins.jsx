'use client';

import {
  InboxOutlined,
  AppstoreOutlined,
  DatabaseOutlined,
  FunctionOutlined,
  PlayCircleOutlined,
  FolderOutlined,
} from '@ant-design/icons';

const pluginTypes = [
  {
    icon: AppstoreOutlined,
    name: 'Blocks',
    description: '60+ UI components',
    packages: ['blocks-antd', 'blocks-echarts', 'blocks-aggrid', 'blocks-markdown'],
  },
  {
    icon: DatabaseOutlined,
    name: 'Connections',
    description: '8+ data sources',
    packages: ['connection-mongodb', 'connection-knex', 'connection-axios-http'],
  },
  {
    icon: FunctionOutlined,
    name: 'Operators',
    description: '50+ functions',
    packages: ['operators-js', 'operators-moment', 'operators-nunjucks'],
  },
  {
    icon: PlayCircleOutlined,
    name: 'Actions',
    description: 'Event handlers',
    packages: ['actions-core', 'actions-pdf-make'],
  },
];

export default function Plugins() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/20 text-primary-300 text-sm font-medium mb-4">
            <InboxOutlined style={{ fontSize: 14 }} />
            Plugin Ecosystem
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Extend with npm packages</h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Add plugins in your config. Tree-shaking bundles only what you use. Build custom plugins
            and publish to npm.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Config Visual */}
          <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
            {/* File tabs */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700 bg-slate-800/50">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="ml-4 text-slate-400 text-sm font-mono">lowdefy.yaml</span>
            </div>

            {/* Code content */}
            <pre className="p-6 text-sm overflow-x-auto">
              <code>
                <span className="text-slate-500"># Declare plugins - that&apos;s it</span>
                {'\n'}
                <span className="text-primary-400">plugins:</span>
                {'\n'}
                <span className="text-slate-500">{'  '}# UI components</span>
                {'\n'}
                <span className="text-slate-400">{'  - '}</span>
                <span className="text-cyan-400">name:</span>
                <span className="text-green-400"> &apos;@lowdefy/blocks-antd&apos;</span>
                {'\n'}
                <span className="text-slate-400">{'    '}</span>
                <span className="text-cyan-400">version:</span>
                <span className="text-yellow-300"> &apos;4.5.2&apos;</span>
                {'\n\n'}
                <span className="text-slate-500">{'  '}# Data grids</span>
                {'\n'}
                <span className="text-slate-400">{'  - '}</span>
                <span className="text-cyan-400">name:</span>
                <span className="text-green-400"> &apos;@lowdefy/blocks-aggrid&apos;</span>
                {'\n'}
                <span className="text-slate-400">{'    '}</span>
                <span className="text-cyan-400">version:</span>
                <span className="text-yellow-300"> &apos;4.5.2&apos;</span>
                {'\n\n'}
                <span className="text-slate-500">{'  '}# Database connection</span>
                {'\n'}
                <span className="text-slate-400">{'  - '}</span>
                <span className="text-cyan-400">name:</span>
                <span className="text-green-400"> &apos;@lowdefy/connection-mongodb&apos;</span>
                {'\n'}
                <span className="text-slate-400">{'    '}</span>
                <span className="text-cyan-400">version:</span>
                <span className="text-yellow-300"> &apos;4.5.2&apos;</span>
                {'\n\n'}
                <span className="text-slate-500">{'  '}# Custom plugin from npm</span>
                {'\n'}
                <span className="text-slate-400">{'  - '}</span>
                <span className="text-cyan-400">name:</span>
                <span className="text-purple-400"> &apos;@acme/custom-blocks&apos;</span>
                {'\n'}
                <span className="text-slate-400">{'    '}</span>
                <span className="text-cyan-400">version:</span>
                <span className="text-yellow-300"> &apos;1.0.0&apos;</span>
              </code>
            </pre>

            {/* Folder structure hint */}
            <div className="px-6 pb-6 pt-2 border-t border-slate-700">
              <div className="flex items-center gap-2 mb-3 text-slate-500">
                <FolderOutlined style={{ fontSize: 14 }} />
                <span className="font-mono text-xs">Project structure</span>
              </div>
              <div className="font-mono text-xs space-y-0.5 text-slate-500">
                <div>
                  <span className="text-yellow-400/70">my-app/</span>
                </div>
                <div className="pl-3">
                  ├── <span className="text-green-400/70">lowdefy.yaml</span>
                  <span className="text-slate-600"> ← plugins declared here</span>
                </div>
                <div className="pl-3">├── pages/</div>
                <div className="pl-3">├── connections/</div>
                <div className="pl-3">└── node_modules/</div>
              </div>
            </div>
          </div>

          {/* Plugin Types */}
          <div className="space-y-4">
            <p className="text-slate-400 mb-6">Four plugin types extend every layer of your app:</p>
            {pluginTypes.map((plugin) => (
              <div
                key={plugin.name}
                className="bg-slate-800/50 rounded-xl p-5 border border-slate-700 hover:border-primary-500/50 transition-colors group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-500/30 transition-colors">
                    <plugin.icon style={{ fontSize: 20, color: '#7dd3fc' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4 mb-1">
                      <h3 className="font-semibold text-white">{plugin.name}</h3>
                      <span className="text-xs text-slate-500">{plugin.description}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {plugin.packages.map((pkg) => (
                        <code
                          key={pkg}
                          className="text-xs text-slate-400 font-mono bg-slate-700/50 px-2 py-0.5 rounded"
                        >
                          {pkg}
                        </code>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="pt-4">
              <a
                href="https://docs.lowdefy.com/plugins-introduction"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors font-medium"
              >
                Browse all plugins →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
