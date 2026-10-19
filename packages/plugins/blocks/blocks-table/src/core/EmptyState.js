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
import { Button, Empty } from 'antd';
import { renderHtml } from '@lowdefy/block-utils';

import renderSlot from './renderSlot.js';

// When a filter or search hides every row, the table says so and offers to clear them, since
// "No rows" would suggest there is no data at all (D17). Otherwise blocks in the `empty` slot
// replace the default empty state, else `emptyText` (html, as in TableLight).
function EmptyState({ content, filtered, methods, onClearFilters, text }) {
  let body;
  if (filtered) {
    body = (
      <Empty description="No matching rows" image={Empty.PRESENTED_IMAGE_SIMPLE}>
        <Button data-lf-clear-filters="" onClick={onClearFilters} size="small">
          Clear filters
        </Button>
      </Empty>
    );
  } else if (content.empty) {
    body = renderSlot({ content, slot: 'empty' });
  } else {
    body = (
      <Empty
        description={renderHtml({ html: text, methods })}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }
  return (
    <div className="lf-table-empty-state" data-lf-empty={filtered ? 'filtered' : ''}>
      {body}
    </div>
  );
}

export default EmptyState;
