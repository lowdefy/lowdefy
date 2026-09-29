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

import React, { useEffect, useState } from 'react';
import { Tooltip } from 'antd';

import Chevron from '../../core/Chevron.js';

const ERROR_OPEN_MS = 4000;

// A failed lazy load's message, in a tooltip on the chevron: open for a few seconds when the load
// fails, then on hover.
function ToggleError({ children, error }) {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    setOpen(true);
    const timer = setTimeout(() => setOpen(false), ERROR_OPEN_MS);
    return () => clearTimeout(timer);
  }, [error]);
  return (
    <Tooltip color="red" onOpenChange={setOpen} open={open} title={error}>
      {children}
    </Tooltip>
  );
}

// Indent and expand chevron in a tree row's first data cell. The delegated click handler
// (handleTreeClick) does the toggling. While a lazy row's children load the chevron is a spinner
// (D17); a failed load shows its error on the chevron.
function renderToggle(item) {
  const button = (
    <button
      aria-busy={item.loading ? true : undefined}
      aria-expanded={item.expanded}
      aria-label={item.expanded ? 'Collapse row' : 'Expand row'}
      className="lf-table-toggle"
      data-error={item.error ? '' : undefined}
      data-expanded={item.expanded ? '' : undefined}
      data-loading={item.loading ? '' : undefined}
      data-lf-tree-toggle=""
      tabIndex={-1}
      type="button"
    >
      {item.loading ? <span className="lf-table-spinner" /> : <Chevron />}
    </button>
  );
  if (!item.error) return button;
  return <ToggleError error={item.error}>{button}</ToggleError>;
}

function TreeToggle({ api, item }) {
  const { tree } = api.config;
  if (!tree || item.depth === undefined) return null;
  return (
    <>
      <span className="lf-table-tree-indent" style={{ width: item.depth * tree.indent }} />
      {item.hasChildren ? renderToggle(item) : <span className="lf-table-toggle-spacer" />}
    </>
  );
}

export default TreeToggle;
