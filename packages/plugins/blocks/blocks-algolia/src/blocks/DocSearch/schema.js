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
      apiKey: {
        type: 'string',
        description: 'Your Algolia Search API key.',
      },
      appId: {
        type: 'string',
        description: 'Your Algolia application ID.',
      },
      disableUserPersonalization: {
        type: 'boolean',
        description: 'Disable saving recent searches and favorites to the local storage.',
      },
      indexName: {
        type: 'string',
        description: 'Your Algolia index name.',
      },
      initialQuery: {
        type: 'string',
        description: 'The search input initial query.',
      },
      maxResultsPerGroup: {
        type: 'number',
        description: 'The maximum number of results to display per search group. Default is 5.',
      },
    },
  },
  events: {
    type: 'object',
    additionalProperties: false,
    properties: {},
  },
};
