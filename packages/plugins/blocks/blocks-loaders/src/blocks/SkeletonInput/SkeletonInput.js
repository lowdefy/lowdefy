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

const SkeletonInput = ({ properties, methods }) => {
  let inputHeight;
  switch (properties.size) {
    case 'small':
      inputHeight = 24;
      break;
    case 'large':
      inputHeight = 40;
      break;
    default:
      inputHeight = 32;
  }
  return (
    <div>
      {properties.label !== false && (
        <Skeleton
          methods={methods}
          properties={{
            width: properties.labelWidth ?? properties.width ?? '30%',
            height: properties.labelHeight ?? 20,
            style: { ...{ marginBottom: 10 }, ...(properties.labelStyle || {}) },
          }}
        />
      )}
      <Skeleton
        methods={methods}
        properties={{
          width: properties.width ?? '100%',
          height: properties.inputHeight ?? inputHeight,
          style: properties.inputStyle || {},
        }}
      />
    </div>
  );
};

SkeletonInput.defaultProps = blockDefaultProps;
SkeletonInput.meta = {
  category: 'display',
  icons: [],
  styles: ['blocks/SkeletonInput/style.less'],
};

export default SkeletonInput;
