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

import validateGenerateField from './dataSetGenerate/validateGenerateField.js';

const connectionKeys = ['count', 'fields'];

function validateConnection({ connectionId, spec, fixtures, generate, fail }) {
  const where = `generate.${connectionId}`;
  if (connectionId.startsWith('_')) {
    fail(`generate key "${connectionId}" looks like an operator; data sets are plain YAML.`);
  }
  if (!type.isObject(spec)) {
    fail(`${where} should be { count, fields }.`);
  }
  Object.keys(spec).forEach((key) => {
    if (!connectionKeys.includes(key)) {
      fail(`${where} has unknown key "${key}". Allowed: ${connectionKeys.join(', ')}.`);
    }
  });
  if (!type.isInt(spec.count) || spec.count < 1) {
    fail(
      `${where}.count should be a whole number above 0. Received ${JSON.stringify(spec.count)}.`
    );
  }
  const rawFields = spec.fields ?? {};
  if (!type.isObject(rawFields)) {
    fail(`${where}.fields should be an object keyed by field name.`);
  }
  const fields = {};
  Object.entries(rawFields).forEach(([field, fieldSpec]) => {
    if (field.startsWith('_') && field !== '_id') {
      fail(`${where}.fields key "${field}" looks like an operator; data sets are plain YAML.`);
    }
    fields[field] = validateGenerateField({
      spec: fieldSpec,
      where: `${where}.fields.${field}`,
      fail,
    });
    const { kind, connectionId: target } = fields[field];
    if (kind === 'ref' && !Object.hasOwn(fixtures, target) && !Object.hasOwn(generate, target)) {
      fail(`${where}.fields.${field} refs "${target}", which is in neither fixtures nor generate.`);
    }
  });
  if (type.isUndefined(fields._id)) {
    fields._id = { kind: 'sequence', prefix: `${connectionId}-`, start: 1 };
  }
  return { count: spec.count, fields };
}

// The `generate` block: a seed and, keyed by connection id like fixtures, how many documents to make
// and how to make each field. Returns { seed, connections } with every field normalised, or null
// when the data set generates nothing.
function validateDataSetGenerate({ generate, fixtures, fail }) {
  if (type.isNone(generate)) return null;
  if (!type.isObject(generate)) {
    fail('"generate" should be an object with a seed and generated connections.');
  }
  if (!type.isInt(generate.seed)) {
    fail(
      `generate.seed should be a whole number, so every machine generates the same documents. Received ${JSON.stringify(
        generate.seed
      )}.`
    );
  }
  const connections = {};
  Object.entries(generate).forEach(([connectionId, spec]) => {
    if (connectionId === 'seed') return;
    connections[connectionId] = validateConnection({
      connectionId,
      spec,
      fixtures,
      generate,
      fail,
    });
  });
  return { seed: generate.seed, connections };
}

export default validateDataSetGenerate;
