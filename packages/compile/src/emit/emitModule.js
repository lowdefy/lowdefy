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

import path from 'path';
import { pathToFileURL } from 'url';
import { ConfigError } from '@lowdefy/errors';

// All user-sourced strings reach emitted code through JSON.stringify —
// injection safety is a hard invariant (design D12).
const json = (value) => JSON.stringify(value);

const MODULE_ID_KEYS = [
  '_module.pageId',
  '_module.connectionId',
  '_module.endpointId',
  '_module.id',
];

const REF_DEF_KEYS = new Set([
  'path',
  'vars',
  'key',
  'resolver',
  'transformer',
  'module',
  'component',
  'menu',
  '~ignoreBuildChecks',
]);

function entryMap(node) {
  const map = new Map();
  for (const entry of node.entries) {
    map.set(entry.key, entry.value);
  }
  return map;
}

// Emits one parsed source file as an ES module: a default async factory plus
// provenance exports. Matches the walker's evaluation semantics — see the
// per-node emitters for the contracts they preserve.
function emitModule({
  ir,
  file,
  fileId,
  mode = 'errors',
  resolveImport,
  refExists = () => true,
  configDir,
  moduleRoot = null,
  runtimeSpecifier = '@lowdefy/compile/runtime',
}) {
  const refImports = new Map(); // cfgPath -> ident
  const transformerImports = new Map(); // absPath -> ident
  const staticRefs = [];
  const keyMap = {};
  let keyCounter = 0;

  function importRef(cfgPath) {
    if (!refImports.has(cfgPath)) {
      refImports.set(cfgPath, `_f${refImports.size}`);
      staticRefs.push(cfgPath);
    }
    return refImports.get(cfgPath);
  }

  function importTransformer(absPath) {
    if (!transformerImports.has(absPath)) {
      transformerImports.set(absPath, `_t${transformerImports.size}`);
    }
    return transformerImports.get(absPath);
  }

  function nextKey(structPath, line) {
    keyCounter += 1;
    const id = `${fileId}:${keyCounter.toString(36)}`;
    keyMap[id] = { key: structPath, '~r': fileId, '~l': line };
    return id;
  }

  function tag(expr, structPath, line) {
    if (mode !== 'keys') return expr;
    return `_r.tag(${expr}, ${json(nextKey(structPath, line))})`;
  }

  const loc = (node) => `_l(${node.pos.line})`;

  function childPath(structPath, segment) {
    return structPath ? `${structPath}.${segment}` : segment;
  }

  function itemPath(structPath, index, item) {
    let id = null;
    if (item.t === 'map') {
      const idEntry = item.entries.find((e) => e.key === 'id');
      if (idEntry?.value.t === 'lit' && typeof idEntry.value.value === 'string') {
        id = idEntry.value.value;
      }
    }
    const segment = id === null ? `[${index}]` : `[${index}:${id}]`;
    return `${structPath}${segment}`;
  }

  function emitRef(refNode, structPath) {
    let parts = new Map();
    if (refNode.t === 'lit' && typeof refNode.value === 'string') {
      parts.set('path', refNode);
    } else if (refNode.t === 'map') {
      parts = entryMap(refNode);
      for (const key of parts.keys()) {
        if (!REF_DEF_KEYS.has(key) && !key.startsWith('~')) {
          // Unknown keys are ignored by makeRefDefinition — parity: ignore.
        }
      }
    } else {
      throw new ConfigError(
        `_ref takes a string or object definition in "${file}" (line ${refNode.pos.line}).`,
        { filePath: file, lineNumber: refNode.pos.line }
      );
    }

    for (const unsupported of ['module', 'component', 'menu']) {
      if (parts.has(unsupported)) {
        throw new ConfigError(
          `_ref ${unsupported} refs are not yet compiled (config-compiler S1 scope) — "${file}" line ${refNode.pos.line}.`,
          { filePath: file, lineNumber: refNode.pos.line }
        );
      }
    }
    if (parts.has('resolver')) {
      throw new ConfigError(
        `_ref resolver refs are not yet compiled (config-compiler S1 scope) — "${file}" line ${refNode.pos.line}.`,
        { filePath: file, lineNumber: refNode.pos.line }
      );
    }

    const pathNode = parts.get('path');
    if (!pathNode) {
      throw new ConfigError(`_ref requires a path in "${file}" (line ${refNode.pos.line}).`, {
        filePath: file,
        lineNumber: refNode.pos.line,
      });
    }

    let varsExpr = '{}';
    const varsNode = parts.get('vars');
    if (varsNode) {
      if (varsNode.t !== 'map') {
        throw new ConfigError(
          `_ref vars must be an object in "${file}" (line ${varsNode.pos.line}).`,
          { filePath: file, lineNumber: varsNode.pos.line }
        );
      }
      varsExpr = emitPlainMapBody(varsNode, childPath(structPath, '_ref.vars'));
    }

    const keyNode = parts.get('key');
    const keyExpr = keyNode ? emitNode(keyNode, childPath(structPath, '_ref.key')) : 'null';

    let transformerIdent = 'null';
    let transformerPath = 'null';
    const transformerNode = parts.get('transformer');
    if (transformerNode) {
      if (transformerNode.t !== 'lit' || typeof transformerNode.value !== 'string') {
        throw new ConfigError(
          `_ref transformer must be a string path in "${file}" (line ${transformerNode.pos.line}) — dynamic transformers are not yet compiled (config-compiler S1 scope).`,
          { filePath: file, lineNumber: transformerNode.pos.line }
        );
      }
      // Transformer paths resolve against the config directory (walker step 4
      // prefixes the module root first when inside a module).
      const cfgRelative = moduleRoot
        ? path.posix.join(moduleRoot, transformerNode.value)
        : transformerNode.value;
      const absPath = path.resolve(configDir, cfgRelative);
      transformerIdent = importTransformer(absPath);
      transformerPath = json(transformerNode.value);
    }

    const ignoreNode = parts.get('~ignoreBuildChecks');
    const ignoreExpr = ignoreNode
      ? emitNode(ignoreNode, childPath(structPath, '_ref.~ignoreBuildChecks'))
      : 'undefined';

    const common =
      `vars: ${varsExpr}, key: ${keyExpr}, transformer: ${transformerIdent}, ` +
      `transformerPath: ${transformerPath}, ignoreBuildChecks: ${ignoreExpr}, loc: ${loc(refNode)}`;

    if (pathNode.t === 'lit' && typeof pathNode.value === 'string') {
      const cfgPath = moduleRoot ? path.posix.join(moduleRoot, pathNode.value) : pathNode.value;
      // Missing files are a collected error with null in place — walker
      // parity; the rest of the config still builds.
      if (!refExists(cfgPath)) {
        return `await _r.missingRef({ scope, path: ${json(cfgPath)}, loc: ${loc(refNode)} })`;
      }
      const ident = importRef(cfgPath);
      return `await _r.ref({ scope, factory: ${ident}, file: ${json(cfgPath)}, ${common} })`;
    }
    const pathExpr = emitNode(pathNode, childPath(structPath, '_ref.path'));
    return `await _r.dynRef({ scope, path: ${pathExpr}, ${common} })`;
  }

  function emitVar(varNode, structPath) {
    let defExpr;
    if (varNode.t === 'lit') {
      defExpr = json(varNode.value);
    } else if (varNode.t === 'map') {
      const parts = entryMap(varNode);
      const keyNode = parts.get('key');
      const defaultNode = parts.get('default');
      const keyExpr = keyNode ? emitNode(keyNode, childPath(structPath, '_var.key')) : 'undefined';
      // The walker resolves children before _var substitution — the default
      // expression evaluates eagerly, parity-true.
      const defaultExpr = defaultNode
        ? `, default: ${emitNode(
            defaultNode,
            childPath(structPath, '_var.default')
          )}, hasDefault: true`
        : '';
      defExpr = `{ key: ${keyExpr}${defaultExpr} }`;
    } else {
      defExpr = emitNode(varNode, childPath(structPath, '_var'));
    }
    return `_r.getVar({ scope, def: ${defExpr}, loc: ${loc(varNode)} })`;
  }

  function emitPlainMapBody(node, structPath) {
    const props = node.entries.map((entry) => {
      const expr = emitNode(entry.value, childPath(structPath, entry.key));
      return `${json(entry.key)}: ${expr}`;
    });
    return `{ ${props.join(', ')} }`;
  }

  function emitNode(node, structPath) {
    if (node.t === 'lit') {
      return json(node.value === undefined ? null : node.value);
    }
    if (node.t === 'seq') {
      const items = node.items.map((item, i) => emitNode(item, itemPath(structPath, i, item)));
      return tag(`[ ${items.join(', ')} ]`, structPath, node.pos.line);
    }

    // Map — classify in the walker's order.
    const keys = node.entries.map((e) => e.key);
    const has = (k) => keys.includes(k);

    if (has('_ref')) {
      return emitRef(entryMap(node).get('_ref'), structPath);
    }
    if (has('_var')) {
      return emitVar(entryMap(node).get('_var'), structPath);
    }
    if (has('_module.var')) {
      const keyExpr = emitNode(
        entryMap(node).get('_module.var'),
        childPath(structPath, '_module.var')
      );
      return `await _r.moduleVar({ scope, key: ${keyExpr}, loc: ${loc(node)} })`;
    }
    const midKey = MODULE_ID_KEYS.find((k) => has(k));
    if (midKey) {
      const argExpr = emitNode(entryMap(node).get(midKey), childPath(structPath, midKey));
      const kind = midKey.slice('_module.'.length);
      return `_r.moduleId({ scope, kind: ${json(kind)}, arg: ${argExpr}, loc: ${loc(node)} })`;
    }

    const nonTilde = keys.filter((k) => !k.startsWith('~'));
    if (nonTilde.length === 1 && nonTilde[0].startsWith('_build.')) {
      const opKey = nonTilde[0];
      const paramsExpr = emitNode(entryMap(node).get(opKey), childPath(structPath, opKey));
      return `_r.buildOperator({ scope, node: { ${json(opKey)}: ${paramsExpr} }, loc: ${loc(
        node
      )} })`;
    }
    if (nonTilde.length === 1 && nonTilde[0].startsWith('_')) {
      // Runtime operator — emitted verbatim as data (stage A), children
      // compiled so _var/_ref inside operator params still resolve.
      return tag(emitPlainMapBody(node, structPath), structPath, node.pos.line);
    }

    return tag(emitPlainMapBody(node, structPath), structPath, node.pos.line);
  }

  const rootExpr = emitNode(ir, '');

  const importLines = [`import { runtime as _r } from ${json(runtimeSpecifier)};`];
  for (const [cfgPath, ident] of refImports) {
    importLines.push(`import ${ident} from ${json(resolveImport(cfgPath))};`);
  }
  for (const [absPath, ident] of transformerImports) {
    importLines.push(`import ${ident} from ${json(pathToFileURL(absPath).href)};`);
  }

  const code = [
    `/* Generated by @lowdefy/compile — do not edit. Source: ${file} */`,
    ...importLines,
    `const _F = ${json(file)};`,
    `const _l = (line) => ({ file: _F, line });`,
    `export const file = _F;`,
    `export const fileId = ${json(fileId)};`,
    `export const refs = ${json(staticRefs)};`,
    `export const keyMap = ${json(keyMap)};`,
    `export default async (scope) => (${rootExpr});`,
    '',
  ].join('\n');

  return { code, staticRefs, keyMap };
}

export default emitModule;
