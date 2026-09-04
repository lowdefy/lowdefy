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

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

// The build already rejects a property a block's schema does not declare. This is
// the inverse, which nothing checks: a property the schema *does* declare that the
// component never reads. Setting it is valid config that does nothing at all - the
// silent failure the property schema was added to kill, only in the direction the
// schema cannot see.
//
// It is a static fact of the source which property names a component reads, so
// this needs no browser and no server. Scoped to the two block packages the
// framework owns; a third-party block author is not held to it.

const packageDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const blockPackages = [
  { directory: packageDirectory, name: 'blocks-antd' },
  { directory: path.resolve(packageDirectory, '../blocks-basic'), name: 'blocks-basic' },
];

// Properties a component is right not to read, with what consumes them instead.
// Anything not listed here is a finding.
const consumedElsewhere = [
  {
    block: 'Dynamic',
    package: 'blocks-basic',
    properties: ['endpointId', 'params', 'required', 'types'],
    reason:
      'Server-resolved container: the server calls the endpoint at page get and fills the content slot, so the client component only renders what it is handed.',
  },
];

// Mismatches that exist today, each with why it is wrong. Closed in both
// directions - an unrecorded mismatch fails, and a recorded one that has been
// fixed fails as stale - so the list can neither grow quietly nor rot. It is
// empty: every property the two packages declare is read, and every property
// they read is declared.
const knownMismatches = [];

// A block's own files, and the local modules they reach, are two different
// questions. Which properties the block *reads* must come from its own directory
// only - a shared helper reads whatever the block that calls it hands over, and
// crediting those names to every caller would declare half the corpus undeclared.
// Which properties are *consumed* must follow the imports, because a block that
// delegates rendering to a sibling module consumes its properties there.
function listBlockFiles(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      // tests/ holds e2e fixtures, and meta.js is the declaration being checked.
      if (entry.name !== 'tests') listBlockFiles(entryPath, files);
      continue;
    }
    if (!entry.name.endsWith('.js')) continue;
    if (entry.name === 'meta.js' || entry.name === 'e2e.js') continue;
    files.push(entryPath);
  }
  return files;
}

function readReachableSource(entryFiles) {
  const seen = new Set();
  const queue = [...entryFiles];
  const sources = [];
  while (queue.length > 0) {
    const filePath = queue.shift();
    if (seen.has(filePath) || !fs.existsSync(filePath)) continue;
    seen.add(filePath);
    const source = fs.readFileSync(filePath, 'utf8');
    sources.push(source);
    for (const match of source.matchAll(/from\s*'([^']+)'/g)) {
      if (!match[1].startsWith('.')) continue;
      const resolved = path.resolve(path.dirname(filePath), match[1]);
      if (!resolved.includes(`${path.sep}tests${path.sep}`)) queue.push(resolved);
    }
  }
  return sources.join('\n');
}

// The four ways a component names a property: a member read, a computed read with
// a string literal, a destructuring of properties, and a properties object built
// for a child block. A destructuring is matched through any member chain, because
// a class component reads `this.props.properties`, not `props.properties`.
//
// A member read is matched only on the block's own properties - `properties`,
// `props.properties` or `this.props.properties`. `link.properties.shortcut` names
// a property of a nested config item, which the block never declares itself.
const OWN_PROPERTIES = String.raw`(?<![\w$.])(?:this\.)?(?:props\.)?properties`;

