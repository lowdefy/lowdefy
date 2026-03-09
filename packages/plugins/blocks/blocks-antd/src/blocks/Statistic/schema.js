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
      decimalSeparator: {
        type: 'string',
        default: '.',
        description: 'Decimal separator.',
      },
      groupSeparator: {
        type: 'string',
        default: ',',
        description: 'Group separator.',
      },
      loading: {
        type: 'boolean',
        default: false,
        description: 'Control the loading status of Statistic.',
      },
      precision: {
        type: 'number',
        description: 'Number of decimals to display.',
      },
      prefix: {
        type: 'string',
        description: 'Prefix text, priority over prefixIcon.',
      },
      prefixIcon: {
        type: ['string', 'object'],
        description:
          "Name of an React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block to customize icon which prefix the statistic.",
        docs: {
          displayType: 'icon',
        },
      },
      suffix: {
        type: 'string',
        description: 'Suffix text, priority over suffixIcon.',
      },
      suffixIcon: {
        type: ['string', 'object'],
        description:
          "Name of an React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block to customize icon which suffix the statistic.",
        docs: {
          displayType: 'icon',
        },
      },
      title: {
        type: 'string',
        description: 'Title to describe the component - supports html.',
      },
      value: {
        oneOf: [
          {
            type: 'number',
            description: 'Value to display.',
            step: '0.01',
          },
          {
            type: 'string',
            description: 'Value to display.',
          },
        ],
      },
      valueStyle: {
        type: 'object',
        description: 'Css style to applied to value.',
        docs: {
          displayType: 'yaml',
        },
      },
    },
  },
};
