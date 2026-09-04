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

import * as espree from 'espree';
import * as eslintScope from 'eslint-scope';

import { CLIENT_JS_GLOBALS, SERVER_JS_GLOBALS } from '../buildJs/jsGlobals.js';

// The kinds that run in the browser bundle. A file that is registered under a
// client kind and a server kind at once - an operator in plugins/operators/
// shared - may only use what both environments have.
const CLIENT_KINDS = ['blocks', 'actions', 'operators.client'];

// React is in scope for every client plugin: the dev server and the production
// bundle both compile the file with the JSX transform.
const CLIENT_PLUGIN_GLOBALS = new Set([...CLIENT_JS_GLOBALS, 'React']);
const SERVER_PLUGIN_GLOBALS = SERVER_JS_GLOBALS;
const SHARED_PLUGIN_GLOBALS = new Set(
  [...CLIENT_JS_GLOBALS].filter((name) => SERVER_JS_GLOBALS.has(name))
);

const ENVIRONMENTS = {
  client: { globals: CLIENT_PLUGIN_GLOBALS, description: 'in the browser' },
  server: { globals: SERVER_PLUGIN_GLOBALS, description: 'on the server' },
  shared: { globals: SHARED_PLUGIN_GLOBALS, description: 'in the browser and on the server' },
};

function environmentOf(kinds) {
  const client = kinds.some((kind) => CLIENT_KINDS.includes(kind));
  const server = kinds.some((kind) => !CLIENT_KINDS.includes(kind));
  if (client && server) return 'shared';
  if (server) return 'server';
  return 'client';
}

function addJsxName({ name, names }) {
  if (name.type === 'JSXIdentifier') {
    names.add(name.name);
    return;
  }
  if (name.type === 'JSXMemberExpression') {
    addJsxName({ name: name.object, names });
  }
}

// eslint-scope resolves Identifier references only, so `<Card />` never
// references the imported Card. Collect the names JSX uses so an import that
// only a JSX tag reads is not reported as unused.
function collectJsxNames({ node, names }) {
  if (node === null || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    node.forEach((child) => collectJsxNames({ node: child, names }));
    return;
  }
  if (node.type === 'JSXOpeningElement') {
    addJsxName({ name: node.name, names });
  }
  Object.entries(node).forEach(([key, value]) => {
    if (key === 'loc' || key === 'range' || key === 'parent') return;
    collectJsxNames({ node: value, names });
  });
}

function declaredNames(declaration) {
  if (declaration === null || declaration === undefined) return [];
  if (declaration.type === 'VariableDeclaration') {
    return declaration.declarations
      .filter(({ id }) => id.type === 'Identifier')
      .map(({ id }) => id.name);
  }
  if (declaration.id?.type === 'Identifier') return [declaration.id.name];
  if (declaration.type === 'Identifier') return [declaration.name];
  return [];
}

// An exported declaration is used by definition - the module boundary is the
// use - so it is never an unused declaration.
function collectExportedNames({ ast }) {
  const names = new Set();
  ast.body.forEach((node) => {
    if (node.type === 'ExportDefaultDeclaration') {
      declaredNames(node.declaration).forEach((name) => names.add(name));
    }
    if (node.type === 'ExportNamedDeclaration') {
      declaredNames(node.declaration).forEach((name) => names.add(name));
      (node.specifiers ?? []).forEach((specifier) => names.add(specifier.local.name));
    }
  });
  return names;
}

function collectUndefinedNames({ globals, scopeManager }) {
  const seen = new Map();
  scopeManager.globalScope.through.forEach((reference) => {
    const { name, loc } = reference.identifier;
    if (globals.has(name) || seen.has(name)) return;
    seen.set(name, { name, line: loc.start.line, column: loc.start.column });
  });
  return [...seen.values()];
}

function collectUnusedNames({ exportedNames, jsxNames, scopeManager }) {
  const moduleScope = scopeManager.scopes.find((scope) => scope.type === 'module');
  if (moduleScope === undefined) return [];
  const unused = [];
  moduleScope.variables.forEach((variable) => {
    if (variable.defs.length === 0) return;
    if (exportedNames.has(variable.name) || jsxNames.has(variable.name)) return;
    const referenced = variable.references.some((reference) => reference.init !== true);
    if (referenced) return;
    const { loc } = variable.defs[0].name;
    unused.push({ name: variable.name, line: loc.start.line, column: loc.start.column });
  });
  return unused;
}

function lintSource({ globals, source }) {
  let ast;
  try {
    ast = espree.parse(source, {
      ecmaVersion: 'latest',
      sourceType: 'module',
      ecmaFeatures: { jsx: true },
      loc: true,
      range: true,
    });
  } catch (error) {
    return {
      syntaxError: { message: error.message, line: error.lineNumber ?? 1, column: error.column },
    };
  }
  // fallback: 'iteration' so the referencer walks JSX nodes, which are not in
  // the ESTree visitor keys eslint-scope ships with.
  const scopeManager = eslintScope.analyze(ast, {
    ecmaVersion: 2024,
    sourceType: 'module',
    fallback: 'iteration',
  });
  const jsxNames = new Set();
  collectJsxNames({ node: ast, names: jsxNames });
  return {
    undefinedNames: collectUndefinedNames({ globals, scopeManager }),
    unusedNames: collectUnusedNames({
      exportedNames: collectExportedNames({ ast }),
      jsxNames,
      scopeManager,
    }),
  };
}

/**
 * Lints every discovered file plugin's source the way lintJsBodies lints a _js
 * body: espree for the parse, eslint-scope for the names, and the environment
 * the file actually runs in for what counts as defined.
 *
 * One result per file, not per record: an operator under plugins/operators/
 * shared is discovered twice, and its author wrote one file.
 */
function lintFilePlugins({ filePlugins }) {
  const groups = new Map();
  filePlugins.forEach((record) => {
    const group = groups.get(record.file);
    if (group === undefined) {
      groups.set(record.file, { file: record.file, relativePath: record.relativePath, kinds: [] });
    }
    groups.get(record.file).kinds.push(record.kind);
  });

  return [...groups.values()].map(({ file, kinds, relativePath }) => {
    const environment = environmentOf(kinds);
    return {
      relativePath,
      environment,
      environmentDescription: ENVIRONMENTS[environment].description,
      ...lintSource({
        globals: ENVIRONMENTS[environment].globals,
        source: fs.readFileSync(file, 'utf8'),
      }),
    };
  });
}

export default lintFilePlugins;
