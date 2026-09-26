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

import { type } from '@lowdefy/helpers';

import { qualifiedNamePattern, semanticNamePattern, setNamePattern } from './iconNamePatterns.js';

// Per icon name, the topmost layer that has it wins, so a later plugin
// replaces an icon and a partial layer falls through to the layers below.
function findInSet({ sets, setId, iconName }) {
  const layers = sets[setId] ?? [];
  for (let layer = layers.length - 1; layer >= 0; layer -= 1) {
    if (layers[layer].names.has(iconName)) {
      return { setId, layer, iconName };
    }
  }
  return null;
}

function resolveSetName({ name, sets, defaultSet }) {
  const qualified = qualifiedNamePattern.exec(name);
  if (qualified) {
    // The author asked for that set by name, so there is no fallback.
    return findInSet({ sets, setId: qualified[1], iconName: qualified[2] });
  }
  if (!setNamePattern.test(name)) {
    return null;
  }
  const inDefaultSet = findInSet({ sets, setId: defaultSet, iconName: name });
  if (inDefaultSet) {
    return inDefaultSet;
  }
  // A default set other than Lucide keeps every Lucide name working.
  return findInSet({ sets, setId: 'lucide', iconName: name });
}

// Resolves a semantic, set or qualified icon name to the set layer that draws
// it: { setId, layer, iconName }, or null when nothing does. The build
// (bundling and validation), dev JIT and icon search all resolve through here.
function resolveIconName({ name, sets, defaultSet, semantic }) {
  if (!type.isString(name)) {
    return null;
  }
  if (semanticNamePattern.test(name)) {
    if (!Object.hasOwn(semantic, name)) {
      return null;
    }
    // A semantic target is a set or qualified name, never another semantic
    // name, so there is one hop and nothing to resolve in cycles.
    return resolveSetName({ name: semantic[name], sets, defaultSet });
  }
  return resolveSetName({ name, sets, defaultSet });
}

export default resolveIconName;
