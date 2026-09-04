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

import { ConfigError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import resolveUpdateFieldSchema from './resolveUpdateFieldSchema.js';
import validateFieldValue from './validateFieldValue.js';

// $set and $setOnInsert carry the shape a field will hold after the write, so
// their values are validated against the field. $push and $addToSet carry one
// element of an array field, so they are validated against that field's
// `items`. $inc, $mul, $min, $rename and the rest express deltas over the
// stored value rather than shapes, and an aggregation-pipeline update is opaque
// here; those pass.
const VALUE_OPERATORS = ['$set', '$setOnInsert'];
const ELEMENT_OPERATORS = ['$push', '$addToSet'];

function parentPathOf(path) {
  const index = path.lastIndexOf('.');
  return index === -1 ? '' : path.slice(0, index);
}

// The `required` names that govern a path's parent: the collection's own array
// at the top level, the enclosing fragment's array below it.
function requiredNamesAt({ collectionSchema, parentPath }) {
  if (parentPath === '') {
    return collectionSchema.required ?? [];
  }
  const parent = resolveUpdateFieldSchema({ fields: collectionSchema.fields, path: parentPath });
  return type.isArray(parent?.required) ? parent.required : [];
}

// $push and $addToSet take either the element itself or a modifier document
// ({ $each: [...], $slice, $position, $sort }); only $each names elements.
function elementsOf(operand) {
  if (type.isObject(operand) && Object.keys(operand).some((key) => key.startsWith('$'))) {
    return type.isArray(operand.$each) ? operand.$each : [];
  }
  return [operand];
}

function validateValueOperators({ update, collectionSchema, position }) {
  const { fields, name } = collectionSchema;
  VALUE_OPERATORS.forEach((operator) => {
    const values = update[operator];
    if (!type.isObject(values)) return;
    Object.keys(values).forEach((path) => {
      const fieldSchema = resolveUpdateFieldSchema({ fields, path });
      if (fieldSchema === null) return;
      validateFieldValue({
        collectionName: name,
        fieldName: path,
        fieldSchema,
        position: `${operator} of ${position}`,
        value: values[path],
      });
    });
  });
}

function validateElementOperators({ update, collectionSchema, position }) {
  const { fields, name } = collectionSchema;
  ELEMENT_OPERATORS.forEach((operator) => {
    const values = update[operator];
    if (!type.isObject(values)) return;
    Object.keys(values).forEach((path) => {
      const fieldSchema = resolveUpdateFieldSchema({ fields, path });
      if (fieldSchema === null || !type.isObject(fieldSchema.items)) return;
      elementsOf(values[path]).forEach((element) => {
        validateFieldValue({
          collectionName: name,
          fieldName: path,
          fieldSchema: fieldSchema.items,
          position: `${operator} of ${position}`,
          value: element,
        });
      });
    });
  });
}

// Removing a field the contract requires leaves the collection in a state the
// contract forbids, which is the one thing a required declaration promises
// cannot happen through a validated write.
function validateUnset({ update, collectionSchema, position }) {
  if (!type.isObject(update.$unset)) return;
  Object.keys(update.$unset).forEach((path) => {
    const parentPath = parentPathOf(path);
    const fieldName = path.slice(parentPath === '' ? 0 : parentPath.length + 1);
    if (!requiredNamesAt({ collectionSchema, parentPath }).includes(fieldName)) return;
    throw new ConfigError(
      `Field "${path}" in $unset of ${position} for collection "${collectionSchema.name}" is required by the declared contract and cannot be removed.`
    );
  });
}

// An upsert that matches nothing inserts a document built from the filter's
// equality terms plus $setOnInsert and $set - the one update shape that creates
// a document, so it is the one that has to satisfy the document-level contract.
function validateUpsertRequired({ update, filter, collectionSchema, position }) {
  const { name, required } = collectionSchema;
  if ((required ?? []).length === 0) return;
  const present = new Set();
  const addKeys = (source) => {
    if (!type.isObject(source)) return;
    Object.keys(source).forEach((key) => {
      if (key.startsWith('$')) return;
      present.add(key.split('.')[0]);
    });
  };
  addKeys(filter);
  addKeys(update.$setOnInsert);
  addKeys(update.$set);
  required.forEach((fieldName) => {
    if (present.has(fieldName)) return;
    throw new ConfigError(
      `Field "${fieldName}" is required by the declared contract for collection "${name}", but the upserting ${position} does not set it in the filter, $set or $setOnInsert.`
    );
  });
}

function validateUpdateFields({
  update,
  collectionSchema,
  filter,
  options,
  position = 'an update',
}) {
  if (!type.isObject(update)) {
    return;
  }
  validateValueOperators({ update, collectionSchema, position });
  validateElementOperators({ update, collectionSchema, position });
  validateUnset({ update, collectionSchema, position });
  if (options?.upsert === true) {
    validateUpsertRequired({ update, filter, collectionSchema, position });
  }
}

export default validateUpdateFields;
