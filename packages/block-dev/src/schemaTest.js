/*
  Copyright 2020-2021 Lowdefy, Inc

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

import Ajv from 'ajv';
import AjvErrors from 'ajv-errors';

const appTestSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'type'],
  properties: {
    id: {
      type: 'string',
    },
    required: {
      type: ['boolean', 'object'],
    },
    type: {
      type: 'string',
    },
    properties: {
      type: 'object',
    },
    style: {
      type: 'object',
    },
    layout: {
      type: 'object',
    },
    blocks: {
      type: 'array',
      items: {
        type: 'object',
      },
    },
    events: {
      type: 'object',
    },
    menus: {
      type: 'array',
    },
    areas: {
      type: 'object',
      patternProperties: {
        '^.*$': {
          type: 'object',
          properties: {
            blocks: {
              type: 'array',
              items: {
                type: 'object',
              },
            },
          },
        },
      },
    },
  },
};

const testSchemaProperties = {
  value: {},
  methods: {
    type: 'object',
  },
  schemaErrors: {},
  eventLog: {
    type: 'array',
  },
  pageId: {
    type: 'string',
  },
  blockId: {
    type: 'string',
  },
  content: {
    type: 'object',
  },
  list: {
    type: 'array',
  },
};

const initAjv = (options) => {
  const ajv = new Ajv({ allErrors: true, jsonPointers: true, ...options });
  AjvErrors(ajv, options);
  return ajv;
};

const ajvInstance = initAjv();
const schemaTest = (schema) => {
  appTestSchema.properties = { ...appTestSchema.properties, ...schema, ...testSchemaProperties };
  return ajvInstance.compile(appTestSchema);
};

export default schemaTest;
