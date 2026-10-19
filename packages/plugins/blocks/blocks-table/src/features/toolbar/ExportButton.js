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

import React, { useState } from 'react';
import { Button } from 'antd';

import ToolbarIcon from './ToolbarIcon.js';

// Waits two frames, so the button's spinner paints before a large client export blocks the
// thread to build the file.
function nextPaint() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}

// Export (D12) with a spinner while the file builds (D17): a client export builds the CSV in the
// browser, a server export awaits the app's `onExport` actions. It needs rows, so it is disabled
// while the table loads its first rows.
function ExportButton({ api }) {
  const [exporting, setExporting] = useState(false);
  async function onClick() {
    setExporting(true);
    try {
      await nextPaint();
      await api.actions.exportCsv({ filename: `${api.blockId}.csv` });
    } finally {
      setExporting(false);
    }
  }
  return (
    <Button
      data-lf-toolbar-button="export"
      disabled={api.loadingState === 'initial'}
      icon={<ToolbarIcon api={api} name="download" />}
      loading={exporting}
      onClick={onClick}
      size="small"
    >
      Export
    </Button>
  );
}

export default ExportButton;
