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

const schema = {
  type: 'object',
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      alt: {
        type: 'string',
        description: 'This attribute defines the alternative text describing the image.',
      },
      color: {
        type: 'string',
        description:
          'The background color of the avatar if not using a src url. Should be a hex color string. Color is a random color if not specified.',
        docs: {
          displayType: 'color',
        },
      },
      content: {
        type: 'string',
        description: 'Text to display inside avatar.',
      },
      gap: {
        type: 'number',
        description: 'Letter type unit distance between left and right sides.',
      },
      icon: {
        type: ['string', 'object'],
        description:
          "Name of an React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block to use an icon in avatar.",
        docs: {
          displayType: 'icon',
        },
      },
      shape: {
        type: 'string',
        enum: ['circle', 'square'],
        default: 'circle',
        description: 'Shape of the avatar.',
      },
      size: {
        type: ['string', 'object'],
        default: 'default',
        enum: ['default', 'small', 'large'],
        description: 'Size of the avatar; default, small, large or responsive.',
        docs: {
          displayType: 'string',
        },
      },
      src: {
        type: 'string',
        description: 'The address of the image for an image avatar.',
      },
      theme: {
        type: 'object',
        description:
          'Antd design token overrides for this block. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>.',
        docs: {
          displayType: 'yaml',
          link: 'https://ant.design/components/avatar#design-token',
        },
        properties: {
          containerSize: {
            type: 'number',
            default: 32,
            description: 'Size of the avatar.',
          },
          containerSizeLG: {
            type: 'number',
            default: 40,
            description: 'Size of the large avatar.',
          },
          containerSizeSM: {
            type: 'number',
            default: 24,
            description: 'Size of the small avatar.',
          },
          textFontSize: {
            type: 'number',
            default: 14,
            description: 'Text font size of the avatar.',
          },
          textFontSizeLG: {
            type: 'number',
            default: 14,
            description: 'Text font size of the large avatar.',
          },
          textFontSizeSM: {
            type: 'number',
            default: 14,
            description: 'Text font size of the small avatar.',
          },
          iconFontSize: {
            type: 'number',
            default: 18,
            description: 'Icon size within the avatar.',
          },
          iconFontSizeLG: {
            type: 'number',
            default: 24,
            description: 'Icon size within the large avatar.',
          },
          iconFontSizeSM: {
            type: 'number',
            default: 14,
            description: 'Icon size within the small avatar.',
          },
          groupSpace: {
            type: 'number',
            default: 4,
            description: 'Spacing between grouped avatars.',
          },
          groupOverlapping: {
            type: 'number',
            default: -8,
            description: 'Negative margin for avatar overlap in groups.',
          },
          groupBorderColor: {
            type: 'string',
            default: '#ffffff',
            description: 'Border color applied to grouped avatars.',
          },
        },
      },
    },
  },
  events: {
    type: 'object',
    additionalProperties: false,
    properties: {
      onClick: {
        type: 'array',
        description: 'Triggered when avatar item is clicked.',
      },
    },
  },
  cssKeys: ['element'],
};

export default schema;
