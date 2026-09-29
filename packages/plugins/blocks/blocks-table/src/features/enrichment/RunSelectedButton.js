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
import { Button, Dropdown } from 'antd';
import htmlToText from '@lowdefy/blocks-antd/table/htmlToText.js';

// The bulk bar's "Run selected": a menu of the visible enrichment and ai columns (a column the
// view hides is not offered); choosing one fires onColumnRun for it with the selection (mode
// all). Shown when the table has onColumnRun and a visible run column.
function RunSelectedButton({ api }) {
  const { columnVisibility } = api.state;
  const runColumns = api.config.enrichment.runColumns.filter(
    (column) => columnVisibility[column.key] !== false
  );
  if (!api.events.onColumnRun || runColumns.length === 0) return null;
  return (
    <Dropdown
      menu={{
        items: runColumns.map((column) => ({
          key: column.key,
          label: htmlToText(column.title),
        })),
        onClick: ({ key }) => api.actions.runColumn({ key, mode: 'all' }),
      }}
      trigger={['click']}
    >
      <Button data-lf-bulk-action="run" size="small" type="link">
        Run selected
      </Button>
    </Dropdown>
  );
}

export default RunSelectedButton;
