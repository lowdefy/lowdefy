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
import YAML from 'yaml';
import { get, serializer, type } from '@lowdefy/helpers';
import { ConfigError } from '@lowdefy/errors';

import { copyMarked, markDeep } from './mark.js';
import { bindModuleEntry } from './moduleHelpers.js';
import hasConfigDirectives from './hasConfigDirectives.js';
import importUserFunction from './importUserFunction.js';
import parseContentByExt from './parseContentByExt.js';

// Per-ref operation order is an invariant (design D3, walker steps 11-16):
// produce content → transformer → pluck key → propagate ~ignoreBuildChecks.
// (Module menu-id scoping joins at S1 with module ref compilation.)
// Failed refs collect a ConfigError and resolve to null — walker parity.

function collectOrThrow(scope, error) {
  if (scope.onError) {
    scope.onError(error);
    return null;
  }
  throw error;
}

// The walker continues tree paths through ref boundaries — reffed content is
// rooted at the global path of the ref site.
function globalSitePath(scope, sitePath) {
  if (!scope.walkPath) {
    return sitePath;
  }
  return sitePath ? `${scope.walkPath}.${sitePath}` : scope.walkPath;
}

// Instance ref ids match the walker: the global tree path of the ref site,
// falling back to the build's id counter on collision — allocation and refMap
// registration are injected by the build through scope.refTracker. Without a
// tracker (errors/keys modes, unit harnesses) there is no instance id.
// `original` registers the raw def for path-less refs (walker step 5 stores
// it when refDef.path is undefined — resolver refs without a path).
function allocRefId({ scope, globalPath, refLine, file, original }) {
  if (!scope.refTracker) {
    return null;
  }
  const refId = scope.refTracker.alloc(globalPath, {
    parent: scope.refId ?? null,
    lineNumber: refLine,
  });
  scope.refTracker.setPath(refId, file);
  if (original !== undefined) {
    scope.refTracker.setOriginal?.(refId, original);
  }
  return refId;
}

// Walker getConfigFile parity for files missing at run time — same message,
// same common-mistake tips, referencedFrom = the file containing the ref.
function missingFileError({ scope, path: refPath, refLine }) {
  const absolutePath = path.resolve(scope.configDir ?? '', refPath);
  let message = `Referenced file does not exist: "${refPath}". Resolved to: ${absolutePath}`;
  if (refPath.startsWith('../')) {
    const suggestedPath = refPath.replace(/^(\.\.\/)+/, '');
    message += ` Tip: Paths in _ref are resolved from config root. Did you mean "${suggestedPath}"?`;
  } else if (refPath.startsWith('./')) {
    const suggestedPath = refPath.substring(2);
    message += ` Tip: Remove "./" prefix - paths are resolved from config root. Did you mean "${suggestedPath}"?`;
  }
  return new ConfigError(message, {
    filePath: scope.file ?? null,
    lineNumber: scope.file ? refLine : null,
  });
}

async function readContentFile({ scope, path: refPath, refLine }) {
  const content = scope.readConfigFile ? await scope.readConfigFile(refPath) : null;
  if (content === null) {
    throw missingFileError({ scope, path: refPath, refLine });
  }
  return content;
}

// Parsed (non-YAML-source) content — resolver objects, JSON — is walked
// uniformly by the walker, so directives inside it resolve. Route through a
// runtime compile only when one is present: plain data stays byte-identical
// (no lexical marks, exactly like the walker's parsed content).
async function compileParsedContent({ scope, childScope, content, label }) {
  if (!scope.importSource) {
    return content;
  }
  if (!type.isObject(content) && !type.isArray(content)) {
    return content;
  }
  if (!hasConfigDirectives(content)) {
    return content;
  }
  const mod = await scope.importSource(YAML.stringify(content), label);
  return mod.default(childScope);
}

const NJK_REMOVED_MESSAGE = (file) =>
  `Structural nunjucks templates (.yaml.njk) are no longer supported — "${file}". ` +
  `Run the v6 migration codemod: {{ var }} becomes _var, string-built ids become ` +
  `_build.nunjucks or _build.string.concat, {% if %} becomes _build.if with ` +
  `_build.array.compact for conditional list membership. ` +
  `The runtime _nunjucks operator is unchanged.`;

