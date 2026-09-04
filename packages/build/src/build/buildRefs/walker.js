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

import { get, ReservedKeyError, type } from '@lowdefy/helpers';
import { ConfigError, ConfigWarning } from '@lowdefy/errors';
import { evaluateOperators } from '@lowdefy/operators';
import makeRefDefinition from './makeRefDefinition.js';
import rebaseModuleRefPaths from './rebaseModuleRefPaths.js';
import getRefContent from './getRefContent.js';
import getModuleRefContent from './getModuleRefContent.js';
import runTransformer from './runTransformer.js';
import getKey from './getKey.js';
import { scopeMenuItemIds } from './scopeMenuItemIds.js';
import resolveDepTarget from '../resolveDepTarget.js';
import setNonEnumerableProperty from '../../utils/setNonEnumerableProperty.js';
import cloneWithMarkers from './cloneWithMarkers.js';
import collectExceptions from '../../utils/collectExceptions.js';
import {
  createRecord,
  getPlaceholderId,
  getRecord,
  makePlaceholder,
  makeRecordId,
  resolveDeferred,
} from './deferredRegistry.js';

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
    deferModuleRefs,
    deferAuthConfig,
    operators,
    env,
    lowdefyApp,
    dynamicIdentifiers,
    shouldStop,
    entryId,
    entrySection,
    activeRecord,
  }) {
    this.buildContext = buildContext;
    this.refId = refId;
    this.sourceRefId = sourceRefId;
    this.vars = vars;
    this.moduleDependencies = moduleDependencies;
    this.moduleEntry = moduleEntry ?? null;
    // The owning module entry id for deferred-record coordinates. Set by the
    // manifest resolvers even before the entry object exists (the local pass
    // walks the manifest before registration completes).
    this.entryId = entryId ?? this.moduleEntry?.id ?? null;
    // The deferred record this walk resolves (null in ordinary walks). Threads
    // through child() and forRef() unchanged, like refChain — every demand made
    // anywhere inside a record's resolution attributes to that record in the
    // wait-graph.
    this.activeRecord = activeRecord ?? null;
    this.moduleRoot = moduleRoot;
    this.packageRoot = packageRoot;
    this.path = path;
    this.currentFile = currentFile;
    this.refChain = refChain;
    this.deferModuleRefs = deferModuleRefs ?? false;
    // Walks that run before the auth-config projection is computed AND whose
    // output is guaranteed a later post-projection walk (entry-config
    // prepare/sweep, deferred-record bodies) leave _build.authConfig folds
    // unevaluated instead of erroring — the operator resolves where the
    // deferred value is consumed. Walks whose output is final (app metadata,
    // the auth pre-pass itself) stay strict, so a genuinely-unresolvable read
    // is still a loud build error.
    this.deferAuthConfig = deferAuthConfig ?? false;
    // Which entry-config section a prepare walk serves ('consumerVars' or
    // 'connections') — entryRef record coordinates and slots need it.
    this.entrySection = entrySection ?? null;
    this.operators = operators;
    this.env = env;
    this.lowdefyApp = lowdefyApp;
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
      deferModuleRefs: this.deferModuleRefs,
      deferAuthConfig: this.deferAuthConfig,
      entrySection: this.entrySection,
      operators: this.operators,
      env: this.env,
      lowdefyApp: this.lowdefyApp,
      dynamicIdentifiers: this.dynamicIdentifiers,
      shouldStop: this.shouldStop,
      entryId: this.entryId,
      activeRecord: this.activeRecord,
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
      deferModuleRefs: this.deferModuleRefs,
      deferAuthConfig: this.deferAuthConfig,
      entrySection: this.entrySection,
      operators: this.operators,
      env: this.env,
      lowdefyApp: this.lowdefyApp,
      dynamicIdentifiers: this.dynamicIdentifiers,
      shouldStop: this.shouldStop,
      entryId: (moduleEntry ?? this.moduleEntry)?.id ?? this.entryId,
      activeRecord: this.activeRecord,
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

// A _build.env read is inlined here, so a name the environment does not set
// becomes a literal null in the artifact before any check can see it. Warn at
// the inline site on every build: unlike a _secret, which is read where the app
// runs, the value is frozen in the environment the build runs in.
function warnUnsetEnvReference(node, ctx) {
  const params = node['_build.env'];
  const name = type.isString(params) ? params : params?.key;
  if (!type.isString(name)) return;
  if (type.isObject(params) && Object.hasOwn(params, 'default')) return;
  if (!type.isUndefined(process.env[name])) return;
  ctx.buildContext.handleWarning(
    new ConfigWarning(
      `Environment variable "${name}" is not set. _build.env read it at build time and inlined null; set it in the build environment or in .env, or give the operator a default.`,
      { configKey: node['~k'], checkSlug: 'secrets' }
    )
  );
}

// Evaluate a _build.* operator using evaluateOperators
function evaluateBuildOperator(node, ctx) {
  if (type.isObject(node) && Object.hasOwn(node, '_build.env')) {
    warnUnsetEnvReference(node, ctx);
  }
  const { output, errors } = evaluateOperators({
    input: node,
    operators: ctx.operators,
    operatorPrefix: '_build.',
    env: ctx.env,
    lowdefyApp: ctx.lowdefyApp,
    authConfig: ctx.buildContext.authConfigProjection,
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

// _var keys are author-written YAML, so a reserved name (e.g. "constructor") is a config
// mistake, not a missing var. Wraps both call shapes for that check. No `default` option is
// passed, so a missing key comes back from `get` as `undefined` — resolveVar relies on that
// `undefined` to tell "var not provided" apart from "var provided as null".
function readVar(key, ctx) {
  try {
    return get(ctx.vars, key);
  } catch (error) {
    if (!(error instanceof ReservedKeyError)) throw error;
    throw new ConfigError(`_var key "${key}" is a reserved name.`, {
      cause: error,
      filePath: ctx.currentFile,
    });
  }
}

// Build the error message for a var that is read but never supplied. Every part of the ref
// chain may be absent in a JIT or synthetic walk, so each is resolved defensively and the
// message degrades to the parts that are known.
function missingVarMessage(key, ctx) {
  const refEntry = ctx.refMap?.[ctx.refId];
  const refPath = refEntry?.path;
  const referringFile = ctx.refMap?.[refEntry?.parent]?.path;
  const lineNumber = refEntry?.lineNumber;
  const optionalForm = `{ _var: { key: ${key}, default: null } }`;

  let message;
  if (referringFile) {
    message =
      `_var "${key}" is not supplied. It is read in "${ctx.currentFile}", which is loaded by the ` +
      `_ref at "${referringFile}:${lineNumber}" resolving to "${refPath}". ` +
      `Add "${key}" to that _ref's vars, or write ${optionalForm} to make it optional.`;
  } else {
    message =
      `_var "${key}" is not supplied. It is read in "${ctx.currentFile}". ` +
      `Add it to the vars of the _ref that loads this file, or write ${optionalForm} to make it optional.`;
  }

  if (type.isObject(ctx.vars) && Object.keys(ctx.vars).length > 0) {
    message += ` Supplied vars: ${Object.keys(ctx.vars).join(', ')}.`;
  }
  return message;
}

// Resolve a _var node
function resolveVar(node, ctx) {
  const varDef = node._var;

  // String form: { _var: "key" } — the var is required.
  if (type.isString(varDef)) {
    const value = readVar(varDef, ctx);
    if (type.isUndefined(value)) {
      throw new ConfigError(missingVarMessage(varDef, ctx), { filePath: ctx.currentFile });
    }
    return cloneWithMarkers(value, { assignRefId: ctx.sourceRefId });
  }

  // Object form: { _var: { key, default } }
  if (type.isObject(varDef) && type.isString(varDef.key)) {
    const varFromParent = readVar(varDef.key, ctx);

    // Var provided (even if null) → use parent's sourceRefId for location
    if (!type.isUndefined(varFromParent)) {
      return cloneWithMarkers(varFromParent, { assignRefId: ctx.sourceRefId });
    }

    // Not provided → the var is only optional if a `default` key was written. Key presence,
    // not the value, so { key, default: null } stays a null default.
    if (!Object.prototype.hasOwnProperty.call(varDef, 'default')) {
      throw new ConfigError(missingVarMessage(varDef.key, ctx), { filePath: ctx.currentFile });
    }

    // Use the default, preserving the template's ~r
    return cloneWithMarkers(varDef.default);
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
  return cloneWithMarkers(value, { assignRefId: ctx.sourceRefId });
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
// Deep-force: demand every deferred-record placeholder in a value's subtree
// and splice the results in place, so cached var values are placeholder-free
// pure data — no consumer of the var cache needs to know records exist.
async function deepForcePlaceholders(value, ctx) {
  const rootId = getPlaceholderId(value);
  if (rootId !== undefined) {
    return cloneWithMarkers(await resolveDeferred(ctx, rootId));
  }
  if (type.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      value[i] = await deepForcePlaceholders(value[i], ctx);
    }
    return value;
  }
  if (type.isObject(value)) {
    for (const key of Object.keys(value)) {
      value[key] = await deepForcePlaceholders(value[key], ctx);
    }
    return value;
  }
  return value;
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

// Read a consumer value by dotted key, forcing any entryRef placeholder on the
// path: a placeholder at the key or any ancestor resolves through
// resolveDeferred and is spliced into consumerVars in place, then the read
// continues. There is no case split on entry state and no structural-snapshot
// read — a read forces exactly the records its value depends on.
async function readConsumerValue(moduleEntry, key, ctx) {
  // Whole-blob deferral: the entire consumerVars value can be a placeholder
  // (vars: { _ref: { module, component } }) — force it before walking keys.
  const rootPlaceholderId = getPlaceholderId(moduleEntry.consumerVars);
  if (rootPlaceholderId !== undefined) {
    moduleEntry.consumerVars =
      cloneWithMarkers(await resolveDeferred(ctx, rootPlaceholderId)) ?? {};
  }
  const parts = key.split('.');
  let parent = moduleEntry.consumerVars;
  for (let i = 0; i < parts.length; i++) {
    if (!type.isObject(parent)) return undefined;
    let node = parent[parts[i]];
    const placeholderId = getPlaceholderId(node);
    if (placeholderId !== undefined) {
      node = cloneWithMarkers(await resolveDeferred(ctx, placeholderId));
      parent[parts[i]] = node;
    }
    if (i === parts.length - 1) return node;
    parent = node;
  }
  return undefined;
}

// Core lazy var resolution with caching on the module entry.
async function resolveEffectiveVar(key, moduleEntry, ctx) {
  if (Object.hasOwn(moduleEntry.resolvedVarCache, key)) {
    return moduleEntry.resolvedVarCache[key];
  }

  const consumerValue = await readConsumerValue(moduleEntry, key, ctx);
  const varDef = getVarDef(moduleEntry.varDefs, key);

  let result;

  if (varDef?.properties) {
    result = await resolveNamespaceVar(key, varDef, moduleEntry, ctx);
  } else if (!type.isNone(consumerValue)) {
    // Deep-force: a consumer value can carry deferred-record placeholders at
    // any depth — demand each and splice, so the cache holds pure data.
    result = await deepForcePlaceholders(consumerValue, ctx);
  } else if (varDef && !type.isUndefined(varDef.default)) {
    // Object/array defaults are varDefault records (demand-only — never swept,
    // a broken default nobody reads must not fail the build); scalar defaults
    // stay raw in varDefs and need no walk.
    const defaultRecordId = getPlaceholderId(varDef.default);
    result =
      defaultRecordId !== undefined ? await resolveDeferred(ctx, defaultRecordId) : varDef.default;
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
  '_module.agentId',
  '_module.notificationId',
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
    return `${targetEntry.id}/${arg.id}`;
  }

  throw new ConfigError('_module.pageId requires a string or object { id, module }.', {
    configKey,
  });
}

// Resolve _module.connectionId
async function resolveModuleConnectionId(arg, moduleEntry, ctx, configKey) {
  const context = ctx.buildContext;

  // A connections value can be an entryRef placeholder mid-build — demand it
  // through the read path and splice, exactly like consumerVars reads. True
  // remap cycles surface as named wait-graph errors from resolveDeferred.
  const readRemapValue = async (entry, id) => {
    const remapping = entry.connections ?? {};
    const placeholderId = getPlaceholderId(remapping[id]);
    if (placeholderId !== undefined) {
      remapping[id] = cloneWithMarkers(await resolveDeferred(ctx, placeholderId));
    }
    return remapping[id];
  };

  if (type.isString(arg)) {
    if (!moduleEntry) {
      throw new ConfigError(
        '_module.connectionId string form is ambiguous at the app level — no module to scope against. Use { id, module } to specify the target module.',
        { configKey }
      );
    }
    const remapValue = await readRemapValue(moduleEntry, arg);
    if (remapValue) {
      return remapValue;
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
    const remapValue = await readRemapValue(targetEntry, arg.id);
    if (remapValue) {
      return remapValue;
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
    return `${targetEntry.id}/${arg.id}`;
  }

  throw new ConfigError('_module.endpointId requires a string or object { id, module }.', {
    configKey,
  });
}

// Resolve _module.agentId
function resolveModuleAgentId(arg, moduleEntry, context, configKey) {
  if (type.isString(arg)) {
    if (!moduleEntry) {
      throw new ConfigError(
        '_module.agentId string form is ambiguous at the app level — no module to scope against. Use { id, module } to specify the target module.',
        { configKey }
      );
    }
    return `${moduleEntry.id}/${arg}`;
  }

  if (type.isObject(arg) && type.isString(arg.id) && type.isString(arg.module)) {
    const targetEntry = resolveDepTarget({
      moduleEntry,
      depName: arg.module,
      context,
      configKey,
      usage: `_module.agentId { id: "${arg.id}", module: "${arg.module}" }`,
    });
    return `${targetEntry.id}/${arg.id}`;
  }

  throw new ConfigError('_module.agentId requires a string or object { id, module }.', {
    configKey,
  });
}

// Resolve _module.notificationId
function resolveModuleNotificationId(arg, moduleEntry, context, configKey) {
  if (type.isString(arg)) {
    if (!moduleEntry) {
      throw new ConfigError(
        '_module.notificationId string form is ambiguous at the app level — no module to scope against. Use { id, module } to specify the target module.',
        { configKey }
      );
    }
    return `${moduleEntry.id}/${arg}`;
  }

  if (type.isObject(arg) && type.isString(arg.id) && type.isString(arg.module)) {
    const targetEntry = resolveDepTarget({
      moduleEntry,
      depName: arg.module,
      context,
      configKey,
      usage: `_module.notificationId { id: "${arg.id}", module: "${arg.module}" }`,
    });
    return `${targetEntry.id}/${arg.id}`;
  }

  throw new ConfigError('_module.notificationId requires a string or object { id, module }.', {
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
async function resolveModuleIdOperator(node, ctx) {
  const { moduleEntry } = ctx;
  const context = ctx.buildContext;
  const configKey = node['~k'];

  if (!type.isUndefined(node['_module.pageId'])) {
    return resolveModulePageId(node['_module.pageId'], moduleEntry, context, configKey);
  }
  if (!type.isUndefined(node['_module.connectionId'])) {
    const connectionArg = node['_module.connectionId'];
    // Prepare (deferModuleRefs) must not resolve the object form: it reads the
    // TARGET entry's remap table, which may not be prepared yet — an eager read
    // would see a raw ref instead of a demandable placeholder. It becomes a
    // connRemap record; demand resolves it once every entry is prepared, so
    // chained remaps force each other value-granularly and true remap cycles
    // surface as named wait-graph errors.
    if (ctx.deferModuleRefs && type.isObject(connectionArg)) {
      const nested = ctx.path.split('.').includes('$refvars');
      const section = ctx.entrySection ?? 'connections';
      const recordId = makeRecordId({
        entryId: ctx.entryId,
        configPath: ctx.path ? `${section}.${ctx.path}` : section,
      });
      createRecord(ctx.buildContext, {
        id: recordId,
        kind: 'connRemap',
        body: node,
        env: {
          file: ctx.currentFile,
          moduleRoot: null,
          packageRoot: null,
          entryId: null,
          refId: ctx.refId,
          configKey: configKey ?? null,
        },
        slot: nested ? null : { entryId: ctx.entryId, section, path: ctx.path },
      });
      return makePlaceholder(recordId);
    }
    return resolveModuleConnectionId(connectionArg, moduleEntry, ctx, configKey);
  }
  if (!type.isUndefined(node['_module.endpointId'])) {
    return resolveModuleEndpointId(node['_module.endpointId'], moduleEntry, context, configKey);
  }
  if (!type.isUndefined(node['_module.agentId'])) {
    return resolveModuleAgentId(node['_module.agentId'], moduleEntry, context, configKey);
  }
  if (!type.isUndefined(node['_module.notificationId'])) {
    return resolveModuleNotificationId(
      node['_module.notificationId'],
      moduleEntry,
      context,
      configKey
    );
  }
  if (!type.isUndefined(node['_module.id'])) {
    return resolveModuleId(node['_module.id'], moduleEntry, context, configKey);
  }

  return node;
}

// Steps 1–7: scope-dependent prepare — resolves path/vars/key, normalises module
// paths, updates refMap, and checks for package-root escapes and circular refs.
// Returns the fully-resolved refDef; all side-effects (unresolvedRefVars, refMap)
// happen here. No file I/O is performed.
async function prepareRef(node, ctx) {
  // 1. Create ref definition
  const lineNumber = node['~l'];
  const refDef = makeRefDefinition(node._ref, ctx.refId, ctx.refMap, lineNumber, ctx.path);

  // 2. Store unresolved vars before resolution mutates them, and clone so
  //    resolution operates on a copy (preserving original.vars for resolver refs).
  const varKeys = Object.keys(refDef.vars);
  if (varKeys.length > 0) {
    ctx.unresolvedRefVars[refDef.id] = refDef.vars;
    refDef.vars = cloneWithMarkers(refDef.vars);
  }

  // 3. Resolve dynamic path/vars/key
  if (type.isObject(refDef.path)) {
    refDef.path = await resolve(cloneWithMarkers(refDef.path), ctx);
  }
  await Promise.all(
    varKeys.map(async (varKey) => {
      if (type.isObject(refDef.vars[varKey]) || type.isArray(refDef.vars[varKey])) {
        // Under prepare (deferModuleRefs), nested module refs inside this ref's
        // vars become entryRef records too. Extend the path with a reserved
        // segment so their coordinates are unique (distinct from this ref's own
        // record) and recognizably nested (slot: null — their placeholder lives
        // in the prepared body, not in consumerVars).
        const varCtx =
          ctx.deferModuleRefs && refDef.module ? ctx.child('$refvars').child(varKey) : ctx;
        refDef.vars[varKey] = await resolve(refDef.vars[varKey], varCtx);
      }
    })
  );
  if (type.isObject(refDef.key)) {
    refDef.key = await resolve(cloneWithMarkers(refDef.key), ctx);
  }

  // 4. Module path resolution: resolve relative paths from the module root
  rebaseModuleRefPaths({ refDef, moduleRoot: ctx.moduleRoot });

  // 5. Update refMap with resolved path; store original for resolver refs
  ctx.refMap[refDef.id].path = refDef.path;
  if (!refDef.path) {
    ctx.refMap[refDef.id].original = refDef.original;
  }

  // 6. Path escape constraint: module refs cannot escape the package root
  if (ctx.packageRoot) {
    for (const field of ['path', 'resolver', 'transformer']) {
      const value = refDef[field];
      if (
        type.isString(value) &&
        !value.startsWith(ctx.packageRoot + '/') &&
        value !== ctx.packageRoot
      ) {
        throw new ConfigError(`Module ref ${field} "${value}" escapes the package root.`, {
          filePath: ctx.currentFile,
          lineNumber: ctx.currentFile ? lineNumber : null,
        });
      }
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

  return refDef;
}

// Steps 8–12, module flavor: content lookup, cross-module cycle key, module
// child context, consumer-var forwarding into file-ref bodies, walk under the
// module context, menu item scoping. Returns the walked content; loadAndWalkRef
// applies the shared tail (steps 13–16). Replayed deferred sentinels route here
// too — `fromFile` carries their original provenance.
async function resolveModuleExportRef(refDef, ctx, { configKey, fromFile }) {
  // 8. Load content. Components and menus dereference a deferred record and
  // clone its immutable body — the record env names the source file
  // explicitly. Legacy live content (scalar bodies, sections produced inline
  // by static operators) resolves against the manifest file.
  const result = await getModuleRefContent({
    context: ctx.buildContext,
    refDef,
    referencedFrom: fromFile,
    walkCtx: ctx,
    configKey,
  });
  const resolvedEntryId = result.entryId;
  const moduleEntry = ctx.buildContext.modules[resolvedEntryId];

  let content;
  let sourceFile;
  if (result.recordId !== undefined) {
    const record = getRecord(ctx.buildContext, result.recordId);
    content = cloneWithMarkers(record.body);
    sourceFile = record.env.file;
  } else {
    content = cloneWithMarkers(result.content);
    sourceFile = path.join(moduleEntry.moduleRoot, 'module.lowdefy.yaml');
  }

  // 9. Circular detection for cross-module component/menu refs.
  // File-based cycle detection (prepareRef step 7) misses these because each
  // module has a different file path. Use a synthetic key with the resolved
  // concrete entry ID: "module:<entryId>/<type>:<name>".
  const exportType = refDef.component ? 'component' : 'menu';
  const exportName = refDef.component ?? refDef.menu;
  const cycleKey = `module:${resolvedEntryId}/${exportType}:${exportName}`;
  if (ctx.refChain.has(cycleKey)) {
    const chainDisplay = [...ctx.refChain, cycleKey].join('\n  -> ');
    throw new ConfigError(
      `Circular module reference detected. Module "${resolvedEntryId}" ${exportType} "${exportName}" ` +
        `references itself through:\n  -> ${chainDisplay}`,
      { filePath: fromFile }
    );
  }

  // 10. Create module child context for the ref
  const childCtx = ctx.forRef({
    refId: refDef.id,
    vars: refDef.vars,
    filePath: sourceFile,
    moduleRoot: moduleEntry.moduleRoot,
    packageRoot: moduleEntry.packageRoot,
    moduleDependencies: moduleEntry.moduleDependencies,
    moduleEntry,
    extraRefChainKeys: [cycleKey],
  });

  // When component/menu content is a file _ref, the inner ref would create
  // a fresh var scope and lose the consumer's vars. Inject them into the clone.
  if (type.isObject(content) && content._ref) {
    if (type.isObject(content._ref)) {
      content._ref.vars = { ...(content._ref.vars ?? {}), ...refDef.vars };
    } else if (type.isString(content._ref) && Object.keys(refDef.vars).length > 0) {
      content._ref = { path: content._ref, vars: refDef.vars };
    }
  }

  // 11. Walk the content
  content = await resolve(content, childCtx);

  // 12. Scope menu item IDs (menu refs only)
  if (refDef.menu) {
    scopeMenuItemIds(content, moduleEntry.id);
  }

  return content;
}

// Steps 8–16: load content, build child context, walk, transform, tag.
// Module refs take steps 8–12 in resolveModuleExportRef; both paths share the
// tail (steps 13–16). `referencedFrom` overrides ctx.currentFile for provenance
// (used when replaying a deferred sentinel whose origin file differs from the
// stage-2 ctx.currentFile).
async function loadAndWalkRef(refDef, ctx, { configKey, referencedFrom } = {}) {
  const fromFile = referencedFrom ?? ctx.currentFile;

  // Errors here are collected (not thrown) so the walker can continue
  // processing sibling refs and report multiple errors at once.
  try {
    let content;
    if (refDef.module) {
      content = await resolveModuleExportRef(refDef, ctx, { configKey, fromFile });
    } else {
      // 8. Load content
      content = await getRefContent({
        context: ctx.buildContext,
        refDef,
        referencedFrom: fromFile,
      });

      // 10. Create child context for the ref
      const childCtx = ctx.forRef({
        refId: refDef.id,
        vars: refDef.vars,
        filePath: refDef.path,
      });

      // 11. Walk the content
      content = await resolve(content, childCtx);
    }

    // 13. Run transformer
    content = await runTransformer({
      context: ctx.buildContext,
      input: content,
      refDef,
      referencedFrom: fromFile,
    });

    // 14. Extract key
    content = getKey({ input: content, refDef, filePath: fromFile });

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

// Resolve a _ref node: prepare (steps 1–7), then optionally defer module refs
// as sentinels (when ctx.deferModuleRefs is true), otherwise load-and-walk (steps 8–16).
async function resolveRef(node, ctx) {
  const refDef = await prepareRef(node, ctx);
  if (ctx.deferModuleRefs && refDef.module) {
    // Prepare-time deferral: the refDef's dynamic parts are already resolved
    // in the enclosing scope (steps 1-7); only the content pull defers. The
    // prepared refDef becomes an entryRef record and the tree gets a
    // placeholder. Records created inside another prepared ref's vars
    // ($refvars segment) have no consumerVars slot — their placeholder lives
    // in the parent body and is spliced by the walk that encounters it.
    const nested = ctx.path.split('.').includes('$refvars');
    const section = ctx.entrySection ?? 'consumerVars';
    const id = makeRecordId({
      entryId: ctx.entryId,
      // ctx.path is '' when the whole section value is the ref (whole-blob).
      configPath: ctx.path ? `${section}.${ctx.path}` : section,
    });
    createRecord(ctx.buildContext, {
      id,
      kind: 'entryRef',
      body: refDef,
      env: {
        // entryRef resolution runs at app level: no module scope; provenance
        // is the file the ref was written in (replaces ~deferredFrom).
        file: ctx.currentFile,
        moduleRoot: null,
        packageRoot: null,
        entryId: null,
        refId: ctx.refId,
        configKey: node['~k'] ?? null,
      },
      slot: nested ? null : { entryId: ctx.entryId, section, path: ctx.path },
    });
    return makePlaceholder(id);
  }
  return loadAndWalkRef(refDef, ctx, { configKey: node['~k'] });
}

// Core walk function — single-pass async tree walker
async function resolve(node, ctx) {
  // 1. Primitives pass through
  if (!type.isObject(node) && !type.isArray(node)) return node;

  // 2. Deferred-record placeholder — kind-aware dispatch. Per-consumer kinds
  // (component, menuLinks) pass through every generic walk untouched; only
  // module-ref consumption dereferences them. Single-value kinds (entryRef,
  // varDefault) force the record and splice a clone in place — the memoized
  // value is shared across demanders, and the tree gets mutated downstream.
  if (type.isObject(node)) {
    const deferredId = getPlaceholderId(node);
    if (deferredId !== undefined) {
      const record = getRecord(ctx.buildContext, deferredId);
      if (record.kind === 'component' || record.kind === 'menuLinks') {
        return node;
      }
      return cloneWithMarkers(await resolveDeferred(ctx, deferredId));
    }
  }

  // 3. _ref — top-down (only operator that needs it)
  if (type.isObject(node) && !type.isUndefined(node._ref)) {
    return resolveRef(node, ctx);
  }

  // 4. Array — walk children in parallel
  if (type.isArray(node)) {
    await Promise.all(
      node.map(async (item, i) => {
        node[i] = await resolve(item, ctx.child(String(i)));
      })
    );
    return node;
  }

  // 5. Object — walk children in parallel (with shouldStop)
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
        if (stopMode === 'skip' || stopMode === 'preserve') {
          // Leave raw — a later phase or consumer handles this region.
          // 'preserve' is a legacy synonym: the ~deferredFrom marker it used
          // to stamp is gone (records carry the source file in env.file).
          return;
        }
        if (type.isString(stopMode) && stopMode.startsWith('record:')) {
          // Record-ify: move the raw body into the registry and splice in the
          // placeholder. The body stays untagged, exactly like an in-place
          // preserved body: manifest walks call resolve() directly (no step 15),
          // so consumer provenance is applied at consumption time by
          // loadAndWalkRef's tagRefDeep over the cloned body.
          const body = node[key];
          // Scalars stay in the tree (mirrors 'preserve', which cannot stamp
          // them); a placeholder means the region was already record-ified by
          // an earlier pass — do not create a duplicate.
          if (!type.isObject(body) && !type.isArray(body)) return;
          if (getPlaceholderId(body) !== undefined) return;
          const kind = stopMode.slice('record:'.length);
          const entryId = ctx.entryId;
          const id = makeRecordId({ entryId, configPath: childPath });
          createRecord(ctx.buildContext, {
            id,
            kind,
            body,
            env: {
              file: ctx.currentFile,
              moduleRoot: ctx.moduleRoot ?? null,
              packageRoot: ctx.packageRoot ?? null,
              entryId,
              refId: ctx.refId,
            },
          });
          node[key] = makePlaceholder(id);
          return;
        }
      }
      node[key] = await resolve(node[key], ctx.child(key));
    })
  );

  // 6. _var — substitution (children already resolved)
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

  // 7. _module.var — module variable substitution
  if (!type.isUndefined(node['_module.var'])) {
    if (!ctx.moduleEntry) {
      if (ctx.moduleRoot) {
        // Module scope without an entry = the header parse or the exportables
        // pass. Those walk module-static structure only: a _module.var here
        // would make manifest headers or export ids vary per consumer, which
        // makes by-name lookup order-dependent.
        throw new ConfigError(
          '_module.var cannot be used in manifest headers or component/menu ids — ' +
            'these are module-static. Move it inside a component body, page, or api section.',
          { filePath: ctx.currentFile }
        );
      }
      throw new ConfigError('_module.var cannot be used at the app level.', {
        filePath: ctx.currentFile,
      });
    }
    return resolve(await resolveModuleVar(node, ctx), ctx);
  }

  // 8. _module.*Id — resolve to scoped ID string
  if (isModuleIdOperator(node)) {
    return resolveModuleIdOperator(node, ctx);
  }

  // 9. _build.* operator
  if (isBuildOperator(node)) {
    // Under prepare (deferModuleRefs), an operand subtree can hold a deferred
    // placeholder where a module ref used to be — the operator cannot fold
    // over it. Leave the node unevaluated: the finalize/demand walk (deferral
    // off) splices concrete values via the placeholder dispatch before this
    // branch runs, and the fold happens then, in the same enclosing scope.
    if (ctx.deferModuleRefs && findPlaceholderInSubtree(node)) {
      return node;
    }
    // Before the auth-config projection is computed, a fold over
    // _build.authConfig cannot resolve. On walks whose output is re-walked
    // post-projection (deferAuthConfig), leave the node unevaluated — its
    // children (_ref, _var) are already resolved, so the fold happens where
    // the deferred value is consumed. Bottom-up resolution makes this guard
    // cover every enclosing _build.* fold of the authConfig read too.
    if (
      ctx.deferAuthConfig &&
      type.isUndefined(ctx.buildContext.authConfigProjection) &&
      findAuthConfigInSubtree(node)
    ) {
      return node;
    }
    const result = evaluateBuildOperator(node, ctx);
    tagRefDeep(result, ctx.refId);
    return result;
  }

  return node;
}

// Does any node in the subtree carry a deferred-record placeholder?
function findPlaceholderInSubtree(node) {
  if (getPlaceholderId(node) !== undefined) return true;
  if (type.isArray(node)) {
    return node.some((item) => findPlaceholderInSubtree(item));
  }
  if (type.isObject(node)) {
    return Object.keys(node).some((key) => findPlaceholderInSubtree(node[key]));
  }
  return false;
}

// Does any node in the subtree read _build.authConfig?
function findAuthConfigInSubtree(node) {
  if (type.isArray(node)) {
    return node.some((item) => findAuthConfigInSubtree(item));
  }
  if (type.isObject(node)) {
    return Object.keys(node).some(
      (key) => key === '_build.authConfig' || findAuthConfigInSubtree(node[key])
    );
  }
  return false;
}

export { resolve, loadAndWalkRef, WalkContext, tagRefDeep };
