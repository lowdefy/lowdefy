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

import RunIcon from './RunIcon.js';

// Header part of an error column (a user-defined column whose config is invalid): a red mark
// with the reason on hover. Its header menu offers Edit column to fix it and Delete column.
function InvalidMark({ col }) {
  const reason = col.column?.invalid;
  if (reason === undefined) return null;
  return (
    <span
      aria-label={`Invalid column: ${reason}`}
      className="lf-enrich-invalid-mark"
      data-lf-enrich-invalid-mark=""
      role="img"
      title={`Invalid column: ${reason}`}
    >
      <RunIcon name="error" />
    </span>
  );
}

export default InvalidMark;
