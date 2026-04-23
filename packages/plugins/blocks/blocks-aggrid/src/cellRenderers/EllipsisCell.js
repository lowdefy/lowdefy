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
import { type } from '@lowdefy/helpers';

function createEllipsisCell(lines) {
  const clamp = Math.max(1, Math.min(6, Math.floor(lines)));
  const style = {
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: clamp,
    overflow: 'hidden',
    whiteSpace: 'normal',
    wordBreak: 'break-word',
    width: '100%',
  };
  function EllipsisCell(params) {
    const { value } = params;
    if (type.isNone(value)) return null;
    return <span style={style}>{String(value)}</span>;
  }
  return EllipsisCell;
}

export default createEllipsisCell;