function readPropertyNames(source) {
  const names = new Set();
  const addBindings = (pattern) => {
    for (const binding of pattern.split(',')) {
      const trimmed = binding.trim();
      if (trimmed.startsWith('...')) continue;
      const name = trimmed.match(/^([A-Za-z_$][\w$]*)/);
      if (name !== null) names.add(name[1]);
    }
  };
  const memberRead = new RegExp(`${OWN_PROPERTIES}\\s*(?:\\?\\.)?\\.([A-Za-z_$][\\w$]*)`, 'g');
  const computedRead = new RegExp(
    `${OWN_PROPERTIES}\\s*(?:\\?\\.)?\\[\\s*['"]([^'"]+)['"]\\s*\\]`,
    'g'
  );
  for (const match of source.matchAll(memberRead)) {
    names.add(match[1]);
  }
  for (const match of source.matchAll(computedRead)) {
    names.add(match[1]);
  }
  for (const match of source.matchAll(/\{([^{}]*)\}\s*=\s*(?:[\w$]+\.)*properties\b/g)) {
    addBindings(match[1]);
  }
  for (const match of source.matchAll(/\bproperties\s*:\s*\{([^{}]*)\}/g)) {
    addBindings(match[1]);
  }
  return names;
}

// A block that spreads its properties onward hands every one of them to the
// component underneath, so which it "reads" cannot be decided from the source and
// the unconsumed check does not apply. Only a spread that carries properties
// counts: the rest of a properties destructuring, or the rest of the component's
// own props, spread into a child.
function forwardsAllProperties(source) {
  if (/\.\.\.\s*properties\b/.test(source)) return true;
  const restBindings = [
    ...source.matchAll(/\{[^{}]*\.\.\.\s*([A-Za-z_$][\w$]*)\s*\}\s*=\s*(?:[\w$]+\.)*properties\b/g),
    ...source.matchAll(/=\s*\(\s*\{[^)]*\.\.\.\s*([A-Za-z_$][\w$]*)\s*\}\s*\)/g),
  ];
  return restBindings.some(([, name]) => new RegExp(`\\{\\s*\\.\\.\\.\\s*${name}\\b`).test(source));
}

async function scanBlockPropertyConsumption() {
  const allowed = new Map(
    consumedElsewhere.flatMap(({ block, package: packageName, properties }) =>
      properties.map((property) => [`${packageName}|${block}|${property}`, true])
    )
  );
  const findings = [];
  const counts = { blocks: 0, forwarding: 0, properties: 0 };

  for (const blockPackage of blockPackages) {
    const blocksDirectory = path.join(blockPackage.directory, 'src/blocks');
    for (const block of fs.readdirSync(blocksDirectory).sort()) {
      const blockDirectory = path.join(blocksDirectory, block);
      if (!fs.statSync(blockDirectory).isDirectory()) continue;
      const metaPath = path.join(blockDirectory, 'meta.js');
      if (!fs.existsSync(metaPath)) continue;
      const meta = (await import(pathToFileURL(metaPath).href)).default;
      const declared = Object.keys(meta?.properties?.properties ?? {});
      if (declared.length === 0) continue;
      counts.blocks += 1;
      counts.properties += declared.length;

      const ownFiles = listBlockFiles(blockDirectory);
      const ownSource = ownFiles.map((filePath) => fs.readFileSync(filePath, 'utf8')).join('\n');
      const reachableSource = readReachableSource(ownFiles);

      const reachableNames = readPropertyNames(reachableSource);
      // withTheme is the wrapper that reads properties.theme off a block.
      if (/withTheme\(/.test(reachableSource)) reachableNames.add('theme');

      if (forwardsAllProperties(reachableSource)) {
        counts.forwarding += 1;
      } else {
        for (const property of declared) {
          if (reachableNames.has(property)) continue;
          if (allowed.has(`${blockPackage.name}|${block}|${property}`)) continue;
          findings.push({ block, direction: 'unconsumed', package: blockPackage.name, property });
        }
      }

      for (const property of readPropertyNames(ownSource)) {
        if (declared.includes(property)) continue;
        findings.push({ block, direction: 'undeclared', package: blockPackage.name, property });
      }
    }
  }
  return { counts, findings };
}

export {
  blockPackages,
  consumedElsewhere,
  forwardsAllProperties,
  knownMismatches,
  readPropertyNames,
  scanBlockPropertyConsumption,
};
