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

const KIND_HEADINGS = {
  blocks: 'Blocks',
  operators: 'Operators',
  actions: 'Actions',
  connections: 'Connections',
  requests: 'Requests',
};

const KIND_SCHEMA_TOOL = {
  blocks: 'lowdefy_get_schema',
  operators: 'lowdefy_get_schema',
  actions: 'lowdefy_get_schema',
  connections: 'lowdefy_get_schema',
  requests: 'lowdefy_get_schema',
};

function cell(value) {
  if (value === undefined || value === null) return '';
  return String(value)
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\|/g, '\\|')
    .trim();
}

function schemaType(schema) {
  if (schema === undefined || schema === null) return 'any';
  if (Array.isArray(schema.type)) return schema.type.join(' \\| ');
  if (schema.enum) return schema.enum.map((value) => `\`${JSON.stringify(value)}\``).join(', ');
  if (schema.type) return schema.type;
  const variants = schema.oneOf ?? schema.anyOf;
  if (variants) return variants.map(schemaType).join(' \\| ');
  return 'any';
}

function defaultCell(schema) {
  if (schema === undefined || schema === null || schema.default === undefined) return '';
  return `\`${JSON.stringify(schema.default)}\``;
}

function propertiesTable({ properties, required = [] }) {
  const names = Object.keys(properties ?? {});
  if (names.length === 0) {
    return '_No properties._';
  }
  const rows = names.map((name) => {
    const property = properties[name] ?? {};
    const isRequired = required.includes(name) ? 'yes' : '';
    return `| \`${name}\` | ${cell(schemaType(property))} | ${isRequired} | ${defaultCell(
      property
    )} | ${cell(property.description)} |`;
  });
  return [
    '| Property | Type | Required | Default | Description |',
    '| --- | --- | --- | --- | --- |',
    ...rows,
  ].join('\n');
}

// Operator params, action params and request/connection properties are all JSON schemas, but
// they arrive in slightly different shapes: a plain object schema, a oneOf/anyOf of shapes, or
// a scalar. Render whichever it is.
function schemaSummary(schema) {
  if (schema === undefined || schema === null) {
    return '_No schema._';
  }
  const variants = schema.oneOf ?? schema.anyOf;
  if (variants) {
    return variants
      .map((variant, index) => {
        const label = `**Form ${index + 1}** — ${cell(schemaType(variant))}${
          variant.description ? `: ${cell(variant.description)}` : ''
        }`;
        if (variant.type === 'object' && variant.properties) {
          return `${label}\n\n${propertiesTable(variant)}`;
        }
        return label;
      })
      .join('\n\n');
  }
  if (schema.type === 'object' && schema.properties) {
    const intro = schema.description ? `${cell(schema.description)}\n\n` : '';
    return `${intro}${propertiesTable(schema)}`;
  }
  const description = schema.description ? `: ${cell(schema.description)}` : '';
  return `Accepts ${cell(schemaType(schema))}${description}`;
}

function eventsList(events) {
  const names = Object.keys(events ?? {});
  if (names.length === 0) {
    return '_No events._';
  }
  return names
    .map((name) => {
      const event = events[name];
      const description = typeof event === 'string' ? event : event?.description;
      const payload =
        typeof event === 'object' && event?.event
          ? ` Event payload: ${Object.keys(event.event)
              .map((key) => `\`${key}\``)
              .join(', ')}.`
          : '';
      return `- \`${name}\`: ${cell(description)}${payload}`;
    })
    .join('\n');
}

function renderDoc(doc) {
  return `#### ${doc.title}\n\n\`/lowdefy-docs/content/${doc.slug}\`\n\n${doc.firstParagraph}`;
}

function renderBlock({ name, packageName, meta, example }) {
  const parts = [
    `#### ${name}`,
    `Provided by \`${packageName}\`. Category: \`${meta.category}\`${
      meta.valueType ? `, value type: \`${meta.valueType}\`` : ''
    }.`,
    '##### Properties',
    propertiesTable(meta.properties ?? {}),
    '##### Events',
    eventsList(meta.events),
  ];
  if (example) {
    parts.push('##### Example', `\`\`\`yaml\n${example}\n\`\`\``);
  }
  return parts.join('\n\n');
}

function renderOperator({ name, packageName, schema }) {
  return `#### ${name}\n\nProvided by \`${packageName}\`.\n\n${schemaSummary(schema?.params)}`;
}

function renderAction({ name, packageName, schema }) {
  return `#### ${name}\n\nProvided by \`${packageName}\`.\n\n${schemaSummary(schema?.params)}`;
}

function renderConnection({ name, packageName, schema, requests }) {
  const requestList =
    requests.length > 0 ? `\n\nRequests: ${requests.map((r) => `\`${r}\``).join(', ')}.` : '';
  return `#### ${name}\n\nProvided by \`${packageName}\`.${requestList}\n\n${schemaSummary(
    schema
  )}`;
}

function renderRequest({ name, packageName, connectionName, schema, meta }) {
  const access = [];
  if (meta?.checkRead) access.push('read');
  if (meta?.checkWrite) access.push('write');
  const accessLine = access.length > 0 ? ` Connection access checked: ${access.join(', ')}.` : '';
  return `#### ${name}\n\nProvided by \`${packageName}\` on connection \`${connectionName}\`.${accessLine}\n\n${schemaSummary(
    schema
  )}`;
}

const RENDERERS = {
  blocks: renderBlock,
  operators: renderOperator,
  actions: renderAction,
  connections: renderConnection,
  requests: renderRequest,
};

// resolved: { docs: [{ slug, title, firstParagraph }], types: { blocks: [...], operators: [...], ... } }
function renderReference({ resolved }) {
  const sections = [
    '## Reference',
    'Generated from `@lowdefy/docs-content` and the plugin schemas at release time — do not edit by hand. The running dev server has the live versions: `lowdefy_get_doc` for a doc page, `lowdefy_get_schema` for a type, `lowdefy_get_examples` for block yaml.',
  ];
  if (resolved.docs.length > 0) {
    sections.push('### Docs', ...resolved.docs.map(renderDoc));
  }
  for (const kind of Object.keys(KIND_HEADINGS)) {
    const items = resolved.types[kind] ?? [];
    if (items.length === 0) continue;
    sections.push(
      `### ${KIND_HEADINGS[kind]}`,
      `Live schema: \`${KIND_SCHEMA_TOOL[kind]}\` with kind \`${kind}\`.`,
      ...items.map((item) => RENDERERS[kind](item))
    );
  }
  return sections.join('\n\n');
}

export default renderReference;
