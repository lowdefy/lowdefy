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

import { formatSchemaError, getConfigSchemaErrors } from '@lowdefy/ajv';
import { type } from '@lowdefy/helpers';

import loadPluginTypeSchema from '../writePluginImports/loadPluginTypeSchema.js';
import schemaCheckKinds from './schemaCheckKinds.js';

function unescapePointerSegment(segment) {
  return segment.replace(/~1/g, '/').replace(/~0/g, '~');
}

// The configKey of the deepest node on the error's path that has one, so a
// finding points at the line of the field rather than the block.
function findConfigKey({ nodeConfigKey, data, error }) {
  let configKey = data?.['~k'] ?? nodeConfigKey;
  const segments = error.instancePath.split('/').slice(1).map(unescapePointerSegment);
  if (error.keyword === 'additionalProperties') {
    segments.push(error.params.additionalProperty);
  }
  let value = data;
  for (const segment of segments) {
    value = value?.[segment];
    if (!type.isObject(value) && !type.isArray(value)) break;
    configKey = value['~k'] ?? configKey;
  }
  return configKey;
}

// Validates each block, action and operator node the type counters recorded
// against its type's plugin schema, judged by getConfigSchemaErrors. Returns
// the findings as { level, configKey, message }, at the package's schemaLevel
// (warning unless its ./checks export raises it). A package that is not
// installed has no schemas to check against.
async function runSchemaChecks({ context, targets, loaded }) {
  const findings = [];
  for (const { kind, typeName, originalTypeName, packageName, nodes } of targets) {
    const schemaKind = schemaCheckKinds[kind];
    const result = loaded.get(packageName);
    if (!schemaKind || result.status === 'pending') continue;
    const { schema: typeSchema } = await loadPluginTypeSchema({
      context,
      kind,
      type: { typeName, originalTypeName, package: packageName },
    });
    const schema = schemaKind.getSchema(typeSchema);
    if (type.isNone(schema)) continue;
    const level = result.schemaLevel ?? 'warning';
    for (const [node, nodeConfigKey] of nodes) {
      const data = schemaKind.getData(node);
      if (type.isUndefined(data)) continue;
      const displayName = schemaKind.getDisplayName({ typeName, node });
      let errors;
      try {
        errors = getConfigSchemaErrors({ schema, data });
      } catch (error) {
        // A schema ajv cannot compile is the plugin's fault: one finding names
        // it, and the type's other nodes are not checked.
        findings.push({
          level,
          configKey: nodeConfigKey,
          message: `${schemaKind.pluginLabel} "${typeName}" schema (${packageName}) could not be checked: ${error.message}`,
        });
        break;
      }
      for (const error of errors) {
        findings.push({
          level,
          configKey: findConfigKey({ nodeConfigKey, data, error }),
          message: formatSchemaError({
            ajvError: error,
            pluginLabel: schemaKind.pluginLabel,
            typeName: displayName,
            fieldLabel: schemaKind.fieldLabel,
          }),
        });
      }
    }
  }
  return findings;
}

export default runSchemaChecks;
