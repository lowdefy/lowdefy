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

const operatorSchema = {
  type: 'object',
  patternProperties: {
    '^_': {},
  },
  additionalProperties: false,
  minProperties: 1,
  maxProperties: 1,
};

const classValueSchema = {
  oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }, operatorSchema],
};

const styleValueSchema = { type: 'object' };

const eventValueSchema = {
  oneOf: [{ type: 'array' }, operatorSchema],
};

// An event meta is a description string or { description, payload | event }.
// Only the description belongs in the JSON Schema - a payload schema has no
// place in a description node and is carried separately by extractBlockTypes.
function getEventDescription(def) {
  if (type.isString(def)) return def;
  if (type.isObject(def) && type.isString(def.description)) return def.description;
  return '';
}

function buildBlockSchema(meta) {
  const cssEntries = Object.entries({
    block: 'The block layout wrapper.',
    ...(meta.cssKeys ?? {}),
  });

  const classProperties = Object.fromEntries(
    cssEntries.map(([key, desc]) => [`.${key}`, { ...classValueSchema, description: desc }])
  );

  const styleProperties = Object.fromEntries(
    cssEntries.map(([key, desc]) => [`.${key}`, { ...styleValueSchema, description: desc }])
  );

  const eventProperties = Object.fromEntries(
    Object.entries(meta.events ?? {}).map(([name, def]) => [
      name,
      { ...eventValueSchema, description: getEventDescription(def) },
    ])
  );

  const schema = {
    type: 'object',
    additionalProperties: false,
    required: ['id', 'type'],
    properties: {
      id: { type: 'string' },
      type: { type: 'string' },
      layout: { oneOf: [{ type: 'object' }, operatorSchema] },
      visible: { oneOf: [{ type: 'boolean' }, operatorSchema] },
      required: { oneOf: [{ type: 'boolean' }, operatorSchema] },
      properties: meta.properties ?? { type: 'object' },
      class: {
        oneOf: [
          { type: 'string' },
          { type: 'array', items: { type: 'string' } },
          operatorSchema,
          {
            type: 'object',
            additionalProperties: false,
            properties: classProperties,
          },
        ],
      },
      style: {
        oneOf: [
          operatorSchema,
          {
            type: 'object',
            additionalProperties: false,
            properties: styleProperties,
          },
          {
            type: 'object',
            patternProperties: {
              '^(?!_)(?!\\.)': {},
            },
            additionalProperties: false,
            minProperties: 1,
          },
        ],
      },
      events: {
        oneOf: [
          operatorSchema,
          {
            type: 'object',
            additionalProperties: false,
            properties: eventProperties,
          },
        ],
      },
    },
  };

  if (meta.category === 'container') {
    schema.properties.blocks = { type: 'array', items: { type: 'object' } };
    schema.properties.areas = { type: 'object' };
  }

  return schema;
}

export default buildBlockSchema;
