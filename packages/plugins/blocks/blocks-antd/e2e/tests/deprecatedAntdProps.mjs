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
import { fileURLToPath } from 'url';

// antd raises its deprecation warnings at runtime only in a development build,
// and the block e2e app is a production build - so no browser-driven test can
// see them. This scans the block sources instead: which antd props a block
// passes is a static fact of the source, so the check is deterministic and needs
// no server.
//
// Deprecations are per component: `bordered` is deprecated on Card and Select
// but current on QRCode, so every entry names the component it applies to and
// the antd type declaration that documents the deprecation. The declarations are
// re-read on every run, so an entry that antd un-deprecates (or renames) fails
// the check rather than silently asserting a prop antd no longer flags.

const packageDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sourceDirectory = path.join(packageDirectory, 'src');
const antdTypesDirectory = path.join(packageDirectory, 'node_modules', 'antd', 'es');

// component: the JSX tag as written in a block; types: the antd declaration file,
// relative to antd/es, whose `@deprecated` annotations back the listed props.
const deprecations = [
  { component: 'Avatar.Group', types: 'avatar/AvatarGroup.d.ts' },
  { component: 'Card', types: 'card/Card.d.ts' },
  { component: 'Collapse', types: 'collapse/Collapse.d.ts' },
  { component: 'Descriptions.Item', types: 'descriptions/Item.d.ts' },
  { component: 'Drawer', types: 'drawer/DrawerPanel.d.ts' },
  { component: 'Modal', types: 'modal/interface.d.ts' },
  { component: 'Select', types: 'select/index.d.ts' },
  { component: 'Steps', types: 'steps/index.d.ts' },
  { component: 'Tabs', types: 'tabs/index.d.ts' },
  { component: 'Timeline', types: 'timeline/Timeline.d.ts' },
  { component: 'Timeline.Item', types: 'timeline/Timeline.d.ts' },
  { component: 'Tooltip', types: 'tooltip/index.d.ts' },
];

// Props antd flags as deprecated that a block may still pass because migrating
// off them is an API change, not a rename. Every entry is a known debt with the
// migration antd asks for; the check fails on anything not listed here, so new
// deprecated usage cannot land while these are being worked through.
const knownDeprecatedUsage = [
  // Avatar.Group max* -> max={{ count, style, popover: { placement, trigger } }}
  { file: 'blocks/Avatar/Avatar.js', component: 'Avatar.Group', prop: 'maxCount' },
  { file: 'blocks/Avatar/Avatar.js', component: 'Avatar.Group', prop: 'maxPopoverPlacement' },
  { file: 'blocks/Avatar/Avatar.js', component: 'Avatar.Group', prop: 'maxPopoverTrigger' },
  { file: 'blocks/Avatar/Avatar.js', component: 'Avatar.Group', prop: 'maxStyle' },
  // Descriptions.Item label/content styles -> styles={{ label, content }}, which
  // lands with the Descriptions `items` migration.
  {
    file: 'blocks/Descriptions/Descriptions.js',
    component: 'Descriptions.Item',
    prop: 'contentStyle',
  },
  {
    file: 'blocks/Descriptions/Descriptions.js',
    component: 'Descriptions.Item',
    prop: 'labelStyle',
  },
  // Modal maskClosable -> mask={{ closable }}, as Drawer already does.
  { file: 'blocks/Modal/Modal.js', component: 'Modal', prop: 'maskClosable' },
  // Steps progressDot -> type + iconRender.
  { file: 'blocks/Steps/Steps.js', component: 'Steps', prop: 'progressDot' },
  // Timeline pending/pendingDot and the Timeline.Item props all land with the
  // Timeline `items` migration.
  { file: 'blocks/TimelineList/TimelineList.js', component: 'Timeline', prop: 'pending' },
  { file: 'blocks/TimelineList/TimelineList.js', component: 'Timeline', prop: 'pendingDot' },
  { file: 'blocks/TimelineList/TimelineList.js', component: 'Timeline.Item', prop: 'dot' },
  { file: 'blocks/TimelineList/TimelineList.js', component: 'Timeline.Item', prop: 'label' },
  { file: 'blocks/TimelineList/TimelineList.js', component: 'Timeline.Item', prop: 'position' },
];

