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
import { Button, Checkbox, Input, Popover } from 'antd';

// "Save as…": asks for a title and whether the view is shared, then fires onViewSave without an
// id. The app creates the view and may make it active through `activeView`.
function SaveViewAs({ api }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [shared, setShared] = useState(false);
  function submit() {
    const trimmed = title.trim();
    if (trimmed === '') return;
    api.views.saveAs({ title: trimmed, shared });
    setOpen(false);
    setTitle('');
    setShared(false);
  }
  const content = (
    <div className="lf-table-save-view" data-lf-save-view="">
      <Input
        aria-label="View name"
        autoFocus
        onChange={(event) => setTitle(event.target.value)}
        onPressEnter={submit}
        placeholder="View name"
        size="small"
        value={title}
      />
      <Checkbox checked={shared} onChange={(event) => setShared(event.target.checked)}>
        Shared
      </Checkbox>
      <Button
        data-lf-view-action="save-as-submit"
        disabled={title.trim() === ''}
        onClick={submit}
        size="small"
        type="primary"
      >
        Save view
      </Button>
    </div>
  );
  return (
    <Popover
      content={content}
      onOpenChange={setOpen}
      open={open}
      placement="bottomRight"
      trigger="click"
    >
      <Button data-lf-view-action="save-as" size="small">
        Save as…
      </Button>
    </Popover>
  );
}

export default SaveViewAs;
