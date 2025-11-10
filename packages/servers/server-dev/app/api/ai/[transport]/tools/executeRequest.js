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
import { callRequest } from '@lowdefy/api';

import createContext from '../helpers/createContext.js';

export default [
  'execute_request',
  'Execute a request with specified blockId, pageId, payload and requestId',
  {
    blockId: z.string().describe('The block ID to test against'),
    pageId: z.string().describe('The page ID to test against'),
    payload: z.record(z.any()).optional().describe('Additional payload for the request'),
    requestId: z.string().optional().describe('The request ID to test against'),
  },
  async ({ blockId, pageId, payload = {}, requestId }) => {
    const requestConfig = {
      blockId,
      pageId,
      payload,
      requestId,
    };

    let responseText = `Executing Request:\n${JSON.stringify(requestConfig, null, 2)}`;

    try {
      const context = await createContext();
      const response = await callRequest(context, requestConfig);

      responseText += `\n\nExecution Result:\n${JSON.stringify(response, null, 2)}`;
    } catch (error) {
      responseText += `\n\nExecution Error:\n${error.message || 'Unknown error occurred'}`;

      if (error.stack) {
        responseText += `\n\nStack Trace:\n${error.stack}`;
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: responseText,
        },
      ],
    };
  },
];
