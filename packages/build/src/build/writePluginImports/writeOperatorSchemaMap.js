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

import { ConfigError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import findFilePlugin from '../filePlugins/findFilePlugin.js';
import collectExceptions from '../../utils/collectExceptions.js';
import importPluginModule from './importPluginModule.js';
import validateHazardsShape from './validateHazardsShape.js';

// A shared operator is discovered once per store, so the client record is
// found first and the server record carries the same sibling JSON.
function writeFileOperator({ context, metas, op, schemas }) {
  const record =
    findFilePlugin({ context, kind: 'operators.client', typeName: op.typeName }) ??
    findFilePlugin({ context, kind: 'operators.server', typeName: op.typeName });
  if (type.isNone(record)) return;
  if (!type.isNone(record.schema)) {
    schemas[op.typeName] = record.schema;
  }
  if (type.isNone(record.hazards)) return;
  const hazardsProblem = validateHazardsShape(record.hazards);
  if (hazardsProblem !== null) {
    collectExceptions(
      context,
      new ConfigError(
        `Operator "${op.typeName}" from "${record.relativePath}": ${hazardsProblem}`,
        {
          received: record.hazards,
          filePath: record.relativePath,
          lineNumber: 1,
        }
      )
    );
    return;
  }
  metas[op.typeName] = { hazards: record.hazards };
}

async function writeOperatorSchemaMap({ components, context }) {
  const schemas = {};
  const metas = {};

  const typesMapSchemas = context.typesMap.schemas?.operators ?? {};

  const allOperators = new Map();
  for (const op of components.imports.operators.client) {
    allOperators.set(op.typeName, op);
  }
  for (const op of components.imports.operators.server) {
    allOperators.set(op.typeName, op);
  }

  const operatorsByPackage = {};
  for (const op of allOperators.values()) {
    // A file plugin has no package barrel: its schema and hazards are the
    // "schema" and "hazards" keys of the sibling JSON discovery read.
    if (type.isNone(op.package)) {
      writeFileOperator({ context, metas, op, schemas });
      continue;
    }
    if (!operatorsByPackage[op.package]) {
      operatorsByPackage[op.package] = [];
    }
    operatorsByPackage[op.package].push(op);
  }

  for (const [packageName, operators] of Object.entries(operatorsByPackage)) {
    const packageSchemas = await importPluginModule({
      context,
      specifier: `${packageName}/schemas`,
    });
    // Operators have no meta beyond hazards, so `./metas` is optional for a
    // package — most ship schemas only and contribute nothing here.
    const packageMetas = await importPluginModule({
      context,
      specifier: `${packageName}/metas`,
    });
    for (const op of operators) {
      if (typesMapSchemas[op.typeName]) {
        schemas[op.typeName] = typesMapSchemas[op.typeName];
      } else if (packageSchemas?.[op.originalTypeName]) {
        schemas[op.typeName] = packageSchemas[op.originalTypeName];
      }
      const meta = packageMetas?.[op.originalTypeName];
      if (meta) {
        const hazardsProblem = validateHazardsShape(meta.hazards);
        if (hazardsProblem !== null) {
          collectExceptions(
            context,
            new ConfigError(
              `Operator "${op.typeName}" from package "${packageName}": meta.${hazardsProblem}`,
              { received: meta.hazards }
            )
          );
        }
        metas[op.typeName] = { hazards: meta.hazards ?? [] };
      }
    }
  }

  await context.writeBuildArtifact('plugins/operatorSchemas.json', JSON.stringify(schemas));
  await context.writeBuildArtifact('plugins/operatorMetas.json', JSON.stringify(metas));
}

export default writeOperatorSchemaMap;
