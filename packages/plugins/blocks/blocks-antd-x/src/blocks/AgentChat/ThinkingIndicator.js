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

import React, { useContext } from 'react';
import { ConfigProvider } from 'antd';

// Renders the three CSS-animated loading dots that @ant-design/x's Bubble shows by
// default (same DOM structure as @ant-design/x/lib/bubble/loading.js so the existing
// stylesheet animates them), optionally followed by a soft "thinking…" label wrapped
// in an aria-live region so screen readers announce rotations without interrupting.
//
// The dots are aria-hidden — they're decorative. Only the label is announced.
//
// We pull the bubble prefix class from antd's ConfigProvider directly (same route
// @ant-design/x's internal useXProviderContext uses) so the CSS selectors line up
// with whatever prefix the host app configures.
function ThinkingIndicator({ label }) {
  const { getPrefixCls } = useContext(ConfigProvider.ConfigContext);
  const prefixCls = getPrefixCls('bubble');
  return (
    <span
      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, verticalAlign: 'middle' }}
    >
      <span className={`${prefixCls}-dot`} aria-hidden="true">
        <i className={`${prefixCls}-dot-item`} key="item-1" />
        <i className={`${prefixCls}-dot-item`} key="item-2" />
        <i className={`${prefixCls}-dot-item`} key="item-3" />
      </span>
      {label != null && label !== '' && (
        <span
          aria-live="polite"
          aria-atomic="true"
          style={{ color: '#8c8c8c', fontSize: '0.9em' }}
        >
          {label}
        </span>
      )}
    </span>
  );
}

export default ThinkingIndicator;
