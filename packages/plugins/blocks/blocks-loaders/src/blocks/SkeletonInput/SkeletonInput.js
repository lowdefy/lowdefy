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

const SkeletonInput = ({ classNames, properties, styles }) => {
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
    <div
      className={classNames?.element}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        ...styles?.element,
      }}
    >
      {properties.label !== false && (
        <Skeleton
          styles={{
            element: {
              borderRadius: 'var(--ant-border-radius-sm, 4px)',
            },
          }}
          properties={{
            width: properties.labelWidth ?? properties.width ?? '30%',
            height: properties.labelHeight ?? 20,
          }}
        />
      )}
      <Skeleton
        styles={{
          element: {
            borderRadius: 'var(--ant-border-radius, 6px)',
            ...styles?.input,
          },
        }}
        properties={{
          width: properties.width ?? '100%',
          height: properties.inputHeight ?? inputHeight,
        }}
      />
    </div>
  );
};

export default withBlockDefaults(SkeletonInput);
