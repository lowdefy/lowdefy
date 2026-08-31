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
import { ConfigError } from '@lowdefy/errors';

import setNonEnumerableProperty from '../../../utils/setNonEnumerableProperty.js';
import validateComponentProps from './validateComponentProps.js';

// resolveDynamicContent's MAX_DYNAMIC_DEPTH is 5 for runtime endpoint calls;
// components are a build-time, statically bounded graph, so a higher limit is
// safe and the real guard is the cycle check below.
const MAX_COMPONENT_DEPTH = 10;

// Returns the single non-tilde operator key of a node ({ _prop: x } -> '_prop'),
// or null. Matches getRuntimeOperatorKey in registerModules.
function operatorKey(node) {
  if (!type.isObject(node)) return null;
  const keys = Object.keys(node).filter((k) => !k.startsWith('~'));
  if (keys.length === 1 && keys[0].startsWith('_')) return keys[0];
  return null;
}

// Deep-clones a value, replacing every { _prop: name } node with the instance's
// prop expression (already a use-site operator expression, or a literal
// default). An undefined prop resolves to null, matching how config treats
// "not set".
function inlineProps(value, propExprs) {
  if (operatorKey(value) === '_prop') {
    const name = value['_prop'];
    if (type.isString(name) && !type.isUndefined(propExprs[name])) {
      return serializer.copy(propExprs[name]);
    }
    return null;
  }
  if (type.isArray(value)) {
    return value.map((item) => inlineProps(item, propExprs));
  }
  if (type.isObject(value)) {
    const copy = {};
    for (const key of Object.keys(value)) {
      copy[key] = inlineProps(value[key], propExprs);
    }
    return copy;
  }
  return value;
}

function prefixId(instanceId, id) {
  return `${instanceId}.${id}`;
}

// Transforms one component-body block in place: prefixes its id, inlines _prop
// in its non-structural fields, and recurses into its block lists.
function transformBlock(block, ctx) {
  if (!type.isObject(block)) return block;
  if (type.isString(block.id)) {
    block.id = prefixId(ctx.instanceId, block.id);
  }
  // Carry the component ancestry so a nested component instance in the body can
  // detect a cycle when buildSubBlocks recurses into it.
  setNonEnumerableProperty(block, '__componentAncestry', ctx.bodyAncestry);
  // 'props' is in the list so a body block that is itself a component instance
  // can forward this component's props (props: { tone: { _prop: tone } }) —
  // the inner instance then receives the use-site expression, not a dangling
  // _prop node that would resolve to nothing at runtime.
  for (const field of [
    'properties',
    'class',
    'style',
    'visible',
    'loading',
    'required',
    'layout',
    'validate',
    'events',
    'skeleton',
    'props',
  ]) {
    if (!type.isNone(block[field])) {
      block[field] = inlineProps(block[field], ctx.propExprs);
    }
  }
  if (type.isArray(block.blocks)) {
    block.blocks = transformBlockList(block.blocks, ctx);
  }
  ['areas', 'slots'].forEach((container) => {
    if (type.isObject(block[container])) {
      Object.values(block[container]).forEach((region) => {
        if (type.isArray(region.blocks)) {
          region.blocks = transformBlockList(region.blocks, ctx);
        }
      });
    }
  });
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
          `Component "${ctx.componentId}" body references slot "${name}" which is not in its declared slots: ${[...ctx.declaredSlots].join(', ') || '(none)'}.`,
          { configKey: ctx.configKey }
        );
      }
      const filled = ctx.useSlots[name];
      const blocks = type.isObject(filled) && type.isArray(filled.blocks) ? filled.blocks : [];
      // Slot fillers stay in the consumer's scope: not prefixed, props not
      // inlined. They carry the consumer's ancestry (this instance's level).
      blocks.forEach((b) => {
        if (type.isObject(b)) setNonEnumerableProperty(b, '__componentAncestry', ctx.consumerAncestry);
        result.push(b);
      });
      return;
    }
    result.push(transformBlock(element, ctx));
  });
  return result;
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
      `Component cycle detected: ${[...ancestry, componentId].join(' -> ')}. A component cannot instantiate itself, directly or transitively.`,
      { configKey }
    );
  }
  if (ancestry.length >= MAX_COMPONENT_DEPTH) {
    throw new ConfigError(
      `Component "${componentId}" exceeds the maximum nesting depth of ${MAX_COMPONENT_DEPTH}.`,
      { configKey }
    );
  }

  const instanceId = block.id;
  const useProps = block.props ?? {};
  const useSlots = type.isObject(block.slots) ? block.slots : {};
  const declaredSlots = new Set(def.slots);

  validateComponentProps({ def, useProps, instanceId, configKey, context });

  for (const name of Object.keys(useSlots)) {
    if (name.startsWith('~')) continue;
    if (!declaredSlots.has(name)) {
      throw new ConfigError(
        `Component "${componentId}" used at "${instanceId}" has no slot "${name}". Declared slots: ${[...declaredSlots].join(', ') || '(none)'}.`,
        { configKey: useSlots[name]?.['~k'] ?? configKey }
      );
    }
  }

  // Merge use-site prop values over declared defaults into the expression map.
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
    declaredSlots,
    instanceId,
    propExprs,
    useSlots,
  };
  const expanded = transformBlockList(body, transformCtx);

  // Rewrite the instance block into a Box wrapper. The wrapper keeps the
  // instance id (its inner blocks are prefixed under it, so two instances never
  // share state) and any use-site layout/visibility, and drops the component
  // keys.
  block.type = 'Box';
  block.blocks = expanded;
  delete block.props;
  delete block.slots;
  delete block.areas;

  // Track component usage per page for dev hot-reload invalidation.
  pageContext.componentDeps = pageContext.componentDeps ?? new Set();
  pageContext.componentDeps.add(componentId);
}

export default expandComponent;
