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

/**
 * The React updaters of one context's blocks, a set per block id. A Block component registers its
 * updater while it is mounted, and `update(blockId)` re-renders every one registered for the
 * block. A native shell can mount one page instance on two screens at once (in two tabs' stacks,
 * or pushed again over itself): both share the page's context, so both copies register, and both
 * re-render when the block changes.
 */
function createUpdaters() {
  const byBlockId = new Map();

  // Adds the updater for the block (adding it again is harmless); returns the function that
  // removes it.
  function register(blockId, updater) {
    if (!byBlockId.has(blockId)) {
      byBlockId.set(blockId, new Set());
    }
    byBlockId.get(blockId).add(updater);
    return () => {
      const updaters = byBlockId.get(blockId);
      if (updaters === undefined) return;
      updaters.delete(updater);
      if (updaters.size === 0) {
        byBlockId.delete(blockId);
      }
    };
  }

  function update(blockId) {
    // A copy, so an updater that unregisters another while running does not skip it.
    [...(byBlockId.get(blockId) ?? [])].forEach((updater) => updater());
  }

  return { register, update };
}

export default createUpdaters;
