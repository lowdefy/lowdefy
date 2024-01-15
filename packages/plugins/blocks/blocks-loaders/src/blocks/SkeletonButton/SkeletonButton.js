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

import React from 'react';
import { blockDefaultProps } from '@lowdefy/block-utils';

import Skeleton from '../Skeleton/Skeleton.js';

const SkeletonButton = ({ properties, methods }) => {
  let height;
  switch (properties.size) {
    case 'small':
      height = 24;
      break;
    case 'large':
      height = 40;
      break;
    default:
      height = 32;
  }
  return (
    <Skeleton
      methods={methods}
      properties={{
        style: {
          ...{ borderRadius: properties.shape === 'round' && height / 2 },
          ...(properties.style || {}),
        },
        width: properties.width ?? '100%',
        height,
      }}
    />
  );
};

SkeletonButton.defaultProps = blockDefaultProps;
SkeletonButton.meta = {
  category: 'display',
  icons: [],
  styles: ['blocks/SkeletonButton/style.less'],
};

export default SkeletonButton;
