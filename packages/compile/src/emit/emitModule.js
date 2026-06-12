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

  // Wraps map/seq expressions with the active provenance mechanism:
  // - 'keys' — lexical ~k tags + a static keyMap (S2 shape)
  // - 'markers' — non-enumerable ~r/~l for the existing addKeys pipeline (S1)
  // Lines follow the parser's convention: a map/seq value carries its KEY's
  // line (addLineNumbers parity).
  function tag(expr, structPath, line) {
    if (mode === 'keys') {
      return `_r.tag(${expr}, ${json(nextKey(structPath, line))})`;
    }
    if (mode === 'markers') {
      // ~l only (addLineNumbers parity). ~r arrives later — applyRef's
      // markDeep at ref completion (instance id; the same file included
      // twice gets two ids), cloneVarValue at substitution — mirroring the
      // walker's tagging timeline so evaluateOperators' marker transfer
      // sees ~r-less nodes exactly when the walker does.
      return `_r.mark(${expr}, ${line})`;
    }
    return expr;
  }

  const loc = (node) => `_l(${node.pos.line})`;

  function childPath(structPath, segment) {
    return structPath ? `${structPath}.${segment}` : segment;
  }

  // Walker tree path within this file — array indices are plain digits, no
  // id/type decoration (WalkContext.child parity). Joined onto the caller's
  // walkPath at runtime to form the global instance ref-id path.
  function childWp(wp, segment) {
    return wp ? `${wp}.${segment}` : segment;
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

  // Ref-def vars values resolve with the CONTAINER's walk context
  // (resolveRef step 3 passes ctx, not ctx.child) — each value gets the
  // container's wp, skipping the _ref.vars.<key> segments.
  function emitRefDefVars(varsNode, structPath, wp) {
    if (varsNode.t !== 'map') {
      throw new ConfigError(
        `_ref vars must be an object in "${file}" (line ${varsNode.pos.line}).`,
        {
          filePath: file,
          lineNumber: varsNode.pos.line,
        }
      );
    }
    const varsStructPath = childPath(structPath, '_ref.vars');
    const varProps = varsNode.entries.map((entry) => {
      const expr = emitNode(
        entry.value,
        childPath(varsStructPath, entry.key),
        wp,
        entry.keyPos.line
      );
      return `${json(entry.key)}: ${expr}`;
    });
    return `{ ${varProps.join(', ')} }`;
  }

  // Emits a ref the compiler does not resolve itself — module/component/menu
  // and resolver refs, non-YAML content files, dynamic paths, the
  // `_ref: { _var }` path shorthand. The def is rebuilt with path/vars/key
  // expressions evaluated in place (walker step-3 semantics: container walk
  // path) and handed to the build's walker at run time. Map-form defs carry
  // the parser's ~l marks — for path-less refs the walker stores the def as
  // refMap `original`, where the serializer writes those markers.
  function emitDelegatedRef(refEntry, structPath, wp, refLine) {
    const refNode = refEntry.value;
    if (refNode.t === 'lit') {
      return (
        `await _r.delegatedRef({ scope, def: ${json(refNode.value)}, ` +
        `sitePath: ${json(wp)}, refLine: ${refLine}, loc: ${loc(refNode)} })`
      );
    }
    const keys = refNode.entries.map((e) => e.key);
    const props = [];
    for (const entry of refNode.entries) {
      const { key, value: valueNode } = entry;
      if (key === 'vars' && valueNode.t === 'map') {
        // The vars map carries its key's line (addLineNumbers parity).
        props.push(
          `"vars": _r.mark(${emitRefDefVars(valueNode, structPath, wp)}, ${entry.keyPos.line})`
        );
        continue;
      }
      if (key === '_var' && !keys.includes('path')) {
        // getRefPath treats `_ref: { _var: x }` as a dynamic path.
        props.push(`"path": ${emitVar(entry, structPath, wp)}`);
        continue;
      }
      if (['transformer', 'resolver', 'module', 'component', 'menu'].includes(key)) {
        if (valueNode.t !== 'lit' || typeof valueNode.value !== 'string') {
          throw new ConfigError(
            `_ref ${key} must be a string path in "${file}" (line ${valueNode.pos.line}) — dynamic ${key} values are not yet compiled (config-compiler S1 scope).`,
            { filePath: file, lineNumber: valueNode.pos.line }
          );
        }
        props.push(`${json(key)}: ${json(valueNode.value)}`);
        continue;
      }
      // path (incl. dynamic), key, ~ignoreBuildChecks, and unknown keys —
      // emitted with the container's walk path (resolveRef step-3 ctx).
      props.push(
        `${json(key)}: ${emitNode(
          valueNode,
          childPath(structPath, `_ref.${key}`),
          wp,
          entry.keyPos.line
        )}`
      );
    }
    // The def map carries the _ref key's line, like any map value.
    return (
      `await _r.delegatedRef({ scope, def: _r.mark({ ${props.join(', ')} }, ` +
      `${refEntry.keyPos.line}), sitePath: ${json(wp)}, refLine: ${refLine}, loc: ${loc(
        refNode
      )} })`
    );
  }

  // refEntry is the `_ref` map entry; wp is the walker path of the map node
  // CONTAINING _ref; refLine is that node's key-line (the walker reads
  // lineNumber from the container's ~l). Ref-def path/vars/key values resolve
  // with the CONTAINER's walk context (resolveRef step 3 passes ctx, not
  // ctx.child) — their emissions get the container's wp, so a nested ref
  // inside a var value continues the global path from the container,
  // skipping the _ref.vars.<key> segments.
  function emitRef(refEntry, structPath, wp, refLine) {
    const refNode = refEntry.value;
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

    const rawPathNode = parts.get('path') ?? null;
    const staticPath =
      rawPathNode?.t === 'lit' && typeof rawPathNode.value === 'string' ? rawPathNode.value : null;
    let staticCfgPath = null;
    if (staticPath !== null) {
      staticCfgPath = moduleRoot ? path.posix.join(moduleRoot, staticPath) : staticPath;
    }
    // .njk stays on the compile path so compileSource rejects it with the
    // codemod message (D5); other non-YAML extensions are walker content
    // (js functions, json5, raw strings — parseRefContent semantics).
    const ext =
      staticCfgPath === null
        ? null
        : staticCfgPath.slice(staticCfgPath.lastIndexOf('.') + 1).toLowerCase();
    const compilableStatic = ext === 'yaml' || ext === 'yml' || ext === 'njk';
    const walkerOnly =
      parts.has('module') || parts.has('component') || parts.has('menu') || parts.has('resolver');

    if (mode === 'markers' && (walkerOnly || !compilableStatic)) {
      return emitDelegatedRef(refEntry, structPath, wp, refLine);
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
    if (staticPath !== null && !compilableStatic) {
      throw new ConfigError(
        `_ref to non-YAML content ("${staticCfgPath}") is not yet compiled (config-compiler S1 scope) — "${file}" line ${refNode.pos.line}.`,
        { filePath: file, lineNumber: refNode.pos.line }
      );
    }

    let varsExpr = '{}';
    const varsNode = parts.get('vars');
    if (varsNode) {
      varsExpr = emitRefDefVars(varsNode, structPath, wp);
    }

    const defEntries = refNode.t === 'map' ? refNode.entries : [];
    const defEntryOf = (name) => defEntries.find((e) => e.key === name) ?? null;

    const keyEntry = defEntryOf('key');
    const keyExpr = keyEntry
      ? emitNode(keyEntry.value, childPath(structPath, '_ref.key'), wp, keyEntry.keyPos.line)
      : 'null';

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

    const ignoreEntry = defEntryOf('~ignoreBuildChecks');
    const ignoreExpr = ignoreEntry
      ? emitNode(
          ignoreEntry.value,
          childPath(structPath, '_ref.~ignoreBuildChecks'),
          wp,
          ignoreEntry.keyPos.line
        )
      : 'undefined';

    const common =
      `sitePath: ${json(wp)}, refLine: ${refLine}, ` +
      `vars: ${varsExpr}, key: ${keyExpr}, transformer: ${transformerIdent}, ` +
      `transformerPath: ${transformerPath}, ignoreBuildChecks: ${ignoreExpr}, loc: ${loc(refNode)}`;

    if (pathNode.t === 'lit' && typeof pathNode.value === 'string') {
      const cfgPath = moduleRoot ? path.posix.join(moduleRoot, pathNode.value) : pathNode.value;
      // Missing files are a collected error with null in place — walker
      // parity; the rest of the config still builds (the refMap entry is
      // still registered, so sitePath/refLine ride along). The resolved
      // absolute path is baked in for the getConfigFile message.
      if (!refExists(cfgPath)) {
        return (
          `await _r.missingRef({ scope, path: ${json(cfgPath)}, ` +
          `resolvedPath: ${json(path.resolve(configDir, cfgPath))}, ` +
          `sitePath: ${json(wp)}, refLine: ${refLine}, loc: ${loc(refNode)} })`
        );
      }
      const ident = importRef(cfgPath);
      return `await _r.ref({ scope, factory: ${ident}, file: ${json(cfgPath)}, ${common} })`;
    }
    const pathExpr = emitNode(
      pathNode,
      childPath(structPath, '_ref.path'),
      wp,
      defEntryOf('path')?.keyPos.line
    );
    return `await _r.dynRef({ scope, path: ${pathExpr}, ${common} })`;
  }

  // varEntry is the `_var` map entry — inner values carry their KEY's line
  // (addLineNumbers parity), so a _state inside `default:` reports the
  // `default:` line exactly like the walker.
  function emitVar(varEntry, structPath, wp) {
    const varNode = varEntry.value;
    let defExpr;
    if (varNode.t === 'lit') {
      defExpr = json(varNode.value);
    } else if (varNode.t === 'map') {
      const keyEntry = varNode.entries.find((e) => e.key === 'key') ?? null;
      const defaultEntry = varNode.entries.find((e) => e.key === 'default') ?? null;
      const keyExpr = keyEntry
        ? emitNode(
            keyEntry.value,
            childPath(structPath, '_var.key'),
            childWp(childWp(wp, '_var'), 'key'),
            keyEntry.keyPos.line
          )
        : 'undefined';
      // The walker resolves children before _var substitution — the default
      // expression evaluates eagerly, parity-true.
      const defaultExpr = defaultEntry
        ? `, default: ${emitNode(
            defaultEntry.value,
            childPath(structPath, '_var.default'),
            childWp(childWp(wp, '_var'), 'default'),
            defaultEntry.keyPos.line
          )}, hasDefault: true`
        : '';
      defExpr = `{ key: ${keyExpr}${defaultExpr} }`;
    } else {
      defExpr = emitNode(
        varNode,
        childPath(structPath, '_var'),
        childWp(wp, '_var'),
        varEntry.keyPos.line
      );
    }
    return `_r.getVar({ scope, def: ${defExpr}, loc: ${loc(varNode)} })`;
  }

  function emitPlainMapBody(node, structPath, wp) {
    const props = node.entries.map((entry) => {
      // A map/seq value carries its key's line (addLineNumbers parity).
      const expr = emitNode(
        entry.value,
        childPath(structPath, entry.key),
        childWp(wp, entry.key),
        entry.keyPos.line
      );
      return `${json(entry.key)}: ${expr}`;
    });
    return `{ ${props.join(', ')} }`;
  }

  function emitNode(node, structPath, wp, markLine = node?.pos?.line) {
    if (node.t === 'lit') {
      return json(node.value === undefined ? null : node.value);
    }
    if (node.t === 'seq') {
      const items = node.items.map((item, i) =>
        emitNode(item, itemPath(structPath, i, item), childWp(wp, String(i)), item.pos.line)
      );
      return tag(`[ ${items.join(', ')} ]`, structPath, markLine);
    }

    // Map — classify in the walker's order.
    const keys = node.entries.map((e) => e.key);
    const has = (k) => keys.includes(k);

    if (has('_ref')) {
      const refEntry = node.entries.find((e) => e.key === '_ref');
      return emitRef(refEntry, structPath, wp, markLine);
    }
    if (has('_var')) {
      return emitVar(
        node.entries.find((e) => e.key === '_var'),
        structPath,
        wp
      );
    }
    if (has('_module.var')) {
      const mvEntry = node.entries.find((e) => e.key === '_module.var');
      const keyExpr = emitNode(
        mvEntry.value,
        childPath(structPath, '_module.var'),
        childWp(wp, '_module.var'),
        mvEntry.keyPos.line
      );
      return `await _r.moduleVar({ scope, key: ${keyExpr}, loc: ${loc(node)} })`;
    }
    const midKey = MODULE_ID_KEYS.find((k) => has(k));
    if (midKey) {
      const midEntry = node.entries.find((e) => e.key === midKey);
      const argExpr = emitNode(
        midEntry.value,
        childPath(structPath, midKey),
        childWp(wp, midKey),
        midEntry.keyPos.line
      );
      const kind = midKey.slice('_module.'.length);
      return `_r.moduleId({ scope, kind: ${json(kind)}, arg: ${argExpr}, loc: ${loc(node)} })`;
    }

    const nonTilde = keys.filter((k) => !k.startsWith('~'));
    if (nonTilde.length === 1 && nonTilde[0].startsWith('_build.')) {
      const opKey = nonTilde[0];
      const opEntry = node.entries.find((e) => e.key === opKey);
      const paramsExpr = emitNode(
        opEntry.value,
        childPath(structPath, opKey),
        childWp(wp, opKey),
        opEntry.keyPos.line
      );
      // The operator node carries its key-line so evaluateOperators can
      // transfer ~l onto the result (walker: the parse-time ~l rides the
      // node into evaluateBuildOperator). Results are then tagged with the
      // evaluating ref's instance id — resolve step 8 tagRefDeep parity —
      // preserving markers the inputs already carry.
      const opNode = `{ ${json(opKey)}: ${paramsExpr} }`;
      const opNodeExpr = mode === 'markers' ? `_r.mark(${opNode}, ${markLine})` : opNode;
      const call = `_r.buildOperator({ scope, node: ${opNodeExpr}, loc: ${loc(node)} })`;
      if (mode === 'markers') {
        return `_r.markDeep(${call}, scope.refId)`;
      }
      return call;
    }
    if (nonTilde.length === 1 && nonTilde[0].startsWith('_')) {
      // Runtime operator — emitted verbatim as data (stage A), children
      // compiled so _var/_ref inside operator params still resolve.
      return tag(emitPlainMapBody(node, structPath, wp), structPath, markLine);
    }

    return tag(emitPlainMapBody(node, structPath, wp), structPath, markLine);
  }

  const rootExpr = emitNode(ir, '', '');

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
    `const _R = ${json(fileId)};`,
    `const _l = (line) => ({ file: _F, line });`,
    `export const file = _F;`,
    `export const fileId = _R;`,
    `export const refs = ${json(staticRefs)};`,
    `export const keyMap = ${json(keyMap)};`,
    `export default async (scope) => {`,
    // Instance ref ids passed by the caller (markers mode) survive; the
    // lexical file id is the fallback for errors/keys modes and direct calls.
    `  scope = { ...scope, refId: scope.refId ?? _R };`,
    `  return (${rootExpr});`,
    `};`,
    '',
  ].join('\n');

  return { code, staticRefs, keyMap };
}

export default emitModule;
