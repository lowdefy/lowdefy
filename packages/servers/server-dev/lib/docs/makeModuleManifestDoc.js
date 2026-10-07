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

// The build does not check every part of module.lowdefy.yaml this page reads
// (exports above all), so a part with the wrong shape is named on the page
// instead of failing every docs call that reads it.
function invalidLine({ label, expected, value, depth = 0 }) {
  return `${'  '.repeat(
    depth
  )}- ${label}: not valid in module.lowdefy.yaml, expected ${expected}. Received ${
    JSON.stringify(value) ?? 'undefined'
  }.`;
}

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
  for (const [name, definition] of Object.entries(varDefs)) {
    const fullName = prefix ? `${prefix}.${name}` : name;
    if (!type.isObject(definition)) {
      lines.push(
        invalidLine({ label: `\`${fullName}\``, expected: 'an object', value: definition, depth })
      );
      continue;
    }
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

function idLines({ items, label }) {
  if (type.isNone(items)) {
    return [];
  }
  if (!type.isArray(items)) {
    return [invalidLine({ label: `\`${label}\``, expected: 'a list', value: items })];
  }
  return items.map((item, index) => {
    if (!type.isObject(item) || !type.isString(item.id)) {
      return invalidLine({
        label: `\`${label}.${index}\``,
        expected: 'an object with a string id',
        value: item,
      });
    }
    const description = type.isString(item.description) ? `: ${item.description}` : '';
    return `- \`${item.id}\`${description}`;
  });
}

function componentLines({ manifest }) {
  const exported = manifest.exports?.components;
  const exportedDescriptions = new Map(
    (type.isArray(exported) ? exported : [])
      .filter((item) => type.isObject(item))
      .map((item) => [item.id, item.description])
  );
  const components = manifest.components;
  if (!type.isArray(components)) {
    return idLines({ items: components, label: 'components' });
  }
  return idLines({
    items: components.map((item) =>
      type.isObject(item)
        ? { id: item.id, description: item.description ?? exportedDescriptions.get(item.id) }
        : item
    ),
    label: 'components',
  });
}

function exportLines({ manifest }) {
  const moduleExports = manifest.exports;
  if (type.isNone(moduleExports)) {
    return [];
  }
  if (!type.isObject(moduleExports)) {
    return [invalidLine({ label: '`exports`', expected: 'an object', value: moduleExports }), ''];
  }
  const lines = [];
  for (const kind of EXPORT_KINDS) {
    const items = idLines({ items: moduleExports[kind], label: `exports.${kind}` });
    if (items.length > 0) {
      lines.push(`### ${kind}`, '', ...items, '');
    }
  }
  return lines;
}

// The interface a module declares in module.lowdefy.yaml, as markdown.
function makeModuleManifestDoc({ moduleEntry }) {
  const manifest = type.isObject(moduleEntry.manifest) ? moduleEntry.manifest : {};
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
  const varDefs = moduleEntry.varDefs ?? {};
  let vars;
  if (type.isObject(varDefs)) {
    vars = varLines({ varDefs, prefix: '', depth: 0 });
  } else {
    vars = [invalidLine({ label: '`vars`', expected: 'an object', value: varDefs })];
  }
  lines.push(...(vars.length > 0 ? vars : ['None declared.']), '');
  lines.push(
    `Set vars in lowdefy.yaml under \`modules\`, on the entry with \`id: ${moduleEntry.id}\`.`,
    ''
  );

  lines.push('## Components', '');
  const components = componentLines({ manifest });
  lines.push(...(components.length > 0 ? components : ['None declared.']), '');

  lines.push('## Exports', '');
  const exportsSection = exportLines({ manifest });
  lines.push(...(exportsSection.length > 0 ? exportsSection : ['None declared.', '']));
  return lines.join('\n');
}

export default makeModuleManifestDoc;
