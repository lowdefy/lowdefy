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
import { getPossibleOperators, isNestedDeeperThan, MAX_DATA_DEPTH } from '@lowdefy/operators';

import getPropertiesSchemaErrors from '../getPropertiesSchemaErrors.js';
import checkEvents from './checkEvents.js';
import checkValue from './checkValue.js';
import collectUrlKinds from './collectUrlKinds.js';
import findSerializerKeys from './findSerializerKeys.js';
import isUnderState from './isUnderState.js';

// Block keys walked by a dedicated rule rather than checkValue.
const STRUCTURAL_KEYS = new Set(['areas', 'blocks', 'events', 'skeleton', 'slots']);
// Keys that must be literal so the policy and schema can see inside them.
const LITERAL_KEYS = ['properties', 'style', 'layout'];

function structureError({ path, message }) {
  return { path, rule: 'policy.structure', message };
}

// Child block lists under blocks, slots.<name>.blocks and areas.<name>.blocks.
function childBlockLists(block) {
  const lists = [];
  if (!type.isUndefined(block.blocks)) {
    lists.push({ blocks: block.blocks, path: 'blocks' });
  }
  ['areas', 'slots'].forEach((containerKey) => {
    Object.keys(block[containerKey] ?? {}).forEach((name) => {
      if (name.startsWith('~')) return;
      lists.push({
        blocks: block[containerKey][name]?.blocks ?? [],
        path: `${containerKey}.${name}.blocks`,
      });
    });
  });
  return lists;
}

// Blocks that bind state: inputs write their value at their id, lists hold arrays there.
function bindsState({ block, blockMetas }) {
  const meta = blockMetas[block.type] ?? {};
  return !type.isNone(meta.valueType) || meta.category === 'list';
}

function hasPossibleOperators({ value, walk }) {
  return getPossibleOperators({ value, operators: walk.clientOperators }).length > 0;
}

function checkBlockShape({ block, path, walk }) {
  const { errors } = walk;
  if (!type.isObject(block) || hasPossibleOperators({ value: block, walk })) {
    errors.push(structureError({ path, message: 'Blocks must be literal objects.' }));
    return false;
  }
  let valid = true;
  if (!type.isString(block.id)) {
    errors.push(structureError({ path: `${path}.id`, message: 'Block "id" must be a string.' }));
    valid = false;
  }
  if (!type.isString(block.type)) {
    errors.push(
      structureError({ path: `${path}.type`, message: 'Block "type" must be a string.' })
    );
    valid = false;
  }
  if (!type.isNone(block.areas) && !type.isNone(block.slots)) {
    errors.push(structureError({ path, message: 'A block cannot have both "areas" and "slots".' }));
  }
  return valid;
}

