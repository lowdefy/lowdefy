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
      separator: {
        type: 'string',
        default: '/',
        description: 'Use a custom separator string.',
      },
      style: {
        type: 'object',
        description: 'Css style object to applied to breadcrumb.',
        docs: {
          displayType: 'yaml',
        },
      },
      list: {
        oneOf: [
          {
            type: 'array',
            description: 'List of breadcrumb links.',
            items: {
              type: 'string',
              description: 'Title of the breadcrumb link.',
            },
          },
          {
            type: 'array',
            description: 'List of breadcrumb links.',
            items: {
              type: 'object',
              properties: {
                label: {
                  type: 'string',
                  description: 'Label of the breadcrumb link.',
                },
                pageId: {
                  type: 'string',
                  description: 'Page id to link to when clicked.',
                },
                url: {
                  type: 'string',
                  description: 'External url link.',
                },
                style: {
                  type: 'object',
                  description: 'Css style to apply to link.',
                  docs: {
                    displayType: 'yaml',
                  },
                },
                icon: {
                  type: ['string', 'object'],
                  description:
                    "Name of an React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block to use an icon in breadcrumb link.",
                  docs: {
                    displayType: 'icon',
                  },
                },
              },
            },
          },
        ],
      },
    },
  },
  events: {
    type: 'object',
    additionalProperties: false,
    properties: {
      onClick: {
        type: 'array',
        description:
          'Triggered when breadcrumb item is clicked. Provides clicked link and index as args.',
      },
    },
  },
};