async function applyRefSteps({
  scope,
  factory,
  file,
  vars,
  key,
  transformer,
  transformerPath,
  ignoreBuildChecks,
  sitePath,
  refLine,
  loc,
  // Walker step-5 variations: path-less refs (resolver without path) register
  // an undefined refMap path with the raw def as `original`, and skip the
  // cycle chain entirely (step 7 only guards when the path is truthy).
  refMapPath = file,
  original = undefined,
  chainGuard = true,
}) {
  const globalPath = globalSitePath(scope, sitePath);
  const refId = allocRefId({ scope, globalPath, refLine, file: refMapPath, original });

  // Walker step 7: the cycle error is thrown OUTSIDE the per-ref collect
  // boundary — it propagates to the PARENT ref's catch (which nulls the
  // parent), or to the top level when the entry references itself.
  if (chainGuard && scope.refChain.includes(file)) {
    throw new ConfigError(
      `Circular reference detected. File "${file}" references itself through:\n  -> ${[
        ...scope.refChain,
        file,
      ].join('\n  -> ')}`,
      { filePath: scope.file, lineNumber: scope.file ? refLine : null }
    );
  }

  const childScope = {
    ...scope,
    vars: vars ?? {},
    file,
    callSite: loc ?? null,
    refId,
    walkPath: globalPath ?? '',
    // The ref that supplied the vars — _var injections re-tag provenance
    // with it (walker cloneVarValue parity).
    sourceRefId: scope.refId ?? null,
    refChain: chainGuard ? [...scope.refChain, file] : scope.refChain,
  };

  // Walker steps 8-16: errors here (content load, child cycles propagating
  // up, transformer, pluck) collect at THIS ref, which resolves to null.
  try {
    let content = await factory(childScope);

    if (transformer) {
      try {
        content = transformer(content, vars ?? {});
      } catch (error) {
        throw new ConfigError(`Error calling transformer "${transformerPath}" from "${file}".`, {
          cause: error,
          filePath: loc?.file,
          lineNumber: refLine ?? loc?.line,
        });
      }
    }

    if (key !== null && key !== undefined) {
      content = get(content, key, { default: null });
    }

    // Walker step 15: tag the resolved content with the instance ref id. This
    // is where reffed nodes get their ~r (construction marks carry ~l only) —
    // var-substituted and nested-ref subtrees already carry theirs and
    // short-circuit, exactly like tagRefDeep.
    if (refId !== null) {
      markDeep(content, refId);
    }

    if (ignoreBuildChecks !== undefined) {
      if (type.isObject(content)) {
        content['~ignoreBuildChecks'] = ignoreBuildChecks;
      } else if (type.isArray(content)) {
        content.forEach((item) => {
          if (type.isObject(item)) {
            item['~ignoreBuildChecks'] = ignoreBuildChecks;
          }
        });
      }
    }

    return content;
  } catch (error) {
    if (error instanceof ConfigError) {
      return collectOrThrow(scope, error);
    }
    throw error;
  }
}

async function ref(args) {
  return applyRefSteps(args);
}

