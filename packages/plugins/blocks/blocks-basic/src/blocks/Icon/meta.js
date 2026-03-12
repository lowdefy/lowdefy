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
  category: 'display',
  icons: [],
  valueType: null,
  events: {
    onClick: 'Trigger actions when icon is clicked.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      color: {
        type: 'string',
        description: 'Primary icon color.',
        docs: {
          displayType: 'color',
        },
      },
      name: {
        type: 'string',
        default: 'AiOutlineCloseCircle',
        description: 'Name of icon to be displayed.',
      },
      rotate: {
        type: 'number',
        description: 'Number of degrees to rotate the icon.',
      },
      size: {
        type: ['string', 'number'],
        description: 'Size of the icon.',
        docs: {
          displayType: 'number',
        },
      },
      spin: {
        type: 'boolean',
        default: false,
        description: 'Continuously spin icon with animation.',
      },
      title: {
        type: 'string',
        description: 'Icon hover title for accessibility.',
      },
      disableLoadingIcon: {
        type: 'boolean',
        default: false,
        description:
          "While loading after the icon has been clicked, don't render the loading icon.",
      },
    },
  },
};
