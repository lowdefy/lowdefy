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

import { get, serializer, type } from '@lowdefy/helpers';
import { ConfigError } from '@lowdefy/errors';
import { evaluateOperators } from '@lowdefy/operators';
import makeRefDefinition from './makeRefDefinition.js';
import getRefContent from './getRefContent.js';
import getModuleRefContent from './getModuleRefContent.js';
import runTransformer from './runTransformer.js';
import getKey from './getKey.js';
import { scopeMenuItemIds } from '../resolveModuleOperators.js';
import resolveDepTarget from '../resolveDepTarget.js';
import setNonEnumerableProperty from '../../utils/setNonEnumerableProperty.js';
import collectExceptions from '../../utils/collectExceptions.js';

class WalkContext {
  constructor({
    buildContext,
    refId,
    sourceRefId,
    vars,
    moduleDependencies,
    moduleEntry,
    moduleRoot,
    packageRoot,
    path,
    currentFile,
    refChain,
    operators,
    env,
    dynamicIdentifiers,
    shouldStop,
  }) {
    this.buildContext = buildContext;
    this.refId = refId;
    this.sourceRefId = sourceRefId;
    this.vars = vars;
    this.moduleDependencies = moduleDependencies;
    this.moduleEntry = moduleEntry ?? null;
    this.moduleRoot = moduleRoot;
    this.packageRoot = packageRoot;
    this.path = path;
    this.currentFile = currentFile;
    this.refChain = refChain;
    this.operators = operators;
    this.env = env;
    this.dynamicIdentifiers = dynamicIdentifiers;
    this.shouldStop = shouldStop;
  }

  child(segment) {
    return new WalkContext({
      buildContext: this.buildContext,
      refId: this.refId,
      sourceRefId: this.sourceRefId,
      vars: this.vars,
      moduleDependencies: this.moduleDependencies,
      moduleEntry: this.moduleEntry,
      moduleRoot: this.moduleRoot,
      packageRoot: this.packageRoot,
      path: this.path ? `${this.path}.${segment}` : segment,
      currentFile: this.currentFile,
      refChain: this.refChain,
      operators: this.operators,
      env: this.env,
      dynamicIdentifiers: this.dynamicIdentifiers,
      shouldStop: this.shouldStop,
    });
  }

  forRef({
    refId,
    vars,
    filePath,
    moduleRoot,
    packageRoot,
    moduleDependencies,
    moduleEntry,
    extraRefChainKeys,
  }) {
    const newChain = new Set(this.refChain);
    if (filePath) {
      newChain.add(filePath);
    }
    if (extraRefChainKeys) {
      for (const key of extraRefChainKeys) {
        newChain.add(key);
      }
    }
    return new WalkContext({
      buildContext: this.buildContext,
      refId,
      sourceRefId: this.refId,
      vars: vars ?? {},
      moduleDependencies: moduleDependencies ?? this.moduleDependencies,
      moduleEntry: moduleEntry ?? this.moduleEntry,
      moduleRoot: moduleRoot ?? this.moduleRoot,
      packageRoot: packageRoot ?? this.packageRoot,
      path: this.path,
      currentFile: filePath ?? this.currentFile,
      refChain: newChain,
      operators: this.operators,
      env: this.env,
      dynamicIdentifiers: this.dynamicIdentifiers,
      shouldStop: this.shouldStop,
    });
  }

  collectError(error) {
    collectExceptions(this.buildContext, error);
  }

  get refMap() {
    return this.buildContext.refMap;
  }

  get unresolvedRefVars() {
    return this.buildContext.unresolvedRefVars;
  }
}

// Detect _build.* operator objects: single non-tilde key starting with '_build.'
function isBuildOperator(node) {
  const keys = Object.keys(node);
  const nonTildeKeys = keys.filter((k) => !k.startsWith('~'));
  return nonTildeKeys.length === 1 && nonTildeKeys[0].startsWith('_build.');
}

// Set ~r as non-enumerable if not already present
function tagRef(node, refId) {
  if (type.isObject(node) || type.isArray(node)) {
    if (node['~r'] === undefined) {
      setNonEnumerableProperty(node, '~r', refId);
    }
  }
}

