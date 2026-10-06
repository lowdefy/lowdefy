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

import COVERAGE_REPORT_VERSION from './coverageReportVersion.js';

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

const TEXT_TOKEN = '^t_[0-9a-f]{16}$';
const nullableString = { type: ['string', 'null'] };

// A frustrated element: its block, else its clicked-text token, else its
// config text. Production text that is not config text appears only as a
// token.
const frustrationSchema = {
  type: 'array',
  items: {
    type: 'object',
    required: ['key', 'page', 'block_id', 'text', 'text_token', 'rage', 'dead'],
    properties: {
      key: { type: 'string' },
      page: { type: 'string' },
      block_id: nullableString,
      text: nullableString,
      text_token: { anyOf: [{ type: 'null' }, { type: 'string', pattern: TEXT_TOKEN }] },
      rage: { type: 'integer', minimum: 0 },
      dead: { type: 'integer', minimum: 0 },
    },
  },
};

// countTextTokens' rows: per page, block and column, the clicks, the distinct
// tokens that resolved to no config text, and the most-clicked of them.
const textTokensSchema = {
  type: 'array',
  items: {
    type: 'object',
    additionalProperties: false,
    required: ['page', 'block_id', 'column', 'clicks', 'tokens', 'top'],
    properties: {
      page: { type: 'string' },
      block_id: nullableString,
      column: nullableString,
      clicks: { type: 'integer', minimum: 0 },
      tokens: { type: 'integer', minimum: 1 },
      top: {
        type: 'array',
        maxItems: 5,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['token', 'clicks', 'persons'],
          properties: {
            token: { type: 'string', pattern: TEXT_TOKEN },
            clicks: { type: 'integer', minimum: 1 },
            persons: { type: 'integer', minimum: 0 },
          },
        },
      },
    },
  },
};

// Whether coverage grouped the window's sessions into flows (decideFlowGrouping).
const flowGroupingSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['grouped', 'rows', 'threshold', 'forced'],
  properties: {
    grouped: { type: 'boolean' },
    rows: { type: 'integer', minimum: 0 },
    threshold: { type: 'integer', minimum: 1 },
    forced: { type: 'boolean' },
  },
};

// The shape of .lowdefy/test/coverage.json. The explorer, variants, usage and
// the app graph read it, so the writer's tests hold it to this schema.
const coverageReportSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'version',
    'generated',
    'source',
    'window',
    'flowGrouping',
    'measures',
    'production',
    'journeys',
  ],
  properties: {
    version: { const: COVERAGE_REPORT_VERSION },
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
    flowGrouping: flowGroupingSchema,
    measures: {
      type: 'object',
      additionalProperties: false,
      required: ['interaction', 'flow', 'failure', 'frustration', 'role'],
      properties: {
        interaction: measureSchema,
        flow: { anyOf: [measureSchema, { type: 'null' }] },
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
      required: ['flows', 'failurePaths', 'frustration', 'roleMatrix', 'entryPoints', 'textTokens'],
      properties: {
        flows: listSchema,
        failurePaths: listSchema,
        frustration: frustrationSchema,
        roleMatrix: listSchema,
        entryPoints: listSchema,
        textTokens: textTokensSchema,
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
