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

function DragHandleIcon() {
  return (
    <svg aria-hidden="true" className="lf-table-icon" viewBox="0 0 16 16">
      {[4, 8, 12].map((y) => (
        <React.Fragment key={y}>
          <circle cx="6" cy={y} fill="currentColor" r="1.1" />
          <circle cx="10" cy={y} fill="currentColor" r="1.1" />
        </React.Fragment>
      ))}
    </svg>
  );
}

export default DragHandleIcon;