// Recursively set ~r on all objects/arrays that don't already have it
function tagRefDeep(node, refId) {
  if (!type.isObject(node) && !type.isArray(node)) return;
  if (node['~r'] !== undefined) return;
  setNonEnumerableProperty(node, '~r', refId);
  if (type.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      tagRefDeep(node[i], refId);
    }
  } else {
    for (const key of Object.keys(node)) {
      tagRefDeep(node[key], refId);
    }
  }
}

// Deep clone preserving non-enumerable build markers (~r, ~l, ~k, ~arr, ~deferredFrom).
// Used before resolving ref def path/vars to prevent mutation of stored originals.
function cloneForResolve(value) {
  if (!type.isObject(value) && !type.isArray(value)) return value;
  if (type.isArray(value)) {
    const clone = value.map((item) => cloneForResolve(item));
    if (value['~r'] !== undefined) setNonEnumerableProperty(clone, '~r', value['~r']);
    if (value['~l'] !== undefined) setNonEnumerableProperty(clone, '~l', value['~l']);
    if (value['~k'] !== undefined) setNonEnumerableProperty(clone, '~k', value['~k']);
    if (value['~arr'] !== undefined) setNonEnumerableProperty(clone, '~arr', value['~arr']);
    if (value['~deferredFrom'] !== undefined)
      setNonEnumerableProperty(clone, '~deferredFrom', value['~deferredFrom']);
    return clone;
  }
  const clone = {};
  for (const key of Object.keys(value)) {
    clone[key] = cloneForResolve(value[key]);
  }
  if (value['~r'] !== undefined) setNonEnumerableProperty(clone, '~r', value['~r']);
  if (value['~l'] !== undefined) setNonEnumerableProperty(clone, '~l', value['~l']);
  if (value['~k'] !== undefined) setNonEnumerableProperty(clone, '~k', value['~k']);
  if (value['~deferredFrom'] !== undefined)
    setNonEnumerableProperty(clone, '~deferredFrom', value['~deferredFrom']);
  return clone;
}

// Deep clone a var value, preserving markers and setting ~r provenance.
// When sourceRefId is null, preserves the template's existing ~r markers.
function cloneVarValue(value, sourceRefId) {
  if (!type.isObject(value) && !type.isArray(value)) return value;
  return cloneDeepWithProvenance(value, sourceRefId);
}

function cloneDeepWithProvenance(node, sourceRefId) {
  if (!type.isObject(node) && !type.isArray(node)) return node;
  if (type.isArray(node)) {
    const clone = node.map((item) => cloneDeepWithProvenance(item, sourceRefId));
    if (node['~r'] !== undefined) {
      setNonEnumerableProperty(clone, '~r', node['~r']);
    } else if (sourceRefId) {
      setNonEnumerableProperty(clone, '~r', sourceRefId);
    }
    if (node['~l'] !== undefined) setNonEnumerableProperty(clone, '~l', node['~l']);
    if (node['~k'] !== undefined) setNonEnumerableProperty(clone, '~k', node['~k']);
    if (node['~arr'] !== undefined) setNonEnumerableProperty(clone, '~arr', node['~arr']);
    return clone;
  }
  const clone = {};
  for (const key of Object.keys(node)) {
    clone[key] = cloneDeepWithProvenance(node[key], sourceRefId);
  }
  if (node['~r'] !== undefined) {
    setNonEnumerableProperty(clone, '~r', node['~r']);
  } else if (sourceRefId) {
    setNonEnumerableProperty(clone, '~r', sourceRefId);
  }
  if (node['~l'] !== undefined) setNonEnumerableProperty(clone, '~l', node['~l']);
  if (node['~k'] !== undefined) setNonEnumerableProperty(clone, '~k', node['~k']);
  return clone;
}

// Evaluate a _build.* operator using evaluateOperators
function evaluateBuildOperator(node, ctx) {
  const { output, errors } = evaluateOperators({
    input: node,
    operators: ctx.operators,
    operatorPrefix: '_build.',
    env: ctx.env,
    dynamicIdentifiers: ctx.dynamicIdentifiers,
  });
  if (errors.length > 0) {
    errors.forEach((error) => {
      error.filePath = error.refId ? ctx.refMap[error.refId]?.path : ctx.currentFile;
      ctx.collectError(error);
    });
  }
  return output;
}

