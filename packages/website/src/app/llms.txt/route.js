import articles from '@/content/articles';

export function GET() {
  const articleLines = articles
    .map((a) => `- [${a.title}](https://lowdefy.com/articles/${a.id})`)
    .join('\n');

  const content = `# Lowdefy

> Config-first web stack for AI and humans. Build full-stack web apps with YAML config.

## About
Lowdefy is an open-source framework for building web applications using YAML configuration.
Apps are defined with Blocks (React components), Operators (logic), Actions (event handlers),
and Connections (database/API integrations).

## Links
- Website: https://lowdefy.com
- Documentation: https://docs.lowdefy.com
- GitHub: https://github.com/lowdefy/lowdefy
- Articles: https://lowdefy.com/articles

## Articles
${articleLines}
`;

  return new Response(content, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
