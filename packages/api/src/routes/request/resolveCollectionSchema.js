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

// The field contract a write is validated against, resolved from the
// build/collections.json artifact by the *evaluated* connection collection
// name - so an operator-valued `collection` the build could not join still
// resolves here. Connections cannot read build artifacts; this is the only
// way the contract reaches them, threaded to the resolver beside `tenant`.
//
// `required` is the JSON Schema array form the build writes at the collection
// level, so { type: object, properties: fields, required } is a compilable
// schema and the connection needs no preprocessing of its own.
//
// The verdict is null - and every write resolver behaves exactly as before -
// when the connection names no collection, the app declares none, the
// collection is undeclared, or it declares no fields. A declaration without
// `fields` describes tenancy and relations only; it has opted out of shape.
async function resolveCollectionSchema(context, { collectionName }) {
  if (!type.isString(collectionName) || collectionName === '') {
    return null;
  }
  const collections = await context.readConfigFile('collections.json');
  if (!type.isObject(collections)) {
    return null;
  }
  const collection = collections[collectionName];
  if (!type.isObject(collection) || !type.isObject(collection.fields)) {
    return null;
  }
  if (Object.keys(collection.fields).length === 0) {
    return null;
  }
  return {
    name: collectionName,
    fields: collection.fields,
    required: type.isArray(collection.required) ? collection.required : [],
  };
}

export default resolveCollectionSchema;