// Resolve a _var node
function resolveVar(node, ctx) {
  const varDef = node._var;

  // String form: { _var: "key" }
  if (type.isString(varDef)) {
    const value = get(ctx.vars, varDef, { default: null });
    return cloneVarValue(value, ctx.sourceRefId);
  }

  // Object form: { _var: { key, default } }
  if (type.isObject(varDef) && type.isString(varDef.key)) {
    const varFromParent = get(ctx.vars, varDef.key);

    // Var provided (even if null) → use parent's sourceRefId for location
    if (!type.isUndefined(varFromParent)) {
      return cloneVarValue(varFromParent, ctx.sourceRefId);
    }

    // Not provided → use default, preserve template's ~r
    const defaultValue = type.isNone(varDef.default) ? null : varDef.default;
    return cloneVarValue(defaultValue, null);
  }

  throw new ConfigError('_var operator takes a string or object with "key" field as arguments.', {
    filePath: ctx.currentFile,
  });
}

// Resolve a _module.var node via lazy resolution against the module entry.
async function resolveModuleVar(node, ctx) {
  const key = node['_module.var'];

  if (!type.isString(key)) {
    throw new ConfigError('_module.var operator takes a string argument.', {
      filePath: ctx.currentFile,
    });
  }

  const value = await resolveEffectiveVar(key, ctx.moduleEntry, ctx);
  return cloneVarValue(value, ctx.sourceRefId);
}

// Navigate the var definitions tree by dot-path key, following `properties` nesting.
function getVarDef(varDefs, key) {
  const parts = key.split('.');
  let current = varDefs;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!current?.[part]) return undefined;
    if (current[part].properties && i < parts.length - 1) {
      current = current[part].properties;
    } else {
      return current[part];
    }
  }
  return undefined;
}

// Resolve a raw var default through the walker using a fresh WalkContext rooted
// at the module manifest. The fresh context prevents false circular-ref detection
// from the consumer's refChain and ensures _ref paths resolve relative to the
// module root.
async function resolveVarDefault(rawDefault, moduleEntry, ctx) {
  const moduleYamlPath = path.join(moduleEntry.moduleRoot, 'module.lowdefy.yaml');

  const defaultCtx = new WalkContext({
    buildContext: ctx.buildContext,
    refId: moduleEntry.refDef.id,
    sourceRefId: null,
    vars: {},
    moduleDependencies: moduleEntry.moduleDependencies,
    moduleEntry,
    moduleRoot: moduleEntry.moduleRoot,
    packageRoot: moduleEntry.packageRoot,
    path: '',
    currentFile: moduleYamlPath,
    refChain: new Set(moduleEntry.refDef.path ? [moduleEntry.refDef.path] : []),
    operators: ctx.operators,
    env: ctx.env,
    dynamicIdentifiers: ctx.dynamicIdentifiers,
  });

  return await resolve(rawDefault, defaultCtx);
}

// Build a merged object for namespace vars (vars with `properties`). Each
// declared property resolves through resolveEffectiveVar — consumer values
// take precedence per-leaf; missing leaves fall back to defaults.
async function resolveNamespaceVar(prefix, varDef, moduleEntry, ctx) {
  const result = {};

  for (const propName of Object.keys(varDef.properties)) {
    const fullKey = `${prefix}.${propName}`;
    result[propName] = await resolveEffectiveVar(fullKey, moduleEntry, ctx);
  }

  return result;
}

// Core lazy var resolution with caching on the module entry.
async function resolveEffectiveVar(key, moduleEntry, ctx) {
  if (Object.hasOwn(moduleEntry.resolvedVarCache, key)) {
    return moduleEntry.resolvedVarCache[key];
  }

  const consumerValue = get(moduleEntry.consumerVars, key, { default: undefined });
  const varDef = getVarDef(moduleEntry.varDefs, key);

  let result;

  if (varDef?.properties) {
    result = await resolveNamespaceVar(key, varDef, moduleEntry, ctx);
  } else if (!type.isNone(consumerValue)) {
    result = consumerValue;
  } else if (varDef && !type.isUndefined(varDef.default)) {
    result = await resolveVarDefault(varDef.default, moduleEntry, ctx);
  } else {
    result = null;
  }

  moduleEntry.resolvedVarCache[key] = result;
  return result;
}

