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

async function writeActionSchemaMap({ components, context }) {
  const schemas = {};

  // Use schemas from typesMap (pre-loaded by server for custom plugins)
  const typesMapSchemas = context.typesMap.schemas?.actions ?? {};

  // Group actions by package
  const actionsByPackage = {};
  for (const action of components.imports.actions) {
    if (!actionsByPackage[action.package]) {
      actionsByPackage[action.package] = [];
    }
    actionsByPackage[action.package].push(action);
  }

  // Import schemas from each package
  for (const [packageName, actions] of Object.entries(actionsByPackage)) {
    let packageSchemas;
    try {
      packageSchemas = await import(`${packageName}/schemas`);
    } catch {
      // Package not resolvable from build context (custom plugins) — skip
    }
    for (const action of actions) {
      // Custom plugin schemas (pre-loaded by server) take priority over default package schemas
      if (typesMapSchemas[action.typeName]) {
        schemas[action.typeName] = typesMapSchemas[action.typeName];
      } else if (packageSchemas?.[action.originalTypeName]) {
        schemas[action.typeName] = packageSchemas[action.originalTypeName];
      }
    }
  }

  return context.writeBuildArtifact('plugins/actionSchemas.json', JSON.stringify(schemas));
}

export default writeActionSchemaMap;
