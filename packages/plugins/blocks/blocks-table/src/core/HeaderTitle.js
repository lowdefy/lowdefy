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
import { Tooltip } from 'antd';
import { type } from '@lowdefy/helpers';
import { renderHtml } from '@lowdefy/block-utils';

function renderTitle({ api, title }) {
  // Titles may hold HTML; plain titles skip the sanitiser.
  if (type.isString(title) && title.includes('<')) {
    return renderHtml({ className: 'lf-table-header-title', html: title, methods: api.methods });
  }
  return <span className="lf-table-header-title">{title}</span>;
}

// A header title, with the column's (or group's) `headerTooltip` as an antd Tooltip, as in
// TableLight. Headers are few, so the tooltip mounts with the header.
function HeaderTitle({ api, headerTooltip, title }) {
  const element = renderTitle({ api, title });
  if (type.isNone(headerTooltip)) return element;
  return (
    <Tooltip title={renderHtml({ html: headerTooltip, methods: api.methods })}>
      <span className="lf-table-header-tooltip">{element}</span>
    </Tooltip>
  );
}

export default HeaderTitle;