// Dynamic (operator-built) paths dispatch at run time on the resolved
// extension — exactly the walker's getRefContent order with the resolver
// branch handled at emit time (a configured resolver wins before dispatch,
// so dynRef never sees one).
async function dynRef({ scope, path: refPath, loc, sitePath, refLine, ...rest }) {
  let factory;
  try {
    if (!type.isString(refPath)) {
      throw new ConfigError(
        `_ref path resolved to a non-string value. Received: ${JSON.stringify(refPath)}.`,
        { filePath: loc?.file, lineNumber: loc?.line }
      );
    }
    const ext = refPath.slice(refPath.lastIndexOf('.') + 1).toLowerCase();
    if (ext === 'njk') {
      throw new ConfigError(NJK_REMOVED_MESSAGE(refPath), {
        filePath: loc?.file,
        lineNumber: loc?.line,
      });
    }
    if (ext === 'yaml' || ext === 'yml') {
      if (!scope.importer) {
        throw new ConfigError(
          'Dynamic _ref paths require a scope importer (createScope({ importer })).',
          { filePath: loc?.file, lineNumber: loc?.line }
        );
      }
      if (scope.fileExists && !(await scope.fileExists(refPath))) {
        throw missingFileError({ scope, path: refPath, refLine });
      }
      const module = await scope.importer(refPath);
      factory = module.default;
    } else if (ext === 'js') {
      factory = () => importUserFunction({ configDir: scope.configDir, filePath: refPath });
    } else {
      factory = async (childScope) => {
        const text = await readContentFile({ scope, path: refPath, refLine });
        const parsed = parseContentByExt({ content: text, path: refPath });
        return compileParsedContent({ scope, childScope, content: parsed, label: refPath });
      };
    }
  } catch (error) {
    if (error instanceof ConfigError) {
      return collectOrThrow(scope, error);
    }
    throw error;
  }
  // applyRefSteps owns step 8-16 collection; its cycle guard (step 7)
  // deliberately propagates past this frame.
  return applyRefSteps({ scope, factory, file: refPath, loc, sitePath, refLine, ...rest });
}

// Non-YAML static content (json, md, txt, html, …): read at factory run
// through the build's cached reader, parse by extension, and compile
// directive-bearing parsed content through the runtime importer.
async function contentRef({ scope, path: refPath, sitePath, refLine, loc, ...rest }) {
  const factory = async (childScope) => {
    const text = await readContentFile({ scope, path: refPath, refLine });
    const parsed = parseContentByExt({ content: text, path: refPath });
    return compileParsedContent({ scope, childScope, content: parsed, label: refPath });
  };
  return applyRefSteps({ scope, factory, file: refPath, sitePath, refLine, loc, ...rest });
}

// `.js` content refs return the imported default directly — walker
// getRefContent's early return: no content parse, transformer/key/tag still
// apply through the shared steps.
async function jsRef({ scope, path: refPath, ...rest }) {
  const factory = () => importUserFunction({ configDir: scope.configDir, filePath: refPath });
  return applyRefSteps({ scope, factory, file: refPath, ...rest });
}

// Resolver refs (per-ref `resolver:` and the build's global refResolver):
// import the user function, call (path, vars, context), then dispatch the
// returned content — YAML text compiles through importSource (nested refs
// and vars resolve under this ref's scope), everything else follows the
// content matrix. Path-less resolver refs register `original` and skip the
// cycle chain (walker step-5/7 parity).
async function resolverRef({
  scope,
  resolver,
  path: refPath,
  def,
  sitePath,
  refLine,
  loc,
  vars,
  ...rest
}) {
  const hasPath = type.isString(refPath);
  const factory = async (childScope) => {
    const resolverFn = await importUserFunction({
      configDir: scope.configDir,
      filePath: resolver,
    });
    let content;
    try {
      content = await resolverFn(refPath, vars ?? {}, scope.resolverContext);
    } catch (error) {
      throw new ConfigError(`Error calling resolver "${resolver}".`, {
        cause: error,
        filePath: scope.file,
        lineNumber: refLine,
      });
    }
    if (type.isNone(content)) {
      throw new ConfigError(`Resolver "${resolver}" returned "${content}".`, {
        filePath: scope.file,
        lineNumber: refLine,
      });
    }
    if (hasPath && type.isString(content)) {
      const ext = refPath.slice(refPath.lastIndexOf('.') + 1).toLowerCase();
      if (ext === 'njk') {
        throw new ConfigError(NJK_REMOVED_MESSAGE(refPath), {
          filePath: scope.file,
          lineNumber: refLine,
        });
      }
      if (ext === 'yaml' || ext === 'yml') {
        if (!scope.importSource) {
          throw new ConfigError(
            'Resolver YAML content requires a scope importSource (createScope({ importSource })).',
            { filePath: scope.file, lineNumber: refLine }
          );
        }
        const mod = await scope.importSource(content, refPath);
        return mod.default(childScope);
      }
    }
    const parsed = parseContentByExt({ content, path: hasPath ? refPath : undefined });
    return compileParsedContent({
      scope,
      childScope,
      content: parsed,
      label: hasPath ? refPath : `resolver:${resolver}`,
    });
  };
  return applyRefSteps({
    scope,
    factory,
    file: hasPath ? refPath : undefined,
    vars,
    sitePath,
    refLine,
    loc,
    ...rest,
    refMapPath: hasPath ? refPath : undefined,
    original: hasPath ? undefined : def,
    chainGuard: hasPath,
  });
}

