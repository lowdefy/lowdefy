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

import collectExceptions from '../../../utils/collectExceptions.js';
import findSimilarString from '../../../utils/findSimilarString.js';

const MAX_LISTED_PROPERTIES = 10;

// Marks a node that cannot be judged before the app runs.
const OMIT = Symbol('omit');

// An operator's result cannot be judged before it runs, so operator-valued
// nodes are left out of the data that is validated, and so is a null value,
// which in config means "not set" (a build-time _var or _if resolves to null
// when it has nothing to give). An array with an operator element is left out
// whole: its length is unknown until the operator runs, so minItems or a
// positional schema would fail on a literal that is fine. ~-prefixed keys
// (~r, ~l) are build metadata the plugin schemas do not allow.
function copyLiteralNodes(node) {
  if (node === null) return OMIT;
  if (getOperatorType(node) !== null) return OMIT;
  if (type.isArray(node)) {
    const items = node.map((item) => copyLiteralNodes(item));
    if (items.includes(OMIT)) return OMIT;
    return items;
  }
  if (!type.isObject(node)) {
    return node;
  }
  const copy = {};
  for (const key of Object.keys(node)) {
    if (key.startsWith('~')) continue;
    const value = copyLiteralNodes(node[key]);
    if (value === OMIT) continue;
    copy[key] = value;
  }
  return copy;
}

