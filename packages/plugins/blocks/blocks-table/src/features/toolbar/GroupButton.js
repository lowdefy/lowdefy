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
import { Button, Popover } from 'antd';

import ToolbarCount from './ToolbarCount.js';
import ToolbarIcon from './ToolbarIcon.js';
import ToolbarList from './ToolbarList.js';

// Group levels over the groupable columns, outermost first (grouping's setGroupKeys).
function GroupButton({ api, groupable }) {
  const keys = api.state.grouping;
  const available = groupable.filter((column) => !keys.includes(column.key));
  const content = (
    <div className="lf-table-toolbar-popover" data-lf-toolbar-group="">
      <ToolbarList
        addLabel="Group by"
        api={api}
        available={available}
        emptyText="No grouping"
        keys={keys}
        name="group"
        onChange={(next) => api.actions.setGroupKeys(next)}
      />
    </div>
  );
  return (
    <Popover content={content} placement="bottomLeft" trigger="click">
      <Button
        data-lf-toolbar-button="group"
        icon={<ToolbarIcon api={api} name="list" />}
        size="small"
      >
        Group
        <ToolbarCount count={keys.length} />
      </Button>
    </Popover>
  );
}

export default GroupButton;
