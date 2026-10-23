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

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Button, Drawer, Popover, Tooltip } from 'antd';

import countConditions from './countConditions.js';
import describeTableFilter from '../filtering/describeTableFilter.js';
import focusFilterLeaf from './focusFilterLeaf.js';
import LazyFilterBuilder from '../filtering/LazyFilterBuilder.js';
import PopoverLoadingContent from '../../core/PopoverLoadingContent.js';
import RecordCount from './RecordCount.js';
import ToolbarCount from './ToolbarCount.js';
import ToolbarIcon from './ToolbarIcon.js';

// The lazy builder can take a few frames to render the condition openFilter added.
const FOCUS_FRAMES = 60;

// Opens the filter builder on the whole `view.filter`; the button counts its conditions and shows
// the filter in words as its tooltip. Edits go through applyFiltering, the one filter write path.
// The `openFilter` method opens it too (api.filterButton), optionally focusing a new condition.
// On a phone (`phone`) the builder opens as a full-height sheet, with the record count at its
// foot following each edit.
function FilterButton({ api, phone = false }) {
  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState(null);
  const popoverRef = useRef(null);
  api.filterButton = {
    open({ focus: target }) {
      setFocus(target);
      setOpen(true);
    },
  };
  useEffect(
    () => () => {
      delete api.filterButton;
    },
    []
  );
  useEffect(() => {
    if (!open || focus === null) return undefined;
    let frame;
    let frames = 0;
    function tryFocus() {
      if (focusFilterLeaf({ container: popoverRef.current, ...focus })) {
        setFocus(null);
        return;
      }
      frames += 1;
      if (frames < FOCUS_FRAMES) frame = requestAnimationFrame(tryFocus);
    }
    frame = requestAnimationFrame(tryFocus);
    return () => cancelAnimationFrame(frame);
  }, [open, focus]);
  const filter = api.state.filter ?? null;
  const sentence = describeTableFilter({ condition: filter, columns: api.config.columns });
  const columns = api.config.columns.filter((column) => column.filterable);
  const content = (
    <div className="lf-table-toolbar-popover" data-lf-toolbar-filter="" ref={popoverRef}>
      <Suspense fallback={<PopoverLoadingContent />}>
        <LazyFilterBuilder
          columns={columns}
          components={api.components}
          condition={filter}
          onChange={(condition) => api.actions.applyFiltering({ filter: condition ?? null })}
          user={api.config.user}
        />
      </Suspense>
    </div>
  );
  const button = (
    <Tooltip title={phone ? null : sentence}>
      <Button
        data-lf-toolbar-button="filter"
        icon={<ToolbarIcon api={api} name="filter" />}
        onClick={phone ? () => setOpen(true) : undefined}
        onFocus={LazyFilterBuilder.preload}
        onPointerEnter={LazyFilterBuilder.preload}
        size="small"
      >
        Filter
        <ToolbarCount count={countConditions(filter)} />
      </Button>
    </Tooltip>
  );
  if (phone) {
    return (
      <>
        {button}
        <Drawer
          className="lf-table-filter-sheet"
          footer={<RecordCount api={api} />}
          onClose={() => setOpen(false)}
          open={open}
          placement="bottom"
          size="100%"
          title="Filter"
        >
          {content}
        </Drawer>
      </>
    );
  }
  return (
    <Popover
      content={content}
      onOpenChange={setOpen}
      open={open}
      placement="bottomLeft"
      trigger="click"
    >
      {button}
    </Popover>
  );
}

export default FilterButton;