// Module refs that cannot resolve statically — page/connection/api forms,
// operator-built names, unknown exports — reproduce getModuleRefContent's
// error ladder exactly, collected at this ref with the refMap entry
// registered (path undefined, raw def as original — walker step 5).
async function invalidModuleRef({
  scope,
  def,
  module: rawName,
  component,
  menu,
  page,
  connection,
  api,
  sitePath,
  refLine,
  loc,
}) {
  allocRefId({
    scope,
    globalPath: globalSitePath(scope, sitePath),
    refLine,
    file: undefined,
    original: def,
  });
  const parts = [];
  if (rawName) parts.push(`module: "${rawName}"`);
  if (component) parts.push(`component: "${component}"`);
  if (menu) parts.push(`menu: "${menu}"`);
  if (page) parts.push(`page: "${page}"`);
  if (connection) parts.push(`connection: "${connection}"`);
  if (api) parts.push(`api: "${api}"`);
  const describe = `_ref { ${parts.join(', ')} }`;
  try {
    const deps = scope.module?.deps ?? null;
    const entryId =
      deps && typeof rawName === 'string' && rawName in deps ? deps[rawName] : rawName;
    const entry = scope.getModuleEntry?.(entryId);
    if (!entry) {
      throw new ConfigError(
        `${describe} references module "${rawName}" but no module with that entry id was registered` +
          (entryId !== rawName
            ? ` ("${rawName}" was mapped to "${entryId}" via dependency wiring).`
            : '.')
      );
    }
    if (page || connection || api) {
      let refType = 'api';
      let operator = '_module.endpointId';
      if (page) {
        refType = 'page';
        operator = '_module.pageId';
      } else if (connection) {
        refType = 'connection';
        operator = '_module.connectionId';
      }
      throw new ConfigError(
        `Cross-module _ref does not support "${refType}". ` +
          `Use ${operator}: { id: "${page ?? connection ?? api}", module: "${rawName}" } instead.`
      );
    }
    let exportType = null;
    if (component !== null && component !== undefined) {
      exportType = 'component';
    } else if (menu !== null && menu !== undefined) {
      exportType = 'menu';
    }
    if (!exportType) {
      throw new ConfigError('Module _ref requires "component" or "menu" property.');
    }
    throw new ConfigError(
      `Module "${entryId}" does not export ${exportType} "${component ?? menu}".`
    );
  } catch (error) {
    if (error instanceof ConfigError) {
      return collectOrThrow(scope, error);
    }
    throw error;
  }
}

