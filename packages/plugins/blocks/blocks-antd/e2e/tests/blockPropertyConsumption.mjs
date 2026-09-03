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
// fixed fails as stale - so the list can neither grow quietly nor rot.
const knownMismatches = [
  // meta describes `theme` as "antd design token overrides for this block", but
  // these components are not wrapped in withTheme, which is what reads it. A
  // theme set on one of these blocks is dropped.
  ...['ConfigProvider', 'Content', 'Footer', 'Header', 'Label', 'Layout', 'Message'].map(
    (block) => ({
      block,
      direction: 'unconsumed',
      package: 'blocks-antd',
      property: 'theme',
      reason: 'Declared as an antd design token override, but the block does not use withTheme.',
    })
  ),
  {
    block: 'Label',
    direction: 'unconsumed',
    package: 'blocks-antd',
    property: 'span',
    reason: 'Documented as "Label inline span"; the component never reads it.',
  },
  {
    block: 'Search',
    direction: 'unconsumed',
    package: 'blocks-antd',
    property: 'icon',
    reason: 'The component always renders SearchOutlined; the configured icon is ignored.',
  },
  {
    block: 'Progress',
    direction: 'unconsumed',
    package: 'blocks-antd',
    property: 'gapPosition',
    reason: 'antd renamed the prop to gapPlacement; the component moved, the meta did not.',
  },
  {
    block: 'Progress',
    direction: 'undeclared',
    package: 'blocks-antd',
    property: 'gapPlacement',
    reason: 'The name the component reads, which no schema lets an app set.',
  },
  ...[
    { block: 'Card', property: 'variant', reason: 'antd v6 replacement for bordered.' },
    {
      block: 'Label',
      property: 'hasFeedback',
      reason:
        'labelLogic reads it; the input blocks declare it as label.hasFeedback but Label itself does not.',
    },
    {
      block: 'CheckboxSelector',
      property: 'size',
      reason: 'Passed to the block label; only theme.fontSize is declared.',
    },
    {
      block: 'CheckboxSwitch',
      property: 'size',
      reason: 'Passed to the block label; only theme.fontSize is declared.',
    },
    {
      block: 'Collapse',
      property: 'expandIconPosition',
      reason: 'Read straight onto the antd Collapse.',
    },
    { block: 'Drawer', property: 'getContainer', reason: 'Read straight onto the antd Drawer.' },
    { block: 'DropdownMenu', property: 'shortcut', reason: 'Read when building menu items.' },
    { block: 'Menu', property: 'shortcut', reason: 'Read when building menu items.' },
    { block: 'Modal', property: 'okButtonType', reason: 'Read for the ok button type.' },
    {
      block: 'PageHeaderMenu',
      property: 'iconsColor',
      reason: 'Read for the header icon colour.',
    },
    { block: 'PageSiderMenu', property: 'iconsColor', reason: 'Read for the header icon colour.' },
    { block: 'PageSiderMenu', property: 'layout', reason: 'Read for the page layout.' },
    { block: 'RadioSelector', property: 'size', reason: 'Passed to the block label.' },
    {
      block: 'RatingSlider',
      property: 'CheckboxInput',
      reason: 'Merged into the embedded CheckboxInput block properties.',
    },
    { block: 'RatingSlider', property: 'marks', reason: 'Read as the slider marks override.' },
    { block: 'RatingSlider', property: 'size', reason: 'Passed to the block label.' },
  ].map((entry) => ({ ...entry, direction: 'undeclared', package: 'blocks-antd' })),
];

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
// for a child block.
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
  for (const match of source.matchAll(/\bproperties\s*(?:\?\.)?\.([A-Za-z_$][\w$]*)/g)) {
    names.add(match[1]);
  }
  for (const match of source.matchAll(/\bproperties\s*(?:\?\.)?\[\s*['"]([^'"]+)['"]\s*\]/g)) {
    names.add(match[1]);
  }
  for (const match of source.matchAll(/\{([^{}]*)\}\s*=\s*(?:\w+\.)?properties\b/g)) {
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
    ...source.matchAll(/\{[^{}]*\.\.\.\s*([A-Za-z_$][\w$]*)\s*\}\s*=\s*(?:\w+\.)?properties\b/g),
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
