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

import { get, serializer, type } from '@lowdefy/helpers';
import { ConfigError } from '@lowdefy/errors';

import { markDeep, setHidden } from './mark.js';
import { bindModuleEntry } from './moduleHelpers.js';

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
function allocRefId({ scope, globalPath, refLine, file }) {
  if (!scope.refTracker) {
    return null;
  }
  const refId = scope.refTracker.alloc(globalPath, {
    parent: scope.refId ?? null,
    lineNumber: refLine,
  });
  scope.refTracker.setPath(refId, file);
  return refId;
}

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
}) {
  const globalPath = globalSitePath(scope, sitePath);
  const refId = allocRefId({ scope, globalPath, refLine, file });

  // Walker step 7: the cycle error is thrown OUTSIDE the per-ref collect
  // boundary — it propagates to the PARENT ref's catch (which nulls the
  // parent), or to the top level when the entry references itself.
  if (scope.refChain.includes(file)) {
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
    refChain: [...scope.refChain, file],
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

async function dynRef({ scope, path, loc, ...rest }) {
  let module;
  try {
    if (!type.isString(path)) {
      throw new ConfigError(
        `_ref path resolved to a non-string value. Received: ${JSON.stringify(path)}.`,
        { filePath: loc?.file, lineNumber: loc?.line }
      );
    }
    if (!scope.importer) {
      throw new ConfigError(
        'Dynamic _ref paths require a scope importer (createScope({ importer })).',
        { filePath: loc?.file, lineNumber: loc?.line }
      );
    }
    module = await scope.importer(path);
  } catch (error) {
    if (error instanceof ConfigError) {
      return collectOrThrow(scope, error);
    }
    throw error;
  }
  // applyRefSteps owns step 8-16 collection; its cycle guard (step 7)
  // deliberately propagates past this frame.
  return applyRefSteps({ scope, factory: module.default, file: path, loc, ...rest });
}

// Refs the compiler does not resolve itself — module/component/menu refs,
// resolver refs, non-YAML content files (js functions, json, raw strings),
// and dynamic paths — delegate to the build's walker through
// scope.walkerResolve. The def is rebuilt as a walker node (vars/key/path
// expressions already evaluated, matching resolveRef step-3 order) and
// resolved by the same code against the same refMap and id counter, so the
// output is walker-identical by construction.
async function delegatedRef({ scope, def, sitePath, refLine, loc }) {
  try {
    if (!scope.walkerResolve) {
      throw new ConfigError(
        'This _ref form is resolved by the build walker — compile it through the full build (scope.walkerResolve is not set).',
        { filePath: loc?.file, lineNumber: loc?.line }
      );
    }
    const node = { _ref: def };
    // The walker reads the ref line from the container's ~l.
    setHidden(node, '~l', refLine);
    return await scope.walkerResolve(node, {
      refId: scope.refId ?? null,
      sourceRefId: scope.sourceRefId ?? null,
      walkPath: globalSitePath(scope, sitePath) ?? '',
      file: scope.file,
      refChain: scope.refChain,
      vars: scope.vars,
    });
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
      throw new ConfigError(
        'Module component refs require the build module registry (scope.getModuleEntry).',
        { filePath: loc?.file, lineNumber: loc?.line }
      );
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
    if (inline) {
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
    const links = (entry.manifest?.menus ?? []).find((m) => m?.id === menu)?.links;
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

export { ref, dynRef, delegatedRef, missingRef, moduleComponentRef, moduleMenuRef };