// A prop is deprecated when its declaration is preceded by an `@deprecated` tag,
// either as a one-line jsdoc comment or as a tag inside a multi-line block.
function readDeprecatedProps({ types }) {
  const declaration = fs.readFileSync(path.join(antdTypesDirectory, types), 'utf8');
  const props = new Set();
  let deprecated = false;
  declaration.split('\n').forEach((line) => {
    if (line.includes('@deprecated')) {
      deprecated = true;
      return;
    }
    const property = line.match(/^\s*(?:readonly\s+)?['"]?([A-Za-z_$][\w$]*)['"]?\??\s*:/);
    if (property === null) return;
    if (deprecated) props.add(property[1]);
    deprecated = false;
  });
  return props;
}

function listSourceFiles(directory, files = []) {
  fs.readdirSync(directory, { withFileTypes: true }).forEach((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      // tests/ holds e2e fixtures and specs, not shipped block code.
      if (entry.name !== 'tests') listSourceFiles(entryPath, files);
      return;
    }
    if (entry.name.endsWith('.js')) files.push(entryPath);
  });
  return files;
}

// Reads the props of one JSX opening tag. Attributes are collected only at brace
// depth zero, so props of nested elements passed as expressions (render props,
// icons) are attributed to their own tag and not to the outer one.
function readTagProps({ source, component }) {
  const usages = [];
  const openingTag = new RegExp(`<${component.replace(/\./g, '\\.')}(?=[\\s/>])`, 'g');
  let match = openingTag.exec(source);
  while (match !== null) {
    const props = new Set();
    let depth = 0;
    let identifier = '';
    let index = match.index + match[0].length;
    while (index < source.length) {
      const character = source[index];
      if (depth === 0 && character === '>') break;
      if (character === '{') depth += 1;
      else if (character === '}') depth -= 1;
      else if (depth === 0) {
        if (/[\w$]/.test(character)) {
          identifier += character;
        } else {
          if (character === '=' && identifier !== '') props.add(identifier);
          identifier = '';
        }
      }
      index += 1;
    }
    usages.push({ props: [...props], line: source.slice(0, match.index).split('\n').length });
    match = openingTag.exec(source);
  }
  return usages;
}

// A block may define a local component with the same name as an antd one, so a
// tag only counts when the file imports its root name from antd.
function importsFromAntd({ source, component }) {
  const root = component.split('.')[0];
  const antdImport = source.match(/import\s*\{([^}]*)\}\s*from\s*'antd'/);
  if (antdImport === null) return false;
  return antdImport[1]
    .split(',')
    .map((name) =>
      name
        .trim()
        .split(/\s+as\s+/)
        .pop()
    )
    .includes(root);
}

function findDeprecatedPropUsage() {
  const found = [];
  const deprecatedProps = new Map(
    deprecations.map(({ component, types }) => [component, readDeprecatedProps({ types })])
  );
  listSourceFiles(sourceDirectory).forEach((file) => {
    const source = fs.readFileSync(file, 'utf8');
    deprecations.forEach(({ component }) => {
      if (!importsFromAntd({ source, component })) return;
      readTagProps({ source, component }).forEach(({ props, line }) => {
        props.forEach((prop) => {
          if (!deprecatedProps.get(component).has(prop)) return;
          found.push({
            component,
            file: path.relative(sourceDirectory, file).split(path.sep).join('/'),
            line,
            prop,
          });
        });
      });
    });
  });
  return found.sort((a, b) =>
    `${a.file}${a.component}${a.prop}`.localeCompare(`${b.file}${b.component}${b.prop}`)
  );
}

export {
  antdTypesDirectory,
  deprecations,
  findDeprecatedPropUsage,
  knownDeprecatedUsage,
  readDeprecatedProps,
};