// D7a: a `_ref: {module, component}` whose export target is a plain file ref
// in the manifest. Walker semantics preserved: the outer ref allocates at the
// site path with a null refMap path and the def stored as `original`; a
// cross-module cycle key guards recursion (collected at THIS ref — walker
// step 9 sits inside the per-ref try); the inner file ref allocates its own
// id at the SAME site path (collision → counter, matching the walker's
// nested makeRefDefinition during content resolution); consumer vars flow
// into the inner ref (vars injection); the registration binds scope.module
// for _module.* inside the component; outer transformer/key/tag/ignore
// apply after.
async function moduleComponentRef({
  scope,
  factory,
  file,
  entryId,
  component,
  def,
  vars: consumerVars,
  key,
  ignoreBuildChecks,
  transformer,
  transformerPath,
  manifestFile,
  innerRefLine,
  // Inline manifest exports: the factory comes from the registry entry's
  // compiled manifest (compiledFactories[factoryKey]) — no inner file ref.
  inline = false,
  factoryKey,
  // Registry mode (E1): the export could not resolve at compile time —
  // operator-built manifest export lists, walker-registered manifests. The
  // module name maps through dependency wiring and the export looks up in
  // the RESOLVED registry manifest at run time, dispatching to the compiled
  // factory, an on-demand-compiled file target, or mark-preserving copied
  // inline data (the walker's getModuleRefContent content paths).
  registry = false,
  module: rawName,
  sitePath,
  refLine,
  loc,
}) {
  const globalPath = globalSitePath(scope, sitePath);
  let outerId = scope.refId ?? null;
  if (scope.refTracker) {
    outerId = scope.refTracker.alloc(globalPath, {
      parent: scope.refId ?? null,
      lineNumber: refLine,
    });
    scope.refTracker.setPath(outerId, null);
    scope.refTracker.setOriginal?.(outerId, def);
  }
  if (registry) {
    const deps = scope.module?.deps ?? null;
    entryId = deps && typeof rawName === 'string' && rawName in deps ? deps[rawName] : rawName;
  }
  const cycleKey = `module:${entryId}/component:${component}`;
  try {
    if (scope.refChain.includes(cycleKey)) {
      throw new ConfigError(
        `Circular module reference detected. Module "${entryId}" component "${component}" ` +
          `references itself through:\n  -> ${[...scope.refChain, cycleKey].join('\n  -> ')}`,
        { filePath: scope.file }
      );
    }
    const entry = scope.getModuleEntry?.(entryId);
    if (!entry) {
      if (registry) {
        throw new ConfigError(
          `_ref { module: "${rawName}", component: "${component}" } references module "${rawName}" but no module with that entry id was registered` +
            (entryId !== rawName
              ? ` ("${rawName}" was mapped to "${entryId}" via dependency wiring).`
              : '.')
        );
      }
      throw new ConfigError(
        'Module component refs require the build module registry (scope.getModuleEntry).',
        { filePath: loc?.file, lineNumber: loc?.line }
      );
    }
    let registryData;
    if (registry) {
      const components = entry.manifest?.components ?? [];
      const index = components.findIndex((c) => c?.id === component);
      const defNode = components[index]?.component;
      if (defNode === undefined || defNode === null) {
        throw new ConfigError(`Module "${entryId}" does not export component "${component}".`);
      }
      const compiledFactory = entry.compiledFactories?.[`component:${index}`];
      if (compiledFactory) {
        inline = true;
        factoryKey = `component:${index}`;
      } else {
        let refPath = null;
        if (type.isObject(defNode) && Object.keys(defNode).length === 1) {
          if (typeof defNode._ref === 'string') {
            refPath = defNode._ref;
          } else if (
            type.isObject(defNode._ref) &&
            typeof defNode._ref.path === 'string' &&
            Object.keys(defNode._ref).every((k) => k === 'path')
          ) {
            refPath = defNode._ref.path;
          }
        }
        if (refPath !== null) {
          // Plain file-target export: compile and import the target on
          // demand (module files key by absolute path).
          if (!scope.importer) {
            throw new ConfigError(
              'Module component refs require a scope importer (createScope({ importer })).',
              { filePath: loc?.file, lineNumber: loc?.line }
            );
          }
          const absPath = path.isAbsolute(refPath)
            ? refPath
            : path.resolve(entry.moduleRoot, refPath);
          const mod = await scope.importer(absPath);
          factory = mod.default;
          file = absPath;
          innerRefLine = defNode['~l'];
          manifestFile =
            defNode['~deferredFrom'] ?? path.join(entry.moduleRoot, 'module.lowdefy.yaml');
        } else {
          registryData = defNode;
          manifestFile =
            (type.isObject(defNode) ? defNode['~deferredFrom'] : undefined) ??
            path.join(entry.moduleRoot, 'module.lowdefy.yaml');
        }
      }
    }
    const vars = consumerVars ?? {};
    let fromFile = manifestFile;
    if (inline) {
      const index = Number(factoryKey?.split(':')[1]);
      const defNode = entry.manifest?.components?.[index]?.component;
      fromFile = defNode?.['~deferredFrom'] ?? `${entry.moduleRoot}/module.lowdefy.yaml`;
    }
    const outerScope = {
      ...scope,
      refId: outerId,
      walkPath: globalPath ?? '',
      sourceRefId: scope.refId ?? null,
      vars,
      file: fromFile,
      // Walker refChain is a Set — re-adding an existing member is a no-op.
      refChain: scope.refChain.includes(fromFile)
        ? [...scope.refChain, cycleKey]
        : [...scope.refChain, fromFile, cycleKey],
      module: bindModuleEntry({
        id: entry.id ?? entryId,
        consumerVars: entry.consumerVars ?? {},
        varDefs: entry.varDefs ?? {},
        connections: entry.connections ?? {},
        deps: entry.moduleDependencies ?? {},
        resolvedVarCache: entry.resolvedVarCache,
      }),
    };

    let content;
    if (registryData !== undefined) {
      // Resolved inline data from the registry: clone per consumer with
      // marks intact; directive-bearing content (raw preserved zones)
      // compiles and runs under the consumer's scope.
      content = copyMarked(registryData);
      if (hasConfigDirectives(content)) {
        if (!scope.importSource) {
          throw new ConfigError(
            'Module inline content with directives requires a scope importSource.',
            { filePath: loc?.file, lineNumber: loc?.line }
          );
        }
        const mod = await scope.importSource(
          YAML.stringify(content),
          `module:${entryId}/component:${component}`
        );
        content = await mod.default(outerScope);
      }
    } else if (inline) {
      const inlineFactory = entry.compiledFactories?.[factoryKey];
      if (!inlineFactory) {
        throw new ConfigError(
          `Module "${entryId}" compiled manifest is missing factory "${factoryKey}".`,
          { filePath: loc?.file, lineNumber: loc?.line }
        );
      }
      // Walker: inline content walks directly under the OUTER ref's context
      // — no inner ref, content tagged with the outer id (markDeep below).
      content = await inlineFactory(outerScope);
    } else {
      content = await applyRefSteps({
        scope: outerScope,
        factory,
        file,
        vars,
        key: null,
        transformer: null,
        transformerPath: null,
        ignoreBuildChecks: undefined,
        sitePath,
        refLine: innerRefLine,
        loc,
      });
    }

    if (transformer) {
      try {
        content = transformer(content, vars);
      } catch (error) {
        throw new ConfigError(`Error calling transformer "${transformerPath}" from "${null}".`, {
          cause: error,
          filePath: loc?.file,
          lineNumber: refLine ?? loc?.line,
        });
      }
    }

    if (key !== null && key !== undefined) {
      content = get(content, key, { default: null });
    }

    if (outerId !== null) {
      markDeep(content, outerId);
    }

    if (ignoreBuildChecks !== undefined) {
      if (type.isObject(content)) {
        content['~ignoreBuildChecks'] = ignoreBuildChecks;
      } else if (type.isArray(content)) {
        content.forEach((item) => {
          if (type.isObject(item)) {
            item['~ignoreBuildChecks'] = ignoreBuildChecks;
          }
        });
      }
    }

    return content;
  } catch (error) {
    if (error instanceof ConfigError) {
      return collectOrThrow(scope, error);
    }
    throw error;
  }
}

