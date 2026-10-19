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
import { type } from '@lowdefy/helpers';

import ViewTabMenu from './ViewTabMenu.js';

const countFormat = new Intl.NumberFormat();

// A view tab: title, the view's count (queue tabs), the dirty dot and, on the active tab, its menu.
function ViewTabLabel({ api, dirty, isActive, view }) {
  return (
    <span
      className="lf-table-view-tab"
      data-dirty={dirty ? '' : undefined}
      data-lf-view-tab={view.key}
    >
      <span className="lf-table-view-tab-title">{view.title}</span>
      {type.isNumber(view.count) ? (
        <span className="lf-table-view-tab-count" data-lf-view-count="">
          {countFormat.format(view.count)}
        </span>
      ) : null}
      {dirty ? (
        <span aria-label="Unsaved changes" className="lf-table-view-dirty" role="img" />
      ) : null}
      {isActive ? <ViewTabMenu api={api} view={view} /> : null}
    </span>
  );
}

export default ViewTabLabel;
