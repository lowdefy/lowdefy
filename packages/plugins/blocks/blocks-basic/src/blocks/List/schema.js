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
      direction: {
        type: 'string',
        enum: ['row', 'column', 'row-reverse', 'column-reverse'],
        description:
          "List content along a 'row' or down a 'column'. Applies the 'flex-direction' css property to the List block.",
      },
      wrap: {
        type: 'string',
        enum: ['wrap', 'nowrap', 'wrap-reverse'],
        description:
          "Specifies wrapping style to be applied to List block as 'wrap', 'nowrap' or 'wrap-reverse'. Applies the 'flex-wrap' css property to the List block - defaults to 'wrap', requires List direction to be set.",
      },
      scroll: {
        type: 'boolean',
        description:
          "Specifies whether scrolling should be applied to the List, can be true or false. Applies the 'overflow' css property to the List block - defaults to 'visible', requires List direction to be set.",
      },
      style: {
        type: 'object',
        description: 'Css style object to apply to List block.',
        docs: {
          displayType: 'yaml',
        },
      },
    },
  },
  events: {
    type: 'object',
    additionalProperties: false,
    properties: {
      onClick: {
        type: 'array',
        description: 'Trigger actions when the List is clicked.',
      },
    },
  },
};
