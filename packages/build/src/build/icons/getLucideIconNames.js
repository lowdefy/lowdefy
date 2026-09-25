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
import { icons } from 'lucide';

const require = createRequire(import.meta.url);

// lucide's type declarations declare each canonical icon once
// (`declare const House: IconNode;`) and export alias names as renames
// (`House as Home`). Alias and canonical names share one node array, so the
// runtime `icons` object alone cannot tell them apart.
const canonicalDeclarationRegex = /^declare const ([A-Z][A-Za-z0-9]*): IconNode;$/gm;

let namesCache = null;

function getLucideIconNames() {
  if (namesCache !== null) {
    return namesCache;
  }
  const packageJsonPath = require.resolve('lucide/package.json');
  const { typings } = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const declarations = fs.readFileSync(path.join(path.dirname(packageJsonPath), typings), 'utf8');
  const canonical = new Set(
    [...declarations.matchAll(canonicalDeclarationRegex)].map((match) => match[1])
  );
  const allNames = Object.keys(icons).sort();
  namesCache = {
    canonical: allNames.filter((name) => canonical.has(name)),
    aliases: allNames.filter((name) => !canonical.has(name)),
  };
  return namesCache;
}

export default getLucideIconNames;