// Ajv reports a oneOf/anyOf failure together with every branch's own errors.
// The branch errors describe schemas the data was never meant to match, so
// only the shallowest oneOf/anyOf error at a path is kept.
function collapseBranchErrors(errors) {
  const branchPaths = errors
    .filter((error) => error.keyword === 'oneOf' || error.keyword === 'anyOf')
    .map((error) => error.instancePath);
  return errors.filter((error) => {
    const isBranchError = error.keyword === 'oneOf' || error.keyword === 'anyOf';
    return !branchPaths.some((branchPath) => {
      if (isBranchError && branchPath === error.instancePath) return false;
      return error.instancePath === branchPath || error.instancePath.startsWith(`${branchPath}/`);
    });
  });
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

// The elements of an array that also holds an operator are validated one at a
// time against the array's items schema, so the schema node at the array's
// path must be found. Composition keywords are followed only when exactly one
// branch describes the step, so an ambiguous schema yields no element checking
// rather than a wrong error.
function branchSchemas(node) {
  const branches = [node];
  ['anyOf', 'oneOf', 'allOf'].forEach((keyword) => {
    if (type.isArray(node[keyword])) {
      node[keyword].forEach((branch) => {
        if (type.isObject(branch)) branches.push(branch);
      });
    }
  });
  return branches;
}

function descendSchema({ node, segment }) {
  const matches = branchSchemas(node)
    .map((branch) => {
      if (type.isInt(segment)) {
        // A tuple items schema positions its element schemas, so an array whose
        // length is unknown until an operator runs cannot be checked at all.
        return type.isObject(branch.items) ? branch.items : undefined;
      }
      if (type.isObject(branch.properties) && !type.isNone(branch.properties[segment])) {
        return branch.properties[segment];
      }
      if (type.isObject(branch.additionalProperties)) return branch.additionalProperties;
      return undefined;
    })
    .filter((match) => type.isObject(match));
  if (matches.length !== 1) return null;
  return matches[0];
}

function resolveSchemaNode({ schema, segments }) {
  let node = schema;
  for (const segment of segments) {
    node = descendSchema({ node, segment });
    if (node === null) return null;
  }
  return node;
}

// An array that holds an operator is left out of the validated data whole, so
// its literal elements are collected here to be checked one by one.
function collectPartialArrays({ node, segments, found }) {
  if (type.isArray(node)) {
    const elements = [];
    let omitted = false;
    node.forEach((item, index) => {
      const value = copyLiteralNodes(item);
      if (value === OMIT) {
        omitted = true;
        return;
      }
      elements.push({ index, value });
    });
    if (omitted) found.push({ segments, elements });
    node.forEach((item, index) =>
      collectPartialArrays({ node: item, segments: [...segments, index], found })
    );
    return;
  }
  if (!type.isObject(node)) return;
  if (getOperatorType(node) !== null) return;
  Object.keys(node).forEach((key) => {
    if (key.startsWith('~')) return;
    collectPartialArrays({ node: node[key], segments: [...segments, key], found });
  });
}

function toPathString(segments) {
  return segments.reduce(
    (path, segment) => (type.isInt(segment) ? `${path}[${segment}]` : `${path}.${segment}`),
    'properties'
  );
}

// A fragment lifted out of the block schema is compiled on its own, so a $ref
// in it has nothing to resolve against and the elements go unchecked.
function hasRef(schema) {
  return JSON.stringify(schema).includes('"$ref"');
}

function getItemValidator({ blockType, pathKey, itemsSchema, context }) {
  const entry = context.blockPropertiesValidators[blockType];
  if (type.isNone(entry.itemValidators)) {
    entry.itemValidators = {};
  }
  if (type.isNone(entry.itemValidators[pathKey])) {
    entry.itemValidators[pathKey] = compile({ schema: itemsSchema });
  }
  return entry.itemValidators[pathKey];
}

function describePartialArrayErrors({ block, blockType, context, schema, prefix }) {
  const found = [];
  collectPartialArrays({ node: block.properties, segments: [], found });
  const lines = [];
  found.forEach(({ segments, elements }) => {
    const node = resolveSchemaNode({ schema, segments });
    const itemsSchema = node?.items;
    if (!type.isObject(itemsSchema) || hasRef(itemsSchema)) return;
    const pathKey = segments.join('.');
    const validateItem = getItemValidator({ blockType, pathKey, itemsSchema, context });
    elements.forEach(({ index, value }) => {
      const result = validateItem(value);
      if (result.valid) return;
      const basePath = toPathString([...segments, index]);
      collapseBranchErrors(result.errors).forEach((error) => {
        const errorSchema =
          error.keyword === 'additionalProperties'
            ? getSchemaAtPath({ schema: itemsSchema, schemaPath: error.schemaPath }) ?? itemsSchema
            : itemsSchema;
        lines.push(
          `${prefix}${describeError({ error, schema: errorSchema, data: value, basePath })}`
        );
      });
    });
  });
  return lines;
}

function formatReceived(value) {
  if (type.isUndefined(value)) return 'undefined';
  return JSON.stringify(value);
}

function describeError({ error, schema, data, basePath = 'properties' }) {
  const path = `${basePath}${error.instancePath.replaceAll('/', '.')}`;
  if (error.keyword === 'additionalProperties') {
    const property = error.params.additionalProperty;
    const validProperties = Object.keys(schema.properties ?? {});
    const nearest = findSimilarString({ input: property, candidates: validProperties });
    let message = `unknown property "${property}"`;
    if (error.instancePath !== '' || basePath !== 'properties') {
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

// buildPage sets pageId on the page object before it is built as the root
// block; nested blocks never carry it.
function isPageRootBlock(block) {
  return !type.isNone(block.pageId);
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
  // properties.title on a page's root block sets the browser tab title
  // (client Head.js), whatever the block type. It is only a block property
  // when the block's own schema declares one.
  if (isPageRootBlock(block) && type.isUndefined(schema.properties?.title)) {
    delete data.title;
  }
  const result = validate(data);
  const prefix = `Block "${block.blockId}" of type "${block.type}": `;
  const lines = result.valid
    ? []
    : collapseBranchErrors(result.errors).map((error) => {
        const errorSchema =
          error.keyword === 'additionalProperties'
            ? getSchemaAtPath({ schema, schemaPath: error.schemaPath }) ?? schema
            : schema;
        return `${prefix}${describeError({ error, schema: errorSchema, data })}`;
      });
  lines.push(
    ...describePartialArrayErrors({ block, blockType: block.type, context, schema, prefix })
  );
  if (lines.length === 0) return;

  collectExceptions(
    context,
    new ConfigError(lines.join('\n'), {
      configKey: block['~k'],
      checkSlug: 'block-properties',
      received: block.properties,
    })
  );
}

export default validateBlockProperties;
