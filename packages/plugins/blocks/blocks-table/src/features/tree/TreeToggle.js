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

import Chevron from '../../core/Chevron.js';

// Indent and expand chevron in a tree row's first data cell. The delegated click handler
// (handleTreeClick) does the toggling.
function TreeToggle({ api, item }) {
  const { tree } = api.config;
  if (!tree || item.depth === undefined) return null;
  return (
    <>
      <span className="lf-table-tree-indent" style={{ width: item.depth * tree.indent }} />
      {item.hasChildren ? (
        <button
          aria-expanded={item.expanded}
          aria-label={item.expanded ? 'Collapse row' : 'Expand row'}
          className="lf-table-toggle"
          data-expanded={item.expanded ? '' : undefined}
          data-lf-tree-toggle=""
          tabIndex={-1}
          type="button"
        >
          <Chevron />
        </button>
      ) : (
        <span className="lf-table-toggle-spacer" />
      )}
    </>
  );
}

export default TreeToggle;
