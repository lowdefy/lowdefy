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

// Renders the generated Reference section of a skill from already-resolved sources. Pure: the
// same input always renders the same markdown, which is what makes regeneration idempotent.
//
// The section is an index, not a copy: a doc slug or a type name plus the one call that fetches
// the live version. Restating schemas here would ship a snapshot of what lowdefy_get_schema
// answers correctly for the version the project is actually running, and it would go stale on
// the next release. Resolving each slug and type is still what the generator does - a renamed
// page or a removed type fails the build - the resolved detail just is not written out.

const KIND_HEADINGS = {
  blocks: 'Blocks',
  operators: 'Operators',
  actions: 'Actions',
  connections: 'Connections',
  requests: 'Requests',
};

const KIND_LOOKUP = {
  blocks: '`lowdefy_get_schema` with kind `blocks`, then `lowdefy_get_examples` for usage yaml:',
  operators: '`lowdefy_get_schema` with kind `operators`:',
  actions: '`lowdefy_get_schema` with kind `actions`:',
  connections: '`lowdefy_get_schema` with kind `connections`:',
  requests: '`lowdefy_get_schema` with kind `requests`:',
};

function typeList(items) {
  return items.map((item) => `\`${item.name}\` (\`${item.packageName}\`)`).join(', ');
}

// resolved: { docs: [{ slug, title }], types: { blocks: [{ name, packageName, ... }], ... } }
function renderReference({ resolved }) {
  const sections = [
    '## Reference',
    'What this skill covers, and the call that returns the live version from the running dev server. Read these before writing config - never write a type name or property from memory.',
  ];
  if (resolved.docs.length > 0) {
    sections.push(
      '### Docs',
      `\`lowdefy_get_doc\` by slug (or \`GET /lowdefy-docs/content/{slug}\`): ${resolved.docs
        .map((doc) => `\`${doc.slug}\``)
        .join(', ')}.`
    );
  }
  for (const kind of Object.keys(KIND_HEADINGS)) {
    const items = resolved.types[kind] ?? [];
    if (items.length === 0) continue;
    sections.push(`### ${KIND_HEADINGS[kind]}`, `${KIND_LOOKUP[kind]} ${typeList(items)}.`);
  }
  return sections.join('\n\n');
}

export default renderReference;
