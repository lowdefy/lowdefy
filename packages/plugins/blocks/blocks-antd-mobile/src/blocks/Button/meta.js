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
  cssKeys: {
    element: 'The Button element.',
    icon: 'The icon in the Button.',
  },
  events: {
    onClick: 'Trigger actions when the button is clicked.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      block: {
        type: 'boolean',
        description: 'Render the button as a full-width block element.',
        default: false,
      },
      color: {
        type: 'string',
        enum: ['default', 'primary', 'success', 'warning', 'danger'],
        default: 'primary',
        description: 'Button color.',
      },
      disabled: {
        type: 'boolean',
        description: 'Disable the button if true.',
        default: false,
      },
      fill: {
        type: 'string',
        enum: ['solid', 'outline', 'none'],
        default: 'solid',
        description: 'Fill style of the button.',
      },
      hideTitle: {
        type: 'boolean',
        description: "Hide the button's title.",
        default: false,
      },
      icon: {
        type: ['string', 'object'],
        description:
          "Name of a React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block to use an icon in the button.",
        docs: {
          displayType: 'icon',
        },
      },
      shape: {
        type: 'string',
        enum: ['default', 'rounded', 'rectangular'],
        default: 'default',
        description: 'Shape of the button.',
      },
      size: {
        type: 'string',
        enum: ['mini', 'small', 'middle', 'large'],
        default: 'middle',
        description: 'Size of the button.',
      },
      title: {
        type: 'string',
        description: 'Title text on the button - supports html.',
      },
    },
  },
};
