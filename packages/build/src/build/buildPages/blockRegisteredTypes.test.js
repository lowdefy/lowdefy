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

// A block that registers its own events (methods.registerEvent) runs their
// actions and operators on any page it is placed on, but only the types in its
// meta.actions / meta.operators reach that page's plugin code
// (countImpliedClientTypes). This reads every block package's source and checks
// the metas declare what the registered events use.
//
// The scan follows a block's relative imports, static and dynamic (a lazy
// block's implementation). From a file imported only by name it reads just the
// top-level functions imported, so a shared helper file (blocks-antd
// headerActions.js) charges each block only for the helpers it uses.

const blocksDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../../plugins/blocks'
);

const IMPORT =
  /import\s+(?:([\w$]+)\s*,?\s*)?(?:\{([^}]*)\}\s*)?(?:\*\s+as\s+[\w$]+\s*)?from\s*'(\.{1,2}\/[^']+)'/g;
const DYNAMIC_IMPORT = /import\(\s*'(\.{1,2}\/[^']+)'\s*\)/g;
const TOP_LEVEL_DECLARATION =
  /^(?:export\s+)?(?:async\s+)?(?:function\s+([\w$]+)|const\s+([\w$]+)\s*=)/gm;
const ACTION_TYPE = /\btype:\s*'([A-Z]\w*)'/g;
const OPERATOR_KEY = /(?<![\w'"$])(_[A-Za-z]\w*)\s*:/g;

// The text of each registerEvent(...) call, with its enclosing top-level declaration.
function registerEventCalls(source) {
  const declarations = [...source.matchAll(TOP_LEVEL_DECLARATION)].map((match) => ({
    index: match.index,
    name: match[1] ?? match[2],
  }));
  const calls = [];
  let start = source.indexOf('registerEvent(');
  while (start !== -1) {
    let depth = 0;
    let end = start + 'registerEvent'.length;
    do {
      if (source[end] === '(') depth += 1;
      if (source[end] === ')') depth -= 1;
      end += 1;
    } while (depth > 0 && end < source.length);
    const enclosing = declarations.filter((declaration) => declaration.index < start).pop();
    calls.push({ text: source.slice(start, end), declaration: enclosing?.name });
    start = source.indexOf('registerEvent(', end);
  }
  return calls;
}

function scanFile({ file, names, found, visited }) {
  const key = `${file}:${names ? [...names].sort().join(',') : '*'}`;
  if (visited.has(key) || !fs.existsSync(file)) return;
  visited.add(key);
  const source = fs.readFileSync(file, 'utf8');
  registerEventCalls(source)
    .filter((call) => !names || names.has(call.declaration))
    .forEach((call) => {
      [...call.text.matchAll(ACTION_TYPE)].forEach((match) => found.actions.add(match[1]));
      [...call.text.matchAll(OPERATOR_KEY)].forEach((match) => found.operators.add(match[1]));
    });
  const dir = path.dirname(file);
  [...source.matchAll(IMPORT)].forEach(([, defaultImport, namedImports, specifier]) => {
    const imported = defaultImport
      ? null
      : new Set(
          (namedImports ?? '')
            .split(',')
            .map((name) => name.trim().split(/\s+as\s+/)[0])
            .filter(Boolean)
        );
    scanFile({ file: path.resolve(dir, specifier), names: imported, found, visited });
  });
  [...source.matchAll(DYNAMIC_IMPORT)].forEach(([, specifier]) =>
    scanFile({ file: path.resolve(dir, specifier), names: null, found, visited })
  );
}

async function scanPackages() {
  const blocks = [];
  const packages = fs
    .readdirSync(blocksDir)
    .filter((name) => fs.existsSync(path.join(blocksDir, name, 'src/blocks.js')));
  for (const packageName of packages) {
    const srcDir = path.join(blocksDir, packageName, 'src');
    const metas = await import(pathToFileURL(path.join(srcDir, 'metas.js')).href);
    const entries = fs
      .readFileSync(path.join(srcDir, 'blocks.js'), 'utf8')
      .matchAll(/export\s*\{\s*default as (\w+)\s*\}\s*from\s*'(\.\/[^']+)'/g);
    for (const [, blockType, entry] of entries) {
      const found = { actions: new Set(), operators: new Set() };
      scanFile({ file: path.join(srcDir, entry), names: null, found, visited: new Set() });
      blocks.push({ blockType, packageName, found, meta: metas[blockType] ?? {} });
    }
  }
  return blocks;
}

let blocks;

beforeAll(async () => {
  blocks = await scanPackages();
});

test('the scan reads the events blocks register themselves', () => {
  const registering = Object.fromEntries(
    blocks
      .filter(({ found }) => found.actions.size > 0)
      .map(({ blockType, found }) => [blockType, [...found.actions].sort()])
  );
  expect(registering).toMatchObject({
    AgentChat: ['Request', 'SetState'],
    Download: ['Request'],
    Header: ['SetDarkMode'],
    PageHeaderMenu: ['SetDarkMode', 'SetLocale'],
    TiptapMentionInput: ['Request'],
  });
});

test('every block declares the action and operator types of the events it registers', () => {
  const undeclared = blocks
    .map(({ blockType, packageName, found, meta }) => ({
      block: `${packageName}/${blockType}`,
      actions: [...found.actions].filter((action) => !(meta.actions ?? []).includes(action)),
      operators: [...found.operators].filter((op) => !(meta.operators ?? []).includes(op)),
    }))
    .filter(({ actions, operators }) => actions.length > 0 || operators.length > 0);
  expect(undeclared).toEqual([]);
});