// Detect _module.*Id operators
const MODULE_ID_OPERATOR_KEYS = [
  '_module.pageId',
  '_module.connectionId',
  '_module.endpointId',
  '_module.id',
];

function isModuleIdOperator(node) {
  return MODULE_ID_OPERATOR_KEYS.some((key) => !type.isUndefined(node[key]));
}

// Resolve _module.pageId
function resolveModulePageId(arg, moduleEntry, context, configKey) {
  if (type.isString(arg)) {
    if (!moduleEntry) {
      throw new ConfigError(
        '_module.pageId string form is ambiguous at the app level — no module to scope against. Use { id, module } to specify the target module.',
        { configKey }
      );
    }
    if (!(moduleEntry.exports?.pages ?? []).some((p) => p.id === arg)) {
      throw new ConfigError(`Module "${moduleEntry.id}" does not export page "${arg}".`, {
        configKey,
      });
    }
    return `${moduleEntry.id}/${arg}`;
  }

  if (type.isObject(arg) && type.isString(arg.id) && type.isString(arg.module)) {
    const targetEntry = resolveDepTarget({
      moduleEntry,
      depName: arg.module,
      context,
      configKey,
      usage: `_module.pageId { id: "${arg.id}", module: "${arg.module}" }`,
    });
    if (!(targetEntry.exports?.pages ?? []).some((p) => p.id === arg.id)) {
      const caller = moduleEntry ? `Module "${moduleEntry.id}"` : 'App config';
      throw new ConfigError(
        `${caller} references page "${arg.id}" ` +
          `from "${arg.module}" (entry "${targetEntry.id}"), ` +
          `but that module does not export page "${arg.id}".`,
        { configKey }
      );
    }
    return `${targetEntry.id}/${arg.id}`;
  }

  throw new ConfigError('_module.pageId requires a string or object { id, module }.', {
    configKey,
  });
}

// Resolve _module.connectionId
function resolveModuleConnectionId(arg, moduleEntry, context, configKey) {
  if (type.isString(arg)) {
    if (!moduleEntry) {
      throw new ConfigError(
        '_module.connectionId string form is ambiguous at the app level — no module to scope against. Use { id, module } to specify the target module.',
        { configKey }
      );
    }
    if (!(moduleEntry.exports?.connections ?? []).some((c) => c.id === arg)) {
      throw new ConfigError(`Module "${moduleEntry.id}" does not export connection "${arg}".`, {
        configKey,
      });
    }
    const remapping = moduleEntry.connections ?? {};
    if (remapping[arg]) {
      return remapping[arg];
    }
    return `${moduleEntry.id}/${arg}`;
  }

  if (type.isObject(arg) && type.isString(arg.id) && type.isString(arg.module)) {
    const targetEntry = resolveDepTarget({
      moduleEntry,
      depName: arg.module,
      context,
      configKey,
      usage: `_module.connectionId { id: "${arg.id}", module: "${arg.module}" }`,
    });
    if (!(targetEntry.exports?.connections ?? []).some((c) => c.id === arg.id)) {
      const caller = moduleEntry ? `Module "${moduleEntry.id}"` : 'App config';
      throw new ConfigError(
        `${caller} references connection "${arg.id}" ` +
          `from "${arg.module}" (entry "${targetEntry.id}"), ` +
          `but that module does not export connection "${arg.id}".`,
        { configKey }
      );
    }
    const targetRemapping = targetEntry.connections ?? {};
    if (targetRemapping[arg.id]) {
      return targetRemapping[arg.id];
    }
    return `${targetEntry.id}/${arg.id}`;
  }

  throw new ConfigError('_module.connectionId requires a string or object { id, module }.', {
    configKey,
  });
}

