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

import formatRecordCount from './formatRecordCount.js';
import getRecordCount from '../../core/getRecordCount.js';

// The rows the view matches. Until the first rows land there is no count to show, so a text
// skeleton holds its place (the loading announcer says "Loading rows"); while refreshing it shows
// the held rows' count.
function RecordCount({ api }) {
  if (api.loadingState === 'initial') {
    return (
      <span className="lf-table-record-count" data-lf-record-count="" data-loading="">
        <span aria-hidden="true" className="lf-table-skeleton lf-table-record-count-skeleton" />
      </span>
    );
  }
  return (
    <span aria-live="polite" className="lf-table-record-count" data-lf-record-count="">
      {formatRecordCount(getRecordCount({ api }))}
    </span>
  );
}

export default RecordCount;
