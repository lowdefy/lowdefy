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

import {
  ALIGN,
  CHILD_SIZE_RESET,
  GAP,
  JUSTIFY,
  SLOT_DISPLAY_CONTENTS,
  WRAP,
} from '../../arrangement.js';

const Row = ({ blockId, classNames, content, properties, styles }) => {
  return (
    <div
      {...blockRootProps({
        blockId,
        classNames,
        styles,
        className: cn(
          'flex flex-row',
          CHILD_SIZE_RESET,
          GAP[properties.gap] ?? GAP.md,
          WRAP[properties.wrap] ?? WRAP.wrap,
          ALIGN[properties.align] ?? ALIGN.stretch,
          JUSTIFY[properties.justify] ?? JUSTIFY.start
        ),
      })}
    >
      {content.content && content.content(SLOT_DISPLAY_CONTENTS)}
    </div>
  );
};

export default withBlockDefaults(Row);
