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

function createCounter() {
  const counts = new Map();
  const locations = new Map();
  // The config nodes behind each count, held by reference with the configKey
  // they were counted at, so plugin checks run on exactly the nodes the build
  // counted and report where it counted them (an operator object counted under
  // its parent's ~k has none of its own). A node reached twice is recorded once.
  const nodes = new Map();

  function increment(key, configKey, node) {
    const count = counts.get(key) || 0;
    counts.set(key, count + 1);
    // Store first occurrence location for error reporting
    if (configKey && !locations.has(key)) {
      locations.set(key, configKey);
    }
    // Mandatory and implied types are counted with no config node behind them.
    if (node) {
      if (!nodes.has(key)) {
        nodes.set(key, new Map());
      }
      if (!nodes.get(key).has(node)) {
        nodes.get(key).set(node, configKey);
      }
    }
  }

  function getCount(key) {
    return counts.get(key) || 0;
  }

  function getCounts() {
    return Object.fromEntries(counts);
  }

  function getLocation(key) {
    return locations.get(key) || null;
  }

  function getLocations() {
    return Object.fromEntries(locations);
  }

  function getNodes(key) {
    return [...(nodes.get(key)?.keys() ?? [])];
  }

  // [type, Map(node -> configKey)] for each type with nodes, without copying.
  function getNodeEntries() {
    return nodes.entries();
  }

  // Drops the recorded nodes, so the counted config is not kept alive once
  // the plugin checks have run on it.
  function clearNodes() {
    nodes.clear();
  }

  return {
    increment,
    getCount,
    getCounts,
    getLocation,
    getLocations,
    getNodes,
    getNodeEntries,
    clearNodes,
  };
}

export default createCounter;
