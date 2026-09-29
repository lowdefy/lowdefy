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
import resolveLink from '../resolveLink.js';
import CellLink from './CellLink.js';
import EmptyCell from './EmptyCell.js';

// A real link through the Lowdefy Link component, so it navigates with the
// router on a plain click and opens a new tab on Cmd/Ctrl or middle click
// without any event wiring. `onCellLink` still fires for apps that listen.
function LinkCell({ value, row, column, components, onEvent }) {
  if (isEmptyValue(value)) return <EmptyCell />;
  const { cell } = column;
  const label = type.isString(cell.labelField) ? get(row, cell.labelField) ?? value : value;
  const link = resolveLink({ link: cell, row });
  return (
    <CellLink
      link={link}
      components={components}
      className="lf-table-link"
      onClick={() => onEvent({ name: 'onCellLink', event: { link, row, value } })}
    >
      {String(label)}
    </CellLink>
  );
}

export default LinkCell;
