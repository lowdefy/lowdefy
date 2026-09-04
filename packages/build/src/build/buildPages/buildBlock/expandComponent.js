/* eslint-disable no-param-reassign */

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

import { serializer, type } from '@lowdefy/helpers';
import { ConfigError, ConfigWarning } from '@lowdefy/errors';

import namespaceBlockId from './namespaceBlockId.js';
import rekeyInstance from './rekeyInstance.js';
import setNonEnumerableProperty from '../../../utils/setNonEnumerableProperty.js';
import validateComponentProps from './validateComponentProps.js';

// resolveDynamicContent's MAX_DYNAMIC_DEPTH is 5 for runtime endpoint calls;
// components are a build-time, statically bounded graph, so a higher limit is
// safe and the real guard is the cycle check below.
const MAX_COMPONENT_DEPTH = 10;

// Keys of a body block that are never prop-expression positions: the two
// identity keys the expansion owns, and the block-tree containers that are
// walked as block lists (where { _slot: name } is meaningful). Every other key
// of every body block — properties, events, requests, subscriptions, validate,
// skeleton, layout, the nested instance's own props — is inlined, so no key can
// be forgotten as `requests` was.
const NOT_INLINED_BLOCK_KEYS = new Set(['id', 'type', 'blocks', 'areas', 'slots']);

// An optional prop that the use site does not supply and that declares no
// default is *absent*, not null: the key is dropped so the block's own default
// applies, exactly as if the author had not written it.
const ABSENT = Symbol('absent');

// Returns the single non-tilde operator key of a node ({ _prop: x } -> '_prop'),
// or null. Matches getRuntimeOperatorKey in registerModules.
function operatorKey(node) {
  if (!type.isObject(node)) return null;
  const keys = Object.keys(node).filter((k) => !k.startsWith('~'));
  if (keys.length === 1 && keys[0].startsWith('_')) return keys[0];
  return null;
}

// Replaces every { _prop: name } node in value with the instance's prop
// expression (a use-site operator expression, or a declared default). Mutates
// in place — value is already a private copy of the component body — so the
// non-enumerable ~k/~l markers on every nested node survive and errors raised
// against the expansion still resolve to the component file.
function inlineProps(value, ctx) {
  if (operatorKey(value) === '_prop') {
    const name = value['_prop'];
    if (!type.isString(name)) {
      throw new ConfigError(
        `Component "${ctx.componentId}" body has a _prop that is not a prop name string.`,
        { received: name, configKey: value['~k'] ?? ctx.configKey, checkSlug: 'component' }
      );
    }
    if (!ctx.declaredProps.has(name)) {
      const declared = [...ctx.declaredProps].join(', ');
      throw new ConfigError(
        `Component "${
          ctx.componentId
        }" body reads prop "${name}" which is not declared. Declared props: ${
          declared || '(none)'
        }.`,
        { configKey: value['~k'] ?? ctx.configKey, checkSlug: 'component' }
      );
    }
    if (type.isUndefined(ctx.propExprs[name])) return ABSENT;
    return serializer.copy(ctx.propExprs[name]);
  }
  if (type.isArray(value)) {
    let write = 0;
    for (let read = 0; read < value.length; read++) {
      const result = inlineProps(value[read], ctx);
      if (result !== ABSENT) {
        value[write] = result;
        write++;
      }
    }
    value.length = write;
    return value;
  }
  if (type.isObject(value)) {
    for (const key of Object.keys(value)) {
      const result = inlineProps(value[key], ctx);
      if (result === ABSENT) {
        delete value[key];
      } else {
        value[key] = result;
      }
    }
    return value;
  }
  return value;
}

function inlineFields(object, skip, ctx) {
  for (const key of Object.keys(object)) {
    if (skip.has(key) || key.startsWith('~')) continue;
    const result = inlineProps(object[key], ctx);
    if (result === ABSENT) {
      delete object[key];
    } else {
      object[key] = result;
    }
  }
}

const SKIP_REGION_KEYS = new Set(['blocks']);

