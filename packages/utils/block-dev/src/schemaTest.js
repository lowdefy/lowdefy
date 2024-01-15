/*
  Copyright 2020-2024 Lowdefy, Inc

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

import { blockSchema } from '@lowdefy/block-utils';

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
  const ajv = new Ajv({ allErrors: true, strict: false, ...options });
  AjvErrors(ajv, options);
  return ajv;
};

const ajvInstance = initAjv();
const sch = JSON.parse(JSON.stringify(blockSchema));

const schemaTest = (schema) => {
  sch.properties = { ...sch.properties, ...schema.properties.properties, ...testSchemaProperties };
  sch.additionalProperties = true;
  return ajvInstance.compile(sch);
};

export default schemaTest;
