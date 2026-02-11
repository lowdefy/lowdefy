/*
  Copyright 2020-2024 Lowdefy, Inc

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

async function writeOperatorSchemaMap({ components, context }) {
  const schemas = {};

  // Use schemas from typesMap (pre-loaded by server for custom plugins)
  const typesMapSchemas = context.typesMap.schemas?.operators ?? {};

  // Combine client and server operators, deduplicating by typeName
  const allOperators = new Map();
  for (const op of components.imports.operators.client) {
    allOperators.set(op.typeName, op);
  }
  for (const op of components.imports.operators.server) {
    allOperators.set(op.typeName, op);
  }

  // Group operators by package
  const operatorsByPackage = {};
  for (const op of allOperators.values()) {
    if (!operatorsByPackage[op.package]) {
      operatorsByPackage[op.package] = [];
    }
    operatorsByPackage[op.package].push(op);
  }

  // Import schemas from each package
  for (const [packageName, operators] of Object.entries(operatorsByPackage)) {
    let packageSchemas;
    try {
      packageSchemas = await import(`${packageName}/schemas`);
    } catch {
      // Package not resolvable from build context (custom plugins) — skip
    }
    for (const op of operators) {
      // Custom plugin schemas (pre-loaded by server) take priority over default package schemas
      if (typesMapSchemas[op.typeName]) {
        schemas[op.typeName] = typesMapSchemas[op.typeName];
      } else if (packageSchemas?.[op.originalTypeName]) {
        schemas[op.typeName] = packageSchemas[op.originalTypeName];
      }
    }
  }

  return context.writeBuildArtifact('plugins/operatorSchemas.json', JSON.stringify(schemas));
}

export default writeOperatorSchemaMap;
