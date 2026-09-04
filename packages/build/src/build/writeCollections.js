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

// build/collections.json is written on every build, as {} when the app
// declares nothing, so the data-layer consumers (lowdefy_data_model, write
// validation, migrations, the dev JIT page build) never need an existence
// check or a fallback. Build-only bookkeeping (configKey) is stripped; the
// artifact shape is a contract - keep it stable.
function writeCollections({ context }) {
  const collections = {};
  Object.keys(context.collections ?? {}).forEach((name) => {
    const collection = context.collections[name];
    const artifact = {};
    if (!type.isUndefined(collection.tenant)) {
      artifact.tenant = collection.tenant;
    }
    if (!type.isUndefined(collection.fields)) {
      artifact.fields = collection.fields;
    }
    // The JSON Schema array form, so { type: object, properties: fields,
    // required } compiles as-is for every consumer.
    if (type.isArray(collection.required) && collection.required.length > 0) {
      artifact.required = collection.required;
    }
    // Field names declared pii: true, as a flat list every consumer (recorder,
    // log redaction, fixture export) can read without walking the schema.
    if (type.isArray(collection.pii) && collection.pii.length > 0) {
      artifact.pii = collection.pii;
    }
    artifact.relations = {};
    Object.keys(collection.relations).forEach((fieldName) => {
      const { collection: target, field } = collection.relations[fieldName];
      artifact.relations[fieldName] = { collection: target, field };
    });
    artifact.indexes = collection.indexes;
    artifact.connections = collection.connections;
    collections[name] = artifact;
  });
  return context.writeBuildArtifact('collections.json', JSON.stringify(collections, null, 2));
}

export default writeCollections;
