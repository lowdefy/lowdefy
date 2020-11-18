/*
  Copyright 2020 Lowdefy, Inc

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
  registeredMethods: {
    type: 'object',
  },
  value: {},
  methods: {
    type: 'object',
  },
  schemaErrors: {},
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
const runBlockSchemaTests = ({ examples, meta }) => {
  blockSchema.properties = { ...blockSchema.properties, ...meta.schema, ...testSchemaProperties };
  const validate = ajvInstance.compile(blockSchema);
  examples.forEach((block) => {
    test(`Test Schema ${block.id}`, () => {
      const valid = validate(block);
      expect(valid).toMatchSnapshot();
      expect(validate.errors).toMatchSnapshot();
    });
  });
};

export default runBlockSchemaTests;
