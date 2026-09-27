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
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

// A block that registers its own events (methods.registerEvent) runs their
// actions and operators on any page it is placed on, but only the types in its
// meta.actions / meta.operators reach that page's plugin code
// (countImpliedClientTypes). This reads every block package's source and checks
// the metas declare what the registered events use.
//
// From each blocks.js entry the scan follows imports, static and dynamic,
// relative or into another monorepo package (its built dist), and re-exports.
// From a file imported only by name it reads the top-level declarations
// imported, plus the ones they reference, so a shared helper file (blocks-antd
// headerActions.js) charges each block only for the helpers it uses. Anything
// it cannot read (a call outside a declaration, actions or types that are not
// literals, an unresolvable @lowdefy import) is reported as a problem, so a
// block can never pass by being out of the scan's reach.

const packagesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const blocksDir = path.join(packagesDir, 'plugins/blocks');

const SPECIFIER = `['"]([^'"]+)['"]`;
const IMPORT = new RegExp(
  `import\\s+(?:([\\w$]+)\\s*,?\\s*)?(?:\\{([^}]*)\\}\\s*)?(\\*\\s+as\\s+[\\w$]+\\s*)?from\\s*${SPECIFIER}`,
  'g'
);
const SIDE_EFFECT_IMPORT = new RegExp(`import\\s*${SPECIFIER}`, 'g');
const DYNAMIC_IMPORT = new RegExp(`import\\(\\s*${SPECIFIER}\\s*\\)`, 'g');
const RE_EXPORT = new RegExp(
  `export\\s*(?:\\{([^}]*)\\}|\\*(?:\\s+as\\s+[\\w$]+)?)\\s*from\\s*${SPECIFIER}`,
  'g'
);
const LOCAL_EXPORT = /export\s*\{([^}]*)\}(?!\s*from)/g;
const TOP_LEVEL_DECLARATION =
  /^(export\s+(?:default\s+)?)?(?:async\s+)?(?:function\*?\s*([\w$]*)|class\s+([\w$]+)|(?:const|let|var)\s+([\w$]+)\s*=)/gm;
