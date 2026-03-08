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

import { get, type } from '@lowdefy/helpers';
import { ConfigError } from '@lowdefy/errors';
import { evaluateOperators, setDynamicMarker } from '@lowdefy/operators';
import makeRefDefinition from './makeRefDefinition.js';
import getRefContent from './getRefContent.js';
import runTransformer from './runTransformer.js';
import getKey from './getKey.js';
import setNonEnumerableProperty from '../../utils/setNonEnumerableProperty.js';
import collectExceptions from '../../utils/collectExceptions.js';

class WalkContext {
  constructor({
    buildContext,
    refId,
    sourceRefId,
    vars,
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
      path: this.path ? `${this.path}.${segment}` : segment,
      currentFile: this.currentFile,
      refChain: this.refChain,
      operators: this.operators,
      env: this.env,
      dynamicIdentifiers: this.dynamicIdentifiers,
      shouldStop: this.shouldStop,
    });
  }

  forRef({ refId, vars, filePath }) {
    const newChain = new Set(this.refChain);
    if (filePath) {
      newChain.add(filePath);
    }
    return new WalkContext({
      buildContext: this.buildContext,
      refId,
      sourceRefId: this.refId,
      vars: vars ?? {},
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

// Check if a value has ~shallow nodes as direct children.
// Used to skip _build.* evaluation when params are shallow-stopped refs
// that will be discarded by stripPageContent anyway.
function hasShallowChild(value) {
  if (!type.isObject(value) && !type.isArray(value)) return false;
  if (type.isObject(value) && value['~shallow'] === true) return true;
  if (type.isArray(value)) {
    return value.some(
      (item) => type.isObject(item) && item['~shallow'] === true
    );
  }
  return Object.values(value).some(
    (item) => type.isObject(item) && item['~shallow'] === true
  );
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

// Deep clone preserving ~r, ~l, ~k non-enumerable markers.
// Used before resolving ref def path/vars to prevent mutation of stored originals.
function cloneForResolve(value) {
  if (!type.isObject(value) && !type.isArray(value)) return value;
  if (type.isArray(value)) {
    const clone = value.map((item) => cloneForResolve(item));
    if (value['~r'] !== undefined) setNonEnumerableProperty(clone, '~r', value['~r']);
    if (value['~l'] !== undefined) setNonEnumerableProperty(clone, '~l', value['~l']);
    if (value['~k'] !== undefined) setNonEnumerableProperty(clone, '~k', value['~k']);
    if (value['~arr'] !== undefined) setNonEnumerableProperty(clone, '~arr', value['~arr']);
    return clone;
  }
  const clone = {};
  for (const key of Object.keys(value)) {
    clone[key] = cloneForResolve(value[key]);
  }
  if (value['~r'] !== undefined) setNonEnumerableProperty(clone, '~r', value['~r']);
  if (value['~l'] !== undefined) setNonEnumerableProperty(clone, '~l', value['~l']);
  if (value['~k'] !== undefined) setNonEnumerableProperty(clone, '~k', value['~k']);
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

// Create a shallow marker for stopped refs (shallow builds)
function createShallowMarker(refDef, ctx, lineNumber) {
  ctx.refMap[refDef.id].path = refDef.path;
  if (!refDef.path) {
    ctx.refMap[refDef.id].original = refDef.original;
  }
  if (Object.keys(refDef.vars).length > 0) {
    ctx.unresolvedRefVars[refDef.id] = refDef.vars;
  }
  const marker = {
    '~shallow': true,
    _ref: refDef.original,
    _refId: refDef.id,
  };
  setDynamicMarker(marker);
  return marker;
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

// Resolve a _ref node (12-step ref handling)
async function resolveRef(node, ctx) {
  // 1. Create ref definition
  const lineNumber = node['~l'];
  const refDef = makeRefDefinition(node._ref, ctx.refId, ctx.refMap, lineNumber);

  // 2. Resolve dynamic path/vars/key: clone before resolving to prevent mutation
  if (type.isObject(refDef.path)) {
    refDef.path = await resolve(cloneForResolve(refDef.path), ctx);
  }
  const varKeys = Object.keys(refDef.vars);
  for (const varKey of varKeys) {
    if (type.isObject(refDef.vars[varKey]) || type.isArray(refDef.vars[varKey])) {
      refDef.vars[varKey] = await resolve(cloneForResolve(refDef.vars[varKey]), ctx);
    }
  }
  if (type.isObject(refDef.key)) {
    refDef.key = await resolve(cloneForResolve(refDef.key), ctx);
  }

  // 3. Update refMap with resolved path; store original for resolver refs
  ctx.refMap[refDef.id].path = refDef.path;
  if (!refDef.path) {
    ctx.refMap[refDef.id].original = refDef.original;
  }

  // 4. Store unresolvedRefVars if vars non-empty
  if (varKeys.length > 0) {
    ctx.unresolvedRefVars[refDef.id] = refDef.vars;
  }

  // 5. Circular detection
  if (refDef.path && ctx.refChain.has(refDef.path)) {
    const chainDisplay = [...ctx.refChain, refDef.path].join('\n  -> ');
    throw new ConfigError(
      `Circular reference detected. File "${refDef.path}" references itself through:\n  -> ${chainDisplay}`,
      { filePath: ctx.currentFile, lineNumber: ctx.currentFile ? lineNumber : null }
    );
  }

  // 6. Load content
  let content = await getRefContent({
    context: ctx.buildContext,
    refDef,
    referencedFrom: ctx.currentFile,
  });

  // 7. Create child context for the ref file
  const childCtx = ctx.forRef({
    refId: refDef.id,
    vars: refDef.vars,
    filePath: refDef.path,
  });

  // 8. Walk the content
  content = await resolve(content, childCtx);

  // 9. Run transformer
  content = await runTransformer({
    context: ctx.buildContext,
    input: content,
    refDef,
  });

  // 10. Extract key
  content = getKey({ input: content, refDef });

  // 11. Tag all nodes with ~r for provenance
  tagRefDeep(content, refDef.id);

  // 12. Propagate ~ignoreBuildChecks
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
}

// Core walk function — single-pass async tree walker
async function resolve(node, ctx) {
  // 1. Primitives pass through
  if (!type.isObject(node) && !type.isArray(node)) return node;

  // 2. Object with _ref
  if (type.isObject(node) && !type.isUndefined(node._ref)) {
    if (ctx.shouldStop && ctx.shouldStop(ctx.path)) {
      const lineNumber = node['~l'];
      const refDef = makeRefDefinition(node._ref, ctx.refId, ctx.refMap, lineNumber);
      return createShallowMarker(refDef, ctx, lineNumber);
    }
    return resolveRef(node, ctx);
  }

  // 4. Object with _var
  if (type.isObject(node) && !type.isUndefined(node._var)) {
    return resolveVar(node, ctx);
  }

  // 5. Array — walk children in-place
  if (type.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      node[i] = await resolve(node[i], ctx.child(String(i)));
    }
    return node;
  }

  // 6. Object — walk children in-place
  const keys = Object.keys(node);
  for (const key of keys) {
    node[key] = await resolve(node[key], ctx.child(key));
  }

  // Check if this is a _build.* operator
  if (isBuildOperator(node)) {
    const opKey = Object.keys(node).find((k) => !k.startsWith('~'));
    // Skip evaluation when params contain shallow-stopped refs — the result
    // will be discarded by stripPageContent, so evaluating would only produce
    // spurious build errors.
    if (hasShallowChild(node[opKey])) {
      return node;
    }
    const result = evaluateBuildOperator(node, ctx);
    tagRefDeep(result, ctx.refId);
    return result;
  }

  return node;
}

export { resolve, WalkContext, cloneForResolve, tagRefDeep };
