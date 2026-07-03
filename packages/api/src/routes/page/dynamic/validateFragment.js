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

import { validate } from '@lowdefy/ajv';
import { type } from '@lowdefy/helpers';
import { ConfigError } from '@lowdefy/errors';

// Keys that look like operators (single key starting with _) but are not.
const KNOWN_NON_OPERATORS = new Set(['_id']);

function isOperatorObject(value) {
  if (!type.isObject(value)) return false;
  const nonTildeKeys = Object.keys(value).filter((key) => !key.startsWith('~'));
  if (nonTildeKeys.length !== 1) return false;
  const [op] = nonTildeKeys[0].split('.');
  const operator = op.replace(/^(_+)/gm, '_');
  return operator.length > 1 && operator[0] === '_' && !KNOWN_NON_OPERATORS.has(operator);
}

function escapePointerSegment(segment) {
  return segment.replace(/~/g, '~0').replace(/\//g, '~1');
}

function collectOperatorPaths(value, path, paths) {
  if (type.isArray(value)) {
    value.forEach((item, index) => collectOperatorPaths(item, `${path}/${index}`, paths));
    return;
  }
  if (!type.isObject(value)) {
    return;
  }
  if (isOperatorObject(value)) {
    paths.push(path);
    return;
  }
  Object.keys(value).forEach((key) => {
    if (key.startsWith('~')) return;
    collectOperatorPaths(value[key], `${path}/${escapePointerSegment(key)}`, paths);
  });
}

// A schema violation at or under an operator node cannot be judged before the
// operator evaluates on the client — { _state: columns } may legitimately sit
// where the schema wants an array. Violations on operator-free paths stand.
function validateBlockProperties(block, { blockSchemas, dynamicBlockId, pageId }) {
  const properties = block.properties;
  if (!type.isObject(properties) || isOperatorObject(properties)) {
    return;
  }
  // Block schemas validate the whole pre-build block shape; the plugin's
  // properties schema sits at schema.properties.properties.
  const propertiesSchema = blockSchemas[block.type]?.properties?.properties;
  if (type.isNone(propertiesSchema)) {
    return;
  }
  const operatorPaths = [];
  collectOperatorPaths(properties, '', operatorPaths);
  const result = validate({ schema: propertiesSchema, data: properties, returnErrors: true });
  if (result.valid) {
    return;
  }
  const errors = result.errors.filter(
    (error) =>
      !operatorPaths.some(
        (path) => error.instancePath === path || error.instancePath.startsWith(`${path}/`)
      )
  );
  if (errors.length > 0) {
    const messages = errors.map(
      (error) => `properties${error.instancePath || ''} ${error.message}`
    );
    throw new ConfigError(
      `Dynamic block "${dynamicBlockId}" on page "${pageId}" resolved block "${block.blockId}" (${
        block.type
      }) has invalid properties:\n${messages.map((message) => `  - ${message}`).join('\n')}`
    );
  }
}

function walkBlocks(blocks, callback) {
  blocks.forEach((block) => {
    callback(block);
    Object.values(block.slots ?? {}).forEach((slot) => {
      walkBlocks(slot.blocks ?? [], callback);
    });
  });
}

async function validateFragment(
  context,
  {
    blocks,
    blockSchemas,
    callApiActionRefs,
    dynamicBlockId,
    pageId,
    pageRequests,
    requestActionRefs,
  }
) {
  walkBlocks(blocks, (block) => {
    validateBlockProperties(block, { blockSchemas, dynamicBlockId, pageId });
  });

  // Request actions can only reference requests defined statically on the page —
  // request artifacts are written at build time.
  const pageRequestIds = new Set(pageRequests.map((request) => request.requestId));
  requestActionRefs.forEach(({ requestId, blockId, eventId }) => {
    if (!pageRequestIds.has(requestId)) {
      throw new ConfigError(
        `Dynamic block "${dynamicBlockId}" on page "${pageId}" resolved content references request "${requestId}" on event "${eventId}" on block "${blockId}" which is not defined on the page.`
      );
    }
  });

  // CallAPI refs fail resolution instead of the user's click — same checks the
  // HTTP endpoint route applies.
  for (const { endpointId, blockId, eventId } of callApiActionRefs) {
    const endpointConfig = await context.readConfigFile(`api/${endpointId}.json`);
    if (!endpointConfig || endpointConfig.type === 'InternalApi') {
      throw new ConfigError(
        `Dynamic block "${dynamicBlockId}" on page "${pageId}" resolved content has a CallAPI action on event "${eventId}" on block "${blockId}" targeting endpoint "${endpointId}" which does not exist or is not accessible from client pages.`
      );
    }
  }
}

export default validateFragment;
