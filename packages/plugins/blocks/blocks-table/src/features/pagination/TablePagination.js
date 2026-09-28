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
import { Pagination } from 'antd';

// Client-side pages below the grid (`pagination: true`), with antd's Pagination as TableLight
// has it: the pager always shows once pagination is on.
function TablePagination({ current, onChange, pageSize, total }) {
  return (
    <div className="lf-table-pagination">
      <Pagination
        current={current}
        onChange={onChange}
        pageSize={pageSize}
        showSizeChanger={false}
        size="small"
        total={total}
      />
    </div>
  );
}

export default TablePagination;
