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
import layoutParamsToArea from './layoutParamsToArea.js';
import deriveAreaStyle from './deriveAreaStyle.js';

const ALIGN_MAP = {
  top: 'flex-start',
  middle: 'center',
  bottom: 'flex-end',
  stretch: 'stretch',
};

const JUSTIFY_MAP = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  'space-between': 'space-between',
  'space-around': 'space-around',
  'space-evenly': 'space-evenly',
};

const Area = ({ area = {}, areaKey, children, id, layout, className, style }) => {
  const derivedArea = layoutParamsToArea({ area, areaKey, layout });
  const gapStyle = deriveAreaStyle(derivedArea);

  return (
    <div
      id={id}
      className={['lf-row', className].filter(Boolean).join(' ')}
      style={{
        ...gapStyle,
        alignItems: ALIGN_MAP[derivedArea.align],
        justifyContent: JUSTIFY_MAP[derivedArea.justify],
        flexDirection: derivedArea.direction,
        flexWrap: derivedArea.wrap ?? 'wrap',
        overflow: derivedArea.overflow,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

Area.defaultProps = blockDefaultProps;
export default Area;
