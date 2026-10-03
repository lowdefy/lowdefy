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

const DAY = '^\\d{4}-\\d{2}-\\d{2}$';

const sequenceSchema = {
  type: 'array',
  items: {
    type: 'object',
    required: ['page', 'identity'],
    properties: { page: { type: 'string' }, identity: { type: 'string' } },
  },
};

const measureSchema = {
  type: 'object',
  required: ['covered', 'total', 'share', 'uncovered'],
  properties: {
    covered: { type: 'integer', minimum: 0 },
    total: { type: 'integer', minimum: 0 },
    share: { type: 'number', minimum: 0, maximum: 1 },
    uncovered: {
      type: 'array',
      items: {
        type: 'object',
        required: ['key', 'count'],
        properties: { key: { type: 'string' }, count: { type: 'integer', minimum: 0 } },
      },
    },
    mode: { enum: ['reached', 'measured'] },
    note: { type: 'string' },
    run: { type: 'string' },
    measured: {
      type: 'object',
      additionalProperties: false,
      required: ['covered', 'total', 'share', 'run'],
      properties: {
        covered: { type: 'integer', minimum: 0 },
        total: { type: 'integer', minimum: 0 },
        share: { type: 'number', minimum: 0, maximum: 1 },
        run: { type: 'string' },
      },
    },
  },
};

const listSchema = { type: 'array', items: { type: 'object' } };

// The shape of .lowdefy/test/coverage.json, version 1. The explorer, variants
// and the app graph read it, so the writer's tests hold it to this schema.
const coverageReportSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['version', 'generated', 'source', 'window', 'measures', 'production', 'journeys'],
  properties: {
    version: { const: 1 },
    generated: { type: 'string' },
    source: { const: 'production' },
    window: {
      type: 'object',
      additionalProperties: false,
      required: ['from', 'to'],
      properties: {
        from: { type: 'string', pattern: DAY },
        to: { type: 'string', pattern: DAY },
      },
    },
    measures: {
      type: 'object',
      additionalProperties: false,
      required: ['interaction', 'flow', 'failure', 'frustration', 'role'],
      properties: {
        interaction: measureSchema,
        flow: measureSchema,
        failure: measureSchema,
        frustration: measureSchema,
        role: measureSchema,
      },
    },
    mutation: {
      type: 'object',
      additionalProperties: false,
      required: ['killed', 'total', 'share'],
      properties: {
        killed: { type: 'integer', minimum: 0 },
        total: { type: 'integer', minimum: 0 },
        share: { type: 'number', minimum: 0, maximum: 1 },
      },
    },
    production: {
      type: 'object',
      additionalProperties: false,
      required: ['flows', 'failurePaths', 'frustration', 'roleMatrix', 'entryPoints'],
      properties: {
        flows: listSchema,
        failurePaths: listSchema,
        frustration: listSchema,
        roleMatrix: listSchema,
        entryPoints: listSchema,
      },
    },
    journeys: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['file', 'name', 'pageId', 'sequence'],
        properties: {
          file: { type: 'string' },
          name: { type: 'string' },
          pageId: { type: 'string' },
          sequence: sequenceSchema,
        },
      },
    },
  },
};

export default coverageReportSchema;
