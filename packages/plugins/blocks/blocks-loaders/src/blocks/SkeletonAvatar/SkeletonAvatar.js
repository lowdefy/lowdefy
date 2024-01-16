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
import { type } from '@lowdefy/helpers';
import { blockDefaultProps } from '@lowdefy/block-utils';

import Skeleton from '../Skeleton/Skeleton.js';

const SkeletonAvatar = ({ properties, methods }) => {
  let size = properties.size ?? 32;
  if (type.isString(size)) {
    switch (properties.size) {
      case 'small':
        size = 24;
        break;
      case 'large':
        size = 40;
        break;
      default:
        size = 32;
    }
  }
  return (
    <Skeleton
      methods={methods}
      properties={{
        style: {
          ...{ borderRadius: properties.shape === 'square' ? '0' : size / 2 },
          ...(properties.style || {}),
        },
        width: size,
        height: size,
      }}
    />
  );
};

SkeletonAvatar.defaultProps = blockDefaultProps;
SkeletonAvatar.meta = {
  category: 'display',
  icons: [],
  styles: ['blocks/SkeletonAvatar/style.less'],
};

export default SkeletonAvatar;