// Transforms one component-body block in place: prefixes its id, inlines _prop
// in every non-structural key, and recurses into its block lists.
function transformBlock(block, ctx) {
  if (!type.isObject(block)) return block;
  if (type.isString(block.id)) {
    block.id = namespaceBlockId({ prefix: ctx.instanceId, id: block.id, configKey: ctx.configKey });
  }
  // Carry the component ancestry so a nested component instance in the body can
  // detect a cycle when buildSubBlocks recurses into it.
  setNonEnumerableProperty(block, '__componentAncestry', ctx.bodyAncestry);
  inlineFields(block, NOT_INLINED_BLOCK_KEYS, ctx);
  if (type.isArray(block.blocks)) {
    block.blocks = transformBlockList(block.blocks, ctx);
  }
  for (const container of ['areas', 'slots']) {
    const regions = block[container];
    if (!type.isObject(regions)) continue;
    for (const region of Object.values(regions)) {
      if (!type.isObject(region)) continue;
      inlineFields(region, SKIP_REGION_KEYS, ctx);
      if (type.isArray(region.blocks)) {
        region.blocks = transformBlockList(region.blocks, ctx);
      }
    }
  }
  return block;
}

// Processes a body block list, expanding { _slot: name } markers into the
// consumer's slot blocks (which stay in the consumer's scope — not prefixed,
// props not inlined) and transforming every other element as a body block.
function transformBlockList(list, ctx) {
  const result = [];
  list.forEach((element) => {
    if (operatorKey(element) === '_slot') {
      const name = element['_slot'];
      if (!ctx.declaredSlots.has(name)) {
        throw new ConfigError(
          `Component "${
            ctx.componentId
          }" body references slot "${name}" which is not in its declared slots: ${
            [...ctx.declaredSlots].join(', ') || '(none)'
          }.`,
          { configKey: ctx.configKey, checkSlug: 'component' }
        );
      }
      const filled = ctx.useSlots[name];
      const blocks = type.isObject(filled) && type.isArray(filled.blocks) ? filled.blocks : [];
      // Slot fillers stay in the consumer's scope: not prefixed, props not
      // inlined. They carry the consumer's ancestry (this instance's level).
      blocks.forEach((b) => {
        if (type.isObject(b)) {
          setNonEnumerableProperty(b, '__componentAncestry', ctx.consumerAncestry);
          // Not a clone: the filler keeps the key it was authored with, so
          // rekeyInstance must leave it and its subtree alone.
          ctx.slotFillers.add(b);
        }
        result.push(b);
      });
      return;
    }
    result.push(transformBlock(element, ctx));
  });
  return result;
}

// _prop and _slot are build-time markers, not operators: nothing resolves them
// after expansion. A node that survives is in a position the expansion cannot
// reach (a block id, a slot filler written at a page where there is no props
// scope), so it is a located error rather than a value that silently resolves
// to undefined at runtime.
function assertNoResidualMarkers(node, path, ctx) {
  const key = operatorKey(node);
  if (key === '_prop' || key === '_slot') {
    const detail =
      key === '_slot'
        ? '_slot may only appear as an element of a "blocks" list inside a component body.'
        : '_prop may only appear inside a component body, and not in a block "id" or "type".';
    throw new ConfigError(
      `Component "${ctx.componentId}" used at "${ctx.instanceId}" left an unresolved ${key} at "${path}". ${detail}`,
      { received: node, configKey: node['~k'] ?? ctx.configKey, checkSlug: 'component' }
    );
  }
  if (type.isArray(node)) {
    node.forEach((item, index) => assertNoResidualMarkers(item, `${path}[${index}]`, ctx));
    return;
  }
  if (type.isObject(node)) {
    Object.keys(node).forEach((childKey) => {
      if (childKey.startsWith('~')) return;
      assertNoResidualMarkers(node[childKey], `${path}.${childKey}`, ctx);
    });
  }
}

// "areas" is the deprecated alias for "slots" everywhere in the block language,
// normalised by moveAreasToSlots — which runs after this step. A component
// instance's slot fill is read here, so the alias is resolved here too, or the
// use site's slot content would be deleted with the instance's component keys.
function resolveSlotAlias(block, { componentId, configKey, context }) {
  if (type.isNone(block.areas)) return;
  if (!type.isNone(block.slots)) {
    throw new ConfigError(
      `Component "${componentId}" used at "${block.id}" cannot have both "areas" and "slots". Use "slots".`,
      { configKey, checkSlug: 'component' }
    );
  }
  context.handleWarning(
    new ConfigWarning(
      `Component "${componentId}" used at "${block.id}": "areas" is deprecated, use "slots".`,
      { configKey, checkSlug: 'component' }
    )
  );
  block.slots = block.areas;
  delete block.areas;
}

