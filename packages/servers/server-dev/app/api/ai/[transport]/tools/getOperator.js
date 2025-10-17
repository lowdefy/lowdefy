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
import loadIndividualSchema from '../helpers/loadIndividualSchema.js';

export default [
  'get_operator',
  'Returns detailed schema information for a specific operator type',
  {
    operatorType: z
      .string()
      .describe('The operator type to get schema for (e.g., "_and", "_array", "_string")'),
  },
  async ({ operatorType }) => {
    const operator = loadIndividualSchema('operators', operatorType);

    if (!operator) {
      return {
        content: [
          {
            type: 'text',
            text: `Operator "${operatorType}" not found.`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: `Operator: ${operatorType}\nPackage: ${operator.package}\nSchema:\n${JSON.stringify(
            operator,
            null,
            2
          )}`,
        },
      ],
    };
  },
];
