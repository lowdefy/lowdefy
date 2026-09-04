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

// tests/snapshots.yaml: which pages are captured, as whom, with which query and
// after which journey. Keep in step with the docs page testing/snapshots.md.
const manifestSchema = {
  type: 'object',
  required: ['pages'],
  properties: {
    pages: {
      type: 'array',
      items: {
        type: 'object',
        required: ['pageId'],
        properties: {
          pageId: {
            type: 'string',
            errorMessage: { type: 'Snapshot page "pageId" should be a string.' },
          },
          users: {
            type: 'array',
            items: {
              type: 'string',
              errorMessage: { type: 'Snapshot page "users" should be dev user names (strings).' },
            },
            errorMessage: { type: 'Snapshot page "users" should be an array of dev user names.' },
          },
          urlQuery: {
            type: 'object',
            errorMessage: { type: 'Snapshot page "urlQuery" should be an object.' },
          },
          ignore: {
            type: 'array',
            items: {
              type: 'string',
              errorMessage: { type: 'Snapshot page "ignore" should be state path strings.' },
            },
            errorMessage: { type: 'Snapshot page "ignore" should be an array of state paths.' },
          },
          journey: {
            type: 'string',
            errorMessage: {
              type: 'Snapshot page "journey" should be a path to a journey yaml file.',
            },
          },
        },
        errorMessage: {
          type: 'Snapshot page should be an object.',
          required: { pageId: 'Snapshot page should have required property "pageId".' },
        },
      },
      errorMessage: { type: 'Snapshot manifest "pages" should be an array.' },
    },
  },
  errorMessage: {
    type: 'Snapshot manifest should be an object.',
    required: { pages: 'Snapshot manifest should have required property "pages".' },
  },
};

export default manifestSchema;
