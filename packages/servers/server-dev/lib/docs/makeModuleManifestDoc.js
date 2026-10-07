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

import { type } from '@lowdefy/helpers';

const EXPORT_KINDS = ['pages', 'components', 'menus', 'connections', 'api'];

// A var default that is an operator, or a body the build defers, has no value
// until the module is built for a consumer.
function formatDefault(value) {
  if (type.isObject(value)) {
    const keys = Object.keys(value);
    if (keys.some((key) => key === '~deferred') || (keys.length === 1 && keys[0].startsWith('_'))) {
      return 'computed';
    }
  }
  return `\`${JSON.stringify(value)}\``;
}

function varLines({ varDefs, prefix, depth }) {
  const lines = [];
  for (const [name, definition] of Object.entries(varDefs ?? {})) {
    const fullName = prefix ? `${prefix}.${name}` : name;
    const details = [];
    if (!type.isNone(definition.type)) {
      details.push(definition.type);
    }
    if (definition.required === true) {
      details.push('required');
    }
    if (!type.isUndefined(definition.default)) {
      details.push(`default ${formatDefault(definition.default)}`);
    }
    const detail = details.length > 0 ? ` (${details.join(', ')})` : '';
    const description = type.isString(definition.description) ? `: ${definition.description}` : '';
    lines.push(`${'  '.repeat(depth)}- \`${fullName}\`${detail}${description}`);
    if (type.isObject(definition.properties)) {
      lines.push(
        ...varLines({ varDefs: definition.properties, prefix: fullName, depth: depth + 1 })
      );
    }
  }
  return lines;
}

function idLines({ items }) {
  return (items ?? []).map((item) => {
    const description = type.isString(item.description) ? `: ${item.description}` : '';
    return `- \`${item.id}\`${description}`;
  });
}

// The interface a module declares in module.lowdefy.yaml, as markdown.
function makeModuleManifestDoc({ moduleEntry }) {
  const manifest = moduleEntry.manifest ?? {};
  const lines = [`# ${moduleEntry.id} module: components, exports and vars`, ''];
  if (type.isString(manifest.name)) {
    lines.push(`**${manifest.name}**`, '');
  }
  if (type.isString(manifest.description)) {
    lines.push(manifest.description, '');
  }
  lines.push(
    `Source: \`${moduleEntry.source}\`. Module id in this app: \`${moduleEntry.id}\`.`,
    ''
  );

  lines.push('## Vars', '');
  const vars = varLines({ varDefs: moduleEntry.varDefs, prefix: '', depth: 0 });
  lines.push(...(vars.length > 0 ? vars : ['None declared.']), '');
  lines.push(
    `Set vars in lowdefy.yaml under \`modules\`, on the entry with \`id: ${moduleEntry.id}\`.`,
    ''
  );

  lines.push('## Components', '');
  const exportedDescriptions = new Map(
    (manifest.exports?.components ?? []).map((item) => [item.id, item.description])
  );
  const components = idLines({
    items: (manifest.components ?? []).map((item) => ({
      id: item.id,
      description: item.description ?? exportedDescriptions.get(item.id),
    })),
  });
  lines.push(...(components.length > 0 ? components : ['None declared.']), '');

  lines.push('## Exports', '');
  const exportLines = [];
  for (const kind of EXPORT_KINDS) {
    const items = manifest.exports?.[kind];
    if (type.isArray(items) && items.length > 0) {
      exportLines.push(`### ${kind}`, '', ...idLines({ items }), '');
    }
  }
  lines.push(...(exportLines.length > 0 ? exportLines : ['None declared.', '']));
  return lines.join('\n');
}

export default makeModuleManifestDoc;
