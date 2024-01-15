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

const SkeletonParagraph = ({ properties, methods }) => {
  const lines = [...Array(properties.lines ?? 4).keys()];
  return (
    <div style={{ width: properties.width ?? '100%' }}>
      {lines.map((key) => (
        <Skeleton
          key={key}
          methods={methods}
          properties={{
            ...{
              height: '1.25rem',
              width: key === lines.length - 1 && key !== 0 ? '40%' : '100%',
              style: { marginBottom: '1rem' },
            },
            ...(properties.style || {}),
          }}
        />
      ))}
    </div>
  );
};

SkeletonParagraph.defaultProps = blockDefaultProps;
SkeletonParagraph.meta = {
  category: 'display',
  icons: [],
  styles: ['blocks/SkeletonParagraph/style.less'],
};

export default SkeletonParagraph;
