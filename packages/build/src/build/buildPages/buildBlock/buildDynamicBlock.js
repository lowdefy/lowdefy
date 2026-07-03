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

import { type } from '@lowdefy/helpers';
import { ConfigError } from '@lowdefy/errors';

import countOperators from '../../../utils/countOperators.js';

const TYPES_CATEGORIES = new Set(['blocks', 'actions', 'operators']);

function countDeclaredTypes(block, { pageId, typeCounters }) {
  const configKey = block['~k'];
  const types = block.properties.types;
  if (!type.isObject(types)) {
    throw new ConfigError(
      `Dynamic block "${block.blockId}" on page "${pageId}" properties.types should be an object.`,
      { received: types, configKey }
    );
  }
  Object.keys(types).forEach((category) => {
    if (category.startsWith('~')) return;
    if (!TYPES_CATEGORIES.has(category)) {
      throw new ConfigError(
        `Dynamic block "${block.blockId}" on page "${pageId}" properties.types has unknown category "${category}". Valid categories: blocks, actions, operators.`,
        { configKey }
      );
    }
    if (!type.isArray(types[category])) {
      throw new ConfigError(
        `Dynamic block "${block.blockId}" on page "${pageId}" properties.types.${category} should be an array.`,
        { received: types[category], configKey }
      );
    }
    types[category].forEach((typeName) => {
      if (!type.isString(typeName)) {
        throw new ConfigError(
          `Dynamic block "${block.blockId}" on page "${pageId}" properties.types.${category} should only contain strings.`,
          { received: typeName, configKey }
        );
      }
      if (category === 'blocks') {
        typeCounters.blocks.increment(typeName, configKey);
      }
      if (category === 'actions') {
        typeCounters.actions.increment(typeName, configKey);
      }
      if (category === 'operators') {
        // Normalize method form (_number.round) to the base operator (_number),
        // matching how countOperators counts operator usage.
        const operator = typeName.split('.')[0];
        if (operator.length < 2 || operator[0] !== '_') {
          throw new ConfigError(
            `Dynamic block "${block.blockId}" on page "${pageId}" properties.types.operators contains "${typeName}" which is not an operator name. Operator names start with "_".`,
            { configKey }
          );
        }
        typeCounters.operators.client.increment(operator, configKey);
      }
    });
  });
}

function buildDynamicBlock(block, pageContext) {
  if (block.type !== 'Dynamic') {
    return;
  }
  const { pageId } = pageContext;
  const configKey = block['~k'];
  if (!type.isObject(block.properties)) {
    throw new ConfigError(
      `Dynamic block "${block.blockId}" on page "${pageId}" properties should be an object.`,
      { received: block.properties, configKey }
    );
  }
  if (type.isUndefined(block.properties.endpointId)) {
    throw new ConfigError(
      `Dynamic block "${block.blockId}" on page "${pageId}" requires properties.endpointId.`,
      { configKey }
    );
  }
  if (!type.isString(block.properties.endpointId)) {
    throw new ConfigError(
      `Dynamic block "${block.blockId}" on page "${pageId}" properties.endpointId is not a string.`,
      { received: block.properties.endpointId, configKey }
    );
  }
  if (!type.isNone(block.properties.params)) {
    if (!type.isObject(block.properties.params)) {
      throw new ConfigError(
        `Dynamic block "${block.blockId}" on page "${pageId}" properties.params should be an object.`,
        { received: block.properties.params, configKey }
      );
    }
    // The page artifact is static — params are passed to the endpoint verbatim,
    // so operators here would never evaluate. Runtime values belong in the
    // endpoint routine (_payload, _user, _secret).
    countOperators(block.properties.params, {
      counter: {
        increment: (operator) => {
          throw new ConfigError(
            `Dynamic block "${block.blockId}" on page "${pageId}" properties.params must not contain operators. Found "${operator}". Params are static — read runtime values in the endpoint routine with _payload, _user or _secret.`,
            { configKey }
          );
        },
      },
    });
  }
  if (!type.isNone(block.properties.required) && !type.isBoolean(block.properties.required)) {
    throw new ConfigError(
      `Dynamic block "${block.blockId}" on page "${pageId}" properties.required is not a boolean.`,
      { received: block.properties.required, configKey }
    );
  }
  if (!type.isNone(block.properties.types)) {
    countDeclaredTypes(block, pageContext);
  }
  pageContext.hasDynamicBlocks = true;
  pageContext.dynamicBlockRefs.push({
    endpointId: block.properties.endpointId,
    block,
    sourcePageId: pageId,
  });
}

export default buildDynamicBlock;
