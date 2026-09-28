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

import getHeaderCellProps from './getHeaderCellProps.js';
import headerParts from './headerParts.js';
import HeaderTitle from './HeaderTitle.js';

function HeaderCell({ api, col, focused, state }) {
  const props = {
    'aria-colindex': col.ariaIndex,
    className: 'lf-table-gridcell',
    'data-align': col.column?.align,
    'data-col-index': col.index,
    'data-col-key': col.key,
    'data-focused': focused ? '' : undefined,
    'data-lf-cell': '',
    'data-lf-header': '',
    'data-pinned': col.region === 'center' ? undefined : col.region,
    'data-pinned-edge': col.pinnedEdge ? '' : undefined,
    'data-special': col.special,
    role: 'columnheader',
    style: col.style,
    tabIndex: focused ? 0 : -1,
    ...(col.special ? {} : getHeaderCellProps({ col, state })),
  };
  if (col.special) {
    return React.createElement('div', props, <col.Header api={api} state={state} />);
  }
  return React.createElement(
    'div',
    props,
    <HeaderTitle api={api} headerTooltip={col.column.headerTooltip} title={col.column.title} />,
    ...headerParts.map((Part, i) => <Part api={api} col={col} key={i} state={state} />)
  );
}

export default HeaderCell;
