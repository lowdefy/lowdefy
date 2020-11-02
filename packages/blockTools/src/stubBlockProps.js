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

import React, { useState } from 'react';
import Ajv from 'ajv';
import AjvErrors from 'ajv-errors';
import { type } from '@lowdefy/helpers';
import makeCssClass from './makeCssClass';
import blockSchema from './blockSchema.json';

const initAjv = (options) => {
  const ajv = new Ajv({ allErrors: true, jsonPointers: true, ...options });
  AjvErrors(ajv, options);
  return ajv;
};
const ajvInstance = initAjv();
const validate = {};

const stubBlockProps = ({ block, meta, logger }) => {
  const [value, setState] = useState(type.enforceType(meta.valueType, null));
  const setValue = (val) => {
    setState(type.enforceType(meta.valueType, val));
  };
  let log = alert;
  if (logger) log = logger;

  // evaluate block schema
  if (!validate[block.type]) {
    blockSchema.properties = { ...blockSchema.properties, ...meta.schema };
    try {
      validate[block.type] = ajvInstance.compile(blockSchema);
    } catch (error) {
      throw new Error(`Schema error in ${block.type} - ${error.message}`);
    }
  }
  block.schemaErrors = !validate[block.type](block);
  if (block.schemaErrors) block.schemaErrors = validate[block.type].errors;
  // block defaults
  block.blockId = block.id;
  if (meta.category === 'list' || meta.category === 'container' || meta.category === 'context') {
    if (!block.areas) block.areas = {};
    if (!block.areas.content) block.areas.content = {};
    if (block.blocks) block.areas.content.blocks = block.blocks;
  }

  // mock default block methods
  block.methods = {
    callAction: (action) => log(JSON.stringify(action, null, 2)),
    registerAction: (action) => log(JSON.stringify(action, null, 2)),
    registerMethod: (method) => log(JSON.stringify(method, null, 2)),
    makeCssClass,
  };

  // block category defaults
  if (meta.category === 'list') {
    block.list = [];
    (block.areas.content.blocks || []).forEach((bl) => {
      block.list.push({
        content: () => (
          <div key={bl.id} style={{ border: '1px solid red', padding: 10 }}>
            {bl.id}
          </div>
        ),
      });
    });
    block.methods = {
      pushItem: () => log('List pushItem'),
      unshiftItem: () => log('List unshiftItem'),
      removeItem: (i) => log(`List removeItem ${i}`),
      moveItemDown: (i) => log(`List moveItemDown ${i}`),
      moveItemUp: (i) => log(`List moveItemUp ${i}`),
      ...block.methods,
    };
  }
  if (meta.category === 'container' || meta.category === 'context') {
    block.content = {};
    Object.keys(block.areas).forEach((key) => {
      block.content[key] = () => (
        <div key={key} style={{ border: '1px solid red', padding: 10 }}>
          {key}
        </div>
      );
    });
  }
  if (meta.category === 'input') {
    block.methods = {
      setValue,
      ...block.methods,
    };
    block.value = value;
  }

  return block;
};

export default stubBlockProps;
