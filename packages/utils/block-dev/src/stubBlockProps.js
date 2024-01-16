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

import React, { useState } from 'react';
import { type } from '@lowdefy/helpers';
import { makeCssClass, createIcon } from '@lowdefy/block-utils';

import schemaTest from './schemaTest.js';

const validate = {};
const Icons = {
  AiIcon: ({ onClick, ...props }) => (
    <svg data-testid="AiIcon" onClick={onClick}>
      ICON PROPS: {JSON.stringify(props)}
    </svg>
  ),
  AiOutlineExclamationCircle: ({ onClick, ...props }) => (
    <svg data-testid="AiOutlineExclamationCircle" onClick={onClick}>
      ICON PROPS: {JSON.stringify(props)}
    </svg>
  ),
  AiOutlineLoading3Quarters: ({ onClick, ...props }) => (
    <svg data-testid="AiOutlineLoading3Quarters" onClick={onClick}>
      ICON PROPS: {JSON.stringify(props)}
    </svg>
  ),
  ErrorIcon: () => {
    throw new Error('ErrorIcon');
  },
};

const IconComponent = createIcon(Icons);

const stubBlockProps = ({ block, meta, logger = () => null, initialValue, schema }) => {
  const [value, setState] = useState(type.enforceType(meta.valueType, block.value || initialValue));
  const setValue = (val) => {
    setState(type.enforceType(meta.valueType, val));
  };
  let log = alert;
  if (logger) log = logger;
  // evaluate block schema
  if (!validate[block.type]) {
    try {
      validate[block.type] = schemaTest(schema);
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
  block.events = block.events || {};
  block.eventLog = [];
  block.components = {
    Icon: IconComponent,
    Link: ({ id, children, onClick, ...props }) => (
      <a data-testid={id} onClick={onClick}>
        LINK PROPS:{JSON.stringify(props)} - CHILDREN: {children('default_title')}
      </a>
    ),
  };
  // mock default block methods
  block.methods = {
    makeCssClass,
    registerEvent: ({ name, actions }) => {
      block.events[name] = actions;
      return;
    },
    registerMethod: (method, methodFn) => {
      block.methods[method] = methodFn;
      return;
    },
    triggerEvent: (event) => block.eventLog.unshift(event),
  };
  // block category defaults
  if (meta.category === 'list') {
    block.list = [];
    (block.areas.content.blocks || []).forEach((bl, i) => {
      block.list.push({
        content: () => (
          <div
            data-testid={`list-${i}-${bl.id}`}
            key={bl.id}
            style={{ border: '1px solid red', padding: 10 }}
          >
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
  if (meta.category === 'container') {
    block.content = {};
    Object.keys(block.areas).forEach((key) => {
      block.content[key] = () => (
        <div data-testid={`area-${key}`} key={key} style={{ border: '1px solid red', padding: 10 }}>
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
