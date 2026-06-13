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
  // D7a: build-injected compile-time resolution of `_ref: {module, component}`
  // to a file target — ({module, component}) => {cfgPath, moduleRoot,
  // entryId, exportName, innerRefLine, manifestFile} | null.
  resolveModuleExport = null,
  // Global refResolver (build option): every path ref except the lowdefy
  // root emits as a resolver call.
  refResolver = null,
  // D7b: walker-path zones emitted as raw ~l-marked data instead of compiled
  // expressions — manifest preserve zones (vars defaults, components content).
  preserveZones = null,
  // D7c: preserve-zone nodes that ALSO compile as exported factories
  // (inline component exports, structured var defaults): (wp) => key | null.
  collectFactoryExports = null,
  runtimeSpecifier = '@lowdefy/compile/runtime',
}) {
  const refImports = new Map(); // cfgPath -> ident
  const transformerImports = new Map(); // absPath -> ident
  const staticRefs = [];
  const moduleImports = []; // { path, moduleRoot } — compiled with their root
  const factoryExports = []; // [key, factoryBodyExpr] — manifest factories
  const keyMap = {};
  let keyCounter = 0;
  let zonesSuspended = false;

  function importRef(cfgPath) {
    if (!refImports.has(cfgPath)) {
      refImports.set(cfgPath, `_f${refImports.size}`);
      staticRefs.push(cfgPath);
    }
    return refImports.get(cfgPath);
  }

  function importModuleTarget(cfgPath, targetModuleRoot) {
    if (!refImports.has(cfgPath)) {
      refImports.set(cfgPath, `_f${refImports.size}`);
      moduleImports.push({ path: cfgPath, moduleRoot: targetModuleRoot });
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

  // S2a lexical key ids — same shape and traversal order as keys mode, but
  // carried as a non-enumerable ~lk marker for addKeys to consume as the ~k
  // id (deterministic per source position; instances disambiguated by
  // addKeys with a tree-order suffix).
  function nextLexId() {
    keyCounter += 1;
    return `${fileId}:${keyCounter.toString(36)}`;
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
      // ~l (addLineNumbers parity) plus the S2a lexical key id. ~r arrives
      // later — applyRef's markDeep at ref completion (instance id; the
      // same file included twice gets two ids), cloneVarValue at
      // substitution — mirroring the walker's tagging timeline so
      // evaluateOperators' marker transfer sees ~r-less nodes exactly when
      // the walker does.
      return `_r.mark(${expr}, ${line}, ${json(nextLexId())})`;
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

  // D7a: `_ref: {module, component}` whose export target is a plain file ref
  // compiles — the target imports as a factory, the registration binds at
  // run time, and the def (with evaluated vars) doubles as the refMap
  // `original`. Everything else falls through to walker delegation.
  function emitModuleComponentRef(refEntry, target, structPath, wp, refLine) {
    const refNode = refEntry.value;
    const parts = entryMap(refNode);
    const defEntries = refNode.entries;
    const entryOf = (name) => defEntries.find((e) => e.key === name) ?? null;

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
      transformerIdent = importTransformer(path.resolve(configDir, transformerNode.value));
      transformerPath = json(transformerNode.value);
    }

    const varsNode = parts.get('vars');
    const varsExpr = varsNode ? emitRefDefVars(varsNode, structPath, wp) : '{}';
    const keyEntry = entryOf('key');
    const keyExpr = keyEntry
      ? emitNode(keyEntry.value, childPath(structPath, '_ref.key'), wp, keyEntry.keyPos.line)
      : 'null';
    const ignoreEntry = entryOf('~ignoreBuildChecks');
    const ignoreExpr = ignoreEntry
      ? emitNode(
          ignoreEntry.value,
          childPath(structPath, '_ref.~ignoreBuildChecks'),
          wp,
          ignoreEntry.keyPos.line
        )
      : 'undefined';

    const tail =
      `def: ${emitRaw(refNode, refEntry.keyPos.line)}, ` +
      `vars: ${varsExpr}, key: ${keyExpr}, ignoreBuildChecks: ${ignoreExpr}, ` +
      `transformer: ${transformerIdent}, transformerPath: ${transformerPath}, ` +
      `sitePath: ${json(wp)}, refLine: ${refLine}, loc: ${loc(refNode)}`;
    if (target === null) {
      // Registry mode: names evaluate at run time (literal or operator-built)
      // and the export resolves against the registered manifest.
      const moduleNode = parts.get('module');
      const componentNode = parts.get('component');
      const nameExpr = (node, name) =>
        emitNode(node, childPath(structPath, `_ref.${name}`), wp, node.pos?.line);
      return (
        `await _r.moduleComponentRef({ scope, registry: true, ` +
        `module: ${nameExpr(moduleNode, 'module')}, ` +
        `component: ${nameExpr(componentNode, 'component')}, ${tail} })`
      );
    }
    const common = `entryId: ${json(target.entryId)}, component: ${json(
      target.exportName
    )}, ${tail}`;
    if (target.kind === 'inline') {
      // The factory lives on the registry entry's compiled manifest.
      return (
        `await _r.moduleComponentRef({ scope, inline: true, ` +
        `factoryKey: ${json(target.factoryKey)}, ${common} })`
      );
    }
    const ident = importModuleTarget(target.cfgPath, target.moduleRoot);
    return (
      `await _r.moduleComponentRef({ scope, factory: ${ident}, file: ${json(target.cfgPath)}, ` +
      `manifestFile: ${json(target.manifestFile)}, innerRefLine: ${
        target.innerRefLine ?? 'undefined'
      }, ` +
      `${common} })`
    );
  }

  // `_ref: {module, menu}` consumption reads resolved links from the build
  // registry at run time (works for compiled and walker-registered modules
  // alike) — only the def shape compiles here.
  function emitModuleMenuRef(refEntry, structPath, wp, refLine) {
    const refNode = refEntry.value;
    const parts = entryMap(refNode);
    const defEntries = refNode.entries;
    const entryOf = (name) => defEntries.find((e) => e.key === name) ?? null;

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
      transformerIdent = importTransformer(path.resolve(configDir, transformerNode.value));
      transformerPath = json(transformerNode.value);
    }
    const varsNode = parts.get('vars');
    const varsExpr = varsNode ? emitRefDefVars(varsNode, structPath, wp) : '{}';
    const keyEntry = entryOf('key');
    const keyExpr = keyEntry
      ? emitNode(keyEntry.value, childPath(structPath, '_ref.key'), wp, keyEntry.keyPos.line)
      : 'null';
    const ignoreEntry = entryOf('~ignoreBuildChecks');
    const ignoreExpr = ignoreEntry
      ? emitNode(
          ignoreEntry.value,
          childPath(structPath, '_ref.~ignoreBuildChecks'),
          wp,
          ignoreEntry.keyPos.line
        )
      : 'undefined';

    // Names evaluate at run time — literal strings emit as literals,
    // operator-built names as compiled expressions (the registry lookup
    // reproduces the walker's error ladder on failure).
    const nameExpr = (name) => {
      const node = parts.get(name);
      if (node.t === 'lit') {
        return json(node.value);
      }
      return emitNode(node, childPath(structPath, `_ref.${name}`), wp, node.pos?.line);
    };
    return (
      `await _r.moduleMenuRef({ scope, module: ${nameExpr('module')}, ` +
      `menu: ${nameExpr('menu')}, def: ${emitRaw(refNode, refEntry.keyPos.line)}, ` +
      `vars: ${varsExpr}, key: ${keyExpr}, ignoreBuildChecks: ${ignoreExpr}, ` +
      `transformer: ${transformerIdent}, transformerPath: ${transformerPath}, ` +
      `sitePath: ${json(wp)}, refLine: ${refLine}, loc: ${loc(refNode)} })`
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
    // codemod message (D5); other non-YAML extensions emit content refs
    // (js functions, json5, raw strings — parseRefContent semantics).
    const ext =
      staticCfgPath === null
        ? null
        : staticCfgPath.slice(staticCfgPath.lastIndexOf('.') + 1).toLowerCase();
    const moduleFormKeys = ['module', 'component', 'menu', 'page', 'connection', 'api'];
    const hasModuleForm = moduleFormKeys.some((k) => parts.has(k));

    if (
      mode === 'markers' &&
      parts.has('module') &&
      parts.has('component') &&
      !parts.has('menu') &&
      !parts.has('resolver') &&
      !parts.has('path') &&
      !parts.has('page') &&
      !parts.has('connection') &&
      !parts.has('api')
    ) {
      const moduleNode = parts.get('module');
      const componentNode = parts.get('component');
      let target = null;
      if (
        resolveModuleExport &&
        moduleNode.t === 'lit' &&
        typeof moduleNode.value === 'string' &&
        componentNode.t === 'lit' &&
        typeof componentNode.value === 'string'
      ) {
        target = resolveModuleExport({
          module: moduleNode.value,
          component: componentNode.value,
        });
      }
      // No static target (operator-built export lists, walker-registered
      // manifests, dynamic names) → registry lookup at run time.
      return emitModuleComponentRef(refEntry, target, structPath, wp, refLine);
    }
    if (
      mode === 'markers' &&
      parts.has('module') &&
      parts.has('menu') &&
      !parts.has('component') &&
      !parts.has('resolver') &&
      !parts.has('path') &&
      !parts.has('page') &&
      !parts.has('connection') &&
      !parts.has('api')
    ) {
      return emitModuleMenuRef(refEntry, structPath, wp, refLine);
    }
    // Module refs that did not resolve statically above — page/connection/api
    // forms, operator-built names, unknown exports — emit the runtime error
    // ladder (getModuleRefContent parity: collected at the ref, refMap entry
    // registered with the raw def as original).
    if (hasModuleForm) {
      if (mode !== 'markers') {
        for (const unsupported of moduleFormKeys) {
          if (parts.has(unsupported)) {
            throw new ConfigError(
              `_ref ${unsupported} refs are not yet compiled (config-compiler S1 scope) — "${file}" line ${refNode.pos.line}.`,
              { filePath: file, lineNumber: refNode.pos.line }
            );
          }
        }
      }
      const fieldExpr = (name) => {
        const node = parts.get(name);
        if (!node) {
          return 'undefined';
        }
        return emitNode(node, childPath(structPath, `_ref.${name}`), wp, node.pos?.line);
      };
      return (
        `await _r.invalidModuleRef({ scope, def: ${emitRaw(refNode, refEntry.keyPos.line)}, ` +
        `module: ${fieldExpr('module')}, component: ${fieldExpr('component')}, ` +
        `menu: ${fieldExpr('menu')}, page: ${fieldExpr('page')}, ` +
        `connection: ${fieldExpr('connection')}, api: ${fieldExpr('api')}, ` +
        `sitePath: ${json(wp)}, refLine: ${refLine}, loc: ${loc(refNode)} })`
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

    // Raw (un-evaluated) vars are recorded as unresolvedRefVars[refId] so the
    // dev page registry can identify the page source ref (the outermost ref
    // WITHOUT vars) and JIT can re-resolve a page-source ref's own vars from
    // disk — walker resolveRef unresolvedRefVars parity.
    const rawVarsExpr = varsNode ? emitRaw(varsNode, varsNode.pos?.line ?? refLine) : 'undefined';

    const common =
      `sitePath: ${json(wp)}, refLine: ${refLine}, ` +
      `vars: ${varsExpr}, rawVars: ${rawVarsExpr}, key: ${keyExpr}, transformer: ${transformerIdent}, ` +
      `transformerPath: ${transformerPath}, ignoreBuildChecks: ${ignoreExpr}, loc: ${loc(refNode)}`;

    // Resolver dispatch — per-ref `resolver:`, or the build's global
    // refResolver which supplies content for every path ref except the
    // lowdefy root (walker getRefContent order). Content loads and parses at
    // factory run; YAML text compiles through the runtime importer.
    const resolverNode = parts.get('resolver') ?? null;
    const isLowdefyRoot = staticPath === 'lowdefy.yaml' || staticPath === 'lowdefy.yml';
    if (resolverNode || (refResolver && !isLowdefyRoot)) {
      if (resolverNode && (resolverNode.t !== 'lit' || typeof resolverNode.value !== 'string')) {
        throw new ConfigError(
          `_ref resolver must be a string path in "${file}" (line ${resolverNode.pos.line}).`,
          { filePath: file, lineNumber: resolverNode.pos.line }
        );
      }
      // Resolver paths take the module-root prefix exactly like transformers
      // (walker step 4).
      let resolverPath = refResolver;
      if (resolverNode) {
        resolverPath = moduleRoot
          ? path.posix.join(moduleRoot, resolverNode.value)
          : resolverNode.value;
      }
      let pathArg = 'undefined';
      if (staticPath !== null) {
        pathArg = json(staticCfgPath);
      } else if (rawPathNode) {
        pathArg = emitNode(
          rawPathNode,
          childPath(structPath, '_ref.path'),
          wp,
          defEntryOf('path')?.keyPos.line
        );
      }
      return (
        `await _r.resolverRef({ scope, resolver: ${json(resolverPath)}, path: ${pathArg}, ` +
        `def: ${emitRaw(refNode, refEntry.keyPos.line)}, ${common} })`
      );
    }

    // getRefPath shorthand: a def with `_var` and no `path` IS the dynamic
    // path — the var resolves to the path string at run time.
    let pathNode = parts.get('path') ?? null;
    if (!pathNode && parts.size === 1 && parts.has('_var')) {
      pathNode = refNode;
    }
    if (!pathNode) {
      throw new ConfigError(`_ref requires a path in "${file}" (line ${refNode.pos.line}).`, {
        filePath: file,
        lineNumber: refNode.pos.line,
      });
    }

    if (pathNode.t === 'lit' && typeof pathNode.value === 'string') {
      const cfgPath = moduleRoot ? path.posix.join(moduleRoot, pathNode.value) : pathNode.value;
      // `.js` content refs import the user function at factory run — walker
      // getRefContent's early return (no parse, no existence pre-check).
      if (ext === 'js') {
        return `await _r.jsRef({ scope, path: ${json(cfgPath)}, ${common} })`;
      }
      // Non-YAML content (json, md, txt, html, …) reads and parses at factory
      // run through the build's cached reader.
      if (ext !== 'yaml' && ext !== 'yml' && ext !== 'njk') {
        return `await _r.contentRef({ scope, path: ${json(cfgPath)}, ${common} })`;
      }
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

  // Raw data emission for preserve zones: no classification, no operator or
  // ref compilation — nodes carry ~l only (walker-preserved subtrees are
  // parse-marked and resolved later or consumed as raw defs). Factory-export
  // collection (D7c) rides the recursion: a raw zone node whose walker path
  // matches ALSO compiles as an exported factory, with zones suspended and
  // wp rooted at '' (consumer-site-relative instance paths).
  function emitRaw(node, markLine, wp = null) {
    if (!zonesSuspended && wp && collectFactoryExports) {
      const factoryKey = collectFactoryExports(wp);
      if (factoryKey) {
        zonesSuspended = true;
        const expr = emitNode(node, '', '', markLine);
        zonesSuspended = false;
        factoryExports.push([factoryKey, expr]);
      }
    }
    if (node.t === 'lit') {
      return json(node.value === undefined ? null : node.value);
    }
    if (node.t === 'seq') {
      const items = node.items.map((item, i) =>
        emitRaw(item, item.pos.line, wp === null ? null : childWp(wp, String(i)))
      );
      const body = `[ ${items.join(', ')} ]`;
      return mode === 'markers' ? `_r.mark(${body}, ${markLine})` : body;
    }
    const props = node.entries.map(
      (entry) =>
        `${json(entry.key)}: ${emitRaw(
          entry.value,
          entry.keyPos.line,
          wp === null ? null : childWp(wp, entry.key)
        )}`
    );
    const body = `{ ${props.join(', ')} }`;
    return mode === 'markers' ? `_r.mark(${body}, ${markLine})` : body;
  }

  function emitNode(node, structPath, wp, markLine = node?.pos?.line) {
    if (!zonesSuspended && preserveZones && wp && preserveZones(wp)) {
      return emitRaw(node, markLine, wp);
    }
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
    ...(factoryExports.length > 0
      ? [
          `export const factories = {`,
          ...factoryExports.map(
            ([factoryKey, expr]) =>
              `  ${json(factoryKey)}: async (scope) => { ` +
              `scope = { ...scope, refId: scope.refId ?? _R }; return (${expr}); },`
          ),
          `};`,
        ]
      : []),
    `export default async (scope) => {`,
    // Instance ref ids passed by the caller (markers mode) survive; the
    // lexical file id is the fallback for errors/keys modes and direct calls.
    `  scope = { ...scope, refId: scope.refId ?? _R };`,
    `  return (${rootExpr});`,
    `};`,
    '',
  ].join('\n');

  return { code, staticRefs, moduleImports, keyMap };
}

export default emitModule;