// Resolve _module.endpointId
function resolveModuleEndpointId(arg, moduleEntry, context, configKey) {
  if (type.isString(arg)) {
    if (!moduleEntry) {
      throw new ConfigError(
        '_module.endpointId string form is ambiguous at the app level — no module to scope against. Use { id, module } to specify the target module.',
        { configKey }
      );
    }
    if (!(moduleEntry.exports?.api ?? []).some((e) => e.id === arg)) {
      throw new ConfigError(`Module "${moduleEntry.id}" does not export endpoint "${arg}".`, {
        configKey,
      });
    }
    return `${moduleEntry.id}/${arg}`;
  }

  if (type.isObject(arg) && type.isString(arg.id) && type.isString(arg.module)) {
    const targetEntry = resolveDepTarget({
      moduleEntry,
      depName: arg.module,
      context,
      configKey,
      usage: `_module.endpointId { id: "${arg.id}", module: "${arg.module}" }`,
    });
    if (!(targetEntry.exports?.api ?? []).some((e) => e.id === arg.id)) {
      const caller = moduleEntry ? `Module "${moduleEntry.id}"` : 'App config';
      throw new ConfigError(
        `${caller} references endpoint "${arg.id}" ` +
          `from "${arg.module}" (entry "${targetEntry.id}"), ` +
          `but that module does not export endpoint "${arg.id}".`,
        { configKey }
      );
    }
    return `${targetEntry.id}/${arg.id}`;
  }

  throw new ConfigError('_module.endpointId requires a string or object { id, module }.', {
    configKey,
  });
}

// Resolve _module.id
function resolveModuleId(arg, moduleEntry, context, configKey) {
  if (!type.isObject(arg)) {
    if (!moduleEntry) {
      throw new ConfigError(
        '_module.id is ambiguous at the app level — no module to scope against. Use { module } to specify the target module.',
        { configKey }
      );
    }
    return moduleEntry.id;
  }

  if (type.isString(arg.module)) {
    const targetEntry = resolveDepTarget({
      moduleEntry,
      depName: arg.module,
      context,
      configKey,
      usage: `_module.id { module: "${arg.module}" }`,
    });
    return targetEntry.id;
  }

  throw new ConfigError('_module.id requires a truthy value or object { module }.', { configKey });
}

// Dispatch _module.*Id operators
function resolveModuleIdOperator(node, ctx) {
  const { moduleEntry } = ctx;
  const context = ctx.buildContext;
  const configKey = node['~k'];

  if (!type.isUndefined(node['_module.pageId'])) {
    return resolveModulePageId(node['_module.pageId'], moduleEntry, context, configKey);
  }
  if (!type.isUndefined(node['_module.connectionId'])) {
    return resolveModuleConnectionId(node['_module.connectionId'], moduleEntry, context, configKey);
  }
  if (!type.isUndefined(node['_module.endpointId'])) {
    return resolveModuleEndpointId(node['_module.endpointId'], moduleEntry, context, configKey);
  }
  if (!type.isUndefined(node['_module.id'])) {
    return resolveModuleId(node['_module.id'], moduleEntry, context, configKey);
  }

  return node;
}