// Walker scopeMenuItemIds parity: menu item ids namespace under the
// exporting registration.
function scopeMenuItemIds(links, entryId) {
  if (!Array.isArray(links)) return;
  for (const item of links) {
    if (!item) continue;
    if (item.id) {
      item.id = `${entryId}/${item.id}`;
    }
    if (Array.isArray(item.links)) {
      scopeMenuItemIds(item.links, entryId);
    }
  }
}

// `_ref: {module, menu}` consumption from the registry: the manifest's menu
// links are resolved at registration (both compiled and walker paths), so
// consumption is per-consumer copy → id scoping → transformer → key → tag →
// ignore — walker getModuleRefContent + resolveRef steps 12-16. Module names
// map through the consuming binding's dependency wiring at run time, with
// getModuleRefContent's exact errors (no location — configKey undefined).
async function moduleMenuRef({
  scope,
  module: rawName,
  menu,
  def,
  vars,
  key,
  ignoreBuildChecks,
  transformer,
  transformerPath,
  sitePath,
  refLine,
  loc,
}) {
  const globalPath = globalSitePath(scope, sitePath);
  let outerId = scope.refId ?? null;
  if (scope.refTracker) {
    outerId = scope.refTracker.alloc(globalPath, {
      parent: scope.refId ?? null,
      lineNumber: refLine,
    });
    scope.refTracker.setPath(outerId, null);
    scope.refTracker.setOriginal?.(outerId, def);
  }
  try {
    const deps = scope.module?.deps ?? null;
    const entryId = deps && rawName in deps ? deps[rawName] : rawName;
    const entry = scope.getModuleEntry?.(entryId);
    if (!entry) {
      throw new ConfigError(
        `_ref { module: "${rawName}", menu: "${menu}" } references module "${rawName}" but no module with that entry id was registered` +
          (entryId !== rawName
            ? ` ("${rawName}" was mapped to "${entryId}" via dependency wiring).`
            : '.')
      );
    }
    const cycleKey = `module:${entryId}/menu:${menu}`;
    if (scope.refChain.includes(cycleKey)) {
      throw new ConfigError(
        `Circular module reference detected. Module "${entryId}" menu "${menu}" ` +
          `references itself through:\n  -> ${[...scope.refChain, cycleKey].join('\n  -> ')}`,
        { filePath: scope.file }
      );
    }
    // Early-compiled manifests resolve their menus on demand with the
    // consumer chain (this consumption's cycle key included) — circular
    // cross-module menu refs throw from the re-entered resolution and
    // collect here (walker recursion parity).
    let menus = entry.manifest?.menus;
    if (entry.resolveMenus) {
      menus = await entry.resolveMenus([...scope.refChain, cycleKey], menu);
    }
    const links = (menus ?? []).find((m) => m?.id === menu)?.links;
    if (!links) {
      throw new ConfigError(`Module "${entryId}" does not export menu "${menu}".`);
    }

    let content = serializer.copy(links);
    scopeMenuItemIds(content, entry.id);

    if (transformer) {
      try {
        content = transformer(content, vars ?? {});
      } catch (error) {
        throw new ConfigError(`Error calling transformer "${transformerPath}" from "${null}".`, {
          cause: error,
          filePath: loc?.file,
          lineNumber: refLine ?? loc?.line,
        });
      }
    }

    if (key !== null && key !== undefined) {
      content = get(content, key, { default: null });
    }

    if (outerId !== null) {
      markDeep(content, outerId);
    }

    if (ignoreBuildChecks !== undefined) {
      if (type.isObject(content)) {
        content['~ignoreBuildChecks'] = ignoreBuildChecks;
      } else if (type.isArray(content)) {
        content.forEach((item) => {
          if (type.isObject(item)) {
            item['~ignoreBuildChecks'] = ignoreBuildChecks;
          }
        });
      }
    }

    return content;
  } catch (error) {
    if (error instanceof ConfigError) {
      return collectOrThrow(scope, error);
    }
    throw error;
  }
}

