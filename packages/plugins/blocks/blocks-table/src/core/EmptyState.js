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
import { Empty } from 'antd';
import { renderHtml } from '@lowdefy/block-utils';

// Blocks in the `empty` slot replace the default empty state; otherwise `emptyText` (html, as in
// TableLight).
function EmptyState({ content, methods, text }) {
  return (
    <div className="lf-table-empty-state" data-lf-empty="">
      {content.empty ? (
        content.empty()
      ) : (
        <Empty
          description={renderHtml({ html: text, methods })}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}
    </div>
  );
}

export default EmptyState;
