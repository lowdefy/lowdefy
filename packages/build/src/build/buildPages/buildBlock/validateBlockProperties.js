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

import { compile } from '@lowdefy/ajv';
import { getOperatorType, type } from '@lowdefy/helpers';
import { ConfigError } from '@lowdefy/errors';

import findSimilarString from '../../../utils/findSimilarString.js';

const MAX_LISTED_PROPERTIES = 10;

// An operator's result cannot be judged before it runs, so operator-valued
// nodes are left out of the data that is validated. ~-prefixed keys (~r, ~l)
// are build metadata the plugin schemas do not allow.
function copyLiteralNodes(node) {
  if (type.isArray(node)) {
    return node
      .filter((item) => getOperatorType(item) === null)
      .map((item) => copyLiteralNodes(item));
  }
  if (!type.isObject(node)) {
    return node;
  }
  const copy = {};
  for (const key of Object.keys(node)) {
    if (key.startsWith('~')) continue;
    const value = node[key];
    if (getOperatorType(value) !== null) continue;
    copy[key] = copyLiteralNodes(value);
  }
  return copy;
}

// An operator may have supplied a required field, so required is not checked.
function stripRequired(schema) {
  if (type.isArray(schema)) {
    return schema.map((item) => stripRequired(item));
  }
  if (!type.isObject(schema)) {
    return schema;
  }
  const copy = {};
  for (const key of Object.keys(schema)) {
    if (key === 'required' && type.isArray(schema[key])) continue;
    copy[key] = stripRequired(schema[key]);
  }
  return copy;
}

function getValidator({ blockType, propertiesSchema, context }) {
  if (type.isNone(context.blockPropertiesValidators)) {
    context.blockPropertiesValidators = {};
  }
  if (type.isNone(context.blockPropertiesValidators[blockType])) {
    const schema = stripRequired(propertiesSchema);
    context.blockPropertiesValidators[blockType] = { schema, validate: compile({ schema }) };
  }
  return context.blockPropertiesValidators[blockType];
}

function formatReceived(value) {
  if (type.isUndefined(value)) return 'undefined';
  return JSON.stringify(value);
}

function describeError({ error, schema, data }) {
  const path = `properties${error.instancePath.replaceAll('/', '.')}`;
  if (error.keyword === 'additionalProperties') {
    const property = error.params.additionalProperty;
    const validProperties = Object.keys(schema.properties ?? {});
    const nearest = findSimilarString({ input: property, candidates: validProperties });
    let message = `unknown property "${property}"`;
    if (error.instancePath !== '') {
      message = `${path}: ${message}`;
    }
    if (nearest !== null) {
      return `${message}. Did you mean "${nearest}"?`;
    }
    if (validProperties.length > 0 && validProperties.length <= MAX_LISTED_PROPERTIES) {
      return `${message}. Valid properties: ${validProperties.join(', ')}.`;
    }
    return `${message}.`;
  }
  const received = error.instancePath
    .split('/')
    .filter((segment) => segment !== '')
    .reduce((node, segment) => node?.[segment], data);
  return `${path} ${error.message}. Received ${formatReceived(received)}.`;
}

// Resolves the sub-schema an additionalProperties error was raised against, so
// the "did you mean" candidates are that object's own property names.
function getSchemaAtPath({ schema, schemaPath }) {
  const segments = schemaPath.replace(/^#\//, '').split('/').slice(0, -1);
  return segments.reduce((node, segment) => node?.[segment], schema);
}

function validateBlockProperties(block, pageContext) {
  const { context } = pageContext;
  if (type.isNone(block.properties)) return;
  if (!type.isObject(block.properties)) return;
  if (getOperatorType(block.properties) !== null) return;
  const propertiesSchema = context.blockSchemas?.[block.type]?.properties?.properties;
  if (type.isNone(propertiesSchema)) return;

  const { schema, validate } = getValidator({ blockType: block.type, propertiesSchema, context });
  const data = copyLiteralNodes(block.properties);
  const { valid, errors } = validate(data);
  if (valid) return;

  const prefix = `Block "${block.blockId}" of type "${block.type}": `;
  const lines = errors.map((error) => {
    const errorSchema =
      error.keyword === 'additionalProperties'
        ? getSchemaAtPath({ schema, schemaPath: error.schemaPath }) ?? schema
        : schema;
    return `${prefix}${describeError({ error, schema: errorSchema, data })}`;
  });
  throw new ConfigError(lines.join('\n'), {
    configKey: block['~k'],
    checkSlug: 'block-properties',
    received: block.properties,
  });
}

export default validateBlockProperties;
