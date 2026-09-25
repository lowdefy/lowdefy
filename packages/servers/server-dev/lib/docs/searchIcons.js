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

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { type } from '@lowdefy/helpers';
import { defaultIconAliases, iconPackages } from '@lowdefy/build/dev';

import readBuildArtifact from './readBuildArtifact.js';

const require = createRequire(import.meta.url);

const DEFAULT_LIMIT = 30;

// Lucide is the pack the built-in semantic names use, so its names rank first
// among react-icons results and an app stays in one visual style.
const PREFERRED_PACKAGE = 'react-icons/lu';

const declarationRegex = /export declare const (\w+)/g;

let iconNamesCache = null;

// Names come from each pack's type declarations: requiring the packs would load
// tens of megabytes of icon code into the dev server. Only the packs Lowdefy
// can bundle (iconPackages) are listed; io and io5 share IoIos names.
function getIconNames() {
  if (iconNamesCache !== null) {
    return iconNamesCache;
  }
  const packages = [
    PREFERRED_PACKAGE,
    ...Object.keys(iconPackages).filter((iconPackage) => iconPackage !== PREFERRED_PACKAGE),
  ];
  const names = new Set();
  packages.forEach((iconPackage) => {
    const packageDir = path.dirname(require.resolve(iconPackage));
    const declarations = fs.readFileSync(path.join(packageDir, 'index.d.ts'), 'utf8');
    [...declarations.matchAll(declarationRegex)]
      .map((match) => match[1])
      .sort()
      .forEach((name) => names.add(name));
  });
  iconNamesCache = [...names];
  return iconNamesCache;
}

function matchesWords(text, words) {
  const lowerText = text.toLowerCase();
  return words.every((word) => lowerText.includes(word));
}

function searchIcons({ query, limit = DEFAULT_LIMIT }) {
  if (!type.isString(query) || query.trim() === '') {
    throw new Error('searchIcons requires a "query" string.');
  }
  const words = query
    .trim()
    .toLowerCase()
    .split(/[\s-]+/);
  // The dev build writes every alias (built-in and theme.icons.aliases) here.
  // Before the first build only the built-in names are known.
  const aliases = readBuildArtifact({ name: 'iconAliases.json' }) ?? defaultIconAliases;

  const aliasResults = Object.entries(aliases)
    .filter(([name, icon]) => matchesWords(`${name} ${icon}`, words))
    .map(([name, icon]) => ({ name, icon }));
  const iconResults = getIconNames()
    .filter((name) => matchesWords(name, words))
    .slice(0, limit);

  return {
    aliases: aliasResults,
    icons: iconResults,
    usage:
      'Prefer a semantic name from "aliases" (icon: edit, or <i data-icon="edit"></i> in HTML). Use a react-icons name from "icons" only when no semantic name fits, and prefer Lu (Lucide) names so the app keeps one style. Add app-specific semantic names under theme.icons.aliases in lowdefy.yaml.',
  };
}

export default searchIcons;
