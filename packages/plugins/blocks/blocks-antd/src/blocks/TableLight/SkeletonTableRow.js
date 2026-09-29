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

// antd's body row while TableLight shows skeleton rows: no `data-row-key` (the placeholders are not
// rows: row events, selection and tests never find them), marked `data-skeleton` instead.
function SkeletonTableRow({ children, className, style }) {
  return (
    <tr aria-busy="true" className={className} data-skeleton="" style={style}>
      {children}
    </tr>
  );
}

export default SkeletonTableRow;
