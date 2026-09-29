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

import getSafeUrl from '../getSafeUrl.js';
import isEmptyValue from '../isEmptyValue.js';
import EmptyCell from './EmptyCell.js';

// An external link that opens in a new tab (`newTab: false` to stay). The
// label is `label`, a `labelField` from the row, or the URL itself.
function UrlCell({ value, row, column }) {
  if (isEmptyValue(value)) return <EmptyCell />;
  const { cell } = column;
  const labelFromRow = type.isString(cell.labelField) ? get(row, cell.labelField) : undefined;
  const label = String(cell.label ?? labelFromRow ?? value);
  const href = getSafeUrl(String(value));
  if (href === null) return label;
  const newTab = cell.newTab !== false;
  return (
    <a
      className="lf-table-link"
      href={href}
      target={newTab ? '_blank' : undefined}
      rel={newTab ? 'noopener noreferrer' : undefined}
    >
      {label}
    </a>
  );
}

export default UrlCell;
