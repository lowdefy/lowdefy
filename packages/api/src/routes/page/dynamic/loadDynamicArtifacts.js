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

// Build artifacts every Dynamic content check reads. readConfigFile caches
// files per server lifetime, and the build package loads only when a page or
// routine first needs it.
async function loadDynamicArtifacts(context) {
  const [{ default: buildDynamicBlocks }, types, blockMetas, blockSchemas, dynamicPolicies] =
    await Promise.all([
      import('@lowdefy/build/dynamic'),
      context.readConfigFile('types.json'),
      context.readConfigFile('plugins/blockMetas.json'),
      context.readConfigFile('plugins/blockSchemas.json'),
      context.readConfigFile('dynamicPolicies.json'),
    ]);
  return {
    blockMetas: blockMetas ?? {},
    blockSchemas: blockSchemas ?? {},
    buildDynamicBlocks,
    dynamicPolicies: dynamicPolicies ?? {},
    types: types ?? {},
  };
}

export default loadDynamicArtifacts;
