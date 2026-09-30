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

import importPluginModule from './importPluginModule.js';

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
        metas[op.typeName] = { hazards: meta.hazards ?? [] };
      }
    }
  }

  await context.writeBuildArtifact('plugins/operatorSchemas.json', JSON.stringify(schemas));
  await context.writeBuildArtifact('plugins/operatorMetas.json', JSON.stringify(metas));
}

export default writeOperatorSchemaMap;
