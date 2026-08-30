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

import findSimilarString from '../../utils/findSimilarString.js';
import humanizeFieldName from './humanizeFieldName.js';

// Resolves a single named field of an archetype against build/collections.json
// (context.collections). This is the whole point of an archetype: the field's
// type, enum and relation come from the declared schema, never a guess. A
// missing collection or field is a hard build error — guessing a type is
// exactly the silent wrongness the design exists to remove (Decision 2).
//
// Returns { field, label, schema, dataType, isEnum, enumValues, isRelation,
// relation } for a resolvable field. `collection` is the already-looked-up
// normalised collection object (from resolveCollection below).
function resolveCollectionField({ collection, collectionName, fieldName, archetype, pageId, configKey }) {
  const fields = collection.fields ?? {};
  const declaredFieldNames = Object.keys(fields);

  if (!Object.hasOwn(fields, fieldName)) {
    // The collection was declared but carries no fields: nothing can be typed,
    // so a bare field name is an error telling the author to declare the
    // fields or use the object form with an explicit label.
    if (declaredFieldNames.length === 0) {
      throw new ConfigError(
        `${archetype} on page "${pageId}" names field "${fieldName}", but collection "${collectionName}" declares no fields. Declare the collection's fields in collections: so the archetype can resolve its type, or give the field explicitly with a label.`,
        { configKey, checkSlug: 'archetype' }
      );
    }
    const nearest = findSimilarString({ input: fieldName, candidates: declaredFieldNames });
    const suffix = nearest !== null ? ` Did you mean "${nearest}"?` : '';
    throw new ConfigError(
      `${archetype} on page "${pageId}" field "${fieldName}" is not a field of collection "${collectionName}". Fields: ${declaredFieldNames.join(', ')}.${suffix}`,
      { configKey, checkSlug: 'archetype' }
    );
  }

  const schema = fields[fieldName] ?? {};
  const isEnum = type.isArray(schema.enum);
  const relation = collection.relations?.[fieldName];
  const isRelation = !type.isNone(relation);

  // The MongoDB "date" field type is stored as { instanceof: 'Date' } by
  // buildCollections, so a schema with no `type` but an instanceof marker is a
  // date. An enum with no type infers no dataType.
  let dataType = schema.type;
  if (type.isUndefined(dataType) && schema.instanceof === 'Date') {
    dataType = 'date';
  }

  return {
    field: fieldName,
    label: humanizeFieldName(fieldName),
    schema,
    dataType,
    isEnum,
    enumValues: isEnum ? schema.enum : null,
    isRelation,
    relation: isRelation ? relation : null,
  };
}

// Looks up the archetype's collection in context.collections, erroring when it
// is not declared (Decision 2).
function resolveCollection({ collections, collectionName, archetype, pageId, configKey }) {
  const collection = collections?.[collectionName];
  if (type.isNone(collection)) {
    const declared = Object.keys(collections ?? {});
    const suffix =
      declared.length > 0
        ? ` Declared collections: ${declared.join(', ')}.`
        : ' No collections are declared.';
    throw new ConfigError(
      `${archetype} on page "${pageId}" uses collection "${collectionName}", which is not declared in collections:. Declare it so the archetype can resolve field types.${suffix}`,
      { configKey, checkSlug: 'archetype' }
    );
  }
  return collection;
}

export { resolveCollection };
export default resolveCollectionField;
