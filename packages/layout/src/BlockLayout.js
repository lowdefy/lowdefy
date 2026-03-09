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
import { blockDefaultProps } from '@lowdefy/block-utils';
import deriveLayout from './deriveLayout.js';

const ALIGN_SELF_MAP = {
  top: 'flex-start',
  middle: 'center',
  bottom: 'flex-end',
};

const BlockLayout = ({ id, children, layout = {}, className, style }) => {
  if (layout.disabled) {
    return (
      <div id={id} className={className} style={style}>
        {children}
      </div>
    );
  }

  const derived = deriveLayout(layout);

  return (
    <div
      id={id}
      className={[derived.className, className].filter(Boolean).join(' ')}
      style={{
        ...derived.style,
        alignSelf: ALIGN_SELF_MAP[layout.selfAlign] ?? layout.selfAlign,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

BlockLayout.defaultProps = blockDefaultProps;
export default BlockLayout;
