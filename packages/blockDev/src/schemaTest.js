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
import blockSchema from './blockSchema.json';

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
  blockSchema.properties = { ...blockSchema.properties, ...schema, ...testSchemaProperties };
  return ajvInstance.compile(blockSchema);
};

export default schemaTest;