// Resolve a _ref node (16-step ref handling)
async function resolveRef(node, ctx) {
  // 1. Create ref definition
  const lineNumber = node['~l'];
  const refDef = makeRefDefinition(node._ref, ctx.refId, ctx.refMap, lineNumber, ctx.path);

  // 2. Store unresolved vars before resolution mutates them, and clone so
  //    resolution operates on a copy (preserving original.vars for resolver refs).
  const varKeys = Object.keys(refDef.vars);
  if (varKeys.length > 0) {
    ctx.unresolvedRefVars[refDef.id] = refDef.vars;
    refDef.vars = cloneForResolve(refDef.vars);
  }

  // 3. Resolve dynamic path/vars/key
  if (type.isObject(refDef.path)) {
    refDef.path = await resolve(cloneForResolve(refDef.path), ctx);
  }
  await Promise.all(
    varKeys.map(async (varKey) => {
      if (type.isObject(refDef.vars[varKey]) || type.isArray(refDef.vars[varKey])) {
        refDef.vars[varKey] = await resolve(refDef.vars[varKey], ctx);
      }
    })
  );
  if (type.isObject(refDef.key)) {
    refDef.key = await resolve(cloneForResolve(refDef.key), ctx);
  }

  // 4. Module path resolution: resolve relative paths from the module root
  if (ctx.moduleRoot && type.isString(refDef.path) && !path.isAbsolute(refDef.path)) {
    refDef.path = path.resolve(ctx.moduleRoot, refDef.path);
  }

  // 5. Update refMap with resolved path; store original for resolver refs
  ctx.refMap[refDef.id].path = refDef.path;
  if (!refDef.path) {
    ctx.refMap[refDef.id].original = refDef.original;
  }

  // 6. Path escape constraint: module refs cannot escape the package root
  if (ctx.packageRoot && refDef.path) {
    if (!refDef.path.startsWith(ctx.packageRoot + '/') && refDef.path !== ctx.packageRoot) {
      throw new ConfigError(`Module ref path "${refDef.path}" escapes the package root.`);
    }
  }

  // 7. Circular detection
  if (refDef.path && ctx.refChain.has(refDef.path)) {
    const chainDisplay = [...ctx.refChain, refDef.path].join('\n  -> ');
    throw new ConfigError(
      `Circular reference detected. File "${refDef.path}" references itself through:\n  -> ${chainDisplay}`,
      { filePath: ctx.currentFile, lineNumber: ctx.currentFile ? lineNumber : null }
    );
  }

  // Steps 8-16: File operations that can fail independently per ref.
  // Errors are collected so the walker can continue processing sibling refs,
  // allowing multiple errors to be reported at once.
  try {
    // 8. Load content
    let content;
    let resolvedEntryId = null;

    if (refDef.module) {
      const result = await getModuleRefContent({
        context: ctx.buildContext,
        refDef,
        referencedFrom: ctx.currentFile,
        walkCtx: ctx,
        configKey: node['~k'],
      });
      content = cloneForResolve(result.content);
      resolvedEntryId = result.entryId;
    } else {
      content = await getRefContent({
        context: ctx.buildContext,
        refDef,
        referencedFrom: ctx.currentFile,
      });
    }

    // 9. Circular detection for cross-module component/menu refs.
    // File-based cycle detection (step 7) misses these because each module
    // has a different file path. Use a synthetic key with the resolved
    // concrete entry ID: "module:<entryId>/<type>:<name>".
    if (resolvedEntryId && (refDef.component || refDef.menu)) {
      const exportType = refDef.component ? 'component' : 'menu';
      const exportName = refDef.component ?? refDef.menu;
      const cycleKey = `module:${resolvedEntryId}/${exportType}:${exportName}`;
      if (ctx.refChain.has(cycleKey)) {
        const chainDisplay = [...ctx.refChain, cycleKey].join('\n  -> ');
        throw new ConfigError(
          `Circular module reference detected. Module "${resolvedEntryId}" ${exportType} "${exportName}" ` +
            `references itself through:\n  -> ${chainDisplay}`,
          { filePath: ctx.currentFile }
        );
      }
    }

    // 10. Create child context for the ref
    let childCtx;
    if (refDef.module && (refDef.component || refDef.menu)) {
      const moduleEntry = ctx.buildContext.modules[resolvedEntryId];
      const deferredFrom = content['~deferredFrom'];
      const exportType = refDef.component ? 'component' : 'menu';
      const exportName = refDef.component ?? refDef.menu;
      const cycleKey = `module:${resolvedEntryId}/${exportType}:${exportName}`;
      childCtx = ctx.forRef({
        refId: refDef.id,
        vars: refDef.vars,
        filePath: deferredFrom ?? path.join(moduleEntry.moduleRoot, 'module.lowdefy.yaml'),
        moduleRoot: moduleEntry.moduleRoot,
        packageRoot: moduleEntry.packageRoot,
        moduleDependencies: moduleEntry.moduleDependencies,
        moduleEntry,
        extraRefChainKeys: [cycleKey],
      });

      // Clone so each consumer gets an independent copy — getModuleRefContent
      // returns a shared reference, and resolve() mutates in place.
      // deferredFrom was read above before the clone (serializer.copy strips
      // non-enumerable properties).
      content = serializer.copy(content);

      // When component/menu content is a file _ref, the inner ref would create
      // a fresh var scope and lose the consumer's vars. Inject them into the clone.
      if ((refDef.component || refDef.menu) && type.isObject(content) && content._ref) {
        if (type.isObject(content._ref)) {
          content._ref.vars = { ...(content._ref.vars ?? {}), ...refDef.vars };
        } else if (type.isString(content._ref) && Object.keys(refDef.vars).length > 0) {
          content._ref = { path: content._ref, vars: refDef.vars };
        }
      }
    } else {
      childCtx = ctx.forRef({
        refId: refDef.id,
        vars: refDef.vars,
        filePath: refDef.path,
      });
    }

    // 11. Walk the content
    content = await resolve(content, childCtx);

    // 12. Scope menu item IDs (module menu refs only)
    if (refDef.module && refDef.menu) {
      const moduleEntry = ctx.buildContext.modules[resolvedEntryId];
      scopeMenuItemIds(content, moduleEntry.id);
    }

    // 13. Run transformer
    content = await runTransformer({
      context: ctx.buildContext,
      input: content,
      refDef,
    });

    // 14. Extract key
    content = getKey({ input: content, refDef });

    // 15. Tag all nodes with ~r for provenance
    tagRefDeep(content, refDef.id);

    // 16. Propagate ~ignoreBuildChecks
    if (refDef.ignoreBuildChecks !== undefined) {
      if (type.isObject(content)) {
        content['~ignoreBuildChecks'] = refDef.ignoreBuildChecks;
      } else if (type.isArray(content)) {
        content.forEach((item) => {
          if (type.isObject(item)) {
            item['~ignoreBuildChecks'] = refDef.ignoreBuildChecks;
          }
        });
      }
    }

    return content;
  } catch (error) {
    if (error instanceof ConfigError) {
      ctx.collectError(error);
      return null;
    }
    throw error;
  }
}

