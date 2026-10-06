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
        description: 'Shorthand for pageId.',
      },
      {
        type: 'object',
        description: 'Link parameters.',
        properties: {
          pageId: {
            type: 'string',
            description: 'The pageId to link to.',
          },
          url: {
            type: 'string',
            description: 'An external URL to link to.',
          },
          newWindow: {
            type: 'boolean',
            description: 'Open the link in a new window.',
          },
          urlQuery: {
            type: 'object',
            description: 'URL query parameters.',
          },
          pathParams: {
            type: 'object',
            description: "Values for the placeholders in the page's path, by placeholder name.",
          },
          input: {
            type: 'object',
            description: 'Input to pass to the linked page.',
          },
          replace: {
            type: 'boolean',
            description: 'Replace the current history entry instead of pushing a new one.',
          },
          scroll: {
            type: 'boolean',
            description: 'Scroll to the top of the page after navigating. Defaults to true.',
          },
        },
      },
    ],
  },
};
