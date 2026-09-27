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

import { type } from '@lowdefy/helpers';

// The tokens antd writes as unitless CSS variables (`unitless` in antd/es/theme/useToken.js).
const unitlessTokens = new Set([
  'fontWeightStrong',
  'lineHeight',
  'lineHeightHeading1',
  'lineHeightHeading2',
  'lineHeightHeading3',
  'lineHeightHeading4',
  'lineHeightHeading5',
  'lineHeightLG',
  'lineHeightSM',
  'opacityImage',
  'opacityLoading',
  'zIndexBase',
  'zIndexPopupBase',
]);

// Some blocks reuse antd class names without rendering the antd component (Label reuses Form.Item,
// ControlledList reuses List), so antd never emits the CSS variables their stylesheet reads, and a
// ConfigProvider theme has nothing to apply to. This maps a component theme to those variables,
// named as antd's token2CSSVar names them: `componentTokens` become `--ant-<componentName>-*`
// variables and every other token a global `--ant-*` variable. The caller sets them as inline
// styles, so they cascade only to the block's own elements, as an antd component theme would.
function getThemeCssVariables({ componentName, componentTokens, theme }) {
  if (!type.isObject(theme)) return {};
  const variables = {};
  Object.entries(theme).forEach(([token, value]) => {
    // antd component configs can also hold non-token keys, such as `algorithm: true`.
    if (!type.isString(value) && !type.isNumber(value)) return;
    const name = token
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .replace(/([A-Z]+)([A-Z][a-z0-9]+)/g, '$1-$2')
      .replace(/([a-z])([A-Z0-9])/g, '$1-$2')
      .toLowerCase();
    const prefix = componentTokens.has(token) ? `--ant-${componentName}-` : '--ant-';
    const needsUnit = type.isNumber(value) && !unitlessTokens.has(token);
    variables[`${prefix}${name}`] = needsUnit ? `${value}px` : value;
  });
  return variables;
}

export default getThemeCssVariables;
