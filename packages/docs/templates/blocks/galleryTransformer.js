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

function stripHtmlTags(str) {
  let result = str;
  let prev;
  do {
    prev = result;
    result = result.replace(/<[^>]*>/g, '');
  } while (result !== prev);
  return result;
}

function escapeMarkdownCell(str) {
  return str.replace(/\\/g, '\\\\').replace(/\|/g, '\\|');
}

function flattenProperties(properties, prefix, rows) {
  for (const [name, def] of Object.entries(properties)) {
    const path = prefix ? `${prefix}.${name}` : name;

    const variants = def.oneOf ?? def.anyOf;
    let propType;
    if (def.type) {
      propType = Array.isArray(def.type) ? def.type.join(' \\| ') : def.type;
    } else if (variants) {
      const types = [...new Set(variants.map((v) => v.type).filter(Boolean))];
      propType = types.join(' \\| ') || '-';
    } else {
      propType = '-';
    }

    const defaultVal = def.default !== undefined ? `\`${JSON.stringify(def.default)}\`` : '-';
    const enumVals = def.enum ? ` Enum: ${def.enum.map((v) => `\`${v}\``).join(', ')}.` : '';
    const description = def.description ?? (variants && variants[0]?.description) ?? '';
    let desc =
      escapeMarkdownCell(
        stripHtmlTags(description.replace(/<a\s+href="([^"]*)"[^>]*>([^<]*)<\/a>/gi, '[$2]($1)'))
      ) + enumVals;
    if (def.docs?.link) {
      const label = def.docs.link.match(/components\/([^#]+)/)?.[1] ?? 'component';
      desc += ` See [Ant Design ${label} tokens](${def.docs.link}).`;
    }
    rows.push(`| \`${path}\` | ${propType} | ${defaultVal} | ${desc} |`);

    if (
      def.properties &&
      (def.type === 'object' || (Array.isArray(def.type) && def.type.includes('object')))
    ) {
      flattenProperties(def.properties, path, rows);
    }

    if (def.type === 'array' && def.items?.properties) {
      flattenProperties(def.items.properties, `${path}.$`, rows);
    }

    if (variants) {
      for (const variant of variants) {
        if (
          variant.type === 'array' &&
          variant.items?.type === 'object' &&
          variant.items.properties
        ) {
          flattenProperties(variant.items.properties, `${path}.$`, rows);
          break;
        }
        if (variant.type === 'object' && variant.properties) {
          flattenProperties(variant.properties, path, rows);
          break;
        }
      }
    }
  }
  return rows;
}

function buildPropertiesTable(properties) {
  if (!properties) return 'No properties defined.';
  const rows = flattenProperties(properties, '', []);
  return `| Property | Type | Default | Description |\n| --- | --- | --- | --- |\n${rows.join(
    '\n'
  )}`;
}

function buildEventsTable(events) {
  if (!events) return 'No events defined.';
  // meta.js string format: { onClick: 'description' }
  // meta.js object format: { onChange: { description: '...', event: { value: '...' } } }
  // old schema.js format: { properties: { onClick: { description: '...' } } }
  const entries = events.properties
    ? Object.entries(events.properties).map(([name, def]) => [name, def.description ?? '', null])
    : Object.entries(events).map(([name, def]) => {
        if (typeof def === 'string') return [name, def, null];
        return [name, def.description ?? '', def.event ?? null];
      });
  if (entries.length === 0) return 'No events defined.';
  const rows = entries.map(([name, desc, eventData]) => {
    const dataCell = eventData ? `\`{ ${Object.keys(eventData).join(', ')} }\`` : '\\-';
    return `| \`${name}\` | ${dataCell} | ${escapeMarkdownCell(desc ?? '')} |`;
  });
  return `| Event | Event Data | Description |\n| --- | --- | --- |\n${rows.join('\n')}`;
}

function buildCssKeysTable(cssKeys) {
  if (!cssKeys) return 'No CSS keys defined.';
  // meta.js format: { element: 'description', icon: 'description' }
  // old schema.js format: ['element', 'icon']
  const entries = Array.isArray(cssKeys)
    ? cssKeys.map((key) => [key, `Target via \`style./${key}\` or \`class./${key}\`.`])
    : Object.entries(cssKeys);
  if (entries.length === 0) return 'No CSS keys defined.';
  const rows = ['| `/block` | Outer block wrapper (always available). |'];
  entries.forEach(([key, desc]) => {
    rows.push(`| \`/${key}\` | ${escapeMarkdownCell(desc ?? '')} |`);
  });
  return `| Key | Target |\n| --- | --- |\n${rows.join('\n')}`;
}

function buildSlotsTable(slots) {
  if (slots === false)
    return 'Slots are **dynamic** — defined by properties (e.g. `tabs`, `panels`). See the Properties table.';
  if (!slots) return 'No slots defined.';
  const entries = Array.isArray(slots) ? slots.map((key) => [key, '']) : Object.entries(slots);
  if (entries.length === 0) return 'No slots defined.';
  const rows = entries.map(([key, desc]) => {
    return `| \`${key}\` | ${escapeMarkdownCell(desc ?? '')} |`;
  });
  return `| Slot | Description |\n| --- | --- |\n${rows.join('\n')}`;
}

function transformer(schema, vars) {
  const table = vars?.table;
  if (table === 'properties') return buildPropertiesTable(schema.properties?.properties);
  if (table === 'events') return buildEventsTable(schema.events);
  if (table === 'cssKeys') return buildCssKeysTable(schema.cssKeys);
  if (table === 'slots') return buildSlotsTable(schema.slots);
  return '';
}

export default transformer;
