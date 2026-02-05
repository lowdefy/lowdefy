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

async function writeBlockSchemaMap({ components, context }) {
  const schemas = {};

  // Use schemas from typesMap (pre-loaded by server for custom plugins)
  const typesMapSchemas = context.typesMap.schemas?.blocks ?? {};

  // Group blocks by package
  const blocksByPackage = {};
  for (const block of components.imports.blocks) {
    if (!blocksByPackage[block.package]) {
      blocksByPackage[block.package] = [];
    }
    blocksByPackage[block.package].push(block);
  }

  // Import schemas from each package
  for (const [packageName, blocks] of Object.entries(blocksByPackage)) {
    let packageSchemas;
    try {
      packageSchemas = await import(`${packageName}/schemas`);
    } catch {
      // Package not resolvable from build context (custom plugins) — skip
    }
    for (const block of blocks) {
      if (packageSchemas?.[block.originalTypeName]) {
        schemas[block.typeName] = packageSchemas[block.originalTypeName];
      } else if (typesMapSchemas[block.typeName]) {
        schemas[block.typeName] = typesMapSchemas[block.typeName];
      }
    }
  }

  return context.writeBuildArtifact('plugins/blockSchemas.json', JSON.stringify(schemas));
}

export default writeBlockSchemaMap;
