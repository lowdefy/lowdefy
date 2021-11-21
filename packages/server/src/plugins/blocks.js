/*
  Copyright 2020-2021 Lowdefy, Inc

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

import Anchor from '@lowdefy/blocks-basic/blocks/Anchor/Anchor.js';
import Box from '@lowdefy/blocks-basic/blocks/Box/Box.js';
import Button from '@lowdefy/blocks-antd/blocks/Button/Button.js';
import Html from '@lowdefy/blocks-basic/blocks/Html/Html.js';

const blocks = {
  Anchor: {
    Component: Anchor,
    meta: {
      category: 'display',
      loading: {
        type: 'SkeletonParagraph',
        properties: {
          lines: 1,
        },
      },
    },
  },
  Box: {
    Component: Box,
    meta: {
      category: 'container',
      loading: false,
    },
  },
  Button: {
    Component: Button,
    meta: {
      category: 'display',
      loading: {
        type: 'SkeletonButton',
      },
    },
  },
  Html: {
    Component: Html,
    meta: {
      category: 'display',
      loading: false,
    },
  },
};

// const blocks = {
//   Anchor,
//   Box,
//   Button,
//   Html,
// };

export default blocks;
