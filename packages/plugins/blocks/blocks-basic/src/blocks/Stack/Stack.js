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
import { blockRootProps, cn, withBlockDefaults } from '@lowdefy/block-utils';

import { ALIGN, GAP, SELF_LAYOUT } from '../../arrangement.js';

const Stack = ({ blockId, classNames, content, properties, styles }) => {
  return (
    <div
      {...blockRootProps({
        blockId,
        classNames,
        styles,
        className: cn(
          'flex flex-col',
          GAP[properties.gap] ?? GAP.md,
          ALIGN[properties.align] ?? ALIGN.stretch
        ),
      })}
    >
      {content.content && content.content(undefined, SELF_LAYOUT)}
    </div>
  );
};

export default withBlockDefaults(Stack);
