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
import { get, type } from '@lowdefy/helpers';

import isEmptyValue from '../isEmptyValue.js';
import EmptyCell from './EmptyCell.js';

// A lazy thumbnail of the image URL in the cell, `width` x `height` pixels
// (default 32 square).
function ImageCell({ value, row, column }) {
  if (isEmptyValue(value) || !type.isString(value)) return <EmptyCell />;
  const { cell } = column;
  const width = cell.width ?? 32;
  const height = cell.height ?? width;
  const alt = type.isString(cell.altField) ? get(row, cell.altField) : cell.alt;
  const className =
    cell.shape === 'circle' ? 'lf-table-image lf-table-image-circle' : 'lf-table-image';
  return (
    <img
      className={className}
      src={value}
      alt={alt ?? ''}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
    />
  );
}

export default ImageCell;
