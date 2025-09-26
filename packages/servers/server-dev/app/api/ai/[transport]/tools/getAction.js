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
  'get_action',
  'Returns detailed schema information for a specific action type',
  {
    actionType: z
      .string()
      .describe('The action type to get schema for (e.g., "CallAPI", "SetState", "Fetch")'),
  },
  async ({ actionType }) => {
    const action = loadIndividualDoc('actions', actionType);

    if (!action) {
      return {
        content: [
          {
            type: 'text',
            text: `Action "${actionType}" not found.`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: `Action: ${actionType}\nDocumentation:\n${action}`,
        },
      ],
    };
  },
];
