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

import React from 'react';
import { withBlockDefaults } from '@lowdefy/block-utils';

import Skeleton from '../Skeleton/Skeleton.js';

const SkeletonParagraph = ({ classNames, properties, styles }) => {
  const lines = [...Array(properties.lines ?? 4).keys()];
  return (
    <div
      className={classNames?.element}
      style={{ width: properties.width ?? '100%', ...styles?.element }}
    >
      {lines.map((key) => (
        <Skeleton
          key={key}
          styles={{ element: { marginBottom: '1rem' } }}
          properties={{
            height: '1.25rem',
            width: key === lines.length - 1 && key !== 0 ? '40%' : '100%',
          }}
        />
      ))}
    </div>
  );
};

SkeletonParagraph.meta = {
  category: 'display',
  icons: [],
};

export default withBlockDefaults(SkeletonParagraph);