const ACTION_TYPE = /\btype\s*:\s*['"]([A-Z]\w*)['"]/g;
const ANY_TYPE = /\btype\s*:/g;
const OPERATOR_KEY = /(?<![\w'"$])(_[A-Za-z]\w*)\s*:/g;

// Replaces comments with spaces, keeping strings, offsets and line breaks.
function stripComments(source) {
  let out = '';
  let i = 0;
  while (i < source.length) {
    const char = source[i];
    const next = source[i + 1];
    if (char === "'" || char === '"' || char === '`') {
      let end = i + 1;
      while (end < source.length && source[end] !== char) {
        end += source[end] === '\\' ? 2 : 1;
      }
      out += source.slice(i, end + 1);
      i = end + 1;
    } else if (char === '/' && next === '/') {
      const end = source.indexOf('\n', i);
      const stop = end === -1 ? source.length : end;
      out += ' '.repeat(stop - i);
      i = stop;
    } else if (char === '/' && next === '*') {
      const end = source.indexOf('*/', i + 2);
      const stop = end === -1 ? source.length : end + 2;
      out += source.slice(i, stop).replace(/[^\n]/g, ' ');
      i = stop;
    } else {
      out += char;
      i += 1;
    }
  }
  return out;
}

function parseNames(list) {
  return (list ?? '')
    .split(',')
    .map((entry) => entry.trim().split(/\s+as\s+/))
    .filter(([name]) => name)
    .map(([name, alias]) => ({ name, alias: alias ?? name }));
}

function callText(source, start) {
  let depth = 0;
  let end = start + 'registerEvent'.length;
  do {
    if (source[end] === '(') depth += 1;
    if (source[end] === ')') depth -= 1;
    end += 1;
  } while (depth > 0 && end < source.length);
  return source.slice(start, end);
}

const parsedFiles = new Map();

function parseFile(file) {
  if (parsedFiles.has(file)) return parsedFiles.get(file);
  const source = stripComments(fs.readFileSync(file, 'utf8'));
  const declarations = [...source.matchAll(TOP_LEVEL_DECLARATION)].map((match, i, all) => {
    const names = [match[2] || match[3] || match[4]].filter(Boolean);
    if (match[1]?.includes('default')) names.push('default');
    const end = all[i + 1]?.index ?? source.length;
    return { names, start: match.index, text: source.slice(match.index, end) };
  });
  const calls = [];
  let start = source.indexOf('registerEvent(');
  while (start !== -1) {
    const text = callText(source, start);
    calls.push({ text, declaration: declarations.filter((d) => d.start < start).pop() });
    start = source.indexOf('registerEvent(', start + text.length);
  }
  const aliases = new Map();
  [...source.matchAll(LOCAL_EXPORT)].forEach(([, list]) =>
    parseNames(list).forEach(({ name, alias }) => aliases.set(alias, name))
  );
  const parsed = {
    aliases,
    calls,
    declarations,
    dynamicImports: [...source.matchAll(DYNAMIC_IMPORT)].map((match) => match[1]),
    imports: [...source.matchAll(IMPORT)].map(([, defaultImport, named, namespace, specifier]) => ({
      names: defaultImport || namespace ? null : parseNames(named).map(({ name }) => name),
      specifier,
    })),
    reExports: [...source.matchAll(RE_EXPORT)].map(([, list, specifier]) => ({
      names: list === undefined ? null : parseNames(list),
      specifier,
    })),
    sideEffectImports: [...source.matchAll(SIDE_EFFECT_IMPORT)].map((match) => match[1]),
  };
  parsedFiles.set(file, parsed);
  return parsed;
}

// The file an import reaches, when it is source in this monorepo (not a
// dependency in node_modules), else null.
function resolveImport({ from, specifier, problems }) {
  if (specifier.startsWith('.')) {
    return path.resolve(path.dirname(from), specifier);
  }
  let resolved;
  try {
    resolved = createRequire(from).resolve(specifier);
  } catch (error) {
    if (specifier.startsWith('@lowdefy/')) {
      problems.push(`${from}: cannot resolve "${specifier}" to check it for registerEvent calls.`);
    }
    return null;
  }
  const inMonorepo =
    resolved.startsWith(packagesDir + path.sep) &&
    !resolved.includes(`${path.sep}node_modules${path.sep}`);
  return inMonorepo ? resolved : null;
}

// The declarations a named import runs: those exported under the names, and
// the ones their text references.
function includedDeclarations({ parsed, names }) {
  const wanted = new Set(names.map((name) => parsed.aliases.get(name) ?? name));
  let size;
  do {
    size = wanted.size;
    parsed.declarations
      .filter((declaration) => declaration.names.some((name) => wanted.has(name)))
      .forEach((declaration) =>
        parsed.declarations.forEach((other) =>
          other.names
            .filter((name) => name !== 'default')
            .filter((name) =>
              new RegExp(`\\b${name.replace('$', '\\$')}\\b`).test(declaration.text)
            )
            .forEach((name) => wanted.add(name))
        )
      );
  } while (wanted.size > size);
  return wanted;
}

function readCall({ call, file, found, problems }) {
  const types = [...call.text.matchAll(ACTION_TYPE)].map((match) => match[1]);
  const literal =
    /actions\s*:\s*\[/.test(call.text) && types.length === [...call.text.matchAll(ANY_TYPE)].length;
  if (!literal) {
    problems.push(`${file}: registerEvent actions are not literal: ${call.text.slice(0, 80)}`);
  }
  types.forEach((actionType) => found.actions.add(actionType));
  [...call.text.matchAll(OPERATOR_KEY)].forEach((match) => found.operators.add(match[1]));
}

// names: null reads the whole file; a list reads what those exports run.
function scanFile({ file, names, found, problems, visited }) {
  if (!fs.existsSync(file)) return;
  const key = `${file}:${names ? [...names].sort().join(',') : '*'}`;
  if (visited.has(key)) return;
  visited.add(key);
  const parsed = parseFile(file);
  const whole = names === null || names.includes('default');
  const included = whole ? null : includedDeclarations({ parsed, names });
  parsed.calls.forEach((call) => {
    if (!call.declaration) {
      problems.push(`${file}: a registerEvent call outside any top-level declaration.`);
      return;
    }
    if (whole || call.declaration.names.some((name) => included.has(name))) {
      readCall({ call, file, found, problems });
    }
  });
  const follow = (specifier, followNames) => {
    const target = resolveImport({ from: file, specifier, problems });
    if (target) scanFile({ file: target, names: followNames, found, problems, visited });
  };
  parsed.imports.forEach(({ names: importNames, specifier }) => follow(specifier, importNames));
  parsed.dynamicImports.forEach((specifier) => follow(specifier, null));
  parsed.sideEffectImports.forEach((specifier) => follow(specifier, null));
  parsed.reExports.forEach(({ names: exported, specifier }) => {
    if (exported === null) {
      follow(specifier, whole ? null : names);
      return;
    }
    const wanted = exported.filter(({ alias }) => whole || names.includes(alias));
    if (wanted.length > 0)
      follow(
        specifier,
        wanted.map(({ name }) => name)
      );
  });
}

async function scanPackages() {
  const blocks = [];
  const problems = [];
  const packages = fs
    .readdirSync(blocksDir)
    .filter((name) => fs.existsSync(path.join(blocksDir, name, 'src/blocks.js')));
  for (const packageName of packages) {
    const srcDir = path.join(blocksDir, packageName, 'src');
    const metas = await import(pathToFileURL(path.join(srcDir, 'metas.js')).href);
    const barrel = stripComments(fs.readFileSync(path.join(srcDir, 'blocks.js'), 'utf8'));
    const entries = barrel.matchAll(
      new RegExp(`export\\s*\\{\\s*default as (\\w+)\\s*\\}\\s*from\\s*${SPECIFIER}`, 'g')
    );
    for (const [, blockType, entry] of entries) {
      const found = { actions: new Set(), operators: new Set() };
      const file = path.join(srcDir, entry);
      scanFile({ file, names: null, found, problems, visited: new Set() });
      blocks.push({ blockType, packageName, found, meta: metas[blockType] ?? {} });
    }
  }
  return { blocks, problems: [...new Set(problems)] };
}

let scan;

beforeAll(async () => {
  scan = await scanPackages();
});

test('the scan reads the events blocks register themselves', () => {
  const registering = Object.fromEntries(
    scan.blocks
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

test('the scan can read every registerEvent call a block reaches', () => {
  expect(scan.problems).toEqual([]);
});

test('every block declares the action and operator types of the events it registers', () => {
  const undeclared = scan.blocks
    .map(({ blockType, packageName, found, meta }) => ({
      block: `${packageName}/${blockType}`,
      actions: [...found.actions].filter((action) => !(meta.actions ?? []).includes(action)),
      operators: [...found.operators].filter((op) => !(meta.operators ?? []).includes(op)),
    }))
    .filter(({ actions, operators }) => actions.length > 0 || operators.length > 0);
  expect(undeclared).toEqual([]);
});

test.each([
  ['a line comment', "// methods.registerEvent({ actions: [{ type: 'Request' }] })\nconst a = 1;"],
  ['a block comment', "/* registerEvent(\n{ type: 'Request' }) */\nconst a = 1;"],
])('stripComments drops a registerEvent call in %s and keeps strings', (_, source) => {
  expect(stripComments(source)).not.toContain('registerEvent');
  expect(stripComments("const s = '// kept';")).toBe("const s = '// kept';");
});
