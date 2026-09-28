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

import resolveLink from '../resolveLink.js';
import AvatarMark from './AvatarMark.js';
import CellLink from './CellLink.js';
import EmptyCell from './EmptyCell.js';

function AvatarCell({ value, row, column, components, onEvent }) {
  const { cell } = column;
  const name = type.isString(cell.nameField) ? get(row, cell.nameField) : value;
  const src = type.isString(cell.srcField) ? get(row, cell.srcField) : undefined;
  const id = type.isString(cell.idField) ? get(row, cell.idField) : undefined;
  if (type.isNone(name) && type.isNone(src)) return <EmptyCell />;
  const label = type.isNone(name) ? '' : String(name);
  const mark = <AvatarMark name={label} src={src} seed={id} shape={cell.shape} />;
  if (type.isObject(cell.link)) {
    const link = resolveLink({ link: cell.link, row });
    return (
      <span className="lf-table-person">
        {mark}
        <CellLink
          link={link}
          components={components}
          className="lf-table-link lf-table-person-name"
          onClick={() => onEvent({ name: 'onCellLink', event: { link, row, value } })}
        >
          {label}
        </CellLink>
      </span>
    );
  }
  return (
    <span className="lf-table-person">
      {mark}
      <span className="lf-table-person-name">{label}</span>
    </span>
  );
}

export default AvatarCell;
