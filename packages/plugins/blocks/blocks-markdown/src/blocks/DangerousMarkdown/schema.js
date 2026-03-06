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
      content: {
        type: 'string',
        description: 'Content in markdown format.',
        docs: {
          displayType: 'text-area',
        },
      },
      DOMPurifyOptions: {
        type: 'object',
        description:
          'Customize DOMPurify options. Options are only applied when the block is mounted, thus any parsed settings is only applied at first render.',
        docs: {
          displayType: 'yaml',
        },
      },
      style: {
        type: 'object',
        description: 'Style to apply to Markdown div.',
        docs: {
          displayType: 'yaml',
        },
      },
    },
  },
};
