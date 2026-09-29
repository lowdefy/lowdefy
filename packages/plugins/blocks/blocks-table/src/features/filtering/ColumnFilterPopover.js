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
import { Popover } from 'antd';

import ColumnFilter from './ColumnFilter.js';

// Mounted only while open, anchored to the bottom edge of the column's header cell.
function ColumnFilterPopover({ api, col }) {
  return (
    <Popover
      arrow={false}
      content={<ColumnFilter api={api} column={col.column} />}
      onOpenChange={(open) => {
        if (!open) api.actions.closeColumnFilter();
      }}
      open
      placement="bottomLeft"
      trigger={['click']}
    >
      <span className="lf-table-header-anchor" />
    </Popover>
  );
}

export default ColumnFilterPopover;
