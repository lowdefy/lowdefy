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
  category: 'container',
  icons: [],
  valueType: null,
  slots: ['content', 'extra'],
  cssKeys: {
    element: 'The Result element.',
    icon: 'The icon in the Result.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      icon: {
        type: ['string', 'object'],
        description:
          "Name of an React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block to customize icon to use as result image.",
        docs: {
          displayType: 'icon',
        },
      },
      status: {
        type: 'string',
        enum: ['success', 'error', 'info', 'warning', '404', '403', '500'],
        default: 'info',
        description: 'Status of the result. Determines image and color.',
      },
      subTitle: {
        type: 'string',
        description: 'Result subtitle or secondary text - supports html.',
      },
      title: {
        type: 'string',
        description: 'Result title or primary text - supports html.',
      },
      theme: {
        type: 'object',
        description:
          'Antd design token overrides for this block. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>.',
        docs: {
          displayType: 'yaml',
          link: 'https://ant.design/components/result#design-token',
        },
        properties: {
          titleFontSize: {
            type: 'number',
            default: 24,
            description: 'Font size of the result title.',
          },
          subtitleFontSize: {
            type: 'number',
            default: 14,
            description: 'Font size of the result subtitle.',
          },
          iconFontSize: {
            type: 'number',
            default: 72,
            description: 'Font size of the result status icon.',
          },
          extraMargin: {
            type: 'string',
            default: '24px 0 0 0',
            description: 'Margin applied to the extra content area.',
          },
          colorSuccess: {
            type: 'string',
            description: 'Color used for the success status icon.',
          },
          colorError: {
            type: 'string',
            description: 'Color used for the error status icon.',
          },
          colorInfo: {
            type: 'string',
            description: 'Color used for the info status icon.',
          },
          colorWarning: {
            type: 'string',
            description: 'Color used for the warning status icon.',
          },
          colorTextHeading: {
            type: 'string',
            description: 'Color of the result title text.',
          },
          colorTextDescription: {
            type: 'string',
            description: 'Color of the result subtitle text.',
          },
          paddingLG: {
            type: 'number',
            default: 24,
            description: 'Large padding value applied to the result container.',
          },
          lineHeight: {
            type: 'number',
            default: 1.5714285714285714,
            description: 'Line height used for result text content.',
          },
        },
      },
    },
  },
};
