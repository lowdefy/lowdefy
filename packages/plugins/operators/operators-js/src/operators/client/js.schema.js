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
  params: {
    oneOf: [
      {
        type: 'string',
        description: 'Hash identifier of the pre-built JavaScript function to execute.',
      },
      {
        type: 'object',
        required: ['fn'],
        additionalProperties: false,
        properties: {
          fn: {
            type: 'string',
            description:
              'Hash identifier of the pre-built JavaScript function to execute. In config this is either the function body, or a module reference "./lib/file.js#exportName" naming an exported function in a real .js file (resolved relative to the containing config file); the build replaces both with a hash.',
          },
          args: {
            description: 'Pre-resolved values injected into the JavaScript function as `args`.',
          },
        },
      },
    ],
  },
};
