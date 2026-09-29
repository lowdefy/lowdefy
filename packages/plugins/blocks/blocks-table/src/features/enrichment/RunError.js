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

import React, { useSyncExternalStore } from 'react';
import { Tooltip } from 'antd';

import formatRunError from './formatRunError.js';
import RunIcon from './RunIcon.js';

// An error cell's marker and label. The tooltip (antd) says what failed, "Failed after 3
// attempts" and the stored message shortened (formatRunError; the details panel has it whole),
// and opens below the cell, so it never covers the row above. It mounts only while the row is
// hovered or holds focus (api.cellActivity), so error cells stay static DOM until then.
function RunError({ api, rowId, state }) {
  const activity = api.cellActivity;
  const active = useSyncExternalStore(activity.subscribe, () => {
    const { state: activityState } = activity;
    return activityState.hoveredRow === rowId || activityState.focusedRow === rowId;
  });
  const { summary, message } = formatRunError(state);
  const marker = (
    <span
      aria-label={`Error. ${summary}: ${message}`}
      className="lf-enrich-state"
      data-lf-enrich-error={message}
      role="img"
    >
      <RunIcon name="error" />
      <span className="lf-enrich-label">Error</span>
    </span>
  );
  if (!active) return marker;
  return (
    <Tooltip
      placement="bottomLeft"
      rootClassName="lf-enrich-error-tooltip"
      title={
        <span data-lf-enrich-error-tooltip="">
          <strong className="lf-enrich-error-summary">{summary}</strong>
          <span className="lf-enrich-error-message">{message}</span>
        </span>
      }
    >
      {marker}
    </Tooltip>
  );
}

export default RunError;
