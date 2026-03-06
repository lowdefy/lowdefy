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

export default {
  type: 'object',
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      option: {
        type: 'object',
        description: 'EChart settings object.',
        docs: {
          displayType: 'yaml',
        },
      },
      theme: {
        type: 'object',
        description: 'EChart theme object.',
        docs: {
          displayType: 'yaml',
        },
      },
      width: {
        type: ['number', 'string'],
        default: 'auto',
        description: 'Specify chart width explicitly, in pixel.',
        docs: {
          displayType: 'string',
        },
      },
      height: {
        type: ['number', 'string'],
        default: 'auto',
        description: 'Specify chart height explicitly, in pixel.',
        docs: {
          displayType: 'string',
        },
      },
      init: {
        type: 'object',
        description: 'EChart init object.',
        properties: {
          renderer: {
            type: 'string',
            enum: ['canvas', 'svg'],
            default: 'canvas',
            description: 'Chart renderer.',
          },
          locale: {
            type: 'string',
            enum: ['EN', 'ZH'],
            default: 'EN',
            description: 'Specify the locale.',
          },
        },
      },
      style: {
        type: 'object',
        description: 'Css style object to apply to EChart div.',
        docs: {
          displayType: 'yaml',
        },
      },
    },
  },
  events: {
    type: 'object',
    properties: {
      click: {
        type: 'array',
        description: 'Trigger actions when the element is clicked.',
      },
    },
  },
};