// Expands a component-instance block into a Box wrapper carrying the expanded
// body. Runs first in buildBlock, so setBlockId, validateBlock and all block
// validations then apply to the expansion unchanged, and buildSubBlocks
// recurses into the body (expanding nested components).
function expandComponent(block, pageContext) {
  const { context } = pageContext;
  const def = context.componentDefs?.[block.type];
  if (type.isNone(def)) return;

  const configKey = block['~k'];
  const componentId = block.type;

  // Ancestry is carried per block (non-enumerable), not on the shared
  // pageContext, so sibling instances never see a polluted stack.
  const ancestry = block.__componentAncestry ?? [];
  if (ancestry.includes(componentId)) {
    throw new ConfigError(
      `Component cycle detected: ${[...ancestry, componentId].join(
        ' -> '
      )}. A component cannot instantiate itself, directly or transitively.`,
      { configKey, checkSlug: 'component' }
    );
  }
  if (ancestry.length >= MAX_COMPONENT_DEPTH) {
    throw new ConfigError(
      `Component "${componentId}" exceeds the maximum nesting depth of ${MAX_COMPONENT_DEPTH}.`,
      { configKey, checkSlug: 'component' }
    );
  }

  resolveSlotAlias(block, { componentId, configKey, context });

  const instanceId = block.id;
  const useProps = block.props ?? {};
  const useSlots = type.isObject(block.slots) ? block.slots : {};
  const declaredSlots = new Set(def.slots);

  validateComponentProps({ def, useProps, instanceId, configKey, context });

  for (const name of Object.keys(useSlots)) {
    if (name.startsWith('~')) continue;
    if (!declaredSlots.has(name)) {
      throw new ConfigError(
        `Component "${componentId}" used at "${instanceId}" has no slot "${name}". Declared slots: ${
          [...declaredSlots].join(', ') || '(none)'
        }.`,
        { configKey: useSlots[name]?.['~k'] ?? configKey, checkSlug: 'component' }
      );
    }
  }

  // Merge use-site prop values over declared defaults into the expression map.
  // A declared prop with neither is absent from the map, and inlineProps drops
  // the key that reads it.
  const propExprs = {};
  for (const [name, propDef] of Object.entries(def.props)) {
    if (!type.isUndefined(useProps[name])) {
      propExprs[name] = useProps[name];
    } else if (type.isObject(propDef) && !type.isUndefined(propDef.default)) {
      propExprs[name] = propDef.default;
    }
  }

  const body = serializer.copy(def.blocks);
  const transformCtx = {
    bodyAncestry: [...ancestry, componentId],
    componentId,
    configKey,
    consumerAncestry: ancestry,
    declaredProps: new Set(Object.keys(def.props)),
    declaredSlots,
    instanceId,
    propExprs,
    slotFillers: new Set(),
    useSlots,
  };
  const expanded = transformBlockList(body, transformCtx);
  assertNoResidualMarkers(expanded, `${instanceId}.blocks`, transformCtx);

  // The body and every inlined prop expression are copies, and a copy carries
  // the ~k of the node it was copied from. Two instances of one component would
  // otherwise name the same config location and share each other's
  // ~ignoreBuildChecks.
  rekeyInstance({
    tree: expanded,
    instanceKey: configKey,
    keyMap: context.keyMap,
    skip: transformCtx.slotFillers,
  });

  // Rewrite the instance block into a Box wrapper. The wrapper keeps the
  // instance id (its inner blocks are prefixed under it, so two instances never
  // share state) and any use-site layout/visibility, and drops the component
  // keys.
  block.type = 'Box';
  block.blocks = expanded;
  delete block.props;
  delete block.slots;

  // Track component usage per page for dev hot-reload invalidation.
  pageContext.componentDeps = pageContext.componentDeps ?? new Set();
  pageContext.componentDeps.add(componentId);
}

export default expandComponent;
