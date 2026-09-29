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

import getRelationLabel from '../getRelationLabel.js';
import isEmptyValue from '../isEmptyValue.js';
import resolveLink from '../resolveLink.js';
import CellLink from './CellLink.js';
import EmptyCell from './EmptyCell.js';

// Related records as chips. With `pageId` (or `href`) each chip links to its
// record; `urlQuery` values are paths in the related record, and default to
// `{ _id: _id }` when a `pageId` is given.
function RelationCell({ value, row, column, components, onEvent }) {
  const { cell } = column;
  const items = (type.isArray(value) ? value : [value]).filter((item) => !isEmptyValue(item));
  if (items.length === 0) return <EmptyCell />;
  const linked = type.isString(cell.pageId) || type.isString(cell.href);
  const linkConfig = {
    pageId: cell.pageId,
    href: cell.href,
    newTab: cell.newTab,
    urlQuery: cell.urlQuery ?? (type.isString(cell.pageId) ? { _id: '_id' } : undefined),
  };
  return (
    <span className="lf-table-chips">
      {items.map((item, index) => {
        const label = getRelationLabel({ item, cell });
        const key = `${index}-${label}`;
        if (!linked || !type.isObject(item)) {
          return (
            <span key={key} className="lf-table-chip">
              {label}
            </span>
          );
        }
        const link = resolveLink({ link: linkConfig, row: item });
        return (
          <CellLink
            key={key}
            link={link}
            components={components}
            className="lf-table-chip lf-table-link"
            onClick={() => onEvent({ name: 'onCellLink', event: { link, row, value: item } })}
          >
            {label}
          </CellLink>
        );
      })}
    </span>
  );
}

export default RelationCell;
