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

// The expand chevron of an expandable row, in its first data cell. Rows that
// `rowExpandable.when` excludes keep the space so the column stays aligned.
function ExpandToggle({ item }) {
  if (item.expandable === undefined) return null;
  if (!item.expandable) return <span className="lf-table-toggle-spacer" />;
  return (
    <button
      aria-expanded={item.detailExpanded}
      aria-label={item.detailExpanded ? 'Collapse row details' : 'Expand row details'}
      className="lf-table-toggle"
      data-expanded={item.detailExpanded ? '' : undefined}
      data-lf-expand-toggle=""
      tabIndex={-1}
      type="button"
    >
      <Chevron />
    </button>
  );
}

export default ExpandToggle;
