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
import { ConfigError } from '@lowdefy/errors';

import resolveIconName from './resolveIconName.js';

function withLayerAttrs({ data, layer }) {
  if (type.isNone(layer.attrs)) {
    return data;
  }
  return { ...data, attrs: { ...layer.attrs, ...(data.attrs ?? {}) } };
}

// Loads IconData for icon names the caller has already resolved, keyed by the
// names as used (semantic, set and qualified). Each layer's loadIcons is called
// once with every icon it draws, so a set reads only the data the app uses.
async function loadIconData({ names, icons }) {
  const requests = new Map();
  names.forEach((name) => {
    const resolved = resolveIconName({ name, ...icons });
    if (resolved === null) {
      throw new Error(`Icon "${name}" does not resolve; only resolved names can be loaded.`);
    }
    const requestKey = `${resolved.setId}:${resolved.layer}`;
    if (!requests.has(requestKey)) {
      requests.set(requestKey, { ...resolved, iconNames: new Set(), usedNames: [] });
    }
    const request = requests.get(requestKey);
    request.iconNames.add(resolved.iconName);
    request.usedNames.push({ name, iconName: resolved.iconName });
  });

  const iconData = {};
  for (const request of requests.values()) {
    const layer = icons.sets[request.setId][request.layer];
    const loaded = await layer.loadIcons({ names: [...request.iconNames] });
    request.usedNames.forEach(({ name, iconName }) => {
      const data = loaded?.[iconName];
      if (!type.isObject(data) || !type.isArray(data.node)) {
        throw new ConfigError(
          `Icon set "${request.setId}" from "${layer.package}" lists "${iconName}", but its loadIcons returned no icon data for it.`
        );
      }
      iconData[name] = withLayerAttrs({ data, layer });
    });
  }
  return iconData;
}

export default loadIconData;
