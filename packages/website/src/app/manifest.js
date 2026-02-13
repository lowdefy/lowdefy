export default function manifest() {
  return {
    name: 'Lowdefy - Config-First Web Stack for AI and Humans',
    short_name: 'Lowdefy',
    description:
      'Build full-stack web apps with YAML config. AI outputs production-ready code. Easy to review, secure by design, connects to any data source.',
    start_url: '/',
    display: 'standalone',
    theme_color: '#1990ff',
    background_color: '#0f172a',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
