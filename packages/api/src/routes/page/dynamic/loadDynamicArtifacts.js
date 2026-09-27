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
// readConfigFile returns the same cached array per server lifetime, so the set
// is built once.
const clientOperatorSets = new WeakMap();

function getClientOperatorSet(names) {
  if (names === null) {
    return null;
  }
  if (!clientOperatorSets.has(names)) {
    clientOperatorSets.set(names, new Set(names));
  }
  return clientOperatorSets.get(names);
}

async function loadDynamicArtifacts(context) {
  const [
    { default: buildDynamicBlocks },
    types,
    blockMetas,
    blockSchemas,
    clientOperators,
    dynamicPolicies,
  ] = await Promise.all([
    import('@lowdefy/build/dynamic'),
    context.readConfigFile('types.json'),
    context.readConfigFile('plugins/blockMetas.json'),
    context.readConfigFile('plugins/blockSchemas.json'),
    context.readConfigFile('plugins/clientOperators.json'),
    context.readConfigFile('dynamicPolicies.json'),
  ]);
  return {
    blockMetas: blockMetas ?? {},
    blockSchemas: blockSchemas ?? {},
    buildDynamicBlocks,
    // Every client operator name the app knows, so only keys the client would
    // run count as operators. Without the list every operator-shaped key counts.
    clientOperators: getClientOperatorSet(clientOperators),
    dynamicPolicies: dynamicPolicies ?? {},
    types: types ?? {},
  };
}

export default loadDynamicArtifacts;
