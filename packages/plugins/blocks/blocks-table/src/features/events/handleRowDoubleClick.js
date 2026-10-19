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

import isControlTarget from '@lowdefy/blocks-antd/table/isControlTarget.js';

import getBodyTarget from './getBodyTarget.js';
import getRowIndex from './getRowIndex.js';

function handleRowDoubleClick(event, api) {
  const target = getBodyTarget({ event, api });
  if (!target) return false;
  const { cell, row, rowElement } = target;
  if (
    isControlTarget({ target: event.target, container: rowElement }) ||
    cell?.dataset.lfSelectCell === ''
  ) {
    return false;
  }
  const rowKey = api.config.getKey(row.original);
  api.methods.triggerEvent({
    name: 'onRowDoubleClick',
    event: {
      row: row.original,
      rowKey,
      index: getRowIndex({ api, rowKey }),
    },
  });
  return true;
}

export default handleRowDoubleClick;