// Walker getConfigFile parity for statically known missing files — the
// refMap entry is still registered (the walker creates it before fetching),
// and the message carries the resolved absolute path plus the common-mistake
// tips. resolvedPath is emitted at compile time (the runtime has no
// configDir). Line is the ref container's key line (refDef.lineNumber).
async function missingRef({ scope, path: refPath, resolvedPath, sitePath, refLine, loc }) {
  allocRefId({ scope, globalPath: globalSitePath(scope, sitePath), refLine, file: refPath });

  let message = `Referenced file does not exist: "${refPath}". Resolved to: ${resolvedPath}`;
  if (refPath.startsWith('../')) {
    const suggestedPath = refPath.replace(/^(\.\.\/)+/, '');
    message += ` Tip: Paths in _ref are resolved from config root. Did you mean "${suggestedPath}"?`;
  } else if (refPath.startsWith('./')) {
    const suggestedPath = refPath.substring(2);
    message += ` Tip: Remove "./" prefix - paths are resolved from config root. Did you mean "${suggestedPath}"?`;
  }

  const error = new ConfigError(message, {
    filePath: loc?.file ?? null,
    lineNumber: loc?.file ? refLine : null,
  });
  return collectOrThrow(scope, error);
}

export {
  ref,
  dynRef,
  contentRef,
  jsRef,
  resolverRef,
  invalidModuleRef,
  missingRef,
  moduleComponentRef,
  moduleMenuRef,
};
