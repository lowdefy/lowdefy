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

// Shared antd Upload component-token schema for S3 blocks wrapped in
// `withTheme('Upload', …)`. Values are forwarded into a scoped
// `<ConfigProvider theme={{ components: { Upload: theme } }}>` wrapper.
// See https://ant.design/components/upload#design-token.

const uploadTheme = {
  type: 'object',
  description:
    'Antd design token overrides for this block. See <a href="https://ant.design/components/upload#design-token">antd design tokens</a>.',
  docs: {
    displayType: 'yaml',
    link: 'https://ant.design/components/upload#design-token',
  },
  properties: {
    actionsColor: {
      type: 'string',
      description: 'Color of action icons (download, preview, remove).',
    },
    pictureCardSize: {
      type: 'number',
      description:
        'Size of list items in card type (affects both picture-card and picture-circle).',
    },
    controlItemBgHover: {
      type: 'string',
      description: 'Background color of file item on hover.',
    },
    colorIcon: {
      type: 'string',
      description: 'Color of file icons.',
    },
    fontSize: {
      type: 'number',
      description: 'Font size of file name text.',
    },
    borderRadiusSM: {
      type: 'number',
      description: 'Border radius of file list items.',
    },
  },
};

export default uploadTheme;
