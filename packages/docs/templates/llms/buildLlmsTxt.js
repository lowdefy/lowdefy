/*
  Copyright 2020-2026 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

// llms.txt.org convention: H1 title, blockquote summary, then `## Section` groups
// of `- [Title](url)` links.
function buildLlmsTxt(groupedSections) {
  const lines = [
    '# Lowdefy',
    '',
    '> Lowdefy: config-driven web framework — YAML blocks/operators/actions/connections.',
    '',
    'A running Lowdefy dev server (`lowdefy dev`) also serves project-specific docs — including ' +
      'your own local plugins — at `/lowdefy-docs`, with an MCP endpoint at `/lowdefy-docs/mcp`. ' +
      'Prefer those routes over this static index when a dev server is available.',
    '',
  ];

  groupedSections.forEach(({ section, docs }) => {
    lines.push(`## ${section}`, '');
    docs.forEach((doc) => {
      lines.push(`- [${doc.title}](https://docs.lowdefy.com/md/${doc.slug}.md)`);
    });
    lines.push('');
  });

  return lines.join('\n').trimEnd().concat('\n');
}

export default buildLlmsTxt;
