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

import { z } from 'zod';
import loadIndividualDoc from '../helpers/loadIndividualDoc.js';

export default [
  'get_request',
  'Returns detailed schema information for a specific request type',
  {
    connectionType: z
      .string()
      .describe(
        'The connection type the request belongs to (e.g., "AxiosHttp", "MongoDBCollection")'
      ),
    requestType: z
      .string()
      .describe('The request type to get schema for (e.g., "AxiosHttp", "MongoDBAggregation")'),
  },
  async ({ connectionType, requestType }) => {
    const request = loadIndividualDoc(`requests/${connectionType}`, requestType);

    if (!request) {
      return {
        content: [
          {
            type: 'text',
            text: `Request "${requestType}" not found.`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: `Connection: ${connectionType}\nRequest: ${requestType}\nDocumentation:\n${request}`,
        },
      ],
    };
  },
];
