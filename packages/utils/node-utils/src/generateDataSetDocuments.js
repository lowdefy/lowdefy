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

import createFieldGenerator from './dataSetGenerate/createFieldGenerator.js';
import orderGenerateConnections from './dataSetGenerate/orderGenerateConnections.js';

function idsOf(documents) {
  return documents.filter((document) => !type.isUndefined(document._id)).map(({ _id }) => _id);
}

function refIdsFor({ connectionId, field, target, fixtures, generated, fail }) {
  const ids = [...idsOf(fixtures[target] ?? []), ...idsOf(generated[target] ?? [])];
  if (ids.length === 0) {
    fail(
      `generate.${connectionId}.fields.${field} refs "${target}", which has no documents with an _id.`
    );
  }
  return ids;
}

function checkIds({ connectionId, documents, fixtures, fail }) {
  const fixtureIds = new Set(idsOf(fixtures[connectionId] ?? []).map((id) => JSON.stringify(id)));
  const seen = new Set();
  documents.forEach((document, index) => {
    const key = JSON.stringify(document._id);
    if (fixtureIds.has(key)) {
      fail(`generate.${connectionId}[${index}] _id ${key} is also a fixture's _id.`);
    }
    if (seen.has(key)) {
      fail(`generate.${connectionId}[${index}] _id ${key} is generated twice.`);
    }
    seen.add(key);
  });
}

// The documents a data set's `generate` block makes (validateDataSetGenerate's result), keyed by
// connection id, in the fixtures' form: dates as { "~d": ... } markers, so the dev server loads
// generated documents and fixtures the same way. Every reader of a data set (the dev server, lint,
// variants) calls this through parseDataSet, so they all see the same documents.
function generateDataSetDocuments({ generate, fixtures, fail }) {
  if (type.isNone(generate)) return {};
  const generated = {};
  orderGenerateConnections({ connections: generate.connections, fail }).forEach((connectionId) => {
    const { count, fields } = generate.connections[connectionId];
    const fieldNames = ['_id', ...Object.keys(fields).filter((field) => field !== '_id')];
    const generators = fieldNames.map((field) => {
      const spec = fields[field];
      const refIds =
        spec.kind === 'ref'
          ? refIdsFor({ connectionId, field, target: spec.connectionId, fixtures, generated, fail })
          : null;
      return [
        field,
        createFieldGenerator({ seed: generate.seed, connectionId, field, spec, refIds }),
      ];
    });
    const documents = Array.from({ length: count }, (_, index) =>
      Object.fromEntries(generators.map(([field, generator]) => [field, generator(index)]))
    );
    checkIds({ connectionId, documents, fixtures, fail });
    generated[connectionId] = documents;
  });
  return generated;
}

export default generateDataSetDocuments;