function checkBlock({ block, path, depth, walk }) {
  const { blockMetas, blockSchemas, errors, ids, policy } = walk;
  if (!checkBlockShape({ block, path, walk })) {
    return;
  }
  walk.count += 1;
  if (depth > policy.limits.depth) {
    errors.push({
      path,
      rule: 'limits.depth',
      message: `Block nesting is deeper than ${policy.limits.depth}, the depth dynamic blocks policy "${policy.id}" allows.`,
    });
    return;
  }
  if (!policy.blocks.includes(block.type)) {
    errors.push({
      path: `${path}.type`,
      rule: 'policy.blocks',
      message: `Block type "${block.type}" is not in dynamic blocks policy "${policy.id}" blocks.`,
    });
  }
  if (bindsState({ block, blockMetas })) {
    if (ids.has(block.id)) {
      errors.push({
        path: `${path}.id`,
        rule: 'policy.ids',
        message: `Block id "${block.id}" binds state and is used more than once.`,
      });
    }
    ids.add(block.id);
    if (!type.isNone(policy.state) && !isUnderState({ key: block.id, state: policy.state })) {
      errors.push({
        path: `${path}.id`,
        rule: 'policy.state',
        message: `Block id "${block.id}" binds state outside "${policy.state}", the state dynamic blocks policy "${policy.id}" allows.`,
      });
    }
  }
  LITERAL_KEYS.forEach((key) => {
    if (hasPossibleOperators({ value: block[key], walk })) {
      errors.push({
        path: `${path}.${key}`,
        rule: 'policy.literal',
        message: `Block "${key}" must be literal under dynamic blocks policy "${policy.id}", not an operator.`,
      });
    }
  });
  // The block schema marks which properties hold URLs.
  const urlKinds = collectUrlKinds({
    value: block.properties,
    schema: blockSchemas[block.type]?.properties?.properties,
    path: `${path}.properties`,
  });
  Object.keys(block).forEach((key) => {
    if (key.startsWith('~') || STRUCTURAL_KEYS.has(key)) return;
    checkValue({ value: block[key], key, path: `${path}.${key}`, walk: { ...walk, urlKinds } });
  });
  if (!type.isUndefined(block.events)) {
    checkEvents({ events: block.events, path: `${path}.events`, walk });
  }
  getPropertiesSchemaErrors({ block, blockSchemas }).forEach((message) => {
    errors.push({ path: `${path}.properties`, rule: 'schema', message });
  });
  // Skeletons render through LoadingBlock without buildBlock, so they obey the
  // same rules as content.
  if (!type.isUndefined(block.skeleton)) {
    checkBlock({ block: block.skeleton, path: `${path}.skeleton`, depth: depth + 1, walk });
  }
  childBlockLists(block).forEach((list) => {
    // eslint-disable-next-line no-use-before-define
    checkBlockList({ blocks: list.blocks, path: `${path}.${list.path}`, depth: depth + 1, walk });
  });
}

function checkBlockList({ blocks, path, depth, walk }) {
  if (!type.isArray(blocks)) {
    walk.errors.push(structureError({ path, message: 'A block list must be an array.' }));
    return;
  }
  blocks.forEach((block, index) => checkBlock({ block, path: `${path}.${index}`, depth, walk }));
}

// Applies a dynamic blocks policy to content as submitted (before buildBlock renames
// ids or moves areas to slots), so every error's path indexes that content.
// clientOperators is the app's set of client operator names: a key that names
// none of them is data to the client.
function checkPolicy({ blocks, policy, blockMetas, blockSchemas, clientOperators = null }) {
  // The rules walk content by recursion, so content nested deeper than any
  // Dynamic data may be is refused first, before it can exhaust the stack.
  if (isNestedDeeperThan({ value: blocks, limit: MAX_DATA_DEPTH })) {
    return [
      {
        path: 'blocks',
        rule: 'limits.depth',
        message: `Content is nested more than ${MAX_DATA_DEPTH} levels deep. Dynamic blocks policy "${policy.id}" content may nest at most ${MAX_DATA_DEPTH} levels.`,
      },
    ];
  }
  // Checked as the page sends it to the client: an Error or Date in the content
  // is a "~e" or "~d" object there.
  const content = serializer.serialize(blocks, { skipMarkers: true });
  const bytes = JSON.stringify(content).length;
  if (bytes > policy.limits.bytes) {
    return [
      {
        path: 'blocks',
        rule: 'limits.bytes',
        message: `Content is ${bytes} bytes. Dynamic blocks policy "${policy.id}" allows ${policy.limits.bytes}.`,
      },
    ];
  }
  const walk = {
    actionIds: new Set(),
    blockMetas,
    blockSchemas,
    clientOperators,
    count: 0,
    errors: [],
    ids: new Set(),
    policy,
  };
  checkBlockList({ blocks: content, path: 'blocks', depth: 1, walk });
  findSerializerKeys({ value: content, path: 'blocks' }).forEach((path) => {
    walk.errors.push(
      structureError({
        path,
        message: 'Keys starting with "~" are reserved for serialized values such as dates.',
      })
    );
  });
  if (walk.count > policy.limits.blocks) {
    walk.errors.unshift({
      path: 'blocks',
      rule: 'limits.blocks',
      message: `Content has ${walk.count} blocks. Dynamic blocks policy "${policy.id}" allows ${policy.limits.blocks}.`,
    });
  }
  return walk.errors;
}

export default checkPolicy;
