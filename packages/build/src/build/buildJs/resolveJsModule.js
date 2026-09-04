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

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import * as espree from 'espree';
import { ConfigError, LowdefyInternalError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import findSimilarString from '../../utils/findSimilarString.js';

const moduleReferenceRegex = /^\.{1,2}\/[^#]+\.(?:js|mjs)#([A-Za-z_$][\w$]*)$/;

function collectExports(ast) {
  const names = new Set();
  let hasExportAll = false;
  for (const node of ast.body) {
    if (node.type === 'ExportDefaultDeclaration') {
      names.add('default');
    }
    if (node.type === 'ExportAllDeclaration') {
      if (node.exported) {
        names.add(node.exported.name);
      } else {
        hasExportAll = true;
      }
    }
    if (node.type !== 'ExportNamedDeclaration') continue;
    const declaration = node.declaration;
    if (declaration) {
      if (declaration.type === 'VariableDeclaration') {
        for (const declarator of declaration.declarations) {
          collectPatternNames(declarator.id, names);
        }
      } else if (declaration.id) {
        names.add(declaration.id.name);
      }
    }
    for (const specifier of node.specifiers) {
      names.add(specifier.exported.name ?? specifier.exported.value);
    }
  }
  return { names, hasExportAll };
}

// export const { a, b: [c] } = obj; declares a, b-less c — walk the pattern.
function collectPatternNames(pattern, names) {
  if (pattern.type === 'Identifier') {
    names.add(pattern.name);
  } else if (pattern.type === 'ObjectPattern') {
    for (const property of pattern.properties) {
      collectPatternNames(
        property.type === 'RestElement' ? property.argument : property.value,
        names
      );
    }
  } else if (pattern.type === 'ArrayPattern') {
    for (const element of pattern.elements) {
      if (element) collectPatternNames(element, names);
    }
  } else if (pattern.type === 'AssignmentPattern') {
    collectPatternNames(pattern.left, names);
  } else if (pattern.type === 'RestElement') {
    collectPatternNames(pattern.argument, names);
  }
}

// addKeys moves a node's ~r into its keyMap entry before buildJs runs, so the
// containing file is found from the node's configKey — walking up ~k_parent
// for nodes created by build steps that never carried a ref of their own.
// Every _js node comes from a config file, so a miss is a broken keyMap, not a
// reason to reinterpret the path as relative to the config root.
function findRefId({ context, configKey, refId }) {
  if (!type.isNone(refId)) return refId;
  let key = configKey;
  let depth = 0;
  while (!type.isNone(key) && depth < 100) {
    const entry = context.keyMap[key];
    if (type.isNone(entry)) break;
    if (!type.isNone(entry['~r'])) return entry['~r'];
    key = entry['~k_parent'];
    depth += 1;
  }
  throw new LowdefyInternalError(
    `_js module reference at config key "${configKey}" could not be traced to the config file that contains it.`
  );
}

function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

// A module reference is resolved relative to the config file that contains the
// _js node (refMap[refId].path), not the config root — the specifier must mean
// what it means to every JS toolchain, so go-to-definition works and a config
// file moves together with its lib/. The hash is keyed on the config-root
// relative path so two files that both write "./lib/x.js#run" from different
// directories get different entries.
function resolveJsModule({ context, configKey, env, fn, refId }) {
  const match = fn.match(moduleReferenceRegex);
  if (!match) {
    throw new ConfigError(
      `_js module reference must be "<relative path to a .js or .mjs file>#<exportName>". Received "${fn}".`,
      { configKey, checkSlug: 'js-modules' }
    );
  }
  const [modulePath] = fn.split('#');
  const exportName = match[1];
  const refPath = context.refMap[findRefId({ context, configKey, refId })]?.path;
  const containingDirectory = type.isString(refPath) ? path.dirname(refPath) : '.';
  const absolutePath = path.resolve(context.directories.config, containingDirectory, modulePath);
  const relativePath = toPosix(path.relative(context.directories.config, absolutePath));

  if (relativePath.startsWith('..')) {
    throw new ConfigError(
      `_js module "${modulePath}" resolves outside the config directory (resolved to "${absolutePath}"). Modules must live inside the config directory so the built server can carry a copy.`,
      { configKey, checkSlug: 'js-modules' }
    );
  }
  if (!fs.existsSync(absolutePath)) {
    // _ref is relative to the config root and a module is relative to the file
    // that names it, so both readings are printed - the second is the mistake
    // an author who knows _ref makes.
    const fromConfigRoot = path.resolve(context.directories.config, modulePath);
    throw new ConfigError(
      `_js module file not found: "${modulePath}" resolved to "${absolutePath}", relative to the config file "${toPosix(
        containingDirectory
      )}" that contains it. Module paths are relative to their own config file, unlike _ref, which is relative to the config root — that reading would be "${fromConfigRoot}".`,
      { configKey, checkSlug: 'js-modules' }
    );
  }

  const source = fs.readFileSync(absolutePath, 'utf8');
  let ast;
  try {
    ast = espree.parse(source, { ecmaVersion: 'latest', sourceType: 'module' });
  } catch (error) {
    throw new ConfigError(
      `_js module "${modulePath}" could not be parsed: ${error.message} (line ${error.lineNumber}, column ${error.column}).`,
      { configKey, checkSlug: 'js-modules' }
    );
  }

  const { names, hasExportAll } = collectExports(ast);
  if (!names.has(exportName)) {
    if (hasExportAll) {
      throw new ConfigError(
        `_js module "${modulePath}" re-exports with "export *". Name the export explicitly so the build can check it.`,
        { configKey, checkSlug: 'js-modules' }
      );
    }
    const sorted = [...names].sort();
    const suggestion = findSimilarString({ input: exportName, candidates: sorted });
    const hint = suggestion ? ` Did you mean "${suggestion}"?` : '';
    throw new ConfigError(
      `_js module "${modulePath}" has no export "${exportName}". Exports: ${sorted.join(
        ', '
      )}.${hint}`,
      { configKey, checkSlug: 'js-modules' }
    );
  }

  const hash = crypto.createHash('sha1').update(`${relativePath}#${exportName}`).digest('base64');
  context.jsModules[env][hash] = { absolutePath, exportName, relativePath, configKey };
  return { hash, absolutePath, exportName, relativePath };
}

export default resolveJsModule;
