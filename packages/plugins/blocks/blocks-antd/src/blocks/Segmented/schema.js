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
      options: {
        type: 'array',
        description:
          'Options for the segmented control. Array of strings or { label, value, icon, disabled } objects.',
      },
      size: {
        type: 'string',
        enum: ['small', 'middle', 'large'],
        description: 'Size of the segmented control.',
      },
      block: {
        type: 'boolean',
        default: false,
        description: "Option to fit width to its parent's width.",
      },
      disabled: {
        type: 'boolean',
        default: false,
        description: 'Disable the segmented control.',
      },
    },
  },
};
