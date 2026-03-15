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

function buildPropertiesTable(properties) {
  if (!properties) return 'No properties defined.';
  const rows = Object.entries(properties)
    .filter(([name]) => name !== 'theme')
    .map(([name, def]) => {
      const propType = Array.isArray(def.type) ? def.type.join(' \\| ') : def.type ?? '-';
      const defaultVal = def.default !== undefined ? `\`${JSON.stringify(def.default)}\`` : '-';
      const enumVals = def.enum ? ` Enum: ${def.enum.map((v) => `\`${v}\``).join(', ')}.` : '';
      const desc = (def.description ?? '').replace(/\|/g, '\\|').replace(/<[^>]*>/g, '') + enumVals;
      return `| \`${name}\` | ${propType} | ${defaultVal} | ${desc} |`;
    });
  return `| Property | Type | Default | Description |\n| --- | --- | --- | --- |\n${rows.join(
    '\n'
  )}`;
}

function buildEventsTable(events) {
  if (!events) return 'No events defined.';
  // meta.js format: { onClick: 'description' }
  // old schema.js format: { properties: { onClick: { description: '...' } } }
  const entries = events.properties
    ? Object.entries(events.properties).map(([name, def]) => [name, def.description ?? ''])
    : Object.entries(events);
  if (entries.length === 0) return 'No events defined.';
  const rows = entries.map(([name, desc]) => {
    return `| \`${name}\` | ${(desc ?? '').replace(/\|/g, '\\|')} |`;
  });
  return `| Event | Description |\n| --- | --- |\n${rows.join('\n')}`;
}

function buildCssKeysTable(cssKeys) {
  if (!cssKeys) return 'No CSS keys defined.';
  // meta.js format: { element: 'description', icon: 'description' }
  // old schema.js format: ['element', 'icon']
  const entries = Array.isArray(cssKeys)
    ? cssKeys.map((key) => [key, `Target via \`style.--${key}\` or \`class.--${key}\`.`])
    : Object.entries(cssKeys);
  if (entries.length === 0) return 'No CSS keys defined.';
  const rows = ['| `block` | Outer block wrapper (always available). |'];
  entries.forEach(([key, desc]) => {
    rows.push(`| \`${key}\` | ${(desc ?? '').replace(/\|/g, '\\|')} |`);
  });
  return `| Key | Target |\n| --- | --- |\n${rows.join('\n')}`;
}

function buildDesignTokensTable(designTokens) {
  if (!designTokens || !designTokens.properties) return 'No design tokens defined.';
  const rows = Object.entries(designTokens.properties).map(([name, def]) => {
    const propType = def.type ?? '-';
    const defaultVal = def.default !== undefined ? `\`${JSON.stringify(def.default)}\`` : '-';
    const desc = (def.description ?? '').replace(/\|/g, '\\|');
    return `| \`${name}\` | ${propType} | ${defaultVal} | ${desc} |`;
  });
  const link = designTokens.docs?.link;
  const linkLabel = link ? link.match(/components\/([^#]+)/)?.[1] ?? 'component' : '';
  const header = link
    ? `Override via the \`theme\` property. See [Ant Design ${linkLabel} tokens](${link}).\n\n`
    : 'Override via the `theme` property.\n\n';
  return `${header}| Token | Type | Default | Description |\n| --- | --- | --- | --- |\n${rows.join(
    '\n'
  )}`;
}

function transformer(schema, vars) {
  const table = vars?.table;
  if (table === 'properties') return buildPropertiesTable(schema.properties?.properties);
  if (table === 'events') return buildEventsTable(schema.events);
  if (table === 'cssKeys') return buildCssKeysTable(schema.cssKeys);
  if (table === 'designTokens') return buildDesignTokensTable(schema.properties?.properties?.theme);
  return '';
}

export default transformer;