// Core walk function — single-pass async tree walker
async function resolve(node, ctx) {
  // 1. Primitives pass through
  if (!type.isObject(node) && !type.isArray(node)) return node;

  // 2. _ref — top-down (only operator that needs it)
  if (type.isObject(node) && !type.isUndefined(node._ref)) {
    return resolveRef(node, ctx);
  }

  // 3. Array — walk children in parallel
  if (type.isArray(node)) {
    await Promise.all(
      node.map(async (item, i) => {
        node[i] = await resolve(item, ctx.child(String(i)));
      })
    );
    return node;
  }

  // 4. Object — walk children in parallel (with shouldStop)
  const keys = Object.keys(node);
  await Promise.all(
    keys.map(async (key) => {
      if (ctx.shouldStop) {
        const childPath = ctx.path ? `${ctx.path}.${key}` : key;
        const stopMode = ctx.shouldStop(childPath, ctx.refId);
        if (stopMode === 'delete' || stopMode === true) {
          delete node[key];
          return;
        }
        if (stopMode === 'preserve') {
          if (type.isObject(node[key]) || type.isArray(node[key])) {
            setNonEnumerableProperty(node[key], '~deferredFrom', ctx.currentFile);
          }
          return;
        }
      }
      node[key] = await resolve(node[key], ctx.child(key));
    })
  );

  // 5. _var — substitution (children already resolved)
  if (!type.isUndefined(node._var)) {
    try {
      const varResult = resolveVar(node, ctx);
      return await resolve(varResult, ctx);
    } catch (error) {
      if (error instanceof ConfigError) {
        ctx.collectError(error);
        return null;
      }
      throw error;
    }
  }

  // 6. _module.var — module variable substitution
  if (!type.isUndefined(node['_module.var'])) {
    if (!ctx.moduleEntry) {
      if (ctx.moduleRoot) return node;
      throw new ConfigError('_module.var cannot be used at the app level.');
    }
    return resolve(await resolveModuleVar(node, ctx), ctx);
  }

  // 7. _module.*Id — resolve to scoped ID string
  if (isModuleIdOperator(node)) {
    return resolveModuleIdOperator(node, ctx);
  }

  // 8. _build.* operator
  if (isBuildOperator(node)) {
    const result = evaluateBuildOperator(node, ctx);
    tagRefDeep(result, ctx.refId);
    return result;
  }

  return node;
}

export { resolve, WalkContext, cloneForResolve, tagRefDeep };
