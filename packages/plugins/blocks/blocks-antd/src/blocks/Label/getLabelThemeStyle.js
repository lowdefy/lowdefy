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

const formComponentTokens = new Set([
  'labelColonMarginInlineEnd',
  'labelColonMarginInlineStart',
  'labelColor',
  'labelFontSize',
  'labelRequiredMarkColor',
]);

// Same naming as antd's token2CSSVar, e.g. labelColor -> label-color.
function toKebabCase(token) {
  return token
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z0-9]+)/g, '$1-$2')
    .replace(/([a-z])([A-Z0-9])/g, '$1-$2')
    .toLowerCase();
}

// Label reuses antd's Form.Item class names without rendering an antd Form, so antd never emits
// the Form CSS variables that style.css reads, and a ConfigProvider theme has nothing to apply to.
// Set those variables directly instead. The caller scopes them to the Label's own elements so, as
// with an antd component theme, a token such as colorError does not restyle the wrapped input.
function getLabelThemeStyle(theme) {
  if (!type.isObject(theme)) return {};
  const style = {};
  Object.entries(theme).forEach(([token, value]) => {
    const prefix = formComponentTokens.has(token) ? '--ant-form-' : '--ant-';
    style[`${prefix}${toKebabCase(token)}`] = type.isNumber(value) ? `${value}px` : value;
  });
  return style;
}

export default getLabelThemeStyle;
