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
    element: 'The Avatar element.',
    max: 'The Avatar max overflow style.',
  },
  events: {
    onClick: 'Triggered when avatar item is clicked.',
  },
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
      group: {
        type: 'object',
        description:
          'Render as an avatar group with multiple avatars. When set, the block renders Avatar.Group wrapping data-driven avatars.',
        docs: {
          displayType: 'yaml',
        },
        properties: {
          maxCount: {
            type: 'number',
            description: 'Max avatars to show. Excess shows as "+N".',
          },
          maxPopoverPlacement: {
            type: 'string',
            enum: ['top', 'bottom'],
            default: 'top',
            description: 'Placement of the overflow popover.',
          },
          maxPopoverTrigger: {
            type: 'string',
            enum: ['hover', 'click'],
            default: 'hover',
            description: 'Trigger mode for the overflow popover.',
          },
          shape: {
            type: 'string',
            enum: ['circle', 'square'],
            description: 'Default shape for all avatars in the group.',
          },
          size: {
            type: ['string', 'number'],
            enum: ['default', 'small', 'large'],
            description: 'Default size for all avatars in the group.',
          },
          avatars: {
            type: 'array',
            description: 'Array of avatar configurations.',
            items: {
              type: 'object',
              properties: {
                alt: {
                  type: 'string',
                  description: 'Alt text for image avatar.',
                },
                color: {
                  type: 'string',
                  description: 'Background color.',
                  docs: {
                    displayType: 'color',
                  },
                },
                content: {
                  type: 'string',
                  description: 'Text content inside the avatar.',
                },
                gap: {
                  type: 'number',
                  description: 'Letter type unit distance between left and right sides.',
                },
                icon: {
                  type: ['string', 'object'],
                  description: 'Icon name or properties.',
                  docs: {
                    displayType: 'icon',
                  },
                },
                shape: {
                  type: 'string',
                  enum: ['circle', 'square'],
                  description: 'Override shape for this avatar.',
                },
                size: {
                  type: ['string', 'number'],
                  enum: ['default', 'small', 'large'],
                  description: 'Override size for this avatar.',
                  docs: {
                    displayType: 'string',
                  },
                },
                src: {
                  type: 'string',
                  description: 'Image URL.',
                },
              },
            },
          },
        },
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
};
