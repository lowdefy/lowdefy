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
import { defaultIconAliases, getLucideIconNames, loadIconSets } from '@lowdefy/build/dev';

import readBuildArtifact from './readBuildArtifact.js';

const DEFAULT_LIMIT = 30;

let setNamesCache = { key: null, names: [] };

// Installed icon sets are read through the loader the build uses, so search
// and the build agree. Icons a plugin adds to "lucide" are listed unqualified,
// like Lucide's own; every other set's names are listed qualified, which
// always resolve. Cached until the plugin list in the build changes.
async function getSetNames() {
  const iconSets = readBuildArtifact({ name: 'customTypesMap.json' })?.iconSets ?? {};
  const key = JSON.stringify(iconSets);
  if (setNamesCache.key === key) {
    return setNamesCache.names;
  }
  const sets = await loadIconSets({
    context: { directories: { server: process.cwd() }, typesMap: { iconSets } },
  });
  const lucideNames = new Set(Object.values(getLucideIconNames()).flat());
  const names = [];
  Object.entries(sets).forEach(([setId, layers]) => {
    const setNames = new Set(layers.flatMap((layer) => [...layer.names]));
    [...setNames].sort().forEach((name) => {
      if (setId !== 'lucide') {
        names.push(`${setId}:${name}`);
      } else if (!lucideNames.has(name)) {
        names.push(name);
      }
    });
  });
  setNamesCache = { key, names };
  return names;
}

function matchesWords(text, words) {
  const lowerText = text.toLowerCase();
  return words.every((word) => lowerText.includes(word));
}

async function searchIcons({ query, limit = DEFAULT_LIMIT }) {
  if (!type.isString(query) || query.trim() === '') {
    throw new Error('searchIcons requires a "query" string.');
  }
  const words = query
    .trim()
    .toLowerCase()
    .split(/[\s-]+/);
  // The dev build writes the full semantic map (built-in, the default icon
  // set's and theme.icons.aliases). Before the first build only the built-in
  // names are known.
  const semantic = readBuildArtifact({ name: 'iconAliases.json' }) ?? defaultIconAliases;

  const semanticResults = Object.entries(semantic)
    .filter(([name, icon]) => matchesWords(`${name} ${icon}`, words))
    .map(([name, icon]) => ({ name, icon }));
  // Canonical Lucide names rank before alias names (Home is an alias of House).
  const { canonical, aliases } = getLucideIconNames();
  const iconResults = [...canonical, ...aliases, ...(await getSetNames())]
    .filter((name) => matchesWords(name, words))
    .slice(0, limit);

  return {
    semantic: semanticResults,
    icons: iconResults,
    usage:
      'Use a semantic name from "semantic" (icon: edit, or <i data-icon="edit"></i> in HTML). Otherwise use a Lucide name from "icons" in PascalCase (icon: Receipt). Never invent a name. Qualified names (set:Name) come from installed icon set plugins. Add app-specific semantic names under theme.icons.aliases in lowdefy.yaml.',
  };
}

export default searchIcons;
